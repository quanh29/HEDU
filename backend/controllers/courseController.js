import pool from '../config/mysql.js';
import { v4 as uuidv4 } from 'uuid';
// Giữ lại Course model cho requirements và objectives
import Course from '../models/Course.js';
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

// Lấy toàn bộ nội dung course (course, sections, lessons) theo courseId
// Chỉ hiển thị khóa học đã được duyệt (approved)
export const getFullCourseContent = async (req, res) => {
    const { courseId } = req.params;
    try {
        // Lấy course từ MySQL - chỉ lấy khóa học đã duyệt
        const [courseRows] = await pool.query(`
            SELECT c.*, u.user_id as instructor_user_id, u.fName, u.lName, u.ava as avaUrl, u.headline 
            FROM Courses c 
            JOIN Users u ON c.instructor_id = u.user_id 
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
        
        // Định dạng instructor info
        course.instructors = [{
            _id: course.instructor_user_id,
            fullName: `${course.fName} ${course.lName}`,
            avaUrl: course.avaUrl,
            headline: course.headline || '',
        }];

        // Lấy sections và lessons từ MongoDB
        const sections = await Section.find({ course_id: courseId }).lean();
        const sectionIds = sections.map(sec => sec._id);
        const lessons = await Lesson.find({ section: { $in: sectionIds } }).lean();
        
        lessons.forEach(lesson => {
            lesson.contentUrl = undefined;
            lesson.description = undefined;
        });

        const sectionsWithLessons = sections.map(section => ({
            ...section,
            lessons: lessons.filter(lesson => lesson.section.toString() === section._id.toString())
        }));

        res.status(200).json({
            course,
            sections: sectionsWithLessons
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

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

// example of how to create a course
// {
//     "title": "React for Beginners",
//     "subtitle": "Learn React from scratch",
//     "instructors": [
//         "userId1",
//         "userId2"
//     ],
//     "rating": 4.5,
//     "reviewCount": 100,
//     "thumbnail": "https://example.com/thumbnail.jpg",
//     "description": "This course will teach you the basics of React, a popular JavaScript library for building user interfaces. You will learn how to create components, manage state, and build interactive web applications. This course is perfect for beginners who want to get started with React. You will learn how to set up a React project, create components, manage state, and build interactive user interfaces. By the end of this course, you will have a solid understanding of React and be able to build your own web applications.",
//     "originalPrice": 1000000,
//     "currentPrice": 500000,
//     "requirements": [
//         "Basic knowledge of JavaScript",
//         "Familiarity with HTML and CSS"
//     ],
//     "objectives": [
//         "Understand the basics of React",
//         "Build interactive user interfaces",
//         "Learn about components and state management"
//     ],
//     "tags": [
//         "react",
//         "javascript",
//         "frontend",
//         "web dev"
//     ],
//     "level": "beginner",
//     "language": "english",
//     "hasPractice": true,
//     "hasCertificate": false,
//     "sections": [
//         {
//             "title": "Introduction to React",
//             "lessons": [
//                 {
//                     "title": "What is React?",
//                     "contentType": "video",
//                     "contentUrl": "https://example.com/lesson1.mp4",
//                     "info": 1,
//                     "description": "In this lesson, we will learn what React is and why it is used."
//                 },
//                 {
//                     "title": "Setting up React",
//                     "contentType": "In this lesson, we will learn how to set up a React",
//                     "contentUrl": "https://example.com/lesson2.mp4",
//                     "info": 2,
//                     "description": "We will set up a React project using Create React App."
//                 }
//             ]
//         },
//         {
//             "title": "React Components",
//             "lessons": [
//                 {
//                     "title": "Functional Components",
//                     "contentType": "Functional components are the simplest way to write React components.",
//                     "contentUrl": "https://example.com/lesson3.mp4",
//                     "info": 3,
//                     "description": "In this lesson, we will learn about functional components and how to"
//                 }
//             ]
//         }
//     ]
// }