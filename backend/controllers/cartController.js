import pool from '../config/mysql.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Lấy giỏ hàng của user
 */
export const getCart = async (req, res) => {
    try {
        const { userId } = req;

        // Tìm cart của user
        const [carts] = await pool.query(
            'SELECT cart_id FROM Carts WHERE user_id = ?',
            [userId]
        );

        if (carts.length === 0) {
            return res.json({
                success: true,
                data: []
            });
        }

        const cartId = carts[0].cart_id;

        // Lấy chi tiết giỏ hàng với thông tin khóa học
        const [cartItems] = await pool.query(`
            SELECT
                cd.cart_id,
                cd.course_id,
                c.title,
                c.picture_url,
                c.currentPrice,
                c.originalPrice,
                u.fName,
                u.lName
            FROM CartDetail cd
            JOIN Courses c ON cd.course_id = c.course_id
            LEFT JOIN Users u ON c.instructor_id = u.user_id
            WHERE cd.cart_id = ?
            ORDER BY cd.course_id
        `, [cartId]);

        // Format response
        const formattedItems = cartItems.map(item => ({
            cartId: item.cart_id,
            courseId: item.course_id,
            course: {
                title: item.title,
                picture_url: item.picture_url,
                currentPrice: item.currentPrice,
                originalPrice: item.originalPrice,
                instructor_name: item.fName && item.lName ?
                    `${item.fName} ${item.lName}` : 'Giảng viên'
            }
        }));

        res.json({
            success: true,
            data: formattedItems
        });

    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching cart',
            error: error.message
        });
    }
};

/**
 * Thêm khóa học vào giỏ hàng
 */
export const addToCart = async (req, res) => {
    try {
        const { userId } = req;
        const { courseId } = req.body;

        if (!courseId) {
            return res.status(400).json({
                success: false,
                message: 'Course ID is required'
            });
        }

        // Kiểm tra khóa học có tồn tại và được duyệt không
        const [courses] = await pool.query(
            'SELECT course_id, course_status FROM Courses WHERE course_id = ?',
            [courseId]
        );

        if (courses.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        if (courses[0].course_status !== 'approved') {
            return res.status(400).json({
                success: false,
                message: 'Course is not available for purchase'
            });
        }

        // Kiểm tra xem user đã có cart chưa
        let [carts] = await pool.query(
            'SELECT cart_id FROM Carts WHERE user_id = ?',
            [userId]
        );

        let cartId;
        if (carts.length === 0) {
            // Tạo cart mới
            cartId = uuidv4();
            await pool.query(
                'INSERT INTO Carts (cart_id, user_id) VALUES (?, ?)',
                [cartId, userId]
            );
        } else {
            cartId = carts[0].cart_id;
        }

        // Kiểm tra xem khóa học đã có trong cart chưa
        const [existingItems] = await pool.query(
            'SELECT * FROM CartDetail WHERE cart_id = ? AND course_id = ?',
            [cartId, courseId]
        );

        if (existingItems.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Course already in cart'
            });
        }

        // Thêm khóa học vào cart
        await pool.query(
            'INSERT INTO CartDetail (cart_id, course_id) VALUES (?, ?)',
            [cartId, courseId]
        );

        res.json({
            success: true,
            message: 'Course added to cart successfully'
        });

    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding course to cart',
            error: error.message
        });
    }
};

/**
 * Xóa khóa học khỏi giỏ hàng
 */
export const removeFromCart = async (req, res) => {
    try {
        const { userId } = req;
        const { courseId } = req.params;

        // Tìm cart của user
        const [carts] = await pool.query(
            'SELECT cart_id FROM Carts WHERE user_id = ?',
            [userId]
        );

        if (carts.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        const cartId = carts[0].cart_id;

        // Xóa item khỏi cart
        const [result] = await pool.query(
            'DELETE FROM CartDetail WHERE cart_id = ? AND course_id = ?',
            [cartId, courseId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Course not found in cart'
            });
        }

        res.json({
            success: true,
            message: 'Course removed from cart successfully'
        });

    } catch (error) {
        console.error('Error removing from cart:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing course from cart',
            error: error.message
        });
    }
};

/**
 * Làm trống giỏ hàng
 */
export const clearCart = async (req, res) => {
    try {
        const { userId } = req;

        // Tìm cart của user
        const [carts] = await pool.query(
            'SELECT cart_id FROM Carts WHERE user_id = ?',
            [userId]
        );

        if (carts.length === 0) {
            return res.json({
                success: true,
                message: 'Cart is already empty'
            });
        }

        const cartId = carts[0].cart_id;

        // Xóa tất cả items trong cart
        await pool.query(
            'DELETE FROM CartDetail WHERE cart_id = ?',
            [cartId]
        );

        res.json({
            success: true,
            message: 'Cart cleared successfully'
        });

    } catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({
            success: false,
            message: 'Error clearing cart',
            error: error.message
        });
    }
};