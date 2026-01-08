import Course from '../models/Course.js';
import CourseRevision from '../models/CourseDraft.js';
import logger from '../utils/logger.js';
import User from '../models/User.js';
import { pushNotification } from '../services/notificationService.js';
import { io } from '../server.js';
import { pushNotificationToUser } from '../sockets/notificationSocket.js';
import Category from '../models/Category.js';
import Labeling from '../models/Labeling.js';
import Level from '../models/Level.js';
import Language from '../models/Language.js';
import { clerkClient } from '@clerk/express';

/**
 * Admin Controller - Quản lý courses cho admin
 */

/**
 * Kiểm tra user có phải admin không
 */
export const isAdmin = async (req, res) => {
    try {
        const { userId } = req.auth();
        
        if (!userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized' 
            });
        }

        // Get user from Clerk to check metadata
        const user = await clerkClient.users.getUser(userId);
        
        // Check if user has admin or superadmin role in privateMetadata
        const role = user.privateMetadata?.role;
        const isAdminUser = role === 'admin' || role === 'superadmin';
        
        if (!isAdminUser) {
            return res.status(403).json({ 
                success: false, 
                message: 'Access denied - Admin role required',
                isAdmin: false
            });
        }
        
        logger.info(`✅ [isAdmin] Admin check successful for userId: ${userId}, role: ${role}`);
        
        return res.status(200).json({ 
            success: true, 
            message: 'User is admin',
            isAdmin: true,
            isSuperAdmin: role === 'superadmin',
            role: role,
            userId: userId
        });

    } catch (error) {
        logger.error('Error checking admin status:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error',
            isAdmin: false
        });
    }
};

/**
 * Lấy tất cả courses cho admin (bao gồm tất cả status)
 */
export const getAllCoursesForAdmin = async (req, res) => {
    try {
        const { course_status, category, search, page = 1, limit = 100 } = req.query;
        const skip = (page - 1) * limit;

        let query = {};
        
        // Filter by status
        if (course_status && course_status !== 'all') {
            query.course_status = course_status;
        }

        // Search by title
        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }

        let courses;
        
        // Filter by category
        if (category && category !== 'all') {
            // Tìm category theo title
            const categoryDoc = await Category.findOne({ title: category }).lean();
            if (categoryDoc) {
                // Tìm các course_id có category này
                const labelings = await Labeling.find({ category_id: categoryDoc._id }).select('course_id').lean();
                const courseIds = labelings.map(l => l.course_id);
                query._id = { $in: courseIds };
            }
        }

        courses = await Course.find(query)
            .sort({ _id: -1 })
            .skip(parseInt(skip))
            .limit(parseInt(limit))
            .lean();

        // Lấy thông tin instructor và categories cho mỗi course
        const coursesWithDetails = await Promise.all(courses.map(async (course) => {
            // Lấy thông tin instructor
            const instructor = await User.findById(course.instructor_id)
                .select('_id email full_name profile_image_url headline')
                .lean();

            // Lấy categories
            const labelings = await Labeling.find({ course_id: course._id }).select('category_id').lean();
            const categoryIds = labelings.map(l => l.category_id);
            const categories = await Category.find({ _id: { $in: categoryIds } }).lean();

            // Map instructor fields
            const instructorData = instructor ? {
                user_id: instructor._id,
                full_name: instructor.full_name || '',
                email: instructor.email,
                ava: instructor.profile_image_url
            } : null;

            return {
                course_id: course._id,
                ...course,
                instructor: instructorData,
                instructor_user_id: course.instructor_id,
                full_name: instructorData?.full_name,
                instructor_email: instructorData?.email,
                instructor_ava: instructorData?.ava,
                categories: categories.map(cat => ({
                    category_id: cat._id,
                    title: cat.title
                })),
                students: 0,
                reports: 0
            };
        }));

        res.json(coursesWithDetails);
    } catch (error) {
        console.error('Error fetching courses for admin:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi khi lấy danh sách khóa học',
            error: error.message 
        });
    }
};

/**
 * Lấy chi tiết course cho admin (bao gồm cả status không phải approved)
 */
export const getCourseByIdForAdmin = async (req, res) => {
    try {
        const { courseId } = req.params;

        const course = await Course.findById(courseId).lean();

        if (!course) {
            return res.status(404).json({ 
                success: false, 
                message: 'Không tìm thấy khóa học' 
            });
        }

        // Lấy thông tin instructor
        const instructor = await User.findById(course.instructor_id).lean();
        
        // Lấy level và language
        const level = await Level.findById(course.level_id).lean();
        const language = await Language.findById(course.lang_id).lean();

        // Lấy categories
        const labelings = await Labeling.find({ course_id: courseId }).select('category_id').lean();
        const categoryIds = labelings.map(l => l.category_id);
        const categories = await Category.find({ _id: { $in: categoryIds } }).lean();
        
        const instructorData = instructor ? {
            user_id: instructor._id,
            fName: instructor.full_name?.split(' ')[0] || '',
            lName: instructor.full_name?.split(' ').slice(1).join(' ') || '',
            email: instructor.email,
            ava: instructor.profile_image_url,
            headline: instructor.headline
        } : null;

        const result = {
            course_id: course._id,
            ...course,
            instructor_user_id: course.instructor_id,
            fName: instructorData?.fName,
            lName: instructorData?.lName,
            instructor_email: instructorData?.email,
            instructor_ava: instructorData?.ava,
            headline: instructorData?.headline,
            level_title: level?.title,
            language_title: language?.title,
            categories: categories.map(cat => ({
                category_id: cat._id,
                title: cat.title
            })),
            instructor: instructorData,
            students: 0
        };

        res.json(result);
    } catch (error) {
        console.error('Error fetching course for admin:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi khi lấy thông tin khóa học',
            error: error.message 
        });
    }
};

/**
 * Lấy full course data cho admin (bao gồm sections và lessons)
 */
export const getFullCourseDataForAdmin = async (req, res) => {
    try {
        const { courseId } = req.params;

        // Import services
        const { getFullCourseDataForManagementService } = await import('../services/courseService.js');
        
        const fullCourseData = await getFullCourseDataForManagementService(courseId);
        
        if (!fullCourseData) {
            return res.status(404).json({ 
                success: false, 
                message: 'Không tìm thấy khóa học' 
            });
        }

        // Thêm thống kê tổng quan
        const stats = {
            totalSections: fullCourseData.sections?.length || 0,
            totalLessons: 0,
            totalVideos: 0,
            totalMaterials: 0,
            totalQuizzes: 0
        };

        if (fullCourseData.sections) {
            fullCourseData.sections.forEach(section => {
                if (section.lessons) {
                    stats.totalLessons += section.lessons.length;
                    section.lessons.forEach(lesson => {
                        if (lesson.contentType === 'video') stats.totalVideos++;
                        else if (lesson.contentType === 'material') stats.totalMaterials++;
                        else if (lesson.contentType === 'quiz') stats.totalQuizzes++;
                    });
                }
            });
        }

        res.json({
            course: fullCourseData,
            stats
        });
    } catch (error) {
        console.error('Error fetching full course data for admin:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi khi lấy dữ liệu đầy đủ khóa học',
            error: error.message 
        });
    }
};

/**
 * Cập nhật status của course (approve, reject, suspend, etc.)
 */
export const updateCourseStatus = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { course_status, reason } = req.body;

        // Validate status
        const validStatuses = ['draft', 'pending', 'approved', 'rejected', 'suspended', 'hidden'];
        if (!validStatuses.includes(course_status)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Trạng thái không hợp lệ' 
            });
        }

        const result = await Course.updateOne(
            { _id: courseId },
            { $set: { course_status } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Không tìm thấy khóa học' 
            });
        }

        // Send notification to instructor about status change
        try {
            const course = await Course.findById(courseId);
            if (course) {
                const statusText = {
                    'approved': 'đã được duyệt',
                    'rejected': 'đã bị từ chối',
                    'suspended': 'đã bị tạm ngưng',
                    'hidden': 'đã bị ẩn'
                };
                
                const notification = await pushNotification({
                    receiver_id: course.instructor_id,
                    event_type: 'course_update',
                    event_title: `Khóa học "${course.title}" ${statusText[course_status] || 'đã được cập nhật'}`,
                    event_message: reason || `Trạng thái khóa học của bạn đã được thay đổi thành ${course_status}`,
                    event_url: `/instructor`
                });
                
                pushNotificationToUser(io, course.instructor_id, notification);
            }
        } catch (notifError) {
            logger.error('Error sending notification:', notifError);
        }

        res.json({ 
            success: true, 
            message: 'Cập nhật trạng thái thành công',
            course_status,
            reason 
        });
    } catch (error) {
        console.error('Error updating course status:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi khi cập nhật trạng thái',
            error: error.message 
        });
    }
};

/**
 * Xóa course (chỉ admin có quyền)
 */
export const deleteCourseByAdmin = async (req, res) => {
    try {
        const { courseId } = req.params;

        // Import service
        const { deleteCourseService } = await import('../services/courseService.js');
        
        await deleteCourseService(courseId);
        
        res.json({ 
            success: true, 
            message: 'Xóa khóa học thành công' 
        });
    } catch (error) {
        console.error('Error deleting course:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi khi xóa khóa học',
            error: error.message 
        });
    }
};

/**
 * Lấy thống kê courses
 */
export const getCourseStatistics = async (req, res) => {
    try {
        const stats = await Course.aggregate([
            {
                $facet: {
                    total: [{ $count: 'count' }],
                    draft: [{ $match: { course_status: 'draft' } }, { $count: 'count' }],
                    pending: [{ $match: { course_status: 'pending' } }, { $count: 'count' }],
                    approved: [{ $match: { course_status: 'approved' } }, { $count: 'count' }],
                    rejected: [{ $match: { course_status: 'rejected' } }, { $count: 'count' }],
                    suspended: [{ $match: { course_status: 'suspended' } }, { $count: 'count' }],
                    hidden: [{ $match: { course_status: 'hidden' } }, { $count: 'count' }]
                }
            },
            {
                $project: {
                    total_courses: { $arrayElemAt: ['$total.count', 0] },
                    draft_count: { $arrayElemAt: ['$draft.count', 0] },
                    pending_count: { $arrayElemAt: ['$pending.count', 0] },
                    approved_count: { $arrayElemAt: ['$approved.count', 0] },
                    rejected_count: { $arrayElemAt: ['$rejected.count', 0] },
                    suspended_count: { $arrayElemAt: ['$suspended.count', 0] },
                    hidden_count: { $arrayElemAt: ['$hidden.count', 0] }
                }
            }
        ]);

        const result = {
            total_courses: stats[0]?.total_courses || 0,
            draft_count: stats[0]?.draft_count || 0,
            pending_count: stats[0]?.pending_count || 0,
            approved_count: stats[0]?.approved_count || 0,
            rejected_count: stats[0]?.rejected_count || 0,
            suspended_count: stats[0]?.suspended_count || 0,
            hidden_count: stats[0]?.hidden_count || 0
        };

        res.json(result);
    } catch (error) {
        console.error('Error fetching course statistics:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi khi lấy thống kê',
            error: error.message 
        });
    }
};

/**
 * Cập nhật thông tin course (admin override)
 */
export const updateCourseByAdmin = async (req, res) => {
    try {
        const { courseId } = req.params;
        const updateData = req.body;

        // Import service
        const { updateCourseService } = await import('../services/courseService.js');
        
        await updateCourseService(courseId, updateData);
        
        res.json({ 
            success: true, 
            message: 'Cập nhật khóa học thành công' 
        });
    } catch (error) {
        console.error('Error updating course by admin:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi khi cập nhật khóa học',
            error: error.message 
        });
    }
};

/**
 * Lấy danh sách pending revisions cho admin
 */
export const getPendingRevisions = async (req, res) => {
    try {
        const revisions = await CourseRevision.find({ status: 'pending' })
            .sort({ createdAt: -1 })
            .lean();

        // Lấy thông tin course từ MongoDB
        const revisionsWithCourseInfo = await Promise.all(
            revisions.map(async (revision) => {
                const course = await Course.findById(revision.courseId).lean();
                
                if (course) {
                    const instructor = await User.findById(course.instructor_id)
                        .select('_id email full_name')
                        .lean();
                    
                    return {
                        ...revision,
                        currentCourse: {
                            course_id: course._id,
                            title: course.title,
                            course_status: course.course_status,
                            fName: instructor?.full_name?.split(' ')[0] || '',
                            lName: instructor?.full_name?.split(' ').slice(1).join(' ') || '',
                            email: instructor?.email
                        }
                    };
                }
                
                return {
                    ...revision,
                    currentCourse: null
                };
            })
        );

        res.json({
            success: true,
            revisions: revisionsWithCourseInfo
        });
    } catch (error) {
        logger.error('Error fetching pending revisions:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi khi lấy danh sách pending revisions',
            error: error.message 
        });
    }
};

/**
 * Lấy chi tiết revision
 */
export const getRevisionDetail = async (req, res) => {
    try {
        const { revisionId } = req.params;
        
        const revision = await CourseRevision.findById(revisionId).lean();
        
        if (!revision) {
            return res.status(404).json({ 
                success: false, 
                message: 'Revision not found' 
            });
        }

        // Lấy thông tin course hiện tại từ MongoDB
        const course = await Course.findById(revision.courseId).lean();
        
        let currentCourse = null;
        if (course) {
            const instructor = await User.findById(course.instructor_id)
                .select('_id email full_name')
                .lean();
            
            currentCourse = {
                ...course,
                course_id: course._id,
                fName: instructor?.full_name?.split(' ')[0] || '',
                lName: instructor?.full_name?.split(' ').slice(1).join(' ') || '',
                email: instructor?.email
            };
        }

        res.json({
            success: true,
            revision,
            currentCourse
        });
    } catch (error) {
        logger.error('Error fetching revision detail:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi khi lấy chi tiết revision',
            error: error.message 
        });
    }
};

/**
 * Get all users for admin management
 */
export const getAllUsers = async (req, res) => {
    try {
        const { status, role, search, page = 1, limit = 100 } = req.query;
        const skip = (page - 1) * limit;

        let query = {};
        
        // Filter by status
        if (status && status !== 'all') {
            query.is_active = status === 'active';
        }

        // Filter by role
        if (role && role !== 'all') {
            if (role === 'admin') {
                query.is_admin = true;
                query.is_superadmin = { $ne: true };
            } else if (role === 'superadmin') {
                query.is_superadmin = true;
            } else if (role === 'user') {
                query.is_admin = { $ne: true };
                query.is_superadmin = { $ne: true };
            }
        }

        // Search by name, email, or ID
        if (search) {
            query.$or = [
                { full_name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { _id: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .select('_id email full_name is_admin is_superadmin is_active createdAt profile_image_url')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const total = await User.countDocuments(query);

        logger.info(`✅ [Admin] Fetched ${users.length} users`);

        res.status(200).json({
            success: true,
            data: users,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        logger.error('Error fetching users for admin:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users',
            error: error.message
        });
    }
};

/**
 * Toggle user active status
 * Admin can only toggle regular users
 * Superadmin can toggle anyone including other superadmins
 */
export const toggleUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { is_active } = req.body;
        const currentUserRole = req.userRole; // Set by protectAdmin or protectSuperAdmin middleware

        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get target user's role from Clerk
        let targetUserRole = 'user'; // default
        try {
            const clerkUser = await clerkClient.users.getUser(userId);
            targetUserRole = clerkUser.privateMetadata?.role || 'user';
        } catch (clerkError) {
            logger.warn('Failed to get user role from Clerk:', clerkError);
        }

        // Permission check: Admin can only toggle regular users
        if (currentUserRole === 'admin') {
            if (targetUserRole === 'admin' || targetUserRole === 'superadmin') {
                return res.status(403).json({
                    success: false,
                    message: 'Admin không có quyền vô hiệu hóa/kích hoạt admin hoặc superadmin khác'
                });
            }
        }
        
        // Prevent superadmin from deactivating themselves
        if (currentUserRole === 'superadmin' && userId === req.userId && !is_active) {
            return res.status(403).json({
                success: false,
                message: 'Superadmin không thể vô hiệu hóa chính mình'
            });
        }

        // Update user status
        user.is_active = is_active;
        await user.save();

        // Also update Clerk user status
        try {
            await clerkClient.users.updateUser(userId, {
                publicMetadata: {
                    is_active: is_active
                }
            });
        } catch (clerkError) {
            logger.warn('Failed to update Clerk user status:', clerkError);
        }

        logger.info(`✅ [Admin] User ${userId} status updated to ${is_active ? 'active' : 'inactive'}`);

        res.status(200).json({
            success: true,
            message: `User ${is_active ? 'activated' : 'deactivated'} successfully`,
            data: user
        });
    } catch (error) {
        logger.error('Error toggling user status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user status',
            error: error.message
        });
    }
};

/**
 * Create admin user
 * Only superadmin can create admin or superadmin users
 */
export const createAdminUser = async (req, res) => {
    try {
        const { email, password, full_name, role = 'admin' } = req.body;

        // Only superadmin can create admin/superadmin users (already protected by protectSuperAdmin middleware)
        // Validate required fields
        if (!email || !password || !full_name) {
            return res.status(400).json({
                success: false,
                message: 'Email, password, and full name are required'
            });
        }

        // Validate role
        if (!['admin', 'superadmin'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role. Must be "admin" or "superadmin"'
            });
        }

        // Create user in Clerk with specified role
        const clerkUser = await clerkClient.users.createUser({
            emailAddress: [email],
            password: password,
            firstName: full_name.split(' ')[0],
            lastName: full_name.split(' ').slice(1).join(' ') || '',
            privateMetadata: {
                role: role
            }
        });

        // User will be created in MongoDB via webhook
        logger.info(`✅ [Superadmin] ${role} user created: ${email}`);

        res.status(201).json({
            success: true,
            message: `${role === 'superadmin' ? 'Superadmin' : 'Admin'} user created successfully`,
            data: {
                id: clerkUser.id,
                email: email,
                full_name: full_name,
                is_admin: role === 'admin',
                is_superadmin: role === 'superadmin'
            }
        });
    } catch (error) {
        logger.error('Error creating admin user:', error);
        
        // Handle Clerk specific errors
        if (error.errors) {
            return res.status(400).json({
                success: false,
                message: error.errors[0]?.message || 'Failed to create admin user',
                error: error.errors
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create admin user',
            error: error.message
        });
    }
};

export const getProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    console.log('👤 [Public Profile] userId:', userId);

    // Get user from MongoDB
    const user = await User.findById(userId).select('_id email is_admin full_name is_male dob headline bio profile_image_url');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: user.toObject()
      }
    });
  } catch (error) {
    console.error('❌ [Public Profile] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get public profile',
      error: error.message
    });
  }
};