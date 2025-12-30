import Refund from '../models/Refund.js';
import Enrollment from '../models/Enrollment.js';
import Payment from '../models/Payment.js';
import Order from '../models/Order.js';
import Earning from '../models/Earning.js';
import Course from '../models/Course.js';
import Wallet from '../models/Wallet.js';
import Transaction from '../models/Transaction.js';
import axios from 'axios';
import crypto from 'crypto';

// Request a refund
export const requestRefund = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { enrollmentId, courseId, reason } = req.body;

    // Validate required fields
    if (!enrollmentId || !courseId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc'
      });
    }

    // Check if enrollment exists and belongs to user
    const enrollment = await Enrollment.findOne({
      _id: enrollmentId,
      userId: userId
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khóa học đã đăng ký'
      });
    }

    // Check if refund already exists for this enrollment
    const existingRefund = await Refund.findOne({
      enrollmentId: enrollmentId,
      status: { $in: ['pending', 'approved'] }
    });

    if (existingRefund) {
      return res.status(400).json({
        success: false,
        message: 'Đã tồn tại yêu cầu hoàn tiền cho khóa học này'
      });
    }

    // Find the order that contains this course to get the purchase price
    const order = await Order.findOne({
      userId: userId,
      orderStatus: 'success',
      'items.courseId': courseId
    }).sort({ createdAt: -1 });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin đơn hàng'
      });
    }

    // Get the price of the specific course from order items
    const courseItem = order.items.find(item => item.courseId === courseId);
    
    if (!courseItem) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin khóa học trong đơn hàng'
      });
    }

    const refundAmount = courseItem.price;

    // Get payment information for MoMo transaction details
    const payment = await Payment.findOne({
      orderId: order._id.toString(),
      paymentStatus: 'success'
    });

    // Create refund request
    const refund = new Refund({
      userId: userId,
      enrollmentId: enrollmentId,
      courseId: courseId,
      orderId: order._id,
      amount: refundAmount,
      reason: reason || 'Yêu cầu hoàn tiền từ người dùng',
      momoTransactionId: payment?.momoTransactionId || null,
      status: 'pending'
    });

    await refund.save();

    return res.status(201).json({
      success: true,
      message: 'Yêu cầu hoàn tiền đã được gửi thành công',
      data: refund
    });

  } catch (error) {
    console.error('Error requesting refund:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi gửi yêu cầu hoàn tiền',
      error: error.message
    });
  }
};

// Get refund history for current user
export const getRefundHistory = async (req, res) => {
  try {
    const userId = req.userId;

    const refunds = await Refund.find({ userId: userId })
      .sort({ requestDate: -1 })
      .lean();

    // Fetch course details from Mongodb for each refund
    const refundsWithCourse = await Promise.all(
      refunds.map(async (refund) => {
        try {
          const courses = await Course.find({ _id: { $in: refund.courseId } }).lean();
          
          return {
            ...refund,
            course: courses.length > 0 ? courses[0] : null
          };
        } catch (error) {
          console.error(`Error fetching course ${refund.courseId}:`, error);
          return {
            ...refund,
            course: null
          };
        }
      })
    );

    return res.status(200).json({
      success: true,
      data: refundsWithCourse
    });

  } catch (error) {
    console.error('Error fetching refund history:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tải lịch sử hoàn tiền',
      error: error.message
    });
  }
};

// Get all refund requests (Admin only)
export const getAllRefunds = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const refunds = await Refund.find(query)
      .sort({ requestDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Refund.countDocuments(query);

    // Fetch course details from Mongodb for each refund
    const refundsWithCourse = await Promise.all(
      refunds.map(async (refund) => {
        try {
          const courses = await Course.find({ _id: { $in: refund.courseId } }).lean();
          
          return {
            ...refund,
            course: courses.length > 0 ? courses[0] : null
          };
        } catch (error) {
          console.error(`Error fetching course ${refund.courseId}:`, error);
          return {
            ...refund,
            course: null
          };
        }
      })
    );

    return res.status(200).json({
      success: true,
      data: refundsWithCourse,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching all refunds:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tải danh sách hoàn tiền',
      error: error.message
    });
  }
};

// Process refund (Admin only) - Approve or Reject
export const processRefund = async (req, res) => {
  try {
    const adminId = req.auth.userId;
    const { refundId } = req.params;
    const { status, adminNote } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ'
      });
    }

    const refund = await Refund.findById(refundId);

    if (!refund) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu hoàn tiền'
      });
    }

    if (refund.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Yêu cầu hoàn tiền đã được xử lý'
      });
    }

    // Update refund status
    refund.status = status;
    refund.processedDate = new Date();
    refund.processedBy = adminId;
    if (adminNote) {
      refund.adminNote = adminNote;
    }

    // If approved, initiate MoMo refund
    if (status === 'approved') {
      let momoRefundSuccess = false;
      let momoErrorMessage = '';

      try {
        const momoRefund = await initiateMoMoRefund(refund);
        if (momoRefund.success) {
          refund.momoRefundId = momoRefund.refundId;
          refund.momoRefundResponse = momoRefund.response;
          refund.status = 'completed';
          momoRefundSuccess = true;
        }
      } catch (momoError) {
        console.error('MoMo refund error:', momoError);
        
        // Extract MoMo error details
        if (momoError.response?.data) {
          const momoResponse = momoError.response.data;
          momoErrorMessage = `MoMo Error (Code ${momoResponse.resultCode}): ${momoResponse.message || 'Unknown error'}`;
          console.error('MoMo response:', momoResponse);
        } else {
          momoErrorMessage = `MoMo API Error: ${momoError.message}`;
        }
        
        // Note: We don't throw the error here, allowing the refund to be approved
        // Admin will need to process the actual refund manually
      }

      // Add MoMo error info to admin note if refund failed
      if (!momoRefundSuccess) {
        // Refund to user's wallet instead
        try {
          // Find or create user's wallet
          let wallet = await Wallet.findOne({ user_id: refund.userId });
          
          if (!wallet) {
            wallet = new Wallet({
              user_id: refund.userId,
              balance: 0
            });
          }

          // Update wallet balance
          const previousBalance = wallet.balance;
          wallet.balance += refund.amount;
          await wallet.save();

          // Create transaction record
          const transaction = new Transaction({
            wallet_id: wallet._id.toString(),
            operation: 'credit',
            amount: refund.amount,
            balance: wallet.balance,
            description: `Hoàn tiền khóa học - MoMo thất bại, hoàn vào ví (Order: ${refund.orderId})`
          });
          await transaction.save();

          // Update status to completed and add note
          refund.status = 'completed';
          // const walletNote = `\n Hoàn tiền qua MoMo thất bại.\n${momoErrorMessage}\n Đã hoàn ${refund.amount.toLocaleString('vi-VN')} VNĐ vào ví người dùng.\nSố dư trước: ${previousBalance.toLocaleString('vi-VN')} VNĐ\nSố dư sau: ${wallet.balance.toLocaleString('vi-VN')} VNĐ`;
          const walletNote = `Đã hoàn ${refund.amount.toLocaleString('vi-VN')} VNĐ vào ví người dùng.\nSố dư trước: ${previousBalance.toLocaleString('vi-VN')} VNĐ\nSố dư sau: ${wallet.balance.toLocaleString('vi-VN')} VNĐ`;          
          refund.adminNote = (refund.adminNote || '') + walletNote;
          
          console.log(`✅ Refunded ${refund.amount} VNĐ to user ${refund.userId}'s wallet (Transaction: ${transaction._id})`);
        } catch (walletError) {
          console.error('Error refunding to wallet:', walletError);
          const errorNote = `\n⚠️ LƯU Ý: Hoàn tiền qua MoMo thất bại.\n${momoErrorMessage}\n⚠️ Hoàn tiền vào ví cũng thất bại: ${walletError.message}\nVui lòng xử lý hoàn tiền thủ công cho người dùng.`;
          refund.adminNote = (refund.adminNote || '') + errorNote;
        }
      }

      // Delete enrollment after approval regardless of MoMo refund status
      try {
        await Enrollment.findByIdAndDelete(refund.enrollmentId);
        console.log(`Enrollment ${refund.enrollmentId} deleted after refund approval`);
      } catch (enrollmentError) {
        console.error('Error deleting enrollment:', enrollmentError);
        refund.adminNote = (refund.adminNote || '') + '\n⚠️ Cảnh báo: Không thể xóa enrollment tự động. Vui lòng xóa thủ công.';
      }

      // Update earning status to refunded
      try {
        const earningUpdate = await Earning.updateMany(
          {
            order_id: refund.orderId.toString(),
            course_id: refund.courseId,
            status: 'pending'
          },
          {
            status: 'refunded',
            updated_at: new Date()
          }
        );
        
        if (earningUpdate.modifiedCount > 0) {
          console.log(`✅ Updated ${earningUpdate.modifiedCount} earning(s) to refunded for course ${refund.courseId}`);
        } else {
          console.log(`⚠️ No pending earnings found for course ${refund.courseId} in order ${refund.orderId}`);
        }
      } catch (earningError) {
        console.error('Error updating earning status:', earningError);
        refund.adminNote = (refund.adminNote || '') + '\n⚠️ Cảnh báo: Không thể cập nhật earning status. Vui lòng xử lý thủ công.';
      }
    }

    await refund.save();

    return res.status(200).json({
      success: true,
      message: `Yêu cầu hoàn tiền đã được ${status === 'approved' ? 'chấp nhận' : 'từ chối'}`,
      data: refund
    });

  } catch (error) {
    console.error('Error processing refund:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi xử lý yêu cầu hoàn tiền',
      error: error.message
    });
  }
};

// Helper function to initiate MoMo refund
const initiateMoMoRefund = async (refund) => {
  try {
    const accessKey = process.env.MOMO_ACCESS_KEY;
    const secretKey = process.env.MOMO_SECRET_KEY;
    const partnerCode = process.env.MOMO_PARTNER_CODE;
    
    const orderId = `REFUND_${refund._id}_${Date.now()}`;
    const requestId = orderId;
    const amount = refund.amount;
    const transId = refund.momoTransactionId;
    const description = `Hoàn tiền cho đơn hàng ${refund.orderId}`;

    // Create signature
    const rawSignature = `accessKey=${accessKey}&amount=${amount}&description=${description}&orderId=${orderId}&partnerCode=${partnerCode}&requestId=${requestId}&transId=${transId}`;
    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');

    const requestBody = {
      partnerCode,
      orderId,
      requestId,
      amount,
      transId,
      lang: 'vi',
      description,
      signature
    };

    // Call MoMo refund API
    const response = await axios.post(
      'https://test-payment.momo.vn/v2/gateway/api/refund',
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('MoMo refund API response:', response.data);

    if (response.data.resultCode === 0) {
      return {
        success: true,
        refundId: response.data.transId,
        response: response.data
      };
    } else {
      const error = new Error(response.data.message || 'MoMo refund failed');
      error.response = { data: response.data };
      throw error;
    }

  } catch (error) {
    console.error('MoMo refund initiation error:', error);
    
    // If axios error with response, preserve the response data
    if (error.response?.data) {
      const momoError = new Error(error.response.data.message || 'MoMo refund failed');
      momoError.response = error.response;
      throw momoError;
    }
    
    throw error;
  }
};

// Get refund statistics (Admin only)
export const getRefundStats = async (req, res) => {
  try {
    const stats = await Refund.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const formattedStats = {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      completed: 0,
      totalAmount: 0
    };

    stats.forEach(stat => {
      formattedStats[stat._id] = stat.count;
      formattedStats.total += stat.count;
      formattedStats.totalAmount += stat.totalAmount;
    });

    return res.status(200).json({
      success: true,
      data: formattedStats
    });

  } catch (error) {
    console.error('Error fetching refund stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tải thống kê hoàn tiền',
      error: error.message
    });
  }
};

// Withdraw refund request (User can cancel their own pending request)
export const withdrawRefund = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { refundId } = req.params;

    const refund = await Refund.findOne({
      _id: refundId,
      userId: userId
    });

    if (!refund) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu hoàn tiền'
      });
    }

    if (refund.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể thu hồi yêu cầu hoàn tiền đang chờ xử lý'
      });
    }

    // Update status to withdrawn
    refund.status = 'withdrawn';
    refund.processedDate = new Date();
    refund.adminNote = 'Yêu cầu đã được thu hồi bởi người dùng';
    
    await refund.save();

    return res.status(200).json({
      success: true,
      message: 'Đã thu hồi yêu cầu hoàn tiền thành công',
      data: refund
    });

  } catch (error) {
    console.error('Error withdrawing refund:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi thu hồi yêu cầu hoàn tiền',
      error: error.message
    });
  }
};
