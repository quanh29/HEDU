import pool from '../config/mysql.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Get all ratings for a course
 */
export const getRatingsByCourseId = async (courseId) => {
    const [ratings] = await pool.query(
        `SELECT r.rating_id, r.rating, r.user_comment, r.user_id, r.course_id, r.created_at, r.updated_at,
                u.fName, u.lName, u.ava
         FROM Ratings r
         LEFT JOIN Users u ON r.user_id = u.user_id
         WHERE r.course_id = ?
         ORDER BY r.created_at DESC`,
        [courseId]
    );
    return ratings;
};

/**
 * Get a specific rating by user and course
 */
export const getRatingByUserAndCourse = async (userId, courseId) => {
    const [ratings] = await pool.query(
        `SELECT r.rating_id, r.rating, r.user_comment, r.user_id, r.course_id, r.created_at, r.updated_at,
                u.fName, u.lName, u.ava
         FROM Ratings r
         LEFT JOIN Users u ON r.user_id = u.user_id
         WHERE r.user_id = ? AND r.course_id = ?`,
        [userId, courseId]
    );
    return ratings[0] || null;
};

/**
 * Create a new rating
 */
export const createRating = async (userId, courseId, rating, userComment) => {
    const ratingId = uuidv4();
    const now = new Date();
    
    await pool.query(
        `INSERT INTO Ratings (rating_id, user_id, course_id, rating, user_comment, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [ratingId, userId, courseId, rating, userComment, now, now]
    );
    
    // Update course rating and review count
    await updateCourseRating(courseId);
    
    return ratingId;
};

/**
 * Update an existing rating
 */
export const updateRating = async (ratingId, rating, userComment) => {
    const now = new Date();
    
    const [result] = await pool.query(
        `UPDATE Ratings 
         SET rating = ?, user_comment = ?, updated_at = ?
         WHERE rating_id = ?`,
        [rating, userComment, now, ratingId]
    );
    
    // Get course_id to update course rating
    const [ratingData] = await pool.query(
        'SELECT course_id FROM Ratings WHERE rating_id = ?',
        [ratingId]
    );
    
    if (ratingData.length > 0) {
        await updateCourseRating(ratingData[0].course_id);
    }
    
    return result.affectedRows > 0;
};

/**
 * Delete a rating
 */
export const deleteRating = async (ratingId) => {
    // Get course_id before deleting
    const [ratingData] = await pool.query(
        'SELECT course_id FROM Ratings WHERE rating_id = ?',
        [ratingId]
    );
    
    const [result] = await pool.query(
        'DELETE FROM Ratings WHERE rating_id = ?',
        [ratingId]
    );
    
    // Update course rating after deletion
    if (ratingData.length > 0) {
        await updateCourseRating(ratingData[0].course_id);
    }
    
    return result.affectedRows > 0;
};

/**
 * Update course rating and review count
 */
export const updateCourseRating = async (courseId) => {
    const [stats] = await pool.query(
        `SELECT AVG(rating) as avgRating, COUNT(*) as reviewCount
         FROM Ratings
         WHERE course_id = ?`,
        [courseId]
    );
    
    const avgRating = stats[0].avgRating || 0;
    const reviewCount = stats[0].reviewCount || 0;
    
    await pool.query(
        `UPDATE Courses
         SET rating = ?, reviewCount = ?
         WHERE course_id = ?`,
        [avgRating, reviewCount, courseId]
    );
};

export default {
    getRatingsByCourseId,
    getRatingByUserAndCourse,
    createRating,
    updateRating,
    deleteRating,
    updateCourseRating
};
