import Wallet from '../models/Wallet.js';
import Transaction from '../models/Transaction.js';
import crypto from 'crypto';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

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
 * Get wallet information for current user
 * @route GET /api/wallet
 */
export const getWallet = async (req, res) => {
  try {
    const userId = req.userId;

    let wallet = await Wallet.findOne({ user_id: userId });

    // Create wallet if doesn't exist
    if (!wallet) {
      wallet = await Wallet.create({
        user_id: userId,
        balance: 0
      });
    }

    return res.status(200).json({
      success: true,
      data: wallet
    });

  } catch (error) {
    console.error('Error fetching wallet:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tải thông tin ví',
      error: error.message
    });
  }
};

/**
 * Get transaction history for current user
 * @route GET /api/wallet/transactions
 */
export const getTransactions = async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 20 } = req.query;

    const wallet = await Wallet.findOne({ user_id: userId });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy ví'
      });
    }

    const skip = (page - 1) * limit;

    const transactions = await Transaction.find({ wallet_id: wallet._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Transaction.countDocuments({ wallet_id: wallet._id });

    return res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching transactions:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tải lịch sử giao dịch',
      error: error.message
    });
  }
};

/**
 * Deposit money into wallet via MoMo
 * @route POST /api/wallet/deposit
 */
export const deposit = async (req, res) => {
  try {
    const userId = req.userId;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Số tiền không hợp lệ'
      });
    }

    if (amount < 10000) {
      return res.status(400).json({
        success: false,
        message: 'Số tiền nạp tối thiểu là 10,000 ₫'
      });
    }

    let wallet = await Wallet.findOne({ user_id: userId });

    if (!wallet) {
      wallet = await Wallet.create({
        user_id: userId,
        balance: 0
      });
    }

    // Prepare MoMo payment request for wallet deposit
    const partnerCode = process.env.MOMO_PARTNER_CODE;
    const accessKey = process.env.MOMO_ACCESS_KEY;
    const secretKey = process.env.MOMO_SECRET_KEY;
    const endpoint = process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create';
    const returnUrl = process.env.MOMO_RETURN_URL_WALLET || 'http://localhost:5173/wallet';
    const ipnUrl = process.env.MOMO_IPN_URL_WALLET;

    // Validate MoMo credentials
    if (!partnerCode || !accessKey || !secretKey) {
      return res.status(500).json({ 
        success: false,
        message: 'Cấu hình thanh toán MoMo chưa đầy đủ' 
      });
    }

    const orderId = `WALLET_DEPOSIT_${Date.now()}`;
    const requestId = uuidv4();
    const orderInfo = `Nap tien vao vi: ${amount} VND`;
    const requestType = 'payWithMethod';
    const extraData = Buffer.from(JSON.stringify({ 
      type: 'wallet_deposit',
      userId,
      walletId: wallet._id.toString(),
      amount
    })).toString('base64');

    // Build signature data
    const signatureData = {
      accessKey,
      amount: amount.toString(),
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

    // Send request to MoMo
    const momoRequest = {
      partnerCode,
      accessKey,
      requestId,
      amount,
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

    if (momoResponse.data.resultCode === 0) {
      return res.json({
        success: true,
        paymentUrl: momoResponse.data.payUrl,
        orderId,
        amount
      });
    } else {
      return res.status(400).json({
        success: false,
        message: momoResponse.data.message || 'Lỗi khi khởi tạo thanh toán MoMo'
      });
    }

  } catch (error) {
    console.error('Error initiating deposit:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi nạp tiền',
      error: error.message
    });
  }
};

/**
 * Withdraw money from wallet
 * @route POST /api/wallet/withdraw
 */
export const withdraw = async (req, res) => {
  try {
    const userId = req.userId;
    const { amount, payment_method_index } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Số tiền không hợp lệ'
      });
    }

    if (amount < 50000) {
      return res.status(400).json({
        success: false,
        message: 'Số tiền rút tối thiểu là 50,000 ₫'
      });
    }

    const wallet = await Wallet.findOne({ user_id: userId });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy ví'
      });
    }

    if (wallet.balance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Số dư không đủ'
      });
    }

    // Check payment method
    let paymentMethod = null;
    if (payment_method_index !== undefined && wallet.payment_methods && wallet.payment_methods[payment_method_index]) {
      paymentMethod = wallet.payment_methods[payment_method_index];
    } else if (wallet.payment_methods && wallet.payment_methods.length > 0) {
      paymentMethod = wallet.payment_methods.find(m => m.is_default) || wallet.payment_methods[0];
    }

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng thêm phương thức thanh toán trước khi rút tiền'
      });
    }

    // Deduct from wallet balance
    wallet.balance -= amount;
    await wallet.save();

    // Create transaction description based on payment method type
    let description = '';
    if (paymentMethod.type === 'momo') {
      description = `Rút tiền về MoMo ${paymentMethod.phone_number}: ${new Intl.NumberFormat('vi-VN').format(amount)} ₫`;
    } else {
      description = `Rút tiền về ${paymentMethod.bank_name} ${paymentMethod.account_number}: ${new Intl.NumberFormat('vi-VN').format(amount)} ₫`;
    }

    // Create transaction record
    const transaction = await Transaction.create({
      wallet_id: wallet._id.toString(),
      operation: 'debit',
      amount: amount,
      balance: wallet.balance,
      description: description
    });

    return res.status(200).json({
      success: true,
      message: 'Rút tiền thành công. Tiền sẽ được chuyển trong 1-3 ngày làm việc.',
      data: {
        balance: wallet.balance,
        amount: amount,
        payment_method: {
          type: paymentMethod.type,
          info: paymentMethod.type === 'momo' ? paymentMethod.phone_number : `${paymentMethod.bank_name} - ${paymentMethod.account_number}`
        },
        transaction_id: transaction._id
      }
    });

  } catch (error) {
    console.error('Error withdrawing:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi rút tiền',
      error: error.message
    });
  }
};

/**
 * Handle MoMo callback for wallet deposit
 * @route POST /api/wallet/momo/callback
 */
export const handleMoMoDepositCallback = async (req, res) => {
  try {
    // Parse body if it's a Buffer
    let body = req.body;
    if (Buffer.isBuffer(req.body)) {
      const bodyString = req.body.toString('utf8');
      body = JSON.parse(bodyString);
    }

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
    } = body;

    // Verify signature
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
      console.error('Invalid MoMo signature for wallet deposit');
      console.error('Expected:', expectedSignature);
      console.error('Received:', signature);
      return res.status(400).json({ message: 'Invalid signature' });
    }

    // Decode extraData
    const decodedData = JSON.parse(Buffer.from(extraData, 'base64').toString());
    const { userId, walletId, amount: depositAmount } = decodedData;

    if (resultCode === 0) {
      // Payment successful - credit wallet
      const wallet = await Wallet.findById(walletId);
      
      if (wallet) {
        wallet.balance += depositAmount;
        await wallet.save();

        // Create transaction record
        await Transaction.create({
          wallet_id: walletId,
          operation: 'credit',
          amount: depositAmount,
          balance: wallet.balance,
          description: `Nap tien qua MoMo: ${new Intl.NumberFormat('vi-VN').format(depositAmount)} VND (GD: ${transId})`
        });

        console.log(`✅ Wallet deposit successful: ${depositAmount} for user ${userId}`);
      }
    } else {
      console.log(`❌ Wallet deposit failed: ${message} for user ${userId}`);
    }
    // Respond to MoMo
    res.status(204).end();

  } catch (error) {
    console.error('Error handling MoMo wallet deposit callback:', error);
    res.status(500).json({ message: 'Error processing callback' });
  }
};

/**
 * Handle MoMo callback for wallet disbursement (withdrawal)
 * @route POST /api/wallet/momo/disbursement-callback
 */
export const handleMoMoDisbursementCallback = async (req, res) => {
  const {
    partnerCode,
    orderId,
    requestId,
    amount,
    orderInfo,
    resultCode,
    message,
    transId,
    responseTime,
    signature
  } = req.body;

  try {
    // Verify signature
    const crypto = await import('crypto');
    const secretKey = process.env.MOMO_SECRET_KEY;
    const accessKey = process.env.MOMO_ACCESS_KEY;

    const signatureData = {
      accessKey,
      amount: amount.toString(),
      message,
      orderId,
      orderInfo,
      partnerCode,
      requestId,
      responseTime: responseTime.toString(),
      resultCode: resultCode.toString(),
      transId: transId ? transId.toString() : ''
    };

    const rawSignature = Object.keys(signatureData)
      .sort()
      .map(key => `${key}=${signatureData[key]}`)
      .join('&');

    const expectedSignature = crypto.default
      .createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('Invalid MoMo signature for disbursement callback');
      return res.status(400).json({ message: 'Invalid signature' });
    }

    // Find transaction by order_id
    const transaction = await Transaction.findOne({ disbursement_order_id: orderId });

    if (!transaction) {
      console.error(`Transaction not found for disbursement orderId: ${orderId}`);
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Update transaction status based on result
    if (resultCode === 0) {
      // Disbursement successful
      transaction.disbursement_status = 'completed';
      transaction.disbursement_trans_id = transId;
      await transaction.save();

      console.log(`✅ Disbursement successful: ${amount} for order ${orderId}, transId: ${transId}`);
    } else {
      // Disbursement failed - refund to wallet
      transaction.disbursement_status = 'failed';
      transaction.disbursement_error = message;
      await transaction.save();

      // Refund amount back to wallet
      const wallet = await Wallet.findById(transaction.wallet_id);
      if (wallet) {
        wallet.balance += transaction.amount;
        await wallet.save();

        // Create refund transaction record
        await Transaction.create({
          wallet_id: wallet._id.toString(),
          operation: 'credit',
          amount: transaction.amount,
          balance: wallet.balance,
          description: `Hoàn tiền do rút MoMo thất bại: ${new Intl.NumberFormat('vi-VN').format(transaction.amount)} ₫ (Lỗi: ${message})`
        });

        console.log(`❌ Disbursement failed: ${message} for order ${orderId}. Amount refunded to wallet.`);
      }
    }

    // Respond to MoMo
    res.status(204).end();

  } catch (error) {
    console.error('Error handling MoMo disbursement callback:', error);
    res.status(500).json({ message: 'Error processing callback' });
  }
};

/**
 * Internal function to add/subtract balance (used by other controllers)
 * @param {string} userId 
 * @param {number} amount - positive for credit, negative for debit
 * @param {string} description 
 */
export const updateWalletBalance = async (userId, amount, description) => {
  try {
    let wallet = await Wallet.findOne({ user_id: userId });

    if (!wallet) {
      wallet = await Wallet.create({
        user_id: userId,
        balance: 0
      });
    }

    wallet.balance += amount;
    
    if (wallet.balance < 0) {
      throw new Error('Số dư không đủ');
    }

    await wallet.save();

    // Create transaction record
    await Transaction.create({
      wallet_id: wallet._id.toString(),
      operation: amount > 0 ? 'credit' : 'debit',
      amount: Math.abs(amount),
      balance: wallet.balance,
      description: description
    });

    return {
      success: true,
      balance: wallet.balance
    };

  } catch (error) {
    console.error('Error updating wallet balance:', error);
    throw error;
  }
};

/**
 * Add payment method to wallet
 * @route POST /api/wallet/payment-methods
 */
export const addPaymentMethod = async (req, res) => {
  try {
    const userId = req.userId;
    const { type, phone_number, account_name, bank_name, bank_code, account_number, card_number, is_default } = req.body;

    if (!type || !['momo', 'bank_transfer'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Loại phương thức thanh toán không hợp lệ'
      });
    }

    if (type === 'momo' && !phone_number) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập số điện thoại MoMo'
      });
    }

    if (type === 'bank_transfer' && (!account_name || !bank_name || !account_number)) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ thông tin tài khoản ngân hàng'
      });
    }

    let wallet = await Wallet.findOne({ user_id: userId });

    if (!wallet) {
      wallet = await Wallet.create({
        user_id: userId,
        balance: 0,
        payment_methods: []
      });
    }

    // If this is the first payment method or set as default, make it default
    const shouldBeDefault = is_default || !wallet.payment_methods || wallet.payment_methods.length === 0;

    // If setting as default, unset other defaults
    if (shouldBeDefault && wallet.payment_methods) {
      wallet.payment_methods.forEach(method => {
        method.is_default = false;
      });
    }

    const newMethod = {
      type,
      phone_number: type === 'momo' ? phone_number : undefined,
      account_name: type === 'bank_transfer' ? account_name : undefined,
      bank_name: type === 'bank_transfer' ? bank_name : undefined,
      bank_code: type === 'bank_transfer' ? bank_code : undefined,
      account_number: type === 'bank_transfer' ? account_number : undefined,
      card_number: type === 'bank_transfer' ? card_number : undefined,
      is_default: shouldBeDefault,
      created_at: new Date()
    };

    wallet.payment_methods.push(newMethod);
    await wallet.save();

    return res.status(200).json({
      success: true,
      message: 'Thêm phương thức thanh toán thành công',
      data: wallet.payment_methods
    });

  } catch (error) {
    console.error('Error adding payment method:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi thêm phương thức thanh toán',
      error: error.message
    });
  }
};

/**
 * Remove payment method from wallet
 * @route DELETE /api/wallet/payment-methods/:index
 */
export const removePaymentMethod = async (req, res) => {
  try {
    const userId = req.userId;
    const { index } = req.params;

    const wallet = await Wallet.findOne({ user_id: userId });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy ví'
      });
    }

    if (!wallet.payment_methods || wallet.payment_methods.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không có phương thức thanh toán nào'
      });
    }

    const methodIndex = parseInt(index);
    if (methodIndex < 0 || methodIndex >= wallet.payment_methods.length) {
      return res.status(400).json({
        success: false,
        message: 'Phương thức thanh toán không tồn tại'
      });
    }

    const wasDefault = wallet.payment_methods[methodIndex].is_default;
    wallet.payment_methods.splice(methodIndex, 1);

    // If removed method was default and there are still methods left, set first one as default
    if (wasDefault && wallet.payment_methods.length > 0) {
      wallet.payment_methods[0].is_default = true;
    }

    await wallet.save();

    return res.status(200).json({
      success: true,
      message: 'Xóa phương thức thanh toán thành công',
      data: wallet.payment_methods
    });

  } catch (error) {
    console.error('Error removing payment method:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa phương thức thanh toán',
      error: error.message
    });
  }
};

/**
 * Pay for order using wallet balance
 * @route POST /api/payment/wallet/pay
 */
export const payWithWallet = async (req, res) => {
  try {
    const userId = req.userId;
    const { voucherCode } = req.body;

    // Import required modules
    const Order = (await import('../models/Order.js')).default;
    const Payment = (await import('../models/Payment.js')).default;
    const Earning = (await import('../models/Earning.js')).default;
    const pool = (await import('../config/mysql.js')).default;
    const { updateOrderStatus } = await import('./orderController.js');

    // 1. Create order from cart
    const token = req.headers.authorization.split(' ')[1];
    const orderResponse = await fetch(`${process.env.BACKEND_URL || 'http://localhost:3000'}/api/order/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ voucherCode })
    });

    if (!orderResponse.ok) {
      const errorData = await orderResponse.json();
      return res.status(400).json({
        success: false,
        message: errorData.message || 'Không thể tạo đơn hàng'
      });
    }

    const orderData = await orderResponse.json();
    const { orderId, totalAmount } = orderData;

    // 2. Get wallet and check balance
    const wallet = await Wallet.findOne({ user_id: userId });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy ví'
      });
    }

    if (wallet.balance < totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Số dư không đủ để thanh toán'
      });
    }

    // 3. Deduct from wallet
    wallet.balance -= totalAmount;
    await wallet.save();

    // 4. Create transaction record
    await Transaction.create({
      wallet_id: wallet._id.toString(),
      operation: 'debit',
      amount: totalAmount,
      balance: wallet.balance,
      description: `Thanh toán đơn hàng ${orderId.substring(0, 8)}: ${new Intl.NumberFormat('vi-VN').format(totalAmount)} ₫`
    });

    // 5. Create payment record
    const payment = await Payment.create({
      userId,
      orderId,
      paymentStatus: 'success',
      method: 'wallet',
      amount: totalAmount
    });

    // 6. Update order status
    await updateOrderStatus(orderId, 'success');

    // 7. Get order items and create enrollments
    const order = await Order.findById(orderId);
    const orderItems = order.items;

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

    // 8. Create earning records
    for (const item of orderItems) {
      try {
        const [courseResult] = await pool.query(
          'SELECT instructor_id FROM Courses WHERE course_id = ?',
          [item.courseId]
        );

        if (courseResult.length > 0) {
          const instructorId = courseResult[0].instructor_id;
          const amount = item.price;
          const platformFee = amount * 0.1;
          const netAmount = amount - platformFee;

          await Earning.create({
            instructor_id: instructorId,
            course_id: item.courseId,
            order_id: orderId,
            amount: amount,
            net_amount: netAmount,
            status: 'pending',
            clearance_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          });

          console.log(`✅ Earning created for instructor ${instructorId}, course ${item.courseId}`);
        }
      } catch (earningError) {
        console.error(`Error creating earning for course ${item.courseId}:`, earningError);
      }
    }

    // 9. Clear cart
    const [cartResult] = await pool.query(
      'SELECT cart_id FROM Carts WHERE user_id = ?',
      [userId]
    );

    if (cartResult.length > 0) {
      const cartId = cartResult[0].cart_id;
      await pool.query('DELETE FROM CartDetail WHERE cart_id = ?', [cartId]);
    }

    return res.status(200).json({
      success: true,
      message: 'Thanh toán thành công',
      data: {
        orderId,
        paymentId: payment._id,
        amount: totalAmount,
        balance: wallet.balance
      }
    });

  } catch (error) {
    console.error('Error processing wallet payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi xử lý thanh toán',
      error: error.message
    });
  }
};

/**
 * Set default payment method
 * @route PUT /api/wallet/payment-methods/:index/default
 */
export const setDefaultPaymentMethod = async (req, res) => {
  try {
    const userId = req.userId;
    const { index } = req.params;

    const wallet = await Wallet.findOne({ user_id: userId });

    if (!wallet || !wallet.payment_methods || wallet.payment_methods.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phương thức thanh toán'
      });
    }

    const methodIndex = parseInt(index);
    if (methodIndex < 0 || methodIndex >= wallet.payment_methods.length) {
      return res.status(400).json({
        success: false,
        message: 'Phương thức thanh toán không tồn tại'
      });
    }

    // Unset all defaults
    wallet.payment_methods.forEach((method, idx) => {
      method.is_default = idx === methodIndex;
    });

    await wallet.save();

    return res.status(200).json({
      success: true,
      message: 'Đã đặt làm phương thức thanh toán mặc định',
      data: wallet.payment_methods
    });

  } catch (error) {
    console.error('Error setting default payment method:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi đặt phương thức thanh toán mặc định',
      error: error.message
    });
  }
};
