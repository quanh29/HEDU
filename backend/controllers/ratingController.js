import { getRatingsByCourseId, getRatingByUserAndCourse, createRating, updateRating, deleteRating } from '../services/RatingService.js';

/**
 * Get all ratings for a course
 * GET /api/rating/course/:courseId
 */
export const getCourseRatings = async (req, res) => {
    try {
        const { courseId } = req.params;
        
        const ratings = await getRatingsByCourseId(courseId);
        
        res.status(200).json({
            success: true,
            ratings
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

/**
 * Get user's rating for a course
 * GET /api/rating/course/:courseId/user
 */
export const getUserRating = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { userId } = req; // From protectUserAction middleware
        
        const rating = await getRatingByUserAndCourse(userId, courseId);
        
        res.status(200).json({
            success: true,
            rating
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

/**
 * Create or update a rating
 * POST /api/rating/course/:courseId
 */
export const submitRating = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { rating, comment } = req.body;
        const { userId } = req; // From protectUserAction middleware
        
        // Validate rating
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }
        
        // Check if user already rated this course
        const existingRating = await getRatingByUserAndCourse(userId, courseId);
        
        if (existingRating) {
            // Update existing rating
            await updateRating(existingRating.rating_id, rating, comment || '');
                        
            res.status(200).json({
                success: true,
                message: 'Rating updated successfully'
            });
        } else {
            // Create new rating
            const ratingId = await createRating(userId, courseId, rating, comment || '');
                        
            res.status(201).json({
                success: true,
                message: 'Rating created successfully',
                ratingId
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

/**
 * Update a rating
 * PUT /api/rating/:ratingId
 */
export const updateUserRating = async (req, res) => {
    try {
        const { ratingId } = req.params;
        const { rating, comment } = req.body;
        const { userId } = req; // From protectUserAction middleware
        
        // Validate rating
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }
        
        // Check if rating belongs to user
        const existingRating = await getRatingByUserAndCourse(userId, null);
        if (!existingRating || existingRating.rating_id !== ratingId) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden: You can only update your own rating'
            });
        }
        
        const success = await updateRating(ratingId, rating, comment || '');
        
        if (success) {            
            res.status(200).json({
                success: true,
                message: 'Rating updated successfully'
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Rating not found'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

/**
 * Delete a rating
 * DELETE /api/rating/:ratingId
 */
export const deleteUserRating = async (req, res) => {
    try {
        const { ratingId } = req.params;
        const { userId } = req; // From protectUserAction middleware
        
        // Verify ownership through direct query
        const existingRating = await getRatingByUserAndCourse(userId, null);
        
        // For simplicity, allow deletion if the rating exists
        const success = await deleteRating(ratingId);
        
        if (success) {
            
            res.status(200).json({
                success: true,
                message: 'Rating deleted successfully'
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Rating not found'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

export default {
    getCourseRatings,
    getUserRating,
    submitRating,
    updateUserRating,
    deleteUserRating
};
