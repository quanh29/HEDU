import express from 'express';
import { handleClerkWebhook, getUserProfile, updateUserProfile, uploadAvatar, changePassword } from '../controllers/userController.js';
import { protectUserAction } from '../middleware/auth.js';
import multer from 'multer';

const userRouter = express.Router();

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Clerk webhook endpoint
userRouter.post('/webhook', handleClerkWebhook);

// User profile endpoints
userRouter.get('/profile', protectUserAction, getUserProfile);
userRouter.put('/profile', protectUserAction, updateUserProfile);
userRouter.post('/profile/avatar', protectUserAction, upload.single('avatar'), uploadAvatar);
userRouter.post('/profile/change-password', protectUserAction, changePassword);

export default userRouter;
