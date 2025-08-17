// import Course from '../models/Course.js';
import CourseRevision from '../models/CourseRevision.js';
// import Section from '../models/Section.js';
// import Lesson from '../models/Lesson.js';
// import User from '../models/User.js';

export const addCourseRevision = async (req, res) => {
    const { title, instructors, thumbnail, description, originalPrice, tags, sections, language, level, hasPractice, hasCertificate, requirements, objectives, subtitle, status } = req.body;
    // sections is an array of objects with title and lessons
    // lessons is an array of objects with title, content, and contentUrl, info, description
    if (!title || !instructors || !thumbnail || !description || !originalPrice || !tags || !sections || !language || !level || hasPractice === undefined || hasCertificate === undefined || !requirements || !objectives || !subtitle || !status) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        // Create new courseRevision
        const courseRevision = new CourseRevision({
            title,
            instructors,
            thumbnail,
            description,
            originalPrice,
            tags,
            sections,
            language,
            level,
            hasPractice,
            hasCertificate,
            requirements,
            objectives,
            subtitle,
            status,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        await courseRevision.save();
        res.status(201).json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

//getCourseRevisionsById
export const getCourseRevisionsById = async (req, res) => {
    const { courseId } = req.params;
    try {
        const courseRevisions = await CourseRevision.find({ _id: courseId }).lean();
        res.status(200).json(courseRevisions);

        if (!courseRevisions) {
            return res.status(404).json({ message: 'Course not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

//getCourseRevisionsByUserId
export const getCourseRevisionsByUserId = async (req, res) => {
    const { instructorId } = req.params;
    try {
        const courseRevisions = await CourseRevision.find({ instructors: instructorId }).lean();
        if (!courseRevisions || courseRevisions.length === 0) {
            return res.status(404).json({ message: 'No course revisions found for this user' });
        }
        res.status(200).json(courseRevisions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

//editCourseDraft
export const editCourseDraft = async (req, res) => {
    const { courseId } = req.params;
    const { title, instructors, thumbnail, description, originalPrice, tags, sections, language, level, hasPractice, hasCertificate, requirements, objectives, subtitle, status } = req.body;

    // Validate required fields
    if (!title || !instructors || !thumbnail || !description || !originalPrice || !tags || !sections || !language || !level || hasPractice === undefined || hasCertificate === undefined || !requirements || !objectives || !subtitle || !status) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        // Update courseRevision
        const courseRevision = await CourseRevision.findByIdAndUpdate(courseId, {
            title,
            instructors,
            thumbnail,
            description,
            originalPrice,
            tags,
            sections,
            language,
            level,
            hasPractice,
            hasCertificate,
            requirements,
            objectives,
            subtitle,
            status,
            updatedAt: new Date()
        }, { new: true });

        if (!courseRevision) {
            return res.status(404).json({ message: 'Course not found' });
        }

        res.status(200).json({ success: true, courseRevision });
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
//     "thumbnail": "https://example.com/thumbnail.jpg",
//     "description": "This course will teach you the basics of React, a popular JavaScript library for building user interfaces. You will learn how to create components, manage state, and build interactive web applications. This course is perfect for beginners who want to get started with React. You will learn how to set up a React project, create components, manage state, and build interactive user interfaces. By the end of this course, you will have a solid understanding of React and be able to build your own web applications.",
//     "originalPrice": 1000000,
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
//                     "contentType": "article",
//                     "contentUrl": "https://example.com/lesson2.pdf",
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
//                     "contentType": "quiz",
//                     "questions":[
//                         {
//                             "questionText": "What is a functional component?",
//                             "options": [
//                                 "A class-based component",
//                                 "A component defined as a function",
//                                 "A component that manages its own state"
//                             ],
//                             "correctAnswers": [1],
//                             "explanation": "Functional components are defined as JavaScript functions and do not require a class-based structure."
//                         },
//                         {
//                             "questionText": "How do you create a functional component?",
//                             "options": [
//                                 "By extending the React.Component class",
//                                 "By defining a function that returns JSX",
//                                 "By using the React.createElement method",
//                                 "By using the React.Component class"
//                             ],
//                             "correctAnswers": [1, 3],
//                             "explanation": "Functional components can be created by defining a function that returns JSX or by using the React.Component class."
//                         }
//                     ],
//                     "description": "In this lesson, we will learn about functional components and how to"
//                 }
//             ]
//         }
//     ]
// }