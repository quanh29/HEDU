import Order from '../models/Order.js';
import pool from '../config/mysql.js';

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

    // 1. Get user's cart (MySQL)
    const [cartResult] = await connection.query(
      'SELECT cart_id FROM Carts WHERE user_id = ?',
      [userId]
    );

    if (cartResult.length === 0 || !cartResult[0].cart_id) {
      await connection.rollback();
      return res.status(400).json({ message: 'Giỏ hàng trống' });
    }

    const cartId = cartResult[0].cart_id;

    // 2. Get cart items with course details (MySQL)
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

    // 4. Validate voucher if provided (MySQL)
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

    await connection.commit();
    connection.release();

    // 6. Create Order in MongoDB
    const order = new Order({
      userId,
      orderStatus: 'pending',
      voucherCode: voucherCode || null,
      items: cartItems.map(item => ({
        courseId: item.course_id,
        price: parseFloat(item.price),
        title: item.title
      })),
      subtotal,
      discount,
      totalAmount
    });

    await order.save();

    res.status(201).json({
      success: true,
      orderId: order._id.toString(),
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
      connection.release();
    }
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Lỗi khi tạo đơn hàng' });
  }
};

/**
 * Update order status
 * @param {string} orderId 
 * @param {string} status - 'pending' | 'success' | 'failed'
 */
export const updateOrderStatus = async (orderId, status) => {
  await Order.findByIdAndUpdate(orderId, { orderStatus: status });
};

/**
 * Get order details
 * @route GET /api/order/:orderId
 */
export const getOrderDetails = async (req, res) => {
  const { userId } = req;
  const { orderId } = req.params;

  try {
    // Get order from MongoDB
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    // Verify order belongs to user
    if (order.userId !== userId) {
      return res.status(403).json({ message: 'Không có quyền truy cập' });
    }

    res.json({
      order: {
        orderId: order._id,
        orderStatus: order.orderStatus,
        voucherCode: order.voucherCode,
        subtotal: order.subtotal,
        discount: order.discount,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt
      },
      items: order.items
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

    // Get total count of orders with successful payments from MongoDB
    const totalRecords = await Order.countDocuments({ 
      userId, 
      orderStatus: 'success' 
    });
    
    const totalPages = Math.ceil(totalRecords / limitNum);

    // Get orders with successful payments (with pagination)
    const orders = await Order.find({ 
      userId, 
      orderStatus: 'success' 
    })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limitNum)
      .lean();

    // Format orders with payment details
    const ordersWithDetails = orders.map(order => ({
      orderId: order._id,
      orderStatus: order.orderStatus,
      voucherCode: order.voucherCode,
      subtotal: order.subtotal,
      discount: order.discount,
      totalAmount: order.totalAmount,
      courseCount: order.items.length,
      createdAt: order.createdAt,
      items: order.items
    }));

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
