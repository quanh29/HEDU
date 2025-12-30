import express from 'express';
import { 
    getWishlist, 
    addToWishlist, 
    removeFromWishlist 
} from '../controllers/wishlistController.js';
import { protectUserAction } from '../middleware/auth.js';

const router = express.Router();

// Get user's wishlist
router.get('/', protectUserAction, getWishlist);

// Add course to wishlist
router.post('/', protectUserAction, addToWishlist);

// Remove course from wishlist
router.delete('/:courseId', protectUserAction, removeFromWishlist);

export default router;
