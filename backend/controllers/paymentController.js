import pool from '../config/mysql.js';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import axios from 'axios';
import { updateOrderStatus } from './orderController.js';

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

  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Validate order exists and belongs to user
    const [orderResult] = await connection.query(
      `SELECT o.order_id, o.order_status, o.user_id, o.voucher_code
       FROM Orders o
       WHERE o.order_id = ? AND o.user_id = ?`,
      [orderId, userId]
    );

    if (orderResult.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    const order = orderResult[0];

    if (order.order_status !== 'pending') {
      await connection.rollback();
      return res.status(400).json({ message: 'Đơn hàng đã được xử lý' });
    }

    // 2. Calculate subtotal from OrderDetail
    const [orderItems] = await connection.query(
      'SELECT SUM(price) as total FROM OrderDetail WHERE order_id = ?',
      [orderId]
    );

    const subtotal = parseFloat(orderItems[0].total);

    if (subtotal <= 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'Số tiền không hợp lệ' });
    }

    // 3. Apply voucher discount if exists
    let discount = 0;
    if (order.voucher_code) {
      const [voucherResult] = await connection.query(
        `SELECT voucher_type, amount FROM Vouchers WHERE voucher_code = ?`,
        [order.voucher_code]
      );

      if (voucherResult.length > 0) {
        const voucher = voucherResult[0];
        if (voucher.voucher_type === 'percentage') {
          discount = subtotal * (voucher.amount / 100);
        } else if (voucher.voucher_type === 'absolute') {
          discount = voucher.amount;
        }
      }
    }

    const totalAmount = Math.max(0, Math.round(subtotal - discount));

    if (totalAmount <= 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'Số tiền không hợp lệ' });
    }

    // 4. Create Payment record
    const paymentId = uuidv4();
    await connection.query(
      `INSERT INTO Payments (payment_id, user_id, order_id, payment_status, method, amount)
       VALUES (?, ?, ?, 'pending', 'momo', ?)`,
      [paymentId, userId, orderId, totalAmount]
    );

    // 5. Prepare MoMo payment request
    const partnerCode = process.env.MOMO_PARTNER_CODE;
    const accessKey = process.env.MOMO_ACCESS_KEY;
    const secretKey = process.env.MOMO_SECRET_KEY;
    const endpoint = process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create';
    const returnUrl = process.env.MOMO_RETURN_URL || 'http://localhost:5173/payment/momo/return';
    const ipnUrl = process.env.MOMO_IPN_URL;

    // Validate MoMo credentials
    if (!partnerCode || !accessKey || !secretKey) {
      await connection.rollback();
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

    await connection.commit();

    // 7. Return payment URL to client
    if (momoResponse.data.resultCode === 0) {
      res.json({
        success: true,
        paymentUrl: momoResponse.data.payUrl,
        paymentId,
        orderId,
        amount: totalAmount
      });
    } else {
      // MoMo API error
      await updatePaymentStatus(paymentId, 'failed');
      await updateOrderStatus(orderId, 'failed');
      
      res.status(400).json({
        success: false,
        message: momoResponse.data.message || 'Lỗi khi khởi tạo thanh toán MoMo'
      });
    }

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Error initiating MoMo payment:', error);
    res.status(500).json({ message: 'Lỗi khi khởi tạo thanh toán' });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

/**
 * Handle MoMo IPN (Instant Payment Notification) callback
 * @route POST /api/payment/momo/callback
 */
export const handleMoMoCallback = async (req, res) => {
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

    let connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 3. Update payment status based on resultCode
      if (resultCode === 0) {
        // Payment successful
        await connection.query(
          'UPDATE Payments SET payment_status = ? WHERE payment_id = ?',
          ['success', paymentId]
        );
        await connection.query(
          'UPDATE Orders SET order_status = ? WHERE order_id = ?',
          ['success', orderId]
        );

        // 4. Get order items for enrollment
        const [orderItems] = await connection.query(
          'SELECT course_id FROM OrderDetail WHERE order_id = ?',
          [orderId]
        );

        await connection.commit();
        connection.release();

        // 5. Create enrollments for each course (MongoDB - async)
        // Import enrollmentController dynamically to avoid circular dependency
        const { createEnrollment } = await import('./enrollmentController.js');
        
        for (const item of orderItems) {
          try {
            // Create enrollment request object
            const enrollReq = {
              body: { courseId: item.course_id, userId },
              userId
            };
            const enrollRes = {
              status: (code) => ({ json: () => {} }),
              json: () => {}
            };
            await createEnrollment(enrollReq, enrollRes);
          } catch (enrollError) {
            console.error(`Error creating enrollment for course ${item.course_id}:`, enrollError);
            // Continue with other enrollments even if one fails
          }
        }

        // 6. Clear user's cart
        const [cartResult] = await pool.query(
          'SELECT cart_id FROM Carts WHERE user_id = ?',
          [userId]
        );

        if (cartResult.length > 0) {
          const cartId = cartResult[0].cart_id;
          await pool.query('DELETE FROM CartDetail WHERE cart_id = ?', [cartId]);
        }

      } else {
        // Payment failed
        await connection.query(
          'UPDATE Payments SET payment_status = ? WHERE payment_id = ?',
          ['failed', paymentId]
        );
        await connection.query(
          'UPDATE Orders SET order_status = ? WHERE order_id = ?',
          ['failed', orderId]
        );

        await connection.commit();
        connection.release();
      }

      // 7. Respond to MoMo
      res.status(204).end();

    } catch (error) {
      await connection.rollback();
      connection.release();
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

    // Get payment status from database
    const [paymentResult] = await pool.query(
      `SELECT p.payment_id, p.payment_status, p.amount, p.order_id,
              o.order_status
       FROM Payments p
       JOIN Orders o ON p.order_id = o.order_id
       WHERE p.payment_id = ?`,
      [paymentId]
    );

    if (paymentResult.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Payment not found' 
      });
    }

    const payment = paymentResult[0];

    res.json({
      success: resultCode === '0',
      resultCode,
      message,
      paymentId,
      orderId,
      amount: payment.amount,
      paymentStatus: payment.payment_status,
      orderStatus: payment.order_status
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
  await pool.query(
    'UPDATE Payments SET payment_status = ? WHERE payment_id = ?',
    [status, paymentId]
  );
};

/**
 * Get payment details
 * @route GET /api/payment/:paymentId
 */
export const getPaymentDetails = async (req, res) => {
  const { userId } = req;
  const { paymentId } = req.params;

  try {
    const [paymentResult] = await pool.query(
      `SELECT p.payment_id, p.payment_status, p.method, p.amount, p.created_at,
              p.order_id, o.order_status
       FROM Payments p
       JOIN Orders o ON p.order_id = o.order_id
       WHERE p.payment_id = ? AND p.user_id = ?`,
      [paymentId, userId]
    );

    if (paymentResult.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin thanh toán' });
    }

    res.json(paymentResult[0]);

  } catch (error) {
    console.error('Error fetching payment details:', error);
    res.status(500).json({ message: 'Lỗi khi lấy thông tin thanh toán' });
  }
};
