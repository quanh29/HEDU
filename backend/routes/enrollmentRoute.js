import express from 'express';
import { 
    createEnrollment, 
    getUserEnrollments, 
    checkEnrollment,
    updateCompletedLessons,
    enrollFreeCourse,
    getInstructorStudents,
} from '../controllers/enrollmentController.js';
import { protectUserAction, protectCourseOwner } from '../middleware/auth.js';

const enrollmentRouter = express.Router();

/**
 * POST /api/enrollment
 * Tạo enrollment mới (đăng ký khóa học)
 * Body: { courseId }
 */
enrollmentRouter.post('/', protectUserAction, createEnrollment);

/**
 * GET /api/enrollment
 * Lấy tất cả enrollments của user hiện tại
 */
enrollmentRouter.get('/', protectUserAction, getUserEnrollments);

/**
 * GET /api/enrollment/check/:courseId
 * Kiểm tra xem user đã đăng ký khóa học chưa
 */
enrollmentRouter.get('/check/:courseId', protectUserAction, checkEnrollment);

/**
 * PUT /api/enrollment/:courseId/complete-lesson
 * Đánh dấu lesson đã hoàn thành
 * Body: { lessonId }
 */
enrollmentRouter.put('/:courseId/complete-lesson', protectUserAction, updateCompletedLessons);

/**
 * POST /api/enrollment/free
 * Đăng ký khóa học miễn phí
 * Body: { courseId }
 * Tạo enrollment và conversation với instructor
 */
enrollmentRouter.post('/free', protectUserAction, enrollFreeCourse);

/**
 * GET /api/enrollment/instructor/:instructorId/students
 * Lấy danh sách học viên của giảng viên kèm tiến độ theo từng khóa học
 */
enrollmentRouter.get('/instructor/:instructorId/students', protectUserAction, getInstructorStudents);


export default enrollmentRouter;
