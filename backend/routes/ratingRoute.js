import express from 'express';
import { getCourseRatings, getUserRating, submitRating, updateUserRating, deleteUserRating } from '../controllers/ratingController.js';
import { protectUserAction, protectEnrolledUser } from '../middleware/auth.js';

const ratingRouter = express.Router();

// Get all ratings for a course (public)
ratingRouter.get('/course/:courseId', getCourseRatings);

// Get user's rating for a course (requires authentication)
ratingRouter.get('/course/:courseId/user', protectUserAction, getUserRating);

// Submit a rating (requires authentication and enrollment)
ratingRouter.post('/course/:courseId', protectUserAction, protectEnrolledUser, submitRating);

// Update a specific rating (requires authentication)
ratingRouter.put('/:ratingId', protectUserAction, updateUserRating);

// Delete a rating (requires authentication)
ratingRouter.delete('/:ratingId', protectUserAction, deleteUserRating);

export default ratingRouter;
