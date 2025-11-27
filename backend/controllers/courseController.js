// Import services
import * as courseService from '../services/courseService.js';
import CourseRevision from '../models/CourseDraft.js';
import logger from '../utils/logger.js';
import pool from '../config/mysql.js';

//get course by ID (chỉ hiển thị khóa học đã được duyệt)
export const getCourseById = async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const course = await courseService.getCourseByIdService(courseId);
        
        if (!course) {
            return res.status(404).json({ message: 'Course not found or not approved' });
        }
        
        res.status(200).json(course);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

//find course by title, category, tag, sort, etc.
// limit to 12 results each page
// Chỉ hiển thị các khóa học đã được duyệt (course_status = 'approved')
export const getCourse = async (req, res) => {
    try {
        const courses = await courseService.searchCoursesService(req.query);
        res.status(200).json(courses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const addCourse = async (req, res) => {
    const { title, subTitle, originalPrice, currentPrice, instructor_id, requirements, objectives, sections } = req.body;

    console.log('📥 [addCourse] Received request:', {
        title,
        instructor_id,
        sectionsCount: sections?.length || 0,
        hasSections: !!sections
    });

    // Allow creating draft course with minimal data
    if (!title || !instructor_id) {
        return res.status(400).json({ message: 'Title and instructor_id are required' });
    }

    // Set defaults for draft courses
    const courseData = {
        title,
        subTitle: subTitle || '',
        originalPrice: originalPrice || 0,
        currentPrice: currentPrice || 0,
        instructor_id,
        requirements: requirements || [],
        objectives: objectives || [],
        sections: sections || [],
        course_status: 'draft' // Always create as draft
    };

    try {
        const result = await courseService.createCourseService(courseData);
        console.log('✅ [addCourse] Course created successfully:', result);
        res.status(201).json({ success: true, ...result });
    } catch (error) {
        console.error('❌ [addCourse] Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Lấy toàn bộ nội dung course (course, sections, videos, materials, quizzes) theo courseId
// Chỉ hiển thị khóa học đã được duyệt (approved)
// Route public: không trả về contentUrl, description nhạy cảm, và đáp án quiz
export const getFullCourseContent = async (req, res) => {
    const { courseId } = req.params;
    try {
        const result = await courseService.getFullCourseContentService(courseId);
        
        if (!result) {
            return res.status(404).json({ message: 'Course not found or not approved' });
        }

        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Lấy đầy đủ nội dung course cho học viên đã đăng ký
// Bao gồm contentUrl của videos, materials và chi tiết quiz questions
// Route này dành cho trang CourseContent khi học viên đang học
export const getCourseContentForEnrolledUser = async (req, res) => {
    const { courseId } = req.params;
    try {
        const result = await courseService.getCourseContentForEnrolledUserService(courseId);
        
        if (!result) {
            return res.status(404).json({ message: 'Course not found or not approved' });
        }

        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Lấy tất cả khóa học của instructor (bao gồm tất cả trạng thái)
export const getInstructorCourses = async (req, res) => {
    const { instructorId } = req.params;
    const { page = 1, status } = req.query;
    const limit = 12;
    const offset = (page - 1) * limit;

    try {
        const result = await courseService.getInstructorCoursesService(instructorId, page, limit, offset, status);
        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Cập nhật trạng thái khóa học (dành cho admin hoặc instructor)
export const updateCourseStatus = async (req, res) => {
    const { courseId } = req.params;
    const { course_status } = req.body;

    // Validate course_status
    const validStatuses = ['draft', 'pending', 'approved', 'rejected'];
    if (!validStatuses.includes(course_status)) {
        return res.status(400).json({ message: 'Invalid status. Must be one of: draft, pending, approved, rejected' });
    }

    try {
        const affectedRows = await courseService.updateCourseStatusService(courseId, course_status);

        if (affectedRows === 0) {
            return res.status(404).json({ message: 'Course not found' });
        }

        res.status(200).json({ success: true, message: 'Course status updated', course_status });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Lấy khóa học theo ID không phân biệt trạng thái (dành cho instructor/admin)
export const getCourseByIdForManagement = async (req, res) => {
    const { courseId } = req.params;

    try {
        const course = await courseService.getCourseByIdForManagementService(courseId);
        
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        
        res.status(200).json(course);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Import dữ liệu course requirements và objectives vào MongoDB
export const importCourseData = async (req, res) => {
    const { courses } = req.body;

    // Validate input
    if (!courses || !Array.isArray(courses) || courses.length === 0) {
        return res.status(400).json({ 
            message: 'Invalid input. Expected an array of courses with _id, requirements, and objectives' 
        });
    }

    try {
        const results = await courseService.importCourseDataService(courses);

        res.status(200).json({
            message: 'Import completed',
            total: courses.length,
            successCount: results.success.length,
            failedCount: results.failed.length,
            results
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during import', error: error.message });
    }
};

// Update course (MySQL + MongoDB)
// Nếu course đã approved, tạo revision thay vì update trực tiếp
export const updateCourse = async (req, res) => {
    const { courseId } = req.params;

    try {
        // Kiểm tra trạng thái hiện tại của course
        const [courses] = await pool.query(
            'SELECT course_status FROM Courses WHERE course_id = ?',
            [courseId]
        );

        if (!courses || courses.length === 0) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const currentStatus = courses[0].course_status;
        const newStatus = req.body.course_status;

        logger.info(`📝 [updateCourse] Updating course ${courseId}, currentStatus: ${currentStatus}, newStatus: ${newStatus}`);

        // Nếu course đã approved và đang gửi lại để pending
        // Giờ sử dụng draft system, không tạo CourseRevision nữa
        if (currentStatus === 'approved' && newStatus === 'pending') {
            logger.info(`🔄 [updateCourse] Course is approved, changes should be in draft system`);
            
            // Kiểm tra xem có draft không
            const CourseDraft = (await import('../models/CourseDraft.js')).default;
            const draft = await CourseDraft.findById(courseId);
            
            if (draft) {
                // Đã có draft, không cần tạo gì cả
                logger.info(`✅ [updateCourse] Draft exists, changes are tracked in draft system`);
                return res.status(200).json({ 
                    success: true,
                    message: 'Changes are tracked in draft system. Please submit draft for approval.',
                    isDraft: true,
                    draftStatus: draft.status
                });
            } else {
                // Chưa có draft, nên tạo draft trước
                logger.info(`⚠️ [updateCourse] No draft found, please use draft system`);
                return res.status(400).json({ 
                    success: false,
                    message: 'Please use draft system to edit approved courses',
                    shouldCreateDraft: true
                });
            }
        }

        // Nếu không phải trường hợp trên, update bình thường
        const result = await courseService.updateCourseService(courseId, req.body);
        res.status(200).json(result);
    } catch (error) {
        logger.error('❌ [updateCourse] Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete course (MySQL + MongoDB)
export const deleteCourse = async (req, res) => {
    const { courseId } = req.params;

    try {
        const result = await courseService.deleteCourseService(courseId);
        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get full course data for management (bao gồm sections và lessons)
export const getFullCourseDataForManagement = async (req, res) => {
    const { courseId } = req.params;

    try {
        const course = await courseService.getFullCourseDataForManagementService(courseId);
        
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        
        res.status(200).json(course);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};