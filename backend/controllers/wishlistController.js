import Wishlist from '../models/Wishlist.js';
import Course from '../models/Course.js';
import logger from '../utils/logger.js';
import Enrollment from '../models/Enrollment.js';

/**
 * Get user's wishlist
 * @route GET /api/wishlist
 */
export const getWishlist = async (req, res) => {
    try {
        const { userId } = req;

        // Tìm wishlist của user
        let wishlist = await Wishlist.findOne({ user_id: userId });

        if (!wishlist) {
            // Nếu chưa có wishlist, trả về mảng rỗng
            return res.json({
                success: true,
                data: {
                    items: []
                }
            });
        }

        // Lấy thông tin chi tiết của các khóa học trong wishlist
        const coursesWithDetails = await Promise.all(
            wishlist.items.map(async (item) => {
                const course = await Course.findById(item.course_id).lean();
                if (!course) {
                    return null;
                }
                return {
                    courseId: course._id,
                    title: course.title,
                    image: course.thumbnail_url,
                    currentPrice: course.current_price,
                    originalPrice: course.original_price,
                    instructorId: course.instructor_id
                };
            })
        );

        // Filter out null values (courses that don't exist anymore)
        const validCourses = coursesWithDetails.filter(course => course !== null);

        res.json({
            success: true,
            data: {
                items: validCourses
            }
        });

    } catch (error) {
        logger.error('Error fetching wishlist:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching wishlist',
            error: error.message
        });
    }
};

/**
 * Add course to wishlist
 * @route POST /api/wishlist
 */
export const addToWishlist = async (req, res) => {
    try {
        const { userId } = req;
        const { courseId } = req.body;

        if (!courseId) {
            return res.status(400).json({
                success: false,
                message: 'Course ID is required'
            });
        }

        // Kiểm tra khóa học có tồn tại không
        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Kiểm tra user đã đăng ký khóa học chưa
        const existingEnrollment = await Enrollment.findOne({
            userId: userId,
            courseId: courseId
        });

        if (existingEnrollment) {
            return res.status(400).json({
                success: false,
                message: 'You are already enrolled in this course'
            });
        }

        // Kiểm tra khóa học có phải miễn phí không (chỉ cho phép thêm khóa học có giá > 0)
        if (course.current_price === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot add free courses to wishlist'
            });
        }

        // Tìm hoặc tạo wishlist của user
        let wishlist = await Wishlist.findOne({ user_id: userId });

        if (!wishlist) {
            // Tạo wishlist mới nếu chưa có
            wishlist = new Wishlist({
                user_id: userId,
                items: []
            });
        }

        // Kiểm tra khóa học đã có trong wishlist chưa
        const existingItem = wishlist.items.find(
            item => item.course_id === courseId
        );

        if (existingItem) {
            return res.status(400).json({
                success: false,
                message: 'Course already in wishlist'
            });
        }

        // Thêm khóa học vào wishlist
        wishlist.items.push({ course_id: courseId });
        await wishlist.save();

        logger.info(`✅ [addToWishlist] User ${userId} added course ${courseId} to wishlist`);

        res.status(201).json({
            success: true,
            message: 'Course added to wishlist',
            data: {
                itemCount: wishlist.items.length
            }
        });

    } catch (error) {
        logger.error('Error adding to wishlist:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding to wishlist',
            error: error.message
        });
    }
};

/**
 * Remove course from wishlist
 * @route DELETE /api/wishlist/:courseId
 */
export const removeFromWishlist = async (req, res) => {
    try {
        const { userId } = req;
        const { courseId } = req.params;

        if (!courseId) {
            return res.status(400).json({
                success: false,
                message: 'Course ID is required'
            });
        }

        // Tìm wishlist của user
        const wishlist = await Wishlist.findOne({ user_id: userId });

        if (!wishlist) {
            return res.status(404).json({
                success: false,
                message: 'Wishlist not found'
            });
        }

        // Xóa khóa học khỏi wishlist
        wishlist.items = wishlist.items.filter(
            item => item.course_id !== courseId
        );

        await wishlist.save();

        logger.info(`✅ [removeFromWishlist] User ${userId} removed course ${courseId} from wishlist`);

        res.json({
            success: true,
            message: 'Course removed from wishlist',
            data: {
                itemCount: wishlist.items.length
            }
        });

    } catch (error) {
        logger.error('Error removing from wishlist:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing from wishlist',
            error: error.message
        });
    }
};

/**
 * Remove course from wishlist by courseId (internal use)
 * Used after successful payment or enrollment
 */
export const removeFromWishlistInternal = async (userId, courseId) => {
    try {
        const wishlist = await Wishlist.findOne({ user_id: userId });

        if (!wishlist) {
            return;
        }

        // Xóa khóa học khỏi wishlist
        const originalLength = wishlist.items.length;
        wishlist.items = wishlist.items.filter(
            item => item.course_id !== courseId
        );

        // Chỉ save nếu có thay đổi
        if (wishlist.items.length !== originalLength) {
            await wishlist.save();
            logger.info(`✅ [removeFromWishlistInternal] Removed course ${courseId} from wishlist for user ${userId}`);
        }

    } catch (error) {
        logger.error('Error removing from wishlist (internal):', error);
        // Không throw error để không ảnh hưởng đến flow thanh toán/enrollment
    }
};
