// import Course from '../models/Course.js';
import CourseRevision from '../models/CourseDraft.js';
import pool from '../config/mysql.js';
import Course from '../models/Course.js';
import Section from '../models/Section.js';
import Video from '../models/video.js';
import Material from '../models/Material.js';
import Quiz from '../models/Quiz.js';
import logger from '../utils/logger.js';
import { getOrCreateDraft, getCourseDraft } from '../utils/draftHelper.js';
// import Section from '../models/Section.js';
// import Lesson from '../models/Lesson.js';
// import User from '../models/User.js';

/**
 * Get or create draft for a course
 * Auto-creates draft from published if not exists
 */
export const getOrCreateCourseDraft = async (req, res) => {
    const { courseId } = req.params;
    const userId = req.auth?.userId;

    if (!courseId) {
        return res.status(400).json({ 
            success: false, 
            message: 'courseId is required' 
        });
    }

    try {
        console.log(`📝 [getOrCreateCourseDraft] Request for course: ${courseId}`);
        
        // Get or create draft
        const draft = await getOrCreateDraft(courseId, userId);

        if (!draft) {
            return res.status(500).json({
                success: false,
                message: 'Failed to get or create draft'
            });
        }

        console.log(`✅ [getOrCreateCourseDraft] Returning draft: ${draft._id} (status: ${draft.status})`);

        return res.status(200).json({
            success: true,
            hasDraft: true,
            draftStatus: draft.status,
            courseDraftId: draft._id,
            data: draft,
            message: draft.isAutoCreated ? 'Draft auto-created from published course' : 'Existing draft loaded'
        });
    } catch (error) {
        console.error('❌ [getOrCreateCourseDraft] Error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error getting or creating draft'
        });
    }
};

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
        // Find by id and return a single course revision
        const courseRevision = await CourseRevision.findById(courseId).lean();
        if (!courseRevision) {
            return res.status(404).json({ message: 'Course not found' });
        }
        // Return consistent shape expected by frontend
        res.status(200).json({ course: courseRevision, sections: courseRevision.sections || [] });
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

//editCourse
export const editCourse = async (req, res) => {
    const { courseId } = req.params;
    const updates = req.body;

    try {
        // Find existing revision
        const existing = await CourseRevision.findById(courseId);
        if (!existing) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Merge provided fields with existing values
        const fields = ['title', 'instructors', 'thumbnail', 'description', 'originalPrice', 'tags', 'sections', 'language', 'level', 'hasPractice', 'hasCertificate', 'requirements', 'objectives', 'subtitle', 'status'];
        const updatedData = {};
        fields.forEach(f => {
            if (updates[f] !== undefined) {
                updatedData[f] = updates[f];
            } else {
                updatedData[f] = existing[f];
            }
        });
        updatedData.updatedAt = new Date();

        const courseRevision = await CourseRevision.findByIdAndUpdate(courseId, updatedData, { new: true });

        res.status(200).json({ success: true, courseRevision });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

//deleteDraftCourseById
export const deleteDraftCourseById = async (req, res) => {
    const { courseId } = req.params;
    try {
        const courseRevision = await CourseRevision.findById(courseId);
        if (!courseRevision) {
            return res.status(404).json({ message: 'Course not found' });
        }
        if (courseRevision.status !== 'draft') {
            return res.status(400).json({ message: 'Only draft courses can be deleted' });
        }
        await CourseRevision.findByIdAndDelete(courseId);
        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Tạo course revision khi instructor gửi cập nhật
export const createCourseRevision = async (req, res) => {
    try {
        const { courseId } = req.params;
        const updateData = req.body;

        logger.info(`📝 [createCourseRevision] Creating revision for course: ${courseId}`);

        // Kiểm tra xem khóa học có tồn tại trong MySQL không
        const [courses] = await pool.query(
            'SELECT * FROM Courses WHERE course_id = ?',
            [courseId]
        );

        if (!courses || courses.length === 0) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        const course = courses[0];

        // Kiểm tra xem đã có revision pending nào chưa
        const existingRevision = await CourseRevision.findOne({
            courseId: courseId,
            status: 'pending'
        });

        if (existingRevision) {
            logger.warn(`⚠️ [createCourseRevision] Pending revision already exists for course: ${courseId}`);
            return res.status(400).json({ 
                success: false, 
                message: 'A pending revision already exists for this course' 
            });
        }

        // Tạo revision mới với status 'pending'
        const revision = new CourseRevision({
            courseId: courseId,
            title: updateData.title,
            subtitle: updateData.subTitle,
            instructors: [updateData.instructor_id],
            description: updateData.des,
            thumbnail: updateData.picture_url || course.picture_url,
            originalPrice: updateData.originalPrice,
            currentPrice: updateData.currentPrice,
            tags: updateData.categories || [],
            level: updateData.level || 'beginner',
            language: updateData.language || 'vietnamese',
            hasPractice: updateData.has_practice || false,
            hasCertificate: updateData.has_certificate || false,
            requirements: updateData.requirements,
            objectives: updateData.objectives,
            sections: updateData.sections || [],
            status: 'pending',
            version: (course.version || 0) + 1,
            lv_id: updateData.lv_id,
            lang_id: updateData.lang_id,
            categories: updateData.categories,
            picture_url: updateData.picture_url,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        await revision.save();

        logger.info(`✅ [createCourseRevision] Revision created successfully: ${revision._id}`);

        res.status(201).json({ 
            success: true, 
            message: 'Course revision created and pending approval',
            revisionId: revision._id
        });
    } catch (error) {
        logger.error('❌ [createCourseRevision] Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Lấy pending revisions cho admin
export const getPendingRevisions = async (req, res) => {
    try {
        const revisions = await CourseRevision.find({ status: 'pending' })
            .sort({ createdAt: -1 })
            .lean();

        // Lấy thông tin khóa học từ MySQL cho mỗi revision
        const revisionsWithCourseInfo = await Promise.all(
            revisions.map(async (revision) => {
                const [courses] = await pool.query(
                    'SELECT course_id, title, course_status FROM Courses WHERE course_id = ?',
                    [revision.courseId]
                );

                return {
                    ...revision,
                    currentCourseStatus: courses[0]?.course_status || null,
                    currentCourseTitle: courses[0]?.title || null
                };
            })
        );

        res.status(200).json({
            success: true,
            revisions: revisionsWithCourseInfo
        });
    } catch (error) {
        logger.error('❌ [getPendingRevisions] Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Approve revision - cập nhật course chính
export const approveRevision = async (req, res) => {
    try {
        const { revisionId } = req.params;

        logger.info(`✅ [approveRevision] Approving revision: ${revisionId}`);

        const revision = await CourseRevision.findById(revisionId);

        if (!revision) {
            return res.status(404).json({ success: false, message: 'Revision not found' });
        }

        if (revision.status !== 'pending') {
            return res.status(400).json({ 
                success: false, 
                message: 'Only pending revisions can be approved' 
            });
        }

        const courseId = revision.courseId;

        // Cập nhật MySQL
        await pool.query(
            `UPDATE Courses SET 
                title = ?,
                subTitle = ?,
                des = ?,
                originalPrice = ?,
                currentPrice = ?,
                lv_id = ?,
                lang_id = ?,
                has_practice = ?,
                has_certificate = ?,
                picture_url = ?
            WHERE course_id = ?`,
            [
                revision.title,
                revision.subtitle,
                revision.description,
                revision.originalPrice,
                revision.currentPrice,
                revision.lv_id,
                revision.lang_id,
                revision.hasPractice,
                revision.hasCertificate,
                revision.picture_url,
                courseId
            ]
        );

        // Cập nhật MongoDB Course document
        await Course.findByIdAndUpdate(courseId, {
            requirements: revision.requirements,
            objectives: revision.objectives
        });

        // Cập nhật categories
        if (revision.categories && revision.categories.length > 0) {
            // Import Labeling model nếu chưa có
            const { default: Labeling } = await import('../models/Labeling.js');
            
            // Xóa categories cũ
            await Labeling.deleteMany({ course_id: courseId });
            
            // Thêm categories mới
            const labelings = revision.categories.map(catId => ({
                category_id: catId,
                course_id: courseId
            }));
            
            if (labelings.length > 0) {
                await Labeling.insertMany(labelings);
            }
        }

        // Cập nhật sections trong MongoDB
        if (revision.sections && revision.sections.length > 0) {
            // Lấy danh sách sections cũ trước khi xóa
            const oldSections = await Section.find({ course_id: courseId }).lean();
            
            logger.info(`📦 [approveRevision] Found ${oldSections.length} old sections to replace`);
            
            // Xóa sections cũ
            await Section.deleteMany({ course_id: courseId });

            // Tạo sections mới từ revision và cập nhật lesson references
            for (const sectionData of revision.sections) {
                // Tạo section mới
                const newSection = new Section({
                    course_id: courseId,
                    title: sectionData.title,
                    order: sectionData.order,
                    lessons: sectionData.lessons || []
                });
                await newSection.save();

                logger.info(`📝 [approveRevision] Created new section: ${newSection._id}, title: "${newSection.title}", with ${sectionData.lessons?.length || 0} lessons`);

                // Cập nhật section reference trong các lessons
                if (sectionData.lessons && sectionData.lessons.length > 0) {
                    for (const lesson of sectionData.lessons) {
                        try {
                            if (lesson.contentType === 'video') {
                                // Tìm videoId: ưu tiên videoId explicit, fallback sang _id
                                const videoId = lesson.videoId || lesson._id;
                                if (videoId) {
                                    const updateResult = await Video.findByIdAndUpdate(
                                        videoId,
                                        { 
                                            section: newSection._id.toString(),
                                            title: lesson.title || 'Untitled Video',
                                            order: lesson.order || 1
                                        },
                                        { new: false }
                                    );
                                    if (updateResult) {
                                        logger.info(`  ✅ Updated video "${lesson.title}" (${videoId}) to new section ${newSection._id}`);
                                    } else {
                                        logger.warn(`  ⚠️ Video ${videoId} not found for lesson "${lesson.title}"`);
                                    }
                                }
                            } else if (lesson.contentType === 'material') {
                                const materialId = lesson.materialId || lesson._id;
                                if (materialId) {
                                    const updateResult = await Material.findByIdAndUpdate(
                                        materialId,
                                        { 
                                            section: newSection._id.toString(),
                                            title: lesson.title || 'Untitled Material',
                                            order: lesson.order || 1
                                        },
                                        { new: false }
                                    );
                                    if (updateResult) {
                                        logger.info(`  ✅ Updated material "${lesson.title}" (${materialId}) to new section ${newSection._id}`);
                                    } else {
                                        logger.warn(`  ⚠️ Material ${materialId} not found for lesson "${lesson.title}"`);
                                    }
                                }
                            } else if (lesson.contentType === 'quiz') {
                                const quizId = lesson._id;
                                if (quizId && !quizId.startsWith('temp-')) {
                                    // Cập nhật quiz hiện có
                                    const updateResult = await Quiz.findByIdAndUpdate(
                                        quizId,
                                        { 
                                            section: newSection._id.toString(),
                                            title: lesson.title || 'Untitled Quiz',
                                            description: lesson.description || '',
                                            order: lesson.order || 1,
                                            questions: lesson.questions || []
                                        },
                                        { new: false }
                                    );
                                    if (updateResult) {
                                        logger.info(`  ✅ Updated quiz "${lesson.title}" (${quizId}) to new section ${newSection._id}`);
                                    } else {
                                        logger.warn(`  ⚠️ Quiz ${quizId} not found for lesson "${lesson.title}"`);
                                    }
                                } else if (!quizId || quizId.startsWith('temp-')) {
                                    // Tạo quiz mới nếu là temp ID hoặc không có ID
                                    const newQuiz = new Quiz({
                                        section: newSection._id.toString(),
                                        title: lesson.title || 'Untitled Quiz',
                                        description: lesson.description || '',
                                        order: lesson.order || 1,
                                        questions: lesson.questions || []
                                    });
                                    const savedQuiz = await newQuiz.save();
                                    logger.info(`  ✅ Created new quiz "${lesson.title}" (${savedQuiz._id}) in section ${newSection._id}`);
                                }
                            }
                        } catch (lessonError) {
                            logger.error(`  ❌ Error updating lesson "${lesson.title}":`, lessonError);
                        }
                    }
                }
            }

            logger.info(`✅ [approveRevision] All sections and lessons updated successfully`);
        }

        // Cập nhật status của revision thành 'approved'
        revision.status = 'approved';
        revision.updatedAt = new Date();
        await revision.save();

        logger.info(`✅ [approveRevision] Revision approved and course updated: ${courseId}`);

        res.status(200).json({ 
            success: true, 
            message: 'Revision approved and course updated successfully' 
        });
    } catch (error) {
        logger.error('❌ [approveRevision] Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Reject revision
export const rejectRevision = async (req, res) => {
    try {
        const { revisionId } = req.params;
        const { reason } = req.body;

        logger.info(`❌ [rejectRevision] Rejecting revision: ${revisionId}`);

        const revision = await CourseRevision.findById(revisionId);

        if (!revision) {
            return res.status(404).json({ success: false, message: 'Revision not found' });
        }

        if (revision.status !== 'pending') {
            return res.status(400).json({ 
                success: false, 
                message: 'Only pending revisions can be rejected' 
            });
        }

        // Cập nhật status của revision thành 'rejected'
        revision.status = 'rejected';
        revision.rejectionReason = reason || 'No reason provided';
        revision.updatedAt = new Date();
        await revision.save();

        logger.info(`✅ [rejectRevision] Revision rejected: ${revisionId}`);

        res.status(200).json({ 
            success: true, 
            message: 'Revision rejected successfully' 
        });
    } catch (error) {
        logger.error('❌ [rejectRevision] Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Kiểm tra xem khóa học có revision pending không
export const checkPendingRevision = async (req, res) => {
    try {
        const { courseId } = req.params;

        const revision = await CourseRevision.findOne({
            courseId: courseId,
            status: 'pending'
        });

        res.status(200).json({
            success: true,
            hasPendingRevision: !!revision,
            revision: revision || null
        });
    } catch (error) {
        logger.error('❌ [checkPendingRevision] Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
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