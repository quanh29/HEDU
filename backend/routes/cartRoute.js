import express from 'express';
import {
    getCart,
    addToCart,
    removeFromCart,
    clearCart
} from '../controllers/cartController.js';
import { protectUserAction } from '../middleware/auth.js';

const cartRouter = express.Router();

// Tất cả routes đều yêu cầu authentication
cartRouter.use(protectUserAction);

/**
 * GET /api/cart
 * Lấy giỏ hàng của user hiện tại
 */
cartRouter.get('/', getCart);

/**
 * POST /api/cart
 * Thêm khóa học vào giỏ hàng
 * Body: { courseId }
 */
cartRouter.post('/', addToCart);

/**
 * DELETE /api/cart/:courseId
 * Xóa khóa học khỏi giỏ hàng
 */
cartRouter.delete('/:courseId', removeFromCart);

/**
 * DELETE /api/cart
 * Làm trống giỏ hàng
 */
cartRouter.delete('/', clearCart);

export default cartRouter;