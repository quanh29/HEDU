import Order from '../models/Order.js';
import Payment from '../models/Payment.js';
import Course from '../models/Course.js';
import Cart from '../models/Cart.js';
import Voucher from '../models/Voucher.js';

/**
 * Create order from user's cart
 * Fetches cart data from database (not from client)
 * @route POST /api/order/create
 */
export const createOrderFromCart = async (req, res) => {
  const { userId } = req;
  const { voucherCode } = req.body; // Optional voucher code

  try {
    // 1. Get user's cart (MongoDB)
    const cart = await Cart.findOne({ user_id: userId }).lean();

    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({ message: 'Giỏ hàng trống' });
    }

    // 2. Get course details for each item in cart (MongoDB)
    const courseIds = cart.items.map(item => item.course_id);
    const courses = await Course.find({ 
      _id: { $in: courseIds },
      course_status: 'approved'
    }).lean();

    if (courses.length === 0) {
      return res.status(400).json({ message: 'Giỏ hàng trống' });
    }

    // 3. Validate all courses are approved
    if (courses.length < courseIds.length) {
      return res.status(400).json({ 
        message: 'Một số khóa học trong giỏ hàng không còn khả dụng' 
      });
    }

    // Create cart items with course details
    const cartItems = courses.map(course => ({
      course_id: course._id,
      price: course.current_price,
      title: course.title,
      course_status: course.course_status
    }));

    // 4. Validate voucher if provided (MongoDB)
    let validatedVoucher = null;
    if (voucherCode) {
      validatedVoucher = await Voucher.findOne({ 
        code: voucherCode 
      }).lean();

      if (!validatedVoucher) {
        return res.status(400).json({ message: 'Mã giảm giá không hợp lệ' });
      }

      // Check expiration
      if (validatedVoucher.expiresAt && new Date(validatedVoucher.expiresAt) < new Date()) {
        return res.status(400).json({ message: 'Mã giảm giá đã hết hạn' });
      }
    }

    // 5. Calculate total amount
    const subtotal = cartItems.reduce((sum, item) => sum + parseFloat(item.price), 0);
    let discount = 0;

    if (validatedVoucher) {
      if (validatedVoucher.type === 'percentage') {
        discount = (subtotal * validatedVoucher.value) / 100;
      } else if (validatedVoucher.type === 'fixed') {
        discount = validatedVoucher.value;
      }
    }

    const totalAmount = Math.max(0, subtotal - discount);

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
    
    // find each order's payment info from payment collection and assign its method to the order
    for (let orderDetail of ordersWithDetails) {
      const payment = await Payment.findOne({ orderId: orderDetail.orderId });
      if (payment) {
        orderDetail.paymentMethod = payment.method;
      }
    }

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
