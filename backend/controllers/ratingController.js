import Rating from '../models/Rating.js';

/**
 * Get all ratings for a course
 * GET /api/rating/course/:courseId
 */
export const getCourseRatings = async (req, res) => {
    try {
        const { courseId } = req.params;
        
        const ratings = await Rating.find({ course_id: courseId })
            .populate('user_id', 'username email')
            .sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            ratings
        });
    } catch (error) {
        console.error('Error fetching course ratings:', error);
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
        
        const rating = await Rating.findOne({ 
            user_id: userId, 
            course_id: courseId 
        });
        
        res.status(200).json({
            success: true,
            rating
        });
    } catch (error) {
        console.error('Error fetching user rating:', error);
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
        console.log('Submitting rating:', { userId, courseId, rating, comment });
        
        // Validate rating
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }
        
        // Check if user already rated this course
        const existingRating = await Rating.findOne({ 
            user_id: userId, 
            course_id: courseId 
        });
        
        if (existingRating) {
            // Update existing rating
            existingRating.rating = rating;
            existingRating.comment = comment || '';
            await existingRating.save();
                        
            res.status(200).json({
                success: true,
                message: 'Rating updated successfully',
                rating: existingRating
            });
        } else {
            // Create new rating
            const newRating = new Rating({
                user_id: userId,
                course_id: courseId,
                rating,
                comment: comment || ''
            });
            await newRating.save();
                        
            res.status(201).json({
                success: true,
                message: 'Rating created successfully',
                rating: newRating
            });
        }
    } catch (error) {
        console.error('Error submitting rating:', error);
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
        const existingRating = await Rating.findOne({ 
            _id: ratingId, 
            user_id: userId 
        });
        
        if (!existingRating) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden: You can only update your own rating'
            });
        }
        
        existingRating.rating = rating;
        existingRating.comment = comment || '';
        await existingRating.save();
        
        res.status(200).json({
            success: true,
            message: 'Rating updated successfully',
            rating: existingRating
        });
    } catch (error) {
        console.error('Error updating rating:', error);
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
        
        // Verify ownership and delete
        const existingRating = await Rating.findOne({ 
            _id: ratingId, 
            user_id: userId 
        });
        
        if (!existingRating) {
            return res.status(404).json({
                success: false,
                message: 'Rating not found or you do not have permission to delete it'
            });
        }
        
        await Rating.deleteOne({ _id: ratingId });
        
        res.status(200).json({
            success: true,
            message: 'Rating deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting rating:', error);
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
