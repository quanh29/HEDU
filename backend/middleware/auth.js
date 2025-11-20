import {clerkClient} from '@clerk/express';
import pool from '../config/mysql.js';
import Enrollment from '../models/Enrollment.js';

export const protectAdmin = async (req, res, next) => {
    try {
        const { userId } = req.auth();

        const user = await clerkClient.users.getUser(userId);

        if (user.privateMetadata.role !== 'admin') {
            return res.status(401).json({ message: 'Unauthorized' });
        }
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

        // Get courseId from params or query
        let courseId = req.params.courseId || req.query.courseId;
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