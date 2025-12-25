import express from 'express';
import { handleClerkWebhook } from '../controllers/userController.js';

const userRouter = express.Router();

// Clerk webhook endpoint
userRouter.post('/webhook', handleClerkWebhook);

export default userRouter;
