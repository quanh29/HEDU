import pool from '../config/mysql.js';
import { v4 as uuidv4 } from 'uuid';
// Giữ lại các model Mongoose cho các controller khác
import Section from '../models/Section.js';
import Lesson from '../models/Lesson.js';
import User from '../models/User.js';

//get course by ID
export const getCourseById = async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const [rows] = await pool.query('SELECT * FROM Courses WHERE course_id = ?', [courseId]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Course not found' });
        }
        
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

//find course by title, category, tag, sort (by rating, price, most relevant, newest), level, language, price (free, paid, under 500k, from 500k to 1M, above 1M), hasPractice (boolean) by prac, hasCertificate(boolean) by cert
// limit to 12 results each page
export const getCourse = async (req, res) => {
    const { title = '', category, tag, sort, page = 1, level, language, price, prac, cert } = req.query;
    const limit = 12;
    const offset = (page - 1) * limit;

    try {
        let query = 'SELECT DISTINCT c.*, u.fName, u.lName FROM Courses c JOIN Users u ON c.instructor_id = u.user_id';
        let whereClauses = [];
        let params = [];
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
    const { title, subTitle, des, originalPrice, currentPrice, instructor_id, lv_id, lang_id, has_practice, has_certificate, picture_url } = req.body;

    if (!title || !subTitle || !originalPrice || !currentPrice || !instructor_id) {
        return res.status(400).json({ message: 'Required fields are missing' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const course_id = uuidv4();
        const courseQuery = `INSERT INTO Courses (course_id, title, subTitle, des, originalPrice, currentPrice, instructor_id, lv_id, lang_id, has_practice, has_certificate, picture_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        await connection.query(courseQuery, [course_id, title, subTitle, des, originalPrice, currentPrice, instructor_id, lv_id, lang_id, has_practice, has_certificate, picture_url]);

        // As per instructions, section/lesson creation will remain with MongoDB for now.
        // This part is commented out as it requires other controllers to be updated.
        /*
        for (const section of sections) {
            const newSection = await Section.create({
                course: newCourse._id, // This would be the mongo ID, needs adjustment
                title: section.title,
            });

            for (const lesson of section.lessons) {
                await Lesson.create({
                    section: newSection._id,
                    title: lesson.title,
                    ...
                });
            }
        }
        */

        await connection.commit();
        res.status(201).json({ success: true, course_id: course_id });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        connection.release();
    }
};

// Lấy toàn bộ nội dung course (course, sections, lessons) theo courseId
export const getFullCourseContent = async (req, res) => {
    const { courseId } = req.params;
    try {
        // Lấy course từ MySQL
        const [courseRows] = await pool.query(`
            SELECT c.*, u.user_id as instructor_user_id, u.fName, u.lName, u.ava as avaUrl, u.headline 
            FROM Courses c 
            JOIN Users u ON c.instructor_id = u.user_id 
            WHERE c.course_id = ?`, [courseId]);

        if (courseRows.length === 0) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const course = courseRows[0];
        // Định dạng instructor info
        course.instructors = [{
            _id: course.instructor_user_id, // Giữ _id để tương thích frontend nếu cần
            fullName: `${course.fName} ${course.lName}`,
            avaUrl: course.avaUrl,
            headline: course.headline || '',
        }];


        // Lấy sections và lessons từ MongoDB (tạm thời)
        // Cần một trường trong bảng Courses của MySQL để ánh xạ với _id của Course trong MongoDB
        // Giả sử chúng ta có `mongo_course_id` trong bảng Courses
        // Hoặc chúng ta tìm Course trong Mongo bằng title hoặc slug_title
        const mongoCourse = await Course.findOne({ title: course.title }).lean(); // Tìm bằng title, không lý tưởng
        if (!mongoCourse) {
             return res.status(200).json({
                course,
                sections: [] // Không tìm thấy course tương ứng trong Mongo
            });
        }

        const sections = await Section.find({ course: mongoCourse._id }).lean();
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