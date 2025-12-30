import { clerkClient, getAuth } from '@clerk/express';
import Enrollment from '../models/Enrollment.js';
import logger from '../utils/logger.js';
import Course from '../models/Course.js';

export const protectAdmin = async (req, res, next) => {
    try {
        const { userId } = req.auth();

        const user = await clerkClient.users.getUser(userId);

        if (user.privateMetadata.role !== 'admin') {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        logger.info(`✅ [protectAdmin] Admin access granted for userId: ${userId}`);
        next();

    } catch (error) {
        return res.status(500).json({ message: 'Server error' });
    }
};

export const protectUser = async (req, res, next) => {
    try {
        const { userId } = req.auth();

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const user = await clerkClient.users.getUser(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        req.user = user; // Attach user to request for further use
        next();

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const protectEnrolledUser = async (req, res, next) => {
    try {
        const { userId } = req.auth();
        
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized - Please login' });
        }

        // Get courseId from params, query, or body
        let courseId = req.params.courseId || req.query.courseId || req.body.courseId;
        console.log('🔐 [protectEnrolledUser] userId:', userId, 'courseId:', courseId);
        
        if (!courseId) {
            return res.status(400).json({ success: false, message: 'Course ID is required' });
        }

        // Check if user is enrolled in the course using MongoDB
        const enrollment = await Enrollment.findOne({
            userId: userId,
            courseId: courseId
        });

        if (!enrollment) {
            return res.status(403).json({ 
                success: false, 
                message: 'Access denied - You are not enrolled in this course' 
            });
        }

        // Attach enrollment info to request
        req.enrollment = enrollment;
        req.userId = userId;
        next();

    } catch (error) {
        console.error('Error in protectEnrolledUser middleware:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const protectCourseOwner = async (req, res, next) => {
    try {
        const { userId } = req.auth();
        
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized - Please login' });
        }

        // Get courseId from params or body (for upload requests)
        const courseId = req.params.courseId || req.body.courseId;
        logger.info(`🔐 [protectCourseOwner] userId: ${userId}, courseId: ${courseId}`);
        
        if (!courseId) {
            return res.status(400).json({ success: false, message: 'Course ID is required' });
        }

        // Query MongoDB to check if user is the instructor of this course
        // Use findOne with _id since Course model uses string _id
        const course = await Course.findOne({ _id: courseId });

        if (!course) {
            logger.warn(`⚠️ [protectCourseOwner] Course not found: ${courseId}`);
            return res.status(404).json({ success: false, message: 'Course not found' });
        }
        
        // Check if the user is the course owner
        if (course.instructor_id !== userId) {
            logger.warn(`⚠️ [protectCourseOwner] Access denied for userId: ${userId} to courseId: ${courseId}`);
            return res.status(403).json({ 
                success: false, 
                message: 'Access denied - You are not the owner of this course' 
            });
        }

        logger.info(`✅ [protectCourseOwner] Access granted for userId: ${userId} to courseId: ${courseId}`);
        // Attach userId to request for further use
        req.userId = userId;
        next();

    } catch (error) {
        logger.error('Error in protectCourseOwner middleware:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Middleware to protect user actions - ensures user is authenticated
 * Used for rating, profile updates, and other user-specific actions
 */
export const protectUserAction = async (req, res, next) => {
    try {
        const { userId } = req.auth();
        
        if (!userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized - Please login to perform this action' 
            });
        }

        // Verify user exists in Clerk
        const user = await clerkClient.users.getUser(userId);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Attach userId to request for controllers to use
        req.userId = userId;
        req.user = user;
        
        // logger.info(`✅ [protectUserAction] User action allowed for userId: ${userId}`);
        next();

    } catch (error) {
        logger.error('Error in protectUserAction middleware:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error during authentication' 
        });
    }
};