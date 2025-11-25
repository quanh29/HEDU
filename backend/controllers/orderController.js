import pool from '../config/mysql.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create order from user's cart
 * Fetches cart data from database (not from client)
 * @route POST /api/order/create
 */
export const createOrderFromCart = async (req, res) => {
  const { userId } = req;
  const { voucherCode } = req.body; // Optional voucher code

  let connection;

  try {
    // Get a connection from pool for transaction
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Get user's cart
    const [cartResult] = await connection.query(
      'SELECT cart_id FROM Carts WHERE user_id = ?',
      [userId]
    );

    if (cartResult.length === 0 || !cartResult[0].cart_id) {
      await connection.rollback();
      return res.status(400).json({ message: 'Giỏ hàng trống' });
    }

    const cartId = cartResult[0].cart_id;

    // 2. Get cart items with course details
    const [cartItems] = await connection.query(
      `SELECT cd.course_id, c.currentPrice as price, c.title, c.course_status
       FROM CartDetail cd
       JOIN Courses c ON cd.course_id = c.course_id
       WHERE cd.cart_id = ?`,
      [cartId]
    );

    if (cartItems.length === 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'Giỏ hàng trống' });
    }

    // 3. Validate all courses are approved
    const unapprovedCourses = cartItems.filter(item => item.course_status !== 'approved');
    if (unapprovedCourses.length > 0) {
      await connection.rollback();
      return res.status(400).json({ 
        message: 'Một số khóa học trong giỏ hàng không còn khả dụng' 
      });
    }

    // 4. Validate voucher if provided
    let validatedVoucher = null;
    if (voucherCode) {
      const [voucherResult] = await connection.query(
        `SELECT voucher_code, voucher_type, amount, expire_at
         FROM Vouchers
         WHERE voucher_code = ?`,
        [voucherCode]
      );

      if (voucherResult.length === 0) {
        await connection.rollback();
        return res.status(400).json({ message: 'Mã giảm giá không hợp lệ' });
      }

      validatedVoucher = voucherResult[0];

      // Check expiration
      if (validatedVoucher.expire_at && new Date(validatedVoucher.expire_at) < new Date()) {
        await connection.rollback();
        return res.status(400).json({ message: 'Mã giảm giá đã hết hạn' });
      }
    }

    // 5. Calculate total amount
    const subtotal = cartItems.reduce((sum, item) => sum + parseFloat(item.price), 0);
    let discount = 0;

    if (validatedVoucher) {
      if (validatedVoucher.voucher_type === 'percentage') {
        discount = subtotal * (validatedVoucher.amount / 100);
      } else if (validatedVoucher.voucher_type === 'absolute') {
        discount = validatedVoucher.amount;
      }
    }

    const totalAmount = Math.max(0, subtotal - discount);

    // 6. Create Order
    const orderId = uuidv4();
    await connection.query(
      `INSERT INTO Orders (order_id, user_id, order_status, voucher_code)
       VALUES (?, ?, 'pending', ?)`,
      [orderId, userId, voucherCode || null]
    );

    // 7. Create OrderDetail records
    for (const item of cartItems) {
      await connection.query(
        `INSERT INTO OrderDetail (order_id, course_id, price)
         VALUES (?, ?, ?)`,
        [orderId, item.course_id, item.price]
      );
    }

    // Commit transaction
    await connection.commit();

    res.status(201).json({
      success: true,
      orderId,
      totalAmount,
      subtotal,
      discount,
      items: cartItems.map(item => ({
        courseId: item.course_id,
        title: item.title,
        price: item.price
      })),
      voucherCode: voucherCode || null
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Lỗi khi tạo đơn hàng' });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

/**
 * Update order status
 * @param {string} orderId 
 * @param {string} status - 'pending' | 'success' | 'failed'
 */
export const updateOrderStatus = async (orderId, status, connection = null) => {
  const useConnection = connection || pool;
  
  await useConnection.query(
    'UPDATE Orders SET order_status = ? WHERE order_id = ?',
    [status, orderId]
  );
};

/**
 * Get order details
 * @route GET /api/order/:orderId
 */
export const getOrderDetails = async (req, res) => {
  const { userId } = req;
  const { orderId } = req.params;

  try {
    // Get order
    const [orderResult] = await pool.query(
      `SELECT o.order_id, o.order_status, o.voucher_code, o.user_id
       FROM Orders o
       WHERE o.order_id = ? AND o.user_id = ?`,
      [orderId, userId]
    );

    if (orderResult.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    const order = orderResult[0];

    // Get order items
    const [orderItems] = await pool.query(
      `SELECT od.course_id, od.price, c.title, c.picture_url
       FROM OrderDetail od
       JOIN Courses c ON od.course_id = c.course_id
       WHERE od.order_id = ?`,
      [orderId]
    );

    res.json({
      order,
      items: orderItems
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Lỗi khi lấy thông tin đơn hàng' });
  }
};

/**
 * Get user's order history
 * @route GET /api/order/history
 */
export const getOrderHistory = async (req, res) => {
  const { userId } = req;
  const { page = 1, limit = 10 } = req.query;

  try {
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // Get total count of successful payments
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total
       FROM Orders o
       LEFT JOIN Payments p ON o.order_id = p.order_id
       WHERE o.user_id = ? AND p.payment_status = 'success'`,
      [userId]
    );

    const totalRecords = countResult[0].total;
    const totalPages = Math.ceil(totalRecords / limitNum);

    // Get only orders with successful payments (with pagination)
    const [orders] = await pool.query(
      `SELECT o.order_id, o.order_status, o.voucher_code,
              p.payment_id, p.payment_status, p.method, p.amount, p.created_at
       FROM Orders o
       LEFT JOIN Payments p ON o.order_id = p.order_id
       WHERE o.user_id = ? AND p.payment_status = 'success'
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limitNum, offset]
    );

    // For each order, calculate subtotal and get voucher discount
    const ordersWithDetails = await Promise.all(
      orders.map(async (order) => {
        // Get subtotal from OrderDetail
        const [orderDetails] = await pool.query(
          `SELECT SUM(price) as subtotal, COUNT(*) as course_count
           FROM OrderDetail
           WHERE order_id = ?`,
          [order.order_id]
        );

        const subtotal = parseFloat(orderDetails[0]?.subtotal || 0);
        const courseCount = orderDetails[0]?.course_count || 0;

        // Get voucher discount if applicable
        let discount = 0;
        if (order.voucher_code) {
          const [voucherResult] = await pool.query(
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

        const total = order.amount || (subtotal - discount);

        return {
          ...order,
          subtotal,
          discount,
          total,
          course_count: courseCount
        };
      })
    );

    res.json({ 
      orders: ordersWithDetails,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalRecords,
        limit: limitNum
      }
    });

  } catch (error) {
    console.error('Error fetching order history:', error);
    res.status(500).json({ message: 'Lỗi khi lấy lịch sử đơn hàng' });
  }
};
