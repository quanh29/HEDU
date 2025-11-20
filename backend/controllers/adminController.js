import pool from '../config/mysql.js';
import Course from '../models/Course.js';
import CourseRevision from '../models/CourseRevision.js';
import logger from '../utils/logger.js';

/**
 * Admin Controller - Quản lý courses cho admin
 */

/**
 * Lấy tất cả courses cho admin (bao gồm tất cả status)
 */
export const getAllCoursesForAdmin = async (req, res) => {
    try {
        const { course_status, category, search, page = 1, limit = 100 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT c.*, 
                   u.user_id as instructor_user_id,
                   u.fName, 
                   u.lName,
                   u.email as instructor_email,
                   u.ava as instructor_ava
            FROM Courses c 
            LEFT JOIN Users u ON c.instructor_id = u.user_id
        `;
        
        let whereClauses = [];
        let params = [];

        // Filter by status
        if (course_status && course_status !== 'all') {
            whereClauses.push('c.course_status = ?');
            params.push(course_status);
        }

        // Filter by category
        if (category && category !== 'all') {
            query += ` LEFT JOIN Labeling l ON c.course_id = l.course_id
                       LEFT JOIN Categories cat ON l.category_id = cat.category_id`;
            whereClauses.push('cat.title = ?');
            params.push(category);
        }

        // Search by title or instructor name
        if (search) {
            whereClauses.push('(c.title LIKE ? OR u.fName LIKE ? OR u.lName LIKE ? OR u.email LIKE ?)');
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        if (whereClauses.length > 0) {
            query += ' WHERE ' + whereClauses.join(' AND ');
        }

        query += ` ORDER BY c.course_id DESC
                   LIMIT ? OFFSET ?`;
        
        params.push(parseInt(limit), parseInt(offset));

        const [courses] = await pool.query(query, params);

        // Lấy categories cho mỗi course
        const coursesWithDetails = await Promise.all(courses.map(async (course) => {
            const [categories] = await pool.query(`
                SELECT cat.category_id, cat.title 
                FROM Labeling l 
                JOIN Categories cat ON l.category_id = cat.category_id 
                WHERE l.course_id = ?
            `, [course.course_id]);

            return {
                ...course,
                instructor: {
                    user_id: course.instructor_user_id,
                    fName: course.fName,
                    lName: course.lName,
                    email: course.instructor_email,
                    ava: course.instructor_ava
                },
                categories: categories,
                students: 0, // TODO: Implement when Enrollments table is ready
                reports: 0 // TODO: Implement reports system
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

        const [courseRows] = await pool.query(`
            SELECT c.*, 
                   u.user_id as instructor_user_id, 
                   u.fName, 
                   u.lName, 
                   u.email as instructor_email,
                   u.ava as instructor_ava, 
                   u.headline,
                   lv.title as level_title,
                   lg.title as language_title
            FROM Courses c 
            JOIN Users u ON c.instructor_id = u.user_id 
            LEFT JOIN Levels lv ON c.lv_id = lv.lv_id
            LEFT JOIN Languages lg ON c.lang_id = lg.lang_id
            WHERE c.course_id = ?
        `, [courseId]);

        if (courseRows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Không tìm thấy khóa học' 
            });
        }

        const course = courseRows[0];
        
        // Lấy requirements và objectives từ MongoDB
        const mongoCourse = await Course.findById(courseId).lean();
        if (mongoCourse) {
            course.requirements = mongoCourse.requirements;
            course.objectives = mongoCourse.objectives;
        }

        // Lấy categories
        const [categories] = await pool.query(`
            SELECT cat.category_id, cat.title 
            FROM Labeling l 
            JOIN Categories cat ON l.category_id = cat.category_id 
            WHERE l.course_id = ?
        `, [courseId]);
        
        course.categories = categories;
        course.instructor = {
            user_id: course.instructor_user_id,
            fName: course.fName,
            lName: course.lName,
            email: course.instructor_email,
            ava: course.instructor_ava,
            headline: course.headline
        };
        course.students = 0; // TODO: Implement when Enrollments table is ready

        res.json(course);
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

        const [result] = await pool.query(
            'UPDATE Courses SET course_status = ? WHERE course_id = ?',
            [course_status, courseId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Không tìm thấy khóa học' 
            });
        }

        // TODO: Send notification to instructor about status change
        // TODO: Log the status change with reason

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
        const [stats] = await pool.query(`
            SELECT 
                COUNT(*) as total_courses,
                SUM(CASE WHEN course_status = 'draft' THEN 1 ELSE 0 END) as draft_count,
                SUM(CASE WHEN course_status = 'pending' THEN 1 ELSE 0 END) as pending_count,
                SUM(CASE WHEN course_status = 'approved' THEN 1 ELSE 0 END) as approved_count,
                SUM(CASE WHEN course_status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
                SUM(CASE WHEN course_status = 'suspended' THEN 1 ELSE 0 END) as suspended_count,
                SUM(CASE WHEN course_status = 'hidden' THEN 1 ELSE 0 END) as hidden_count
            FROM Courses
        `);

        res.json(stats[0]);
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

        // Lấy thông tin course từ MySQL
        const revisionsWithCourseInfo = await Promise.all(
            revisions.map(async (revision) => {
                const [courses] = await pool.query(
                    `SELECT c.course_id, c.title, c.course_status, 
                            u.fName, u.lName, u.email
                     FROM Courses c
                     LEFT JOIN Users u ON c.instructor_id = u.user_id
                     WHERE c.course_id = ?`,
                    [revision.courseId]
                );

                return {
                    ...revision,
                    currentCourse: courses[0] || null
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

        // Lấy thông tin course hiện tại từ MySQL
        const [courses] = await pool.query(
            `SELECT c.*, u.fName, u.lName, u.email
             FROM Courses c
             LEFT JOIN Users u ON c.instructor_id = u.user_id
             WHERE c.course_id = ?`,
            [revision.courseId]
        );

        res.json({
            success: true,
            revision,
            currentCourse: courses[0] || null
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
