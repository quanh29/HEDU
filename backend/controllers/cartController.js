import Cart from '../models/Cart.js';
import Course from '../models/Course.js';
import User from '../models/User.js';

/**
 * Lấy giỏ hàng của user
 */
export const getCart = async (req, res) => {
    try {
        const { userId } = req;

        // Tìm cart của user từ MongoDB
        const cart = await Cart.findOne({ user_id: userId }).lean();

        if (!cart || !cart.items || cart.items.length === 0) {
            return res.json({
                success: true,
                data: []
            });
        }

        // Lấy thông tin chi tiết của các khóa học trong cart
        const courseIds = cart.items.map(item => item.course_id);
        const courses = await Course.find({ _id: { $in: courseIds } }).lean();
        
        // Lấy thông tin instructors
        const instructorIds = [...new Set(courses.map(c => c.instructor_id))];
        const instructors = await User.find({ _id: { $in: instructorIds } }).lean();
        
        // Map instructors by id
        const instructorMap = {};
        instructors.forEach(inst => {
            instructorMap[inst._id] = inst;
        });

        // Format response
        const formattedItems = cart.items.map(item => {
            const course = courses.find(c => c._id === item.course_id);
            if (!course) return null;
            
            const instructor = instructorMap[course.instructor_id];
            
            return {
                cartId: cart._id,
                courseId: course._id,
                course: {
                    title: course.title,
                    picture_url: course.thumbnail_url,
                    currentPrice: course.current_price,
                    originalPrice: course.original_price,
                    instructor_name: instructor.full_name || 'Instructor'
                }
            };
        }).filter(item => item !== null);

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

        // Kiểm tra khóa học có tồn tại và được duyệt không (MongoDB)
        const course = await Course.findOne({ 
            _id: courseId, 
            course_status: 'approved' 
        }).lean();

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found or not available for purchase'
            });
        }

        // Tìm hoặc tạo cart của user
        let cart = await Cart.findOne({ user_id: userId });

        if (!cart) {
            // Tạo cart mới
            cart = new Cart({
                user_id: userId,
                items: [{ course_id: courseId }]
            });
            await cart.save();
        } else {
            // Kiểm tra xem khóa học đã có trong cart chưa
            const existingItem = cart.items.find(item => item.course_id === courseId);
            
            if (existingItem) {
                return res.status(400).json({
                    success: false,
                    message: 'Course already in cart'
                });
            }

            // Thêm khóa học vào cart
            cart.items.push({ course_id: courseId });
            await cart.save();
        }

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
        const cart = await Cart.findOne({ user_id: userId });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        // Kiểm tra xem course có trong cart không
        const itemIndex = cart.items.findIndex(item => item.course_id === courseId);
        
        if (itemIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Course not found in cart'
            });
        }

        // Xóa item khỏi cart
        cart.items.splice(itemIndex, 1);
        await cart.save();

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
        const cart = await Cart.findOne({ user_id: userId });

        if (!cart || cart.items.length === 0) {
            return res.json({
                success: true,
                message: 'Cart is already empty'
            });
        }

        // Xóa tất cả items trong cart
        cart.items = [];
        await cart.save();

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