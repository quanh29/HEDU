import express from 'express';
import { 
    createCertificate, 
    getCertificate, 
    checkCertificate 
} from '../controllers/certificateController.js';
import { protectEnrolledUser, protectUserAction } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/certificates/create
 * Tạo certificate cho user đã hoàn thành khóa học
 * Middleware: protectEnrolledUser - đảm bảo user đã enrolled vào khóa học
 */
router.post('/create', protectEnrolledUser, createCertificate);

/**
 * GET /api/certificates/:certificateId
 * Xem certificate công khai (không cần đăng nhập)
 */
router.get('/:certificateId', getCertificate);

/**
 * GET /api/certificates/check/:courseId
 * Kiểm tra xem user đã có certificate cho khóa học chưa
 * Middleware: protectUserAction - đảm bảo user đã đăng nhập
 */
router.get('/check/:courseId', protectUserAction, checkCertificate);

export default router;
