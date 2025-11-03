import pool from '../config/mysql.js';
import { v4 as uuidv4 } from 'uuid';
import Mux from '@mux/mux-node';
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
 * Helper: Xóa videos và MUX assets
 */
async function deleteVideosWithMuxAssets(videoIds) {
    try {
        // Lấy thông tin videos trước khi xóa
        const videos = await Video.find({ _id: { $in: videoIds } }).lean();
        
        // Initialize MUX client
        const { video: muxVideo } = new Mux({
            tokenId: process.env.MUX_TOKEN_ID,
            tokenSecret: process.env.MUX_SECRET_KEY
        });

        // Xóa MUX assets
        const deletePromises = videos.map(async (video) => {
            if (video.assetId) {
                try {
                    await muxVideo.assets.delete(video.assetId);
                    console.log(`✅ Deleted MUX asset: ${video.assetId} for video: ${video.title}`);
                } catch (muxError) {
                    console.error(`❌ Error deleting MUX asset ${video.assetId}:`, muxError.message);
                    // Continue even if MUX deletion fails
                }
            }
        });

        await Promise.all(deletePromises);

        // Xóa videos từ MongoDB
        await Video.deleteMany({ _id: { $in: videoIds } });
        console.log(`✅ Deleted ${videoIds.length} videos from MongoDB`);
    } catch (error) {
        console.error('Error in deleteVideosWithMuxAssets:', error);
        throw error;
    }
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
        requirements, objectives, categories, course_status = 'draft',
        sections
    } = courseData;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const course_id = uuidv4();
        
        console.log('🆕 [createCourseService] Creating course:', {
            course_id,
            title,
            instructor_id,
            sectionsCount: sections?.length || 0
        });
        
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
        
        console.log('✅ [createCourseService] MongoDB Course created');

        // Tạo sections và lessons nếu có
        if (sections && sections.length > 0) {
            console.log(`📦 [createCourseService] Creating ${sections.length} sections...`);
            await updateCourseSectionsService(course_id, sections);
            console.log('✅ [createCourseService] Sections created');
        } else {
            console.log('⚠️ [createCourseService] No sections provided');
        }

        return { course_id, status: course_status };
    } catch (error) {
        await connection.rollback();
        console.error('❌ [createCourseService] Error:', error);
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

/**
 * Service: Update course (MySQL + MongoDB)
 */
export const updateCourseService = async (courseId, courseData) => {
    const { 
        title, subTitle, des, originalPrice, currentPrice, 
        lv_id, lang_id, has_practice, has_certificate, picture_url, 
        requirements, objectives, categories, course_status,
        sections
    } = courseData;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Cập nhật MySQL
        const updateFields = [];
        const updateValues = [];

        if (title !== undefined) { updateFields.push('title = ?'); updateValues.push(title); }
        if (subTitle !== undefined) { updateFields.push('subTitle = ?'); updateValues.push(subTitle); }
        if (des !== undefined) { updateFields.push('des = ?'); updateValues.push(des); }
        if (originalPrice !== undefined) { updateFields.push('originalPrice = ?'); updateValues.push(originalPrice); }
        if (currentPrice !== undefined) { updateFields.push('currentPrice = ?'); updateValues.push(currentPrice); }
        if (lv_id !== undefined) { updateFields.push('lv_id = ?'); updateValues.push(lv_id); }
        if (lang_id !== undefined) { updateFields.push('lang_id = ?'); updateValues.push(lang_id); }
        if (has_practice !== undefined) { updateFields.push('has_practice = ?'); updateValues.push(has_practice); }
        if (has_certificate !== undefined) { updateFields.push('has_certificate = ?'); updateValues.push(has_certificate); }
        if (picture_url !== undefined) { updateFields.push('picture_url = ?'); updateValues.push(picture_url); }
        if (course_status !== undefined) { updateFields.push('course_status = ?'); updateValues.push(course_status); }

        if (updateFields.length > 0) {
            updateValues.push(courseId);
            const courseQuery = `UPDATE Courses SET ${updateFields.join(', ')} WHERE course_id = ?`;
            await connection.query(courseQuery, updateValues);
        }

        // Cập nhật categories nếu có
        if (categories && categories.length > 0) {
            // Xóa categories cũ
            await connection.query('DELETE FROM Labeling WHERE course_id = ?', [courseId]);
            
            // Thêm categories mới
            for (const category_id of categories) {
                await connection.query('INSERT INTO Labeling (category_id, course_id) VALUES (?, ?)', [category_id, courseId]);
            }
        }

        await connection.commit();

        // Cập nhật MongoDB
        if (requirements !== undefined || objectives !== undefined) {
            const mongoCourse = await Course.findById(courseId);
            if (mongoCourse) {
                if (requirements !== undefined) mongoCourse.requirements = requirements;
                if (objectives !== undefined) mongoCourse.objectives = objectives;
                await mongoCourse.save();
            } else {
                // Tạo mới nếu chưa có
                const newMongoCourse = new Course({
                    _id: courseId,
                    requirements: requirements || [],
                    objectives: objectives || []
                });
                await newMongoCourse.save();
            }
        }

        // Cập nhật sections nếu có
        if (sections && sections.length > 0) {
            await updateCourseSectionsService(courseId, sections);
        }

        return { success: true, course_id: courseId };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

/**
 * Service: Update course sections and lessons
 */
export const updateCourseSectionsService = async (courseId, sections) => {
    console.log(`📦 [updateCourseSectionsService] Processing ${sections.length} sections for course ${courseId}`);
    
    // Lấy danh sách section IDs hiện có
    const existingSections = await Section.find({ course_id: courseId }).lean();
    const existingSectionIds = existingSections.map(s => s._id.toString());
    const newSectionIds = sections
        .filter(s => s._id && !s._id.startsWith('temp-'))
        .map(s => s._id.toString());

    console.log('🔍 [updateCourseSectionsService] Existing sections:', existingSectionIds.length);
    console.log('🔍 [updateCourseSectionsService] New section IDs:', newSectionIds);

    // Xóa sections không còn trong danh sách mới
    const sectionsToDelete = existingSectionIds.filter(id => !newSectionIds.includes(id));
    if (sectionsToDelete.length > 0) {
        console.log(`🗑️ [updateCourseSectionsService] Deleting ${sectionsToDelete.length} sections`);
        for (const sectionId of sectionsToDelete) {
            await Section.findByIdAndDelete(sectionId);
            // Xóa tất cả lessons của section này
            await Video.deleteMany({ section: sectionId });
            await Material.deleteMany({ section: sectionId });
            await Quiz.deleteMany({ section: sectionId });
        }
    }

    // Cập nhật hoặc tạo mới sections
    for (const [index, section] of sections.entries()) {
        console.log(`\n📝 [updateCourseSectionsService] Processing section ${index + 1}/${sections.length}:`, {
            title: section.title,
            _id: section._id,
            hasId: !!section._id,
            startsWithTemp: section._id?.startsWith('temp-'),
            lessonsCount: section.lessons?.length || 0
        });
        
        let sectionId;
        
        if (section._id && !section._id.startsWith('temp-')) {
            // Cập nhật section hiện có
            console.log(`✏️ [updateCourseSectionsService] Updating existing section: ${section._id}`);
            await Section.findByIdAndUpdate(section._id, {
                title: section.title,
                order: section.order || 1
            });
            sectionId = section._id;
        } else {
            // Tạo section mới
            console.log('➕ [updateCourseSectionsService] Creating new section:', section.title);
            const newSection = new Section({
                course_id: courseId,
                title: section.title,
                order: section.order || 1
            });
            const savedSection = await newSection.save();
            sectionId = savedSection._id.toString();
            console.log('✅ [updateCourseSectionsService] Section created with ID:', sectionId);
        }

        // Cập nhật lessons của section
        if (section.lessons && section.lessons.length > 0) {
            console.log(`📚 [updateCourseSectionsService] Processing ${section.lessons.length} lessons for section ${sectionId}`);
            await updateSectionLessonsService(sectionId, section.lessons);
        } else {
            console.log(`⚠️ [updateCourseSectionsService] No lessons for section ${sectionId}`);
        }
    }
    
    console.log('✅ [updateCourseSectionsService] All sections processed');
};

/**
 * Service: Update lessons trong một section
 */
export const updateSectionLessonsService = async (sectionId, lessons) => {
    console.log(`📚 [updateSectionLessonsService] Processing ${lessons.length} lessons for section ${sectionId}`);
    
    // Lấy danh sách lesson IDs hiện có
    const [existingVideos, existingMaterials, existingQuizzes] = await Promise.all([
        Video.find({ section: sectionId }).lean(),
        Material.find({ section: sectionId }).lean(),
        Quiz.find({ section: sectionId }).lean()
    ]);

    const existingVideoIds = existingVideos.map(v => v._id.toString());
    const existingMaterialIds = existingMaterials.map(m => m._id.toString());
    const existingQuizIds = existingQuizzes.map(q => q._id.toString());

    const newVideoIds = [];
    const newMaterialIds = [];
    const newQuizIds = [];

    // Xử lý từng lesson
    for (const [index, lesson] of lessons.entries()) {
        console.log(`\n  📝 [updateSectionLessonsService] Processing lesson ${index + 1}:`, {
            title: lesson.title,
            contentType: lesson.contentType,
            _id: lesson._id,
            hasContent: !!(lesson.contentUrl || lesson.playbackId || (lesson.questions && lesson.questions.length > 0))
        });
        
        if (lesson.contentType === 'video') {
            let videoId = null;
            
            // Case 1: link video đã tạo với section bằng videoId
            if (lesson.videoId) {
                console.log('  🔗 [updateSectionLessonsService] Linking existing video to section:', lesson.videoId);
                const existingVideo = await Video.findById(lesson.videoId);
                
                if (existingVideo) {
                    // Cập nhật video với section và thông tin mới
                    await Video.findByIdAndUpdate(lesson.videoId, {
                        section: sectionId,
                        title: lesson.title || existingVideo.title,
                        description: lesson.description || existingVideo.description || '',
                        order: lesson.order || 1,
                        contentUrl: lesson.contentUrl || existingVideo.contentUrl || '',
                        playbackId: lesson.playbackId || existingVideo.playbackId || '',
                        assetId: lesson.assetId || existingVideo.assetId || '',
                        uploadId: lesson.uploadId || existingVideo.uploadId || '',
                        status: lesson.status || existingVideo.status || 'uploading',
                        duration: lesson.duration || existingVideo.duration || 0
                    });
                    videoId = lesson.videoId;
                    console.log('  ✅ [updateSectionLessonsService] Video linked successfully');
                } else {
                    console.log('  ⚠️ [updateSectionLessonsService] Video not found, creating new');
                }
            }
            // Case 2: Lesson mới có playbackId → tìm video theo playbackId và link
            else if (lesson.playbackId) {
                console.log('  🔍 [updateSectionLessonsService] Searching video by playbackId:', lesson.playbackId);
                const existingVideo = await Video.findOne({ playbackId: lesson.playbackId });
                
                if (existingVideo) {
                    console.log('  🔗 [updateSectionLessonsService] Found video, linking to section:', existingVideo._id);
                    // Cập nhật video với section và thông tin mới
                    await Video.findByIdAndUpdate(existingVideo._id, {
                        section: sectionId,
                        title: lesson.title || existingVideo.title,
                        description: lesson.description || existingVideo.description || '',
                        order: lesson.order || 1,
                        contentUrl: lesson.contentUrl || existingVideo.contentUrl || '',
                        assetId: lesson.assetId || existingVideo.assetId || '',
                        uploadId: lesson.uploadId || existingVideo.uploadId || '',
                        status: lesson.status || existingVideo.status || 'uploading',
                        duration: lesson.duration || existingVideo.duration || 0
                    });
                    videoId = existingVideo._id.toString();
                    console.log('  ✅ [updateSectionLessonsService] Video linked successfully');
                } else {
                    console.log('  ⚠️ [updateSectionLessonsService] Video not found by playbackId, creating new');
                }
            }
            
            newVideoIds.push(videoId);
        } else if (lesson.contentType === 'material') {
            // Xử lý material: Ưu tiên materialId (từ upload), sau đó mới đến lesson._id
            const materialIdToLink = lesson.materialId || (lesson._id && !lesson._id.startsWith('temp-') ? lesson._id : null);
            
            if (materialIdToLink) {
                // Link existing material document với section
                console.log('  🔗 [updateSectionLessonsService] Linking existing material to section:', materialIdToLink);
                
                try {
                    const material = await Material.findById(materialIdToLink);
                    
                    if (material) {
                        // Update material: link với section, set isTemporary = false
                        await Material.findByIdAndUpdate(materialIdToLink, {
                            section: sectionId,
                            title: lesson.title || material.originalFilename || 'Untitled Material',
                            order: lesson.order || 1,
                            isTemporary: false // Material giờ đã được link với course
                        });
                        console.log('  ✅ [updateSectionLessonsService] Material linked successfully');
                        newMaterialIds.push(materialIdToLink);
                    } else {
                        console.log('  ⚠️ [updateSectionLessonsService] Material not found, skipping');
                    }
                } catch (error) {
                    console.error('  ❌ [updateSectionLessonsService] Error linking material:', error);
                }
            } else if (lesson.contentUrl) {
                // Legacy: Tạo material mới từ contentUrl (backward compatibility)
                console.log('  ➕ [updateSectionLessonsService] Creating new material from URL:', lesson.title);
                const newMaterial = new Material({
                    section: sectionId,
                    title: lesson.title || 'Untitled Material',
                    order: lesson.order || 1,
                    contentUrl: lesson.contentUrl,
                    isTemporary: false
                });
                const savedMaterial = await newMaterial.save();
                console.log('  ✅ [updateSectionLessonsService] Material created with ID:', savedMaterial._id);
                newMaterialIds.push(savedMaterial._id.toString());
            } else {
                console.log('  ⚠️ [updateSectionLessonsService] Skipping material without materialId or contentUrl:', lesson.title);
            }
        } else if (lesson.contentType === 'quiz') {
            if (lesson._id && !lesson._id.startsWith('temp-')) {
                // Cập nhật quiz hiện có
                console.log('  ✏️ [updateSectionLessonsService] Updating existing quiz:', lesson._id);
                await Quiz.findByIdAndUpdate(lesson._id, {
                    title: lesson.title,
                    description: lesson.description || '',
                    order: lesson.order || 1,
                    questions: lesson.questions || []
                });
                newQuizIds.push(lesson._id);
            } else {
                // Tạo quiz mới - BẤT KỂ có questions hay không
                console.log('  ➕ [updateSectionLessonsService] Creating new quiz:', lesson.title);
                const newQuiz = new Quiz({
                    section: sectionId,
                    title: lesson.title || 'Untitled Quiz',
                    description: lesson.description || '',
                    order: lesson.order || 1,
                    questions: lesson.questions || []
                });
                const savedQuiz = await newQuiz.save();
                console.log('  ✅ [updateSectionLessonsService] Quiz created with ID:', savedQuiz._id);
                newQuizIds.push(savedQuiz._id.toString());
            }
        }
    }

    // Xóa lessons không còn trong danh sách mới
    const videosToDelete = existingVideoIds.filter(id => !newVideoIds.includes(id));
    const materialsToDelete = existingMaterialIds.filter(id => !newMaterialIds.includes(id));
    const quizzesToDelete = existingQuizIds.filter(id => !newQuizIds.includes(id));

    if (videosToDelete.length > 0 || materialsToDelete.length > 0 || quizzesToDelete.length > 0) {
        console.log('🗑️ [updateSectionLessonsService] Deleting removed lessons:', {
            videos: videosToDelete.length,
            materials: materialsToDelete.length,
            quizzes: quizzesToDelete.length
        });
        
        // Xóa videos và MUX assets
        if (videosToDelete.length > 0) {
            await deleteVideosWithMuxAssets(videosToDelete);
        }
        
        await Promise.all([
            ...materialsToDelete.map(id => Material.findByIdAndDelete(id)),
            ...quizzesToDelete.map(id => Quiz.findByIdAndDelete(id))
        ]);
    }
    
    console.log('✅ [updateSectionLessonsService] Summary:', {
        totalProcessed: lessons.length,
        videosCreated: newVideoIds.length - existingVideoIds.filter(id => newVideoIds.includes(id)).length,
        materialsCreated: newMaterialIds.length - existingMaterialIds.filter(id => newMaterialIds.includes(id)).length,
        quizzesCreated: newQuizIds.length - existingQuizIds.filter(id => newQuizIds.includes(id)).length
    });
};

/**
 * Service: Delete course (MySQL + MongoDB)
 */
export const deleteCourseService = async (courseId) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Xóa từ MySQL
        await connection.query('DELETE FROM Labeling WHERE course_id = ?', [courseId]);
        await connection.query('DELETE FROM Courses WHERE course_id = ?', [courseId]);

        await connection.commit();

        // Xóa từ MongoDB
        await Course.findByIdAndDelete(courseId);
        
        // Lấy tất cả sections của course
        const sections = await Section.find({ course_id: courseId }).lean();
        const sectionIds = sections.map(s => s._id);

        // Lấy tất cả videos để xóa MUX assets
        const videos = await Video.find({ section: { $in: sectionIds } }).lean();
        const videoIds = videos.map(v => v._id);

        // Xóa videos và MUX assets
        if (videoIds.length > 0) {
            await deleteVideosWithMuxAssets(videoIds);
        }

        // Xóa materials và quizzes
        await Promise.all([
            Material.deleteMany({ section: { $in: sectionIds } }),
            Quiz.deleteMany({ section: { $in: sectionIds } })
        ]);

        // Xóa tất cả sections
        await Section.deleteMany({ course_id: courseId });

        return { success: true, message: 'Course deleted successfully' };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

/**
 * Service: Get full course data for management (bao gồm sections và lessons)
 */
export const getFullCourseDataForManagementService = async (courseId) => {
    // Lấy course từ MySQL
    const [courseRows] = await pool.query(`
        SELECT c.*, 
               lv.title as level_title,
               lg.title as language_title
        FROM Courses c 
        LEFT JOIN Levels lv ON c.lv_id = lv.lv_id
        LEFT JOIN Languages lg ON c.lang_id = lg.lang_id
        WHERE c.course_id = ?`, [courseId]);

    if (courseRows.length === 0) {
        return null;
    }

    const course = courseRows[0];
    
    // Lấy requirements và objectives từ MongoDB
    const mongoCourse = await Course.findById(courseId).lean();
    if (mongoCourse) {
        course.requirements = mongoCourse.requirements || [];
        course.objectives = mongoCourse.objectives || [];
    } else {
        course.requirements = [];
        course.objectives = [];
    }

    // Lấy categories
    const [categories] = await pool.query(`
        SELECT cat.category_id, cat.title 
        FROM Labeling l 
        JOIN Categories cat ON l.category_id = cat.category_id 
        WHERE l.course_id = ?`, [courseId]);
    
    course.categories = categories;

    // Lấy sections với full content
    const sections = await Section.find({ course_id: courseId }).sort({ order: 1 }).lean();
    
    if (sections && sections.length > 0) {
        const sectionIds = sections.map(sec => sec._id);
        
        // Lấy tất cả content
        const [videos, materials, quizzes] = await Promise.all([
            Video.find({ section: { $in: sectionIds } }).sort({ order: 1 }).lean(),
            Material.find({ section: { $in: sectionIds } }).sort({ order: 1 }).lean(),
            Quiz.find({ section: { $in: sectionIds } }).sort({ order: 1 }).lean()
        ]);

        // Gom lessons theo section
        course.sections = sections.map(section => {
            const sectionIdStr = section._id.toString();
            
            const sectionVideos = videos
                .filter(v => v.section.toString() === sectionIdStr)
                .map(v => ({
                    _id: v._id,
                    videoId: v._id,  // Thêm videoId để frontend có thể track
                    contentType: 'video',
                    title: v.title,
                    description: v.description,
                    order: v.order,
                    contentUrl: v.contentUrl,
                    playbackId: v.playbackId,
                    assetId: v.assetId,
                    uploadId: v.uploadId,
                    status: v.status,
                    duration: v.duration
                }));

            const sectionMaterials = materials
                .filter(m => m.section.toString() === sectionIdStr)
                .map(m => ({
                    _id: m._id,
                    materialId: m._id, // Add materialId để frontend có thể track và link
                    contentType: 'material',
                    title: m.title,
                    order: m.order,
                    contentUrl: m.contentUrl,
                    fileName: m.originalFilename || m.title, // Include fileName
                    publicId: m.contentUrl // publicId (same as contentUrl for Cloudinary)
                }));

            const sectionQuizzes = quizzes
                .filter(q => q.section.toString() === sectionIdStr)
                .map(q => ({
                    _id: q._id,
                    contentType: 'quiz',
                    title: q.title,
                    description: q.description,
                    order: q.order,
                    questions: q.questions
                }));

            const allLessons = [...sectionVideos, ...sectionMaterials, ...sectionQuizzes]
                .sort((a, b) => a.order - b.order);

            return {
                _id: section._id,
                title: section.title,
                order: section.order,
                lessons: allLessons
            };
        });
    } else {
        course.sections = [];
    }

    return course;
};
