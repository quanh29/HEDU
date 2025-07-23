import express from 'express';
import { protectUser } from '../middleware/auth.js';
import { isUserAuthenticated } from '../controllers/userController.js';

const userRouter = express.Router();

userRouter.get('/isUserAuthenticated', protectUser, isUserAuthenticated);

export default userRouter;