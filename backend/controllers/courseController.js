import Course from '../models/Course.js';
import Section from '../models/Section.js';
import Lesson from '../models/Lesson.js';
import User from '../models/User.js';

//get course by ID
export const getCourseById = async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const course = await Course.findById(courseId);
        
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        
        res.status(200).json(course);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

//find course by title, tag, sort (by rating, price, most relevant, newest), level, language, price (free, paid, under 500k, from 500k to 1M, above 1M), hasPractice (boolean) by prac, hasCertificate(boolean) by cert
// limit to 12 results each page
export const getCourse = async (req, res) => {
    const { title = '', tag, sort, page = 1, level, language, price, prac, cert } = req.query;
    const limit = 12;
    const skip = (page - 1) * limit;

    try {
        let keywords = title.trim().split('-').filter(Boolean);
        let query = {};

        // Tìm các khóa học có ít nhất 1 từ trùng trong slug_title
        if (keywords.length > 0) {
            query.slug_title = {
                $regex: keywords.join('|'), // React|Javascript
                $options: 'i' // không phân biệt hoa thường
            };
        }

        if (prac !== undefined) {
            query.hasPractice = prac === 'true'; // convert string to boolean
        }
        if (cert !== undefined) {
            query.hasCertificate = cert === 'true'; // convert string to boolean
        }

        if (tag) {
            //tag và tags là mảng, tìm các khóa học có tất cả các tag trong mảng tag
            query.tags = { $all: tag.split(',') }; // ví dụ: tag=react,javascript
        }
        if (level && level !== 'all') {
            query.level = level; // ví dụ: level=beginner
        }
        if (language) {
            query.language = language; // ví dụ: language=vietnamese
        }
        if (price) {
            switch (price) {
                case 'free':
                    query.currentPrice = 0; // khóa học miễn phí
                    break;
                case 'paid':
                    query.currentPrice = { $gt: 0 }; // khóa học có phí
                    break;
                case 'under-500k':
                    query.currentPrice = { $lt: 500000 }; // khóa học dưới 500k
                    break;
                case '500k-1m':
                    query.currentPrice = { $gte: 500000, $lte: 1000000 }; // khóa học từ 500k đến 1M
                    break;
                case 'over-1m':
                    query.currentPrice = { $gt: 1000000 }; // khóa học trên 1M
                    break;
                default:
                    break;
            }
        }

        let courses = await Course.find(query).skip(skip).limit(limit);

        // Tính độ trùng (số từ khớp trong title)
        courses = courses.map(course => {
            const titleText = course.title.toLowerCase();
            let score = 0;
            for (const word of keywords) {
                if (titleText.includes(word.toLowerCase())) {
                    score++;
                }
            }
            return { course, score };
        });

        // Sắp xếp theo điểm khớp
        courses.sort((a, b) => b.score - a.score);

        // if (tag) {
        //     query.tags = tag; // assuming tags is an array
        // }

        // let courses = await Course.find(query).skip(skip).limit(limit);

        // Sorting logic (default to most relevant)
        if (sort) {
            switch (sort) {
                case 'rating':
                    courses.sort((a, b) => b.course.rating - a.course.rating);
                    break;
                case 'price-asc':
                    courses.sort((a, b) => a.course.currentPrice - b.course.currentPrice);
                    break;
                case 'price-desc':
                    courses.sort((a, b) => b.course.currentPrice - a.course.currentPrice);
                    break;
                case 'newest':
                    courses.sort((a, b) => new Date(b.course.createdAt) - new Date(a.course.createdAt));
                    break;
                default:
                    // most relevant (already sorted by score above)
                    break;
            }
        }
        // lấy thông tin các Instructor dựa trên id trong mảng instructor
        const instructorIds = courses.map(c => c.course.instructors).flat();
        const instructors = await User.find({ _id: { $in: instructorIds } }).lean();
        // Gắn thông tin instructor vào từng course
        courses = courses.map(c => {
            const courseData = c.course;
            courseData.instructors = instructors.filter(instructor => courseData.instructors.includes(instructor._id)).map(instructor => ({
                fullName: instructor.fullName,
            }));
            return courseData;
        });
        res.status(200).json(courses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Function to convert title to slug, removing spaces and converting to lowercase, replacing Vietnamese characters
const convertToSlug = (title) => {
    return title
        .toLowerCase()
        .replace(/ /g, '-') // replace spaces with dashes
        .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a') // replace Vietnamese characters
        .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
        .replace(/[ìíịỉĩ]/g, 'i')
        .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
        .replace(/[ùúụủũưừứựửữ]/g, 'u')
        .replace(/[ỳýỵỷỹ]/g, 'y')
        .replace(/[^a-z0-9-]/g, '') // remove any non-alphanumeric characters except dashes
        .replace(/--+/g, '-') // replace multiple dashes with a single dash
        .trim('-'); // trim dashes from the start and end
};


export const addCourse = async (req, res) => {
    const { title, instructors, rating, reviewCount, enrollmentCount, thumbnail, description, originalPrice, currentPrice, tags, sections, language, level, hasPractice, hasCertificate, requirements, objectives, subtitle } = req.body;
    // sections is an array of objects with title and lessons
    // lessons is an array of objects with title, content, and contentUrl, info, description
    // after creating course, create sections and lessons
    if (!title || !instructors || !thumbnail || !description || !originalPrice || !currentPrice || !tags || !sections || !language || !level || hasPractice === undefined || hasCertificate === undefined || !requirements || !objectives || !subtitle) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const newCourse = new Course({
            title,
            slug_title: convertToSlug(title),
            instructors,
            rating,
            reviewCount,
            thumbnail,
            description,
            originalPrice,
            currentPrice,
            tags,
            createdAt: new Date(),
            updatedAt: new Date(),
            language,
            level,
            hasPractice,
            hasCertificate,
            requirements,
            objectives,
            subtitle
        });

        await newCourse.save();
        // Now create sections through sectionController and lessons through lessonController
        for (const section of sections) {
            const newSection = await Section.create({
                course: newCourse._id,
                title: section.title,
            });

            for (const lesson of section.lessons) {
                await Lesson.create({
                    section: newSection._id,
                    title: lesson.title,
                    contentType: lesson.contentType,
                    contentUrl: lesson.contentUrl,
                    info: lesson.info,
                    description: lesson.description,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }
        }
        res.status(201).json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Lấy toàn bộ nội dung course (course, sections, lessons) theo courseId
export const getFullCourseContent = async (req, res) => {
    const { courseId } = req.params;
    try {
        // Lấy course
        const course = await Course.findById(courseId).lean();
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        // lấy thông tin các Instructor dựa trên id trong mảng instructor
        const instructors = await User.find({ _id: { $in: course.instructors } }).lean();
        course.instructors = instructors.map(instructor => ({
            _id: instructor._id,
            fullName: instructor.fullName,
            avaUrl: instructor.avaUrl, // include avaUrl if available
            headline: instructor.headline || '', // include headline if available
        }));

        // Lấy sections thuộc course
        const sections = await Section.find({ course: courseId }).lean();
        // bỏ qua các trường course
        sections.forEach(section => {
            section.course = undefined; // remove course field to avoid circular reference
        });

        // Lấy lessons cho từng section
        const sectionIds = sections.map(sec => sec._id);
        const lessons = await Lesson.find({ section: { $in: sectionIds } }).lean();
        // bỏ qua các trường contentUrl, description
        lessons.forEach(lesson => {
            lesson.contentUrl = undefined; // remove contentUrl
            lesson.description = undefined; // remove description
        });

        // Gắn lessons vào từng section
        const sectionsWithLessons = sections.map(section => ({
            ...section,
            lessons: lessons.filter(lesson => lesson.section.toString() === section._id.toString())
        }));

        // Trả về course, sections (có lessons)
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