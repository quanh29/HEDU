import express from 'express';
import { 
    createEnrollment, 
    getUserEnrollments, 
    checkEnrollment,
    updateCompletedLessons,
    updateCourseRating
} from '../controllers/enrollmentController.js';
import { protectUser } from '../middleware/auth.js';

const enrollmentRouter = express.Router();

// Tất cả routes đều yêu cầu authentication
// enrollmentRouter.use(protectUser);

/**
 * POST /api/enrollment
 * Tạo enrollment mới (đăng ký khóa học)
 * Body: { courseId }
 */
enrollmentRouter.post('/', createEnrollment);

/**
 * GET /api/enrollment
 * Lấy tất cả enrollments của user hiện tại
 */
enrollmentRouter.get('/', getUserEnrollments);

/**
 * GET /api/enrollment/check/:courseId
 * Kiểm tra xem user đã đăng ký khóa học chưa
 */
enrollmentRouter.get('/check/:courseId', checkEnrollment);

/**
 * PUT /api/enrollment/:courseId/complete-lesson
 * Đánh dấu lesson đã hoàn thành
 * Body: { lessonId }
 */
enrollmentRouter.put('/:courseId/complete-lesson', updateCompletedLessons);

/**
 * PUT /api/enrollment/:courseId/rating
 * Cập nhật rating cho khóa học
 * Body: { rating } (1-5)
 */
enrollmentRouter.put('/:courseId/rating', updateCourseRating);

export default enrollmentRouter;
