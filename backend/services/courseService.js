import pool from '../config/mysql.js';
import { v4 as uuidv4 } from 'uuid';
// MongoDB models
import Course from '../models/Course.js';
import Section from '../models/Section.js';
import Video from '../models/video.js';
import Material from '../models/Material.js';
import Quiz from '../models/Quiz.js';

/**
 * Helper functions
 */
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

/**
 * Service: Lấy thông tin course theo ID (chỉ approved courses)
 */
export const getCourseByIdService = async (courseId) => {
    // Lấy thông tin course từ MySQL - chỉ lấy khóa học đã duyệt (approved)
    const [rows] = await pool.query('SELECT * FROM Courses WHERE course_id = ? AND course_status = ?', [courseId, 'approved']);
    
    if (rows.length === 0) {
        return null;
    }
    
    const course = rows[0];
    
    // Lấy requirements và objectives từ MongoDB
    const mongoCourse = await Course.findById(courseId).lean();
    if (mongoCourse) {
        course.requirements = mongoCourse.requirements;
        course.objectives = mongoCourse.objectives;
    }
    
    return course;
};

/**
 * Service: Lấy thông tin course theo ID (không phân biệt status - cho management)
 */
export const getCourseByIdForManagementService = async (courseId) => {
    const [rows] = await pool.query('SELECT * FROM Courses WHERE course_id = ?', [courseId]);
    
    if (rows.length === 0) {
        return null;
    }
    
    const course = rows[0];
    
    // Lấy requirements và objectives từ MongoDB
    const mongoCourse = await Course.findById(courseId).lean();
    if (mongoCourse) {
        course.requirements = mongoCourse.requirements;
        course.objectives = mongoCourse.objectives;
    }
    
    return course;
};

/**
 * Service: Tìm kiếm và filter courses
 */
export const searchCoursesService = async (filters) => {
    const { title = '', category, tag, sort, page = 1, level, language, price, prac, cert } = filters;
    const limit = 12;
    const offset = (page - 1) * limit;

    let query = 'SELECT DISTINCT c.*, u.fName, u.lName FROM Courses c JOIN Users u ON c.instructor_id = u.user_id';
    let whereClauses = ['c.course_status = ?']; // Chỉ lấy khóa học đã duyệt
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

    // Category search
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

    // Tag search
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
            orderBy = 'c.course_id DESC';
            break;
        default:
            break;
    }
    if (orderBy) {
        query += ` ORDER BY ${orderBy}`;
    }

    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [courses] = await pool.query(query, params);

    return courses.map(c => ({
        ...c,
        instructors: [{ fullName: `${c.fName} ${c.lName}` }]
    }));
};

/**
 * Service: Tạo course mới
 */
export const createCourseService = async (courseData) => {
    const { 
        title, subTitle, des, originalPrice, currentPrice, instructor_id, 
        lv_id, lang_id, has_practice, has_certificate, picture_url, 
        requirements, objectives, categories, course_status = 'draft' 
    } = courseData;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const course_id = uuidv4();
        
        // Lưu vào MySQL
        const courseQuery = `INSERT INTO Courses (course_id, title, subTitle, des, originalPrice, currentPrice, instructor_id, lv_id, lang_id, has_practice, has_certificate, picture_url, course_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        await connection.query(courseQuery, [course_id, title, subTitle, des, originalPrice, currentPrice, instructor_id, lv_id, lang_id, has_practice, has_certificate, picture_url, course_status]);

        // Lưu categories vào Labeling
        if (categories && categories.length > 0) {
            for (const category_id of categories) {
                const labelingQuery = `INSERT INTO Labeling (category_id, course_id) VALUES (?, ?)`;
                await connection.query(labelingQuery, [category_id, course_id]);
            }
        }

        await connection.commit();

        // Lưu requirements và objectives vào MongoDB
        const mongoCourse = new Course({
            _id: course_id,
            requirements,
            objectives
        });
        await mongoCourse.save();

        return { course_id, status: course_status };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

/**
 * Service: Lấy full course content (public - approved only)
 */
export const getFullCourseContentService = async (courseId) => {
    // Lấy course từ MySQL
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
        return null;
    }

    const course = courseRows[0];
    
    // Lấy requirements và objectives từ MongoDB
    const mongoCourse = await Course.findById(courseId).lean();
    if (mongoCourse) {
        course.requirements = mongoCourse.requirements;
        course.objectives = mongoCourse.objectives;
    }
    
    // Map field names
    course.thumbnail = course.picture_url;
    course.description = course.des;
    course.hasPractice = course.has_practice === 1;
    course.hasCertificate = course.has_certificate === 1;
    course.level = course.level_title;
    course.language = course.language_title;
    
    course.instructors = [{
        _id: course.instructor_user_id,
        fullName: `${course.fName} ${course.lName}`,
        avaUrl: course.avaUrl,
        headline: course.headline || '',
    }];

    // Lấy categories
    const [categories] = await pool.query(`
        SELECT cat.category_id, cat.title 
        FROM Labeling l 
        JOIN Categories cat ON l.category_id = cat.category_id 
        WHERE l.course_id = ?`, [courseId]);
    
    course.categories = categories;

    // Lấy sections
    const sections = await Section.find({ course_id: courseId }).sort({ order: 1 }).lean();
    
    if (!sections || sections.length === 0) {
        return {
            course,
            sections: [],
            stats: {
                totalSections: 0,
                totalLessons: 0,
                totalVideos: 0,
                totalMaterials: 0,
                totalQuizzes: 0
            }
        };
    }

    const sectionIds = sections.map(sec => sec._id);
    
    // Lấy content cho từng section
    const [videos, materials, quizzes] = await Promise.all([
        Video.find({ section: { $in: sectionIds } }).sort({ order: 1 }).lean(),
        Material.find({ section: { $in: sectionIds } }).sort({ order: 1 }).lean(),
        Quiz.find({ section: { $in: sectionIds } }).sort({ order: 1 }).lean()
    ]);

    const stats = {
        totalSections: sections.length,
        totalVideos: videos.length,
        totalMaterials: materials.length,
        totalQuizzes: quizzes.length,
        totalLessons: videos.length + materials.length + quizzes.length
    };

    // Gom content theo từng section và populate đầy đủ
    const sectionsWithContent = sections.map(section => {
        const sectionIdStr = section._id.toString();
        
        // Filter và map videos cho section này
        const sectionVideos = videos
            .filter(v => v.section.toString() === sectionIdStr)
            .map(v => {
                return {
                    _id: v._id,
                    title: v.title,
                    description: v.description || '',
                    order: v.order || 0,
                    duration: v.duration || 0,
                    status: v.status || 'processing',
                    // Không trả contentUrl cho public route
                    createdAt: v.createdAt,
                    updatedAt: v.updatedAt
                };
            });

        // Filter và map materials cho section này
        const sectionMaterials = materials
            .filter(m => m.section.toString() === sectionIdStr)
            .map(m => {
                return {
                    _id: m._id,
                    title: m.title,
                    description: m.description || '',
                    order: m.order || 0,
                    fileType: m.fileType || '',
                    fileSize: m.fileSize || 0,
                    fileName: m.fileName || '',
                    // Không trả contentUrl cho public route
                    createdAt: m.createdAt,
                    updatedAt: m.updatedAt
                };
            });

        // Filter và map quizzes cho section này
        const sectionQuizzes = quizzes
            .filter(q => q.section.toString() === sectionIdStr)
            .map(q => {
                return {
                    _id: q._id,
                    title: q.title,
                    description: q.description || '',
                    order: q.order || 0,
                    passingScore: q.passingScore || 70,
                    timeLimit: q.timeLimit || null,
                    // Map questions nhưng không trả correctAnswers cho public
                    questions: (q.questions || []).map(question => ({
                        _id: question._id,
                        questionText: question.questionText,
                        questionType: question.questionType || 'single-choice',
                        options: question.options || [],
                        points: question.points || 1
                        // correctAnswers và explanation removed for public
                    })),
                    createdAt: q.createdAt,
                    updatedAt: q.updatedAt
                };
            });

        return {
            _id: section._id,
            course_id: section.course_id,
            title: section.title,
            description: section.description || '',
            order: section.order || 0,
            videos: sectionVideos,
            materials: sectionMaterials,
            quizzes: sectionQuizzes,
            createdAt: section.createdAt,
            updatedAt: section.updatedAt
        };
    });

    return {
        course,
        sections: sectionsWithContent,
        stats
    };
};

/**
 * Service: Lấy course content cho enrolled users (với full data)
 */
export const getCourseContentForEnrolledUserService = async (courseId) => {
    // Lấy course từ MySQL
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
        return null;
    }

    const course = courseRows[0];
    
    // Lấy requirements và objectives từ MongoDB
    const mongoCourse = await Course.findById(courseId).lean();
    if (mongoCourse) {
        course.requirements = mongoCourse.requirements;
        course.objectives = mongoCourse.objectives;
    }

    // Lấy sections
    const sections = await Section.find({ course_id: courseId }).sort({ order: 1 }).lean();
    
    if (!sections || sections.length === 0) {
        return {
            course: {
                ...course,
                title: course.title,
                courseId: course.course_id
            },
            sections: []
        };
    }

    const sectionIds = sections.map(sec => sec._id.toString());
    
    // Lấy full content
    const [videos, materials, quizzes] = await Promise.all([
        Video.find({ section: { $in: sectionIds } }).sort({ order: 1 }).lean(),
        Material.find({ section: { $in: sectionIds } }).sort({ order: 1 }).lean(),
        Quiz.find({ section: { $in: sectionIds } }).sort({ order: 1 }).lean()
    ]);

    // Gom lessons với full data
    const sectionsWithContent = sections.map((section, index) => {
        const sectionIdStr = section._id.toString();
        
        const sectionVideos = videos
            .filter(v => v.section.toString() === sectionIdStr)
            .map(v => ({
                lessonId: v._id.toString(),
                videoId: v._id.toString(), // Thêm videoId để frontend navigate
                type: 'video',
                title: v.title,
                contentUrl: v.contentUrl,
                description: v.description || '',
                duration: calculateVideoDuration(v.contentUrl),
                order: v.order,
                completed: false
            }));

        const sectionMaterials = materials
            .filter(m => m.section.toString() === sectionIdStr)
            .map(m => ({
                lessonId: m._id.toString(),
                type: 'document',
                title: m.title,
                contentUrl: m.contentUrl,
                fileType: getFileType(m.contentUrl),
                fileSize: '1MB',
                fileName: getFileName(m.contentUrl),
                order: m.order,
                completed: false
            }));

        const sectionQuizzes = quizzes
            .filter(q => q.section.toString() === sectionIdStr)
            .map(q => ({
                lessonId: q._id.toString(),
                quizId: q._id.toString(),
                type: 'quiz',
                title: q.title,
                description: q.description || '',
                questionCount: q.questions ? q.questions.length : 0,
                questions: q.questions ? q.questions.map(quest => ({
                    questionText: quest.questionText,
                    options: quest.options,
                })) : [],
                order: q.order,
                completed: false
            }));

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

    return {
        course: {
            courseId: course.course_id,
            title: course.title,
            description: course.des,
            thumbnail: course.picture_url
        },
        sections: sectionsWithContent
    };
};

/**
 * Service: Lấy courses của instructor
 */
export const getInstructorCoursesService = async (instructorId, page = 1, limit = 12, offset = 0, status = null) => {
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

    return courses.map(c => ({
        ...c,
        instructors: [{ fullName: `${c.fName} ${c.lName}` }]
    }));
};

/**
 * Service: Cập nhật status của course
 */
export const updateCourseStatusService = async (courseId, course_status) => {
    const [result] = await pool.query(
        'UPDATE Courses SET course_status = ? WHERE course_id = ?',
        [course_status, courseId]
    );

    return result.affectedRows;
};

/**
 * Service: Import course data (requirements & objectives)
 */
export const importCourseDataService = async (courses) => {
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

    return results;
};
