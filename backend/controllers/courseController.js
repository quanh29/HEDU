// Import services
import * as courseService from '../services/courseService.js';
import CourseRevision from '../models/CourseRevision.js';
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

    if (!title || !subTitle || !originalPrice || !currentPrice || !instructor_id || !requirements || !objectives) {
        return res.status(400).json({ message: 'Required fields are missing' });
    }

    try {
        const result = await courseService.createCourseService(req.body);
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

        // Nếu course đã approved và đang gửi lại để pending (chỉnh sửa nội dung)
        // thì tạo revision thay vì update trực tiếp
        if (currentStatus === 'approved' && newStatus === 'pending') {
            logger.info(`🔄 [updateCourse] Creating revision for approved course: ${courseId}`);
            
            // Kiểm tra xem đã có revision pending chưa
            const existingRevision = await CourseRevision.findOne({
                courseId: courseId,
                status: 'pending'
            });

            if (existingRevision) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'A pending revision already exists for this course' 
                });
            }

            // Tạo revision mới
            const revision = new CourseRevision({
                courseId: courseId,
                title: req.body.title,
                subtitle: req.body.subTitle,
                instructors: [req.body.instructor_id],
                description: req.body.des,
                thumbnail: req.body.picture_url,
                originalPrice: req.body.originalPrice,
                currentPrice: req.body.currentPrice,
                tags: req.body.categories || [],
                level: req.body.level || 'beginner',
                language: req.body.language || 'vietnamese',
                hasPractice: req.body.has_practice || false,
                hasCertificate: req.body.has_certificate || false,
                requirements: req.body.requirements,
                objectives: req.body.objectives,
                sections: req.body.sections || [],
                status: 'pending',
                version: 1,
                lv_id: req.body.lv_id,
                lang_id: req.body.lang_id,
                categories: req.body.categories,
                picture_url: req.body.picture_url,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            await revision.save();

            logger.info(`✅ [updateCourse] Revision created: ${revision._id}`);

            return res.status(200).json({ 
                success: true,
                message: 'Course revision created and pending approval',
                revisionId: revision._id,
                isRevision: true
            });
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