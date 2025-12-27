import Payment from '../models/Payment.js';
import Order from '../models/Order.js';
import Earning from '../models/Earning.js';
import Course from '../models/Course.js';
import Cart from '../models/Cart.js';
import Enrollment from '../models/Enrollment.js';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import axios from 'axios';
import { updateOrderStatus } from './orderController.js';
import { create } from 'domain';

/**
 * Generate MoMo payment signature
 */
const generateMoMoSignature = (data, secretKey) => {
  const rawSignature = Object.keys(data)
    .sort()
    .map(key => `${key}=${data[key]}`)
    .join('&');
  
  return crypto
    .createHmac('sha256', secretKey)
    .update(rawSignature)
    .digest('hex');
};

/**
 * Initiate MoMo payment
 * @route POST /api/payment/momo/initiate
 */
export const initiateMoMoPayment = async (req, res) => {
  const { userId } = req;
  const { orderId } = req.body;

  try {
    // 1. Validate order exists and belongs to user (MongoDB)
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    if (order.userId !== userId) {
      return res.status(403).json({ message: 'Không có quyền truy cập' });
    }

    if (order.orderStatus !== 'pending') {
      return res.status(400).json({ message: 'Đơn hàng đã được xử lý' });
    }

    // 2. Use pre-calculated totalAmount from order
    const totalAmount = Math.round(order.totalAmount);

    if (totalAmount <= 0) {
      return res.status(400).json({ message: 'Số tiền không hợp lệ' });
    }

    // 4. Create Payment record in MongoDB
    const payment = new Payment({
      userId,
      orderId,
      paymentStatus: 'pending',
      method: 'momo',
      amount: totalAmount
    });

    await payment.save();
    const paymentId = payment._id.toString();

    // 5. Prepare MoMo payment request
    const partnerCode = process.env.MOMO_PARTNER_CODE;
    const accessKey = process.env.MOMO_ACCESS_KEY;
    const secretKey = process.env.MOMO_SECRET_KEY;
    const endpoint = process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create';
    const returnUrl = process.env.MOMO_RETURN_URL || 'http://localhost:5173/payment/momo/return';
    const ipnUrl = process.env.MOMO_IPN_URL;

    // Validate MoMo credentials
    if (!partnerCode || !accessKey || !secretKey) {
      console.error('Missing MoMo credentials in .env file');
      return res.status(500).json({ 
        message: 'Cấu hình thanh toán MoMo chưa đầy đủ. Vui lòng liên hệ quản trị viên.' 
      });
    }

    const requestId = uuidv4();
    const orderInfo = `Thanh toán khóa học - Order ${orderId.substring(0, 8)}`;
    const requestType = 'payWithMethod'; // 'captureWallet' là kiểu thanh toán qua ví MoMo, còn 'payWithMethod' là thanh toán qua nhiều phương thức khác do momo hỗ trợ
    const extraData = Buffer.from(JSON.stringify({ 
      paymentId, 
      orderId, 
      userId 
    })).toString('base64');

    // Build signature data
    const signatureData = {
      accessKey,
      amount: totalAmount.toString(),
      extraData,
      ipnUrl,
      orderId,
      orderInfo,
      partnerCode,
      redirectUrl: returnUrl,
      requestId,
      requestType
    };

    const signature = generateMoMoSignature(signatureData, secretKey);

    // 6. Send request to MoMo
    const momoRequest = {
      partnerCode,
      accessKey,
      requestId,
      amount: totalAmount,
      orderId,
      orderInfo,
      redirectUrl: returnUrl,
      ipnUrl,
      requestType,
      extraData,
      lang: 'vi',
      signature
    };

    const momoResponse = await axios.post(endpoint, momoRequest, {
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('🔵 MoMo Response !');

    // 7. Return payment URL to client
    if (momoResponse.data.resultCode === 0) {
      // Update payment with MoMo request details
      payment.momoRequestId = requestId;
      await payment.save();

      res.json({
        success: true,
        paymentUrl: momoResponse.data.payUrl,
        paymentId,
        orderId,
        amount: totalAmount
      });
    } else {
      // MoMo API error
      payment.paymentStatus = 'failed';
      payment.momoResultCode = momoResponse.data.resultCode;
      payment.momoMessage = momoResponse.data.message;
      await payment.save();
      
      await updateOrderStatus(orderId, 'failed');
      
      res.status(400).json({
        success: false,
        message: momoResponse.data.message || 'Lỗi khi khởi tạo thanh toán MoMo'
      });
    }

  } catch (error) {
    console.error('Error initiating MoMo payment:', error);
    res.status(500).json({ message: 'Lỗi khi khởi tạo thanh toán' });
  }
};

/**
 * Handle MoMo IPN (Instant Payment Notification) callback
 * @route POST /api/payment/momo/callback
 */
export const handleMoMoCallback = async (req, res) => {
  // Log để debug
  console.log('🟣 MoMo IPN Callback received !');
  
  const {
    partnerCode,
    orderId,
    requestId,
    amount,
    orderInfo,
    orderType,
    transId,
    resultCode,
    message,
    payType,
    responseTime,
    extraData,
    signature
  } = req.body;
  try {
    // 1. Verify signature
    const secretKey = process.env.MOMO_SECRET_KEY;
    const accessKey = process.env.MOMO_ACCESS_KEY;

    const signatureData = {
      accessKey,
      amount: amount.toString(),
      extraData,
      message,
      orderId,
      orderInfo,
      orderType,
      partnerCode,
      payType,
      requestId,
      responseTime: responseTime.toString(),
      resultCode: resultCode.toString(),
      transId: transId.toString()
    };

    const expectedSignature = generateMoMoSignature(signatureData, secretKey);

    if (signature !== expectedSignature) {
      console.error('Invalid MoMo signature');
      return res.status(400).json({ message: 'Invalid signature' });
    }

    // 2. Decode extraData to get paymentId, orderId, userId
    const decodedData = JSON.parse(Buffer.from(extraData, 'base64').toString());
    const { paymentId, userId } = decodedData;

    // 3. Update payment status based on resultCode in MongoDB
    const payment = await Payment.findById(paymentId);
    
    if (!payment) {
      console.error('Payment not found:', paymentId);
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Store MoMo transaction details
    payment.momoTransactionId = transId.toString();
    payment.momoRequestId = requestId;
    payment.momoResultCode = resultCode;
    payment.momoMessage = message;

    try {
      if (resultCode === 0) {
        // Payment successful
        payment.paymentStatus = 'success';
        await payment.save();

        // Update order status in MongoDB
        await updateOrderStatus(orderId, 'success');

        // 4. Get order items for enrollment from MongoDB
        const order = await Order.findById(orderId);
        const orderItems = order.items;

        // 5. Create enrollments for each course (MongoDB - async)
        const { createEnrollment } = await import('./enrollmentController.js');
        
        for (const item of orderItems) {
          try {
            const enrollReq = {
              body: { courseId: item.courseId, userId },
              userId
            };
            const enrollRes = {
              status: (code) => ({ json: () => {} }),
              json: () => {}
            };
            await createEnrollment(enrollReq, enrollRes);
          } catch (enrollError) {
            console.error(`Error creating enrollment for course ${item.courseId}:`, enrollError);
          }
        }

        // 6. Create earning records for each course
        for (const item of orderItems) {
          try {
            // Get instructor_id from MongoDB
            const course = await Course.findById(item.courseId).lean();
            console.log('Course for earning:', course);
            if (course) {
              const instructorId = course.instructor_id;
              const amount = item.price;
              const platformFee = amount * 0.1; // 10% platform fee
              const netAmount = amount - platformFee;

              await Earning.create({
                instructor_id: instructorId,
                course_id: item.courseId,
                order_id: orderId,
                amount: amount,
                net_amount: netAmount,
                status: 'pending',
                clearance_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days later
              });

              console.log(`✅ Earning created for instructor ${instructorId}, course ${item.courseId}`);
            }
          } catch (earningError) {
            console.error(`Error creating earning for course ${item.courseId}:`, earningError);
          }
        }

        // 7. Clear user's cart (MongoDB)
        await Cart.findOneAndUpdate(
          { user_id: userId },
          { $set: { items: [] } }
        );
        console.log(`✅ Cart cleared for user ${userId}`);
        console.log('MoMo payment status:' , payment.paymentStatus);
      } else {
        // Payment failed
        payment.paymentStatus = 'failed';
        await payment.save();

        // Update order status in MongoDB
        await updateOrderStatus(orderId, 'failed');
      }

      // 8. Respond to MoMo
      res.status(204).end();

    } catch (error) {
      throw error;
    }

  } catch (error) {
    console.error('Error handling MoMo callback:', error);
    res.status(500).json({ message: 'Error processing callback' });
  }
};

/**
 * Handle MoMo return URL (user redirected back)
 * @route GET /api/payment/momo/return
 */
export const handleMoMoReturn = async (req, res) => {
  const {
    partnerCode,
    orderId,
    requestId,
    amount,
    orderInfo,
    orderType,
    transId,
    resultCode,
    message,
    payType,
    responseTime,
    extraData,
    signature
  } = req.query;

  console.log('🟢 MoMo Return received !');

  try {
    // Verify signature
    const secretKey = process.env.MOMO_SECRET_KEY;
    const accessKey = process.env.MOMO_ACCESS_KEY;

    const signatureData = {
      accessKey,
      amount,
      extraData,
      message,
      orderId,
      orderInfo,
      orderType,
      partnerCode,
      payType,
      requestId,
      responseTime,
      resultCode,
      transId
    };

    const expectedSignature = generateMoMoSignature(signatureData, secretKey);

    if (signature !== expectedSignature) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid signature' 
      });
    }

    // Decode extraData
    const decodedData = JSON.parse(Buffer.from(extraData, 'base64').toString());
    const { paymentId } = decodedData;

    // Get payment status from MongoDB
    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Payment not found' 
      });
    }

    // Get order status from MongoDB
    const order = await Order.findById(payment.orderId);
    const orderStatus = order ? order.orderStatus : null;

    res.json({
      success: resultCode === '0',
      resultCode,
      message,
      paymentId,
      orderId: payment.orderId,
      amount: payment.amount,
      paymentStatus: payment.paymentStatus,
      orderStatus
    });

  } catch (error) {
    console.error('Error handling MoMo return:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error processing return' 
    });
  }
};

/**
 * Update payment status
 * @param {string} paymentId 
 * @param {string} status - 'pending' | 'success' | 'failed'
 */
export const updatePaymentStatus = async (paymentId, status) => {
  await Payment.findByIdAndUpdate(paymentId, { paymentStatus: status });
};

/**
 * Get payment details
 * @route GET /api/payment/:paymentId
 */
export const getPaymentDetails = async (req, res) => {
  const { userId } = req;
  const { paymentId } = req.params;

  try {
    // Get payment from MongoDB
    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin thanh toán' });
    }

    // Verify payment belongs to user
    if (payment.userId !== userId) {
      return res.status(403).json({ message: 'Không có quyền truy cập' });
    }

    // Get order status from MongoDB
    const order = await Order.findById(payment.orderId);
    const orderStatus = order ? order.orderStatus : null;

    res.json({
      paymentId: payment._id,
      paymentStatus: payment.paymentStatus,
      method: payment.method,
      amount: payment.amount,
      createdAt: payment.createdAt,
      orderId: payment.orderId,
      orderStatus,
      momoTransactionId: payment.momoTransactionId,
      momoResultCode: payment.momoResultCode
    });

  } catch (error) {
    console.error('Error fetching payment details:', error);
    res.status(500).json({ message: 'Lỗi khi lấy thông tin thanh toán' });
  }
};


// enpoint to import earning from postman for testing purpose only
// example body:
// {
//   [
//     {
//       "instructor_id": "user_302EGsIkTVD4YEHbtyHaOod5gio",
//       "course_id": "104c8e66-87ad-42d7-8ade-3b01e2fd5084",
//       "order_id": "694f91d2053039f5735a9193",
//       "amount": 1000000,
//       "net_amount": 900000,
//       "status": "pending",
//       "clearance_date": "2024-12-31T00:00:00.000Z",
//       "createdAt": "2024-06-01T12:00:00.000Z",
//       "updatedAt": "2024-06-01T12:00:00.000Z"
//     },
//     {
//       "instructor_id": "user_302EGsIkTVD4YEHbtyHaOod5gio",
//       "course_id": "104c8e66-87ad-42d7-8ade-3b01e2fd5084",
//       "order_id": "694f91d2053039f5735a9193",
//       "amount": 1000000,
//       "net_amount": 900000,
//       "status": "pending",
//       "clearance_date": "2024-12-31T00:00:00.000Z",
//       "createdAt": "2024-06-01T12:00:00.000Z",
//       "updatedAt": "2024-06-01T12:00:00.000Z"
//     }
//   ]
// }
export const importEarning = async (req, res) => {
  try {
    const earningsData = req.body;
    if (!Array.isArray(earningsData) || earningsData.length === 0) {
      return res.status(400).json({ message: 'Invalid earnings data' });
    }
    // Save each earning to the database
    for (const earningData of earningsData) {
      const earning = new Earning(earningData);
      await earning.save();
    }
    res.status(201).json({ message: 'Earnings imported successfully' });
  } catch (error) {
    console.error('Error importing earning:', error);
    res.status(500).json({ message: 'Error importing earning' });
  }
};