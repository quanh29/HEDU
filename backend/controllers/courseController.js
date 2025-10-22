import pool from '../config/mysql.js';
import { v4 as uuidv4 } from 'uuid';
// MongoDB models
import Course from '../models/Course.js';
import Section from '../models/Section.js';
import Video from '../models/video.js';
import Material from '../models/Material.js';
import Quiz from '../models/Quiz.js';
import User from '../models/User.js';

//get course by ID (chỉ hiển thị khóa học đã được duyệt)
export const getCourseById = async (req, res) => {
    try {
        const courseId = req.params.courseId;
        
        // Lấy thông tin course từ MySQL - chỉ lấy khóa học đã duyệt (approved)
        const [rows] = await pool.query('SELECT * FROM Courses WHERE course_id = ? AND course_status = ?', [courseId, 'approved']);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Course not found or not approved' });
        }
        
        const course = rows[0];
        
        // Lấy requirements và objectives từ MongoDB
        const mongoCourse = await Course.findById(courseId).lean();
        if (mongoCourse) {
            course.requirements = mongoCourse.requirements;
            course.objectives = mongoCourse.objectives;
        }
        
        res.status(200).json(course);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

//find course by title, category, tag, sort (by rating, price, most relevant, newest), level, language, price (free, paid, under 500k, from 500k to 1M, above 1M), hasPractice (boolean) by prac, hasCertificate(boolean) by cert
// limit to 12 results each page
// Chỉ hiển thị các khóa học đã được duyệt (course_status = 'approved')
export const getCourse = async (req, res) => {
    const { title = '', category, tag, sort, page = 1, level, language, price, prac, cert } = req.query;
    const limit = 12;
    const offset = (page - 1) * limit;

    try {
        let query = 'SELECT DISTINCT c.*, u.fName, u.lName FROM Courses c JOIN Users u ON c.instructor_id = u.user_id';
        let whereClauses = ['c.course_status = ?']; // Thêm điều kiện mặc định: chỉ lấy khóa học đã duyệt
        let params = ['approved'];
        let joinLabeling = false;

        // Title search
        if (title) {
            const keywords = title.trim().split('-').filter(Boolean);
            if (keywords.length > 0) {
                const titleClauses = keywords.map(() => 'c.title LIKE ?');
                whereClauses.push(`(${titleClauses.join(' OR ')})`);
                params.push(...keywords.map(kw => `%${kw}%`));
            }
        }

        // Category search (filter by category title)
        if (category) {
            if (!joinLabeling) {
                query += ` JOIN Labeling l ON c.course_id = l.course_id`;
                joinLabeling = true;
            }
            query += ` JOIN Categories cat ON l.category_id = cat.category_id`;
            whereClauses.push('cat.title = ?');
            params.push(category);
        }

        if (prac !== undefined) {
            whereClauses.push('c.has_practice = ?');
            params.push(prac === 'true' ? 1 : 0);
        }
        if (cert !== undefined) {
            whereClauses.push('c.has_certificate = ?');
            params.push(cert === 'true' ? 1 : 0);
        }

        // Tag search (requires joining with Labeling and Categories)
        if (tag) {
            const tags = tag.split(',');
            if (!joinLabeling) {
                query += ` JOIN Labeling l ON c.course_id = l.course_id`;
                joinLabeling = true;
            }
            if (!query.includes('JOIN Categories cat')) {
                query += ` JOIN Categories cat ON l.category_id = cat.category_id`;
            }
            whereClauses.push(`cat.title IN (?)`);
            params.push(tags);
        }

        if (level && level !== 'all') {
            query += ` JOIN Levels lv ON c.lv_id = lv.lv_id`;
            whereClauses.push('lv.title = ?');
            params.push(level);
        }

        if (language) {
            query += ` JOIN Languages lg ON c.lang_id = lg.lang_id`;
            whereClauses.push('lg.title = ?');
            params.push(language);
        }

        if (price) {
            switch (price) {
                case 'free':
                    whereClauses.push('c.currentPrice = 0');
                    break;
                case 'paid':
                    whereClauses.push('c.currentPrice > 0');
                    break;
                case 'under-500k':
                    whereClauses.push('c.currentPrice < 500000');
                    break;
                case '500k-1m':
                    whereClauses.push('c.currentPrice BETWEEN 500000 AND 1000000');
                    break;
                case 'over-1m':
                    whereClauses.push('c.currentPrice > 1000000');
                    break;
            }
        }

        if (whereClauses.length > 0) {
            query += ' WHERE ' + whereClauses.join(' AND ');
        }

        // Sorting
        let orderBy = '';
        switch (sort) {
            case 'rating':
                orderBy = 'c.rating DESC';
                break;
            case 'price-asc':
                orderBy = 'c.currentPrice ASC';
                break;
            case 'price-desc':
                orderBy = 'c.currentPrice DESC';
                break;
            case 'newest':
                // Assuming there's a createdAt column, which is not in db.txt but is in the old code.
                // I will add it to the addCourse function. For now, let's sort by course_id as a proxy.
                orderBy = 'c.course_id DESC'; // Placeholder
                break;
            default:
                // Most relevant - can be complex in SQL. For now, no specific order.
                break;
        }
        if (orderBy) {
            query += ` ORDER BY ${orderBy}`;
        }

        query += ' LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const [courses] = await pool.query(query, params);

        // The old logic for relevance scoring and instructor mapping is complex to replicate directly with this SQL query.
        // The current query joins with Users to get instructor name.
        // For simplicity, returning the direct query results.
        const result = courses.map(c => ({
            ...c,
            instructors: [{ fullName: `${c.fName} ${c.lName}` }]
        }));


        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const addCourse = async (req, res) => {
    const { title, subTitle, des, originalPrice, currentPrice, instructor_id, lv_id, lang_id, has_practice, has_certificate, picture_url, requirements, objectives, categories, course_status = 'draft' } = req.body;

    if (!title || !subTitle || !originalPrice || !currentPrice || !instructor_id || !requirements || !objectives) {
        return res.status(400).json({ message: 'Required fields are missing' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const course_id = uuidv4();
        
        // Lưu thông tin course vào MySQL với course_status (mặc định là 'draft' - bản nháp)
        const courseQuery = `INSERT INTO Courses (course_id, title, subTitle, des, originalPrice, currentPrice, instructor_id, lv_id, lang_id, has_practice, has_certificate, picture_url, course_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        await connection.query(courseQuery, [course_id, title, subTitle, des, originalPrice, currentPrice, instructor_id, lv_id, lang_id, has_practice, has_certificate, picture_url, course_status]);

        // Lưu categories vào bảng Labeling nếu có
        if (categories && categories.length > 0) {
            for (const category_id of categories) {
                const labelingQuery = `INSERT INTO Labeling (category_id, course_id) VALUES (?, ?)`;
                await connection.query(labelingQuery, [category_id, course_id]);
            }
        }

        await connection.commit();

        // Lưu requirements và objectives vào MongoDB với _id = course_id
        const mongoCourse = new Course({
            _id: course_id,
            requirements,
            objectives
        });
        await mongoCourse.save();

        res.status(201).json({ success: true, course_id: course_id, status: course_status });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        connection.release();
    }
};

// Lấy toàn bộ nội dung course (course, sections, videos, materials, quizzes) theo courseId
// Chỉ hiển thị khóa học đã được duyệt (approved)
// Route public: không trả về contentUrl, description nhạy cảm, và đáp án quiz
export const getFullCourseContent = async (req, res) => {
    const { courseId } = req.params;
    try {
        // Lấy course từ MySQL - chỉ lấy khóa học đã duyệt
        const [courseRows] = await pool.query(`
            SELECT c.*, 
                   u.user_id as instructor_user_id, 
                   u.fName, 
                   u.lName, 
                   u.ava as avaUrl, 
                   u.headline,
                   lv.title as level_title,
                   lg.title as language_title
            FROM Courses c 
            JOIN Users u ON c.instructor_id = u.user_id 
            LEFT JOIN Levels lv ON c.lv_id = lv.lv_id
            LEFT JOIN Languages lg ON c.lang_id = lg.lang_id
            WHERE c.course_id = ? AND c.course_status = ?`, [courseId, 'approved']);

        if (courseRows.length === 0) {
            return res.status(404).json({ message: 'Course not found or not approved' });
        }

        const course = courseRows[0];
        
        // Lấy requirements và objectives từ MongoDB
        const mongoCourse = await Course.findById(courseId).lean();
        if (mongoCourse) {
            course.requirements = mongoCourse.requirements;
            course.objectives = mongoCourse.objectives;
        }
        
        // Map field names để phù hợp với frontend
        course.thumbnail = course.picture_url; // Frontend dùng thumbnail
        course.description = course.des; // Frontend dùng description
        course.hasPractice = course.has_practice === 1; // Convert to boolean
        course.hasCertificate = course.has_certificate === 1; // Convert to boolean
        course.level = course.level_title; // Dùng title thay vì ID
        course.language = course.language_title; // Dùng title thay vì ID
        
        // Định dạng instructor info
        course.instructors = [{
            _id: course.instructor_user_id,
            fullName: `${course.fName} ${course.lName}`,
            avaUrl: course.avaUrl,
            headline: course.headline || '',
        }];

        // Lấy categories từ MySQL
        const [categories] = await pool.query(`
            SELECT cat.category_id, cat.title 
            FROM Labeling l 
            JOIN Categories cat ON l.category_id = cat.category_id 
            WHERE l.course_id = ?`, [courseId]);
        
        course.categories = categories;

        // Lấy sections từ MongoDB
        const sections = await Section.find({ course_id: courseId }).sort({ order: 1 }).lean();
        
        if (!sections || sections.length === 0) {
            return res.status(200).json({
                course,
                sections: [],
                stats: {
                    totalSections: 0,
                    totalLessons: 0,
                    totalVideos: 0,
                    totalMaterials: 0,
                    totalQuizzes: 0
                }
            });
        }

        const sectionIds = sections.map(sec => sec._id.toString());
        
        // Lấy videos, materials, quizzes từ MongoDB
        const [videos, materials, quizzes] = await Promise.all([
            Video.find({ section: { $in: sectionIds } }).sort({ order: 1 }).lean(),
            Material.find({ section: { $in: sectionIds } }).sort({ order: 1 }).lean(),
            Quiz.find({ section: { $in: sectionIds } }).sort({ order: 1 }).lean()
        ]);

        // Thống kê
        const stats = {
            totalSections: sections.length,
            totalVideos: videos.length,
            totalMaterials: materials.length,
            totalQuizzes: quizzes.length,
            totalLessons: videos.length + materials.length + quizzes.length
        };

        // Gom lessons theo section (chỉ thông tin công khai)
        const sectionsWithContent = sections.map(section => {
            const sectionIdStr = section._id.toString();
            
            // Lấy videos của section (PUBLIC - không có contentUrl, description)
            const sectionVideos = videos
                .filter(v => v.section.toString() === sectionIdStr)
                .map(v => ({
                    _id: v._id,
                    type: 'video',
                    title: v.title,
                    order: v.order
                }));

            // Lấy materials của section (PUBLIC - không có contentUrl)
            const sectionMaterials = materials
                .filter(m => m.section.toString() === sectionIdStr)
                .map(m => ({
                    _id: m._id,
                    type: 'material',
                    title: m.title,
                    order: m.order
                }));

            // Lấy quizzes của section (PUBLIC - không có questions, correctAnswers, explanation)
            const sectionQuizzes = quizzes
                .filter(q => q.section.toString() === sectionIdStr)
                .map(q => ({
                    _id: q._id,
                    type: 'quiz',
                    title: q.title,
                    description: q.description || '',
                    questionCount: q.questions ? q.questions.length : 0,
                    order: q.order
                }));

            // Gộp tất cả lessons và sắp xếp theo order
            const allLessons = [...sectionVideos, ...sectionMaterials, ...sectionQuizzes]
                .sort((a, b) => a.order - b.order);

            return {
                _id: section._id,
                course_id: section.course_id,
                title: section.title,
                order: section.order,
                lessonCount: allLessons.length,
                lessons: allLessons
            };
        });

        res.status(200).json({
            course,
            sections: sectionsWithContent,
            stats
        });
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
        // Lấy course từ MySQL - chỉ lấy khóa học đã duyệt
        const [courseRows] = await pool.query(`
            SELECT c.*, 
                   u.user_id as instructor_user_id, 
                   u.fName, 
                   u.lName, 
                   u.ava as avaUrl, 
                   u.headline,
                   lv.title as level_title,
                   lg.title as language_title
            FROM Courses c 
            JOIN Users u ON c.instructor_id = u.user_id 
            LEFT JOIN Levels lv ON c.lv_id = lv.lv_id
            LEFT JOIN Languages lg ON c.lang_id = lg.lang_id
            WHERE c.course_id = ? AND c.course_status = ?`, [courseId, 'approved']);

        if (courseRows.length === 0) {
            return res.status(404).json({ message: 'Course not found or not approved' });
        }

        const course = courseRows[0];
        
        // Lấy requirements và objectives từ MongoDB
        const mongoCourse = await Course.findById(courseId).lean();
        if (mongoCourse) {
            course.requirements = mongoCourse.requirements;
            course.objectives = mongoCourse.objectives;
        }

        // Lấy sections từ MongoDB
        const sections = await Section.find({ course_id: courseId }).sort({ order: 1 }).lean();
        
        if (!sections || sections.length === 0) {
            return res.status(200).json({
                course: {
                    ...course,
                    title: course.title,
                    courseId: course.course_id
                },
                sections: []
            });
        }

        const sectionIds = sections.map(sec => sec._id.toString());
        
        // Lấy videos, materials, quizzes từ MongoDB với đầy đủ thông tin
        const [videos, materials, quizzes] = await Promise.all([
            Video.find({ section: { $in: sectionIds } }).sort({ order: 1 }).lean(),
            Material.find({ section: { $in: sectionIds } }).sort({ order: 1 }).lean(),
            Quiz.find({ section: { $in: sectionIds } }).sort({ order: 1 }).lean()
        ]);

        // Gom lessons theo section với đầy đủ thông tin
        const sectionsWithContent = sections.map((section, index) => {
            const sectionIdStr = section._id.toString();
            
            // Lấy videos của section với contentUrl và description
            const sectionVideos = videos
                .filter(v => v.section.toString() === sectionIdStr)
                .map(v => ({
                    lessonId: v._id.toString(),
                    type: 'video',
                    title: v.title,
                    contentUrl: v.contentUrl,
                    description: v.description || '',
                    duration: calculateVideoDuration(v.contentUrl), // Có thể implement sau
                    order: v.order,
                    completed: false // Có thể lấy từ progress tracking sau
                }));

            // Lấy materials của section với contentUrl
            const sectionMaterials = materials
                .filter(m => m.section.toString() === sectionIdStr)
                .map(m => ({
                    lessonId: m._id.toString(),
                    type: 'document',
                    title: m.title,
                    contentUrl: m.contentUrl,
                    fileType: getFileType(m.contentUrl), // pdf, doc, etc.
                    fileSize: '1MB', // Có thể calculate từ file thực tế
                    fileName: getFileName(m.contentUrl),
                    order: m.order,
                    completed: false
                }));

            // Lấy quizzes của section với questions (nhưng không có correctAnswers và explanation)
            const sectionQuizzes = quizzes
                .filter(q => q.section.toString() === sectionIdStr)
                .map(q => ({
                    lessonId: q._id.toString(),
                    type: 'quiz',
                    title: q.title,
                    description: q.description || '',
                    questionCount: q.questions ? q.questions.length : 0,
                    questions: q.questions ? q.questions.map(quest => ({
                        questionText: quest.questionText,
                        options: quest.options,
                        // Không trả về correctAnswers và explanation để tránh gian lận
                    })) : [],
                    order: q.order,
                    completed: false
                }));

            // Gộp tất cả lessons và sắp xếp theo order
            const allLessons = [...sectionVideos, ...sectionMaterials, ...sectionQuizzes]
                .sort((a, b) => a.order - b.order);

            return {
                sectionId: section._id.toString(),
                title: section.title,
                courseTitle: course.title,
                order: section.order,
                lessons: allLessons
            };
        });

        res.status(200).json({
            course: {
                courseId: course.course_id,
                title: course.title,
                description: course.des,
                thumbnail: course.picture_url
            },
            sections: sectionsWithContent
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Helper functions
function calculateVideoDuration(url) {
    // Placeholder - implement actual video duration calculation if needed
    return '10:00';
}

function getFileType(url) {
    const extension = url.split('.').pop().toLowerCase();
    return extension || 'pdf';
}

function getFileName(url) {
    return url.split('/').pop() || 'document';
}

// Lấy tất cả khóa học của instructor (bao gồm tất cả trạng thái)
export const getInstructorCourses = async (req, res) => {
    const { instructorId } = req.params;
    const { page = 1, status } = req.query;
    const limit = 12;
    const offset = (page - 1) * limit;

    try {
        let query = 'SELECT c.*, u.fName, u.lName FROM Courses c JOIN Users u ON c.instructor_id = u.user_id WHERE c.instructor_id = ?';
        let params = [instructorId];

        // Lọc theo status nếu có
        if (status) {
            query += ' AND c.course_status = ?';
            params.push(status);
        }

        query += ' ORDER BY c.course_id DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const [courses] = await pool.query(query, params);

        const result = courses.map(c => ({
            ...c,
            instructors: [{ fullName: `${c.fName} ${c.lName}` }]
        }));

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
        const [result] = await pool.query(
            'UPDATE Courses SET course_status = ? WHERE course_id = ?',
            [course_status, courseId]
        );

        if (result.affectedRows === 0) {
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
        const [rows] = await pool.query('SELECT * FROM Courses WHERE course_id = ?', [courseId]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Course not found' });
        }
        
        const course = rows[0];
        
        // Lấy requirements và objectives từ MongoDB
        const mongoCourse = await Course.findById(courseId).lean();
        if (mongoCourse) {
            course.requirements = mongoCourse.requirements;
            course.objectives = mongoCourse.objectives;
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
        const results = {
            success: [],
            failed: [],
            skipped: []
        };

        for (const courseData of courses) {
            const { _id, requirements, objectives } = courseData;

            // Validate required fields
            if (!_id || !requirements || !objectives) {
                results.failed.push({
                    _id: _id || 'unknown',
                    reason: 'Missing required fields (_id, requirements, or objectives)'
                });
                continue;
            }

            // Validate arrays
            if (!Array.isArray(requirements) || !Array.isArray(objectives)) {
                results.failed.push({
                    _id,
                    reason: 'Requirements and objectives must be arrays'
                });
                continue;
            }

            try {
                // Check if course already exists
                const existingCourse = await Course.findById(_id);
                
                if (existingCourse) {
                    // Update existing course
                    existingCourse.requirements = requirements;
                    existingCourse.objectives = objectives;
                    await existingCourse.save();
                    results.success.push({
                        _id,
                        action: 'updated'
                    });
                } else {
                    // Create new course
                    const newCourse = new Course({
                        _id,
                        requirements,
                        objectives
                    });
                    await newCourse.save();
                    results.success.push({
                        _id,
                        action: 'created'
                    });
                }
            } catch (error) {
                results.failed.push({
                    _id,
                    reason: error.message
                });
            }
        }

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