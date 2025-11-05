import express from 'express';
import {
    getAllCoursesForAdmin,
    getCourseByIdForAdmin,
    getFullCourseDataForAdmin,
    updateCourseStatus,
    deleteCourseByAdmin,
    getCourseStatistics,
    updateCourseByAdmin
} from '../controllers/adminController.js';

const adminRouter = express.Router();

/**
 * Admin Routes - Quản lý courses
 * Tất cả routes này cần authentication và admin role
 * TODO: Add admin middleware to verify admin role
 */

// GET /api/admin/courses - Lấy tất cả courses với filters
adminRouter.get('/courses', getAllCoursesForAdmin);

// GET /api/admin/courses/statistics - Lấy thống kê courses
adminRouter.get('/courses/statistics', getCourseStatistics);

// GET /api/admin/courses/:courseId - Lấy chi tiết course
adminRouter.get('/courses/:courseId', getCourseByIdForAdmin);

// GET /api/admin/courses/:courseId/full - Lấy full data (sections + lessons)
adminRouter.get('/courses/:courseId/full', getFullCourseDataForAdmin);

// PATCH /api/admin/courses/:courseId/status - Cập nhật status
adminRouter.patch('/courses/:courseId/status', updateCourseStatus);

// PUT /api/admin/courses/:courseId - Cập nhật thông tin course
adminRouter.put('/courses/:courseId', updateCourseByAdmin);

// DELETE /api/admin/courses/:courseId - Xóa course
adminRouter.delete('/courses/:courseId', deleteCourseByAdmin);

export default adminRouter;
