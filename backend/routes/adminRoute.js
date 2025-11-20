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
import { protectAdmin } from '../middleware/auth.js';

const adminRouter = express.Router();

/**
 * Admin Routes - Quản lý courses
 * Tất cả routes này cần authentication và admin role
 */

// GET /api/admin/verify - Verify admin access
adminRouter.get('/verify', protectAdmin, (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Admin access verified'
    });
});

// GET /api/admin/courses - Lấy tất cả courses với filters
adminRouter.get('/courses', protectAdmin, getAllCoursesForAdmin);

// GET /api/admin/courses/statistics - Lấy thống kê courses
adminRouter.get('/courses/statistics', protectAdmin, getCourseStatistics);

// GET /api/admin/courses/:courseId - Lấy chi tiết course
adminRouter.get('/courses/:courseId', protectAdmin, getCourseByIdForAdmin);

// GET /api/admin/courses/:courseId/full - Lấy full data (sections + lessons)
adminRouter.get('/courses/:courseId/full', protectAdmin, getFullCourseDataForAdmin);

// PATCH /api/admin/courses/:courseId/status - Cập nhật status
adminRouter.patch('/courses/:courseId/status', protectAdmin, updateCourseStatus);

// PUT /api/admin/courses/:courseId - Cập nhật thông tin course
adminRouter.put('/courses/:courseId', protectAdmin, updateCourseByAdmin);

// DELETE /api/admin/courses/:courseId - Xóa course
adminRouter.delete('/courses/:courseId', protectAdmin, deleteCourseByAdmin);

export default adminRouter;
