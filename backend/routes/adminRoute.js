import express from 'express';
import {
    getAllCoursesForAdmin,
    getCourseByIdForAdmin,
    getFullCourseDataForAdmin,
    updateCourseStatus,
    deleteCourseByAdmin,
    getCourseStatistics,
    updateCourseByAdmin,
    getPendingRevisions,
    getRevisionDetail,
    getAllUsers,
    toggleUserStatus,
    createAdminUser
} from '../controllers/adminController.js';
import { 
    approveRevision, 
    rejectRevision 
} from '../controllers/courseRevisionController.js';
import { generateMaterialSignedUrl } from '../controllers/materialUploadController.js';
import {
    getAllVouchers,
    getVoucherStatistics,
    createVoucher,
    updateVoucher,
    toggleVoucherStatus,
    deleteVoucher
} from '../controllers/voucherController.js';
import {
    getCategoryStatistics,
    createHeading,
    updateHeading,
    deleteHeading,
    createCategory,
    updateCategory,
    deleteCategory,
    addCategoryToHeading,
    removeCategoryFromHeading,
    getAllHeadingsWithCategories,
    getAllCategories
} from '../controllers/headingController.js';
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

// POST /api/admin/materials/:materialId/signed-url - Generate signed URL for material download (admin access)
adminRouter.post('/materials/:materialId/signed-url', protectAdmin, generateMaterialSignedUrl);

// DELETE /api/admin/courses/:courseId - Xóa course
adminRouter.delete('/courses/:courseId', protectAdmin, deleteCourseByAdmin);

// Revision management routes
// GET /api/admin/revisions/pending - Lấy danh sách pending revisions
adminRouter.get('/revisions/pending', protectAdmin, getPendingRevisions);

// GET /api/admin/revisions/:revisionId - Lấy chi tiết revision
adminRouter.get('/revisions/:revisionId', protectAdmin, getRevisionDetail);

// POST /api/admin/revisions/:revisionId/approve - Approve revision
adminRouter.post('/revisions/:revisionId/approve', protectAdmin, approveRevision);

// POST /api/admin/revisions/:revisionId/reject - Reject revision
adminRouter.post('/revisions/:revisionId/reject', protectAdmin, rejectRevision);

// User management routes
// GET /api/admin/users - Get all users with filters
adminRouter.get('/users', protectAdmin, getAllUsers);

// PATCH /api/admin/users/:userId/status - Toggle user active status
adminRouter.patch('/users/:userId/status', protectAdmin, toggleUserStatus);

// POST /api/admin/users/create-admin - Create new admin user
adminRouter.post('/users/create-admin', protectAdmin, createAdminUser);

// Voucher management routes
// GET /api/admin/vouchers/statistics - Get voucher statistics
adminRouter.get('/vouchers/statistics', protectAdmin, getVoucherStatistics);

// GET /api/admin/vouchers - Get all vouchers with filters
adminRouter.get('/vouchers', protectAdmin, getAllVouchers);

// POST /api/admin/vouchers - Create new voucher
adminRouter.post('/vouchers', protectAdmin, createVoucher);

// PUT /api/admin/vouchers/:voucherId - Update voucher
adminRouter.put('/vouchers/:voucherId', protectAdmin, updateVoucher);

// PATCH /api/admin/vouchers/:voucherId/status - Toggle voucher status
adminRouter.patch('/vouchers/:voucherId/status', protectAdmin, toggleVoucherStatus);

// DELETE /api/admin/vouchers/:voucherId - Delete voucher
adminRouter.delete('/vouchers/:voucherId', protectAdmin, deleteVoucher);

// Category and Heading management routes
// GET /api/admin/categories/statistics - Get category statistics
adminRouter.get('/categories/statistics', protectAdmin, getCategoryStatistics);

// GET /api/admin/categories/headings - Get all headings with categories
adminRouter.get('/categories/headings', protectAdmin, getAllHeadingsWithCategories);

// GET /api/admin/categories - Get all categories with pagination
adminRouter.get('/categories', protectAdmin, getAllCategories);

// POST /api/admin/categories/headings - Create new heading
adminRouter.post('/categories/headings', protectAdmin, createHeading);

// PUT /api/admin/categories/headings/:headingId - Update heading
adminRouter.put('/categories/headings/:headingId', protectAdmin, updateHeading);

// DELETE /api/admin/categories/headings/:headingId - Delete heading
adminRouter.delete('/categories/headings/:headingId', protectAdmin, deleteHeading);

// POST /api/admin/categories - Create new category
adminRouter.post('/categories', protectAdmin, createCategory);

// PUT /api/admin/categories/:categoryId - Update category
adminRouter.put('/categories/:categoryId', protectAdmin, updateCategory);

// DELETE /api/admin/categories/:categoryId - Delete category
adminRouter.delete('/categories/:categoryId', protectAdmin, deleteCategory);

// POST /api/admin/categories/assign - Add category to heading
adminRouter.post('/categories/assign', protectAdmin, addCategoryToHeading);

// DELETE /api/admin/categories/:headingId/:categoryId - Remove category from heading
adminRouter.delete('/categories/:headingId/:categoryId', protectAdmin, removeCategoryFromHeading);

export default adminRouter;
