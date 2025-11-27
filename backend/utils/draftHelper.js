import CourseDraft from '../models/CourseDraft.js';
import SectionDraft from '../models/SectionDraft.js';
import pool from '../config/mysql.js';
import Course from '../models/Course.js';
import Section from '../models/Section.js';
import Lesson from '../models/Lesson.js';
import Video from '../models/video.js';
import Material from '../models/Material.js';
import Quiz from '../models/Quiz.js';

/**
 * Check if a course is in approved status
 * @param {string} courseId - MySQL course_id
 * @returns {Promise<boolean>}
 */
export const isCourseApproved = async (courseId) => {
    try {
        const [courses] = await pool.query(
            'SELECT course_status FROM Courses WHERE course_id = ?',
            [courseId]
        );
        return courses[0]?.course_status === 'approved';
    } catch (error) {
        console.error('Error checking course approval status:', error);
        throw error;
    }
};

/**
 * Get existing draft for a course, or null if none exists
 * @param {string} courseId - MySQL course_id
 * @returns {Promise<CourseDraft|null>}
 */
export const getCourseDraft = async (courseId) => {
    try {
        const draft = await CourseDraft.findById(courseId);
        return draft;
    } catch (error) {
        console.error('Error getting course draft:', error);
        throw error;
    }
};

/**
 * Create course draft from published course data
 * Copies all published sections, lessons, and content to draft versions
 * @param {string} courseId - MySQL course_id
 * @param {string} userId - Clerk user ID of instructor
 * @returns {Promise<CourseDraft>}
 */
export const createDraftFromPublished = async (courseId, userId) => {
    try {
        console.log(`📋 Creating draft from published course: ${courseId}`);
        
        // Load current course data from MySQL
        const [courses] = await pool.query(
            'SELECT * FROM Courses WHERE course_id = ?',
            [courseId]
        );
        
        if (!courses || courses.length === 0) {
            throw new Error(`Course not found: ${courseId}`);
        }
        
        const course = courses[0];
        
        // Load MongoDB course data
        const mongoCourse = await Course.findById(courseId);
        
        // Load categories
        const [categories] = await pool.query(
            'SELECT category_id FROM Labeling WHERE course_id = ?',
            [courseId]
        );
        const categoryIds = categories.map(c => c.category_id);
        
        // Create draft document with courseId as _id
        const draft = new CourseDraft({
            _id: courseId, // Use courseId as _id
            title: course.title || '',
            subtitle: course.subTitle || '',
            instructors: [course.instructor_id || userId],
            description: course.des || '',
            thumbnail: course.picture_url || '',
            originalPrice: course.originalPrice || 0,
            currentPrice: course.currentPrice || 0,
            createdAt: course.createdAt || new Date(),
            updatedAt: new Date(),
            tags: categoryIds,
            level: course.lv_id || 'beginner',
            language: course.lang_id || 'vietnamese',
            hasPractice: course.has_practice || false,
            hasCertificate: course.has_certificate || false,
            requirements: mongoCourse?.requirements || [],
            objectives: mongoCourse?.objectives || [],
            sections: [], // Legacy field
            status: 'draft',
            version: (course.version || 0) + 1,
            lv_id: course.lv_id,
            lang_id: course.lang_id,
            categories: categoryIds,
            picture_url: course.picture_url,
            draftSections: [],
            draftLessons: [],
            draftVideos: [],
            draftMaterials: [],
            draftQuizzes: [],
            changeLog: new Map(),
            isAutoCreated: true
        });
        
        await draft.save();
        
        console.log(`✅ Created course draft: ${courseId}`);
        
        // Now copy published sections to draft sections
        const publishedSections = await Section.find({ course_id: courseId }).sort({ order: 1 });
        console.log(`  Found ${publishedSections.length} published sections to copy`);
        
        for (const section of publishedSections) {
            // Create section draft
            const sectionDraft = new SectionDraft({
                publishedSectionId: section._id,
                courseDraftId: courseId,
                course_id: courseId,
                title: section.title,
                order: section.order,
                status: 'draft',
                changeType: 'unchanged' // Initially unchanged
            });
            
            await sectionDraft.save();
            draft.draftSections.push(sectionDraft._id);
            
            console.log(`    ✅ Copied section: ${section.title}`);
            
            // Copy lessons for this section
            const publishedLessons = await Lesson.find({ section: section._id }).sort({ order: 1 });
            
            if (publishedLessons.length > 0) {
                const LessonDraft = (await import('../models/LessonDraft.js')).default;
                const VideoDraft = (await import('../models/VideoDraft.js')).default;
                const MaterialDraft = (await import('../models/MaterialDraft.js')).default;
                const QuizDraft = (await import('../models/QuizDraft.js')).default;
                
                for (const lesson of publishedLessons) {
                    const lessonDraft = new LessonDraft({
                        publishedLessonId: lesson._id,
                        courseDraftId: courseId,
                        draftSectionId: sectionDraft._id,
                        title: lesson.title,
                        contentType: lesson.contentType,
                        order: lesson.order,
                        description: lesson.description || '',
                        duration: lesson.duration || 0,
                        isFreePreview: lesson.isFreePreview || false,
                        status: 'draft',
                        changeType: 'unchanged'
                    });
                    
                    // Create draft copies for content based on content type
                    if (lesson.contentType === 'video' && lesson.video) {
                        // Load published video
                        const publishedVideo = await Video.findById(lesson.video);
                        if (publishedVideo) {
                            // Create draft copy
                            const videoDraft = new VideoDraft({
                                publishedVideoId: publishedVideo._id,
                                courseDraftId: courseId,
                                draftLessonId: lessonDraft._id,
                                title: publishedVideo.title || lesson.title,
                                userId: publishedVideo.userId || userId,
                                uploadId: publishedVideo.uploadId,
                                assetId: publishedVideo.assetId,
                                playbackId: publishedVideo.playbackId,
                                status: publishedVideo.status || 'ready',
                                duration: publishedVideo.duration || 0,
                                order: publishedVideo.order || 1,
                                aspectRatio: publishedVideo.aspectRatio,
                                max_resolution: publishedVideo.max_resolution,
                                description: publishedVideo.description || '',
                                changeType: 'unchanged'
                            });
                            
                            try {
                                await videoDraft.save();
                                lessonDraft.draftVideoId = videoDraft._id;
                                draft.draftVideos.push(videoDraft._id);
                                console.log(`        ✅ Created video draft: ${publishedVideo.title}`);
                            } catch (videoError) {
                                console.error(`        ❌ Failed to create video draft for lesson "${lesson.title}":`, videoError.message);
                                console.error('        Video data:', JSON.stringify({
                                    publishedVideoId: publishedVideo._id,
                                    title: publishedVideo.title,
                                    order: publishedVideo.order,
                                    userId: publishedVideo.userId
                                }, null, 2));
                                throw videoError;
                            }
                        }
                    } else if (lesson.contentType === 'material' && lesson.material) {
                        // Load published material
                        const publishedMaterial = await Material.findById(lesson.material);
                        if (publishedMaterial) {
                            // Create draft copy
                            const materialDraft = new MaterialDraft({
                                publishedMaterialId: publishedMaterial._id,
                                courseDraftId: courseId,
                                draftLessonId: lessonDraft._id,
                                title: publishedMaterial.title || lesson.title,
                                contentUrl: publishedMaterial.contentUrl,
                                order: publishedMaterial.order || 1,
                                resource_type: publishedMaterial.resource_type || 'raw',
                                originalFilename: publishedMaterial.originalFilename,
                                fileSize: publishedMaterial.fileSize,
                                changeType: 'unchanged'
                            });
                            
                            try {
                                await materialDraft.save();
                                lessonDraft.draftMaterialId = materialDraft._id;
                                draft.draftMaterials.push(materialDraft._id);
                                console.log(`        ✅ Created material draft: ${publishedMaterial.title}`);
                            } catch (materialError) {
                                console.error(`        ❌ Failed to create material draft for lesson "${lesson.title}":`, materialError.message);
                                throw materialError;
                            }
                        }
                    } else if (lesson.contentType === 'quiz' && lesson.quiz) {
                        // Load published quiz
                        const publishedQuiz = await Quiz.findById(lesson.quiz);
                        if (publishedQuiz) {
                            // Create draft copy
                            const quizDraft = new QuizDraft({
                                publishedQuizId: publishedQuiz._id,
                                courseDraftId: courseId,
                                draftLessonId: lessonDraft._id,
                                title: publishedQuiz.title || lesson.title,
                                questions: publishedQuiz.questions || [],
                                order: publishedQuiz.order || 1,
                                changeType: 'unchanged'
                            });
                            
                            try {
                                await quizDraft.save();
                                lessonDraft.draftQuizId = quizDraft._id;
                                draft.draftQuizzes.push(quizDraft._id);
                                console.log(`        ✅ Created quiz draft: ${publishedQuiz.title}`);
                            } catch (quizError) {
                                console.error(`        ❌ Failed to create quiz draft for lesson "${lesson.title}":`, quizError.message);
                                throw quizError;
                            }
                        }
                    }
                    
                    await lessonDraft.save();
                    draft.draftLessons.push(lessonDraft._id);
                    
                    console.log(`      ✅ Copied lesson: ${lesson.title} (${lesson.contentType})`);
                }
            }
        }
        
        await draft.save();
        
        console.log(`✅ Completed draft creation with ${publishedSections.length} sections`);
        
        return draft;
    } catch (error) {
        console.error('Error creating draft from published:', error);
        throw error;
    }
};

/**
 * Get or create draft for a course
 * If draft exists, return it. If not, create from published course
 * @param {string} courseId - MySQL course_id
 * @param {string} userId - Clerk user ID of instructor
 * @returns {Promise<CourseDraft>}
 */
export const getOrCreateDraft = async (courseId, userId) => {
    try {
        // Check if draft already exists
        let draft = await getCourseDraft(courseId);
        
        if (draft) {
            console.log(`📋 Using existing draft for course: ${courseId}`);
            return draft;
        }
        
        // Check if course is approved
        const isApproved = await isCourseApproved(courseId);
        
        if (!isApproved) {
            throw new Error('Cannot create draft for non-approved course');
        }
        
        // Create draft from published course
        draft = await createDraftFromPublished(courseId, userId);
        
        return draft;
    } catch (error) {
        console.error('Error getting or creating draft:', error);
        throw error;
    }
};

/**
 * Check if instructor can edit course (draft exists or course is not approved)
 * @param {string} courseId - MySQL course_id
 * @returns {Promise<{canEdit: boolean, reason?: string, hasDraft?: boolean}>}
 */
export const canEditCourse = async (courseId) => {
    try {
        const draft = await getCourseDraft(courseId);
        
        if (draft) {
            return {
                canEdit: true,
                hasDraft: true,
                status: draft.status
            };
        }
        
        const isApproved = await isCourseApproved(courseId);
        
        if (!isApproved) {
            // Course is draft or rejected - can edit directly
            return {
                canEdit: true,
                hasDraft: false
            };
        }
        
        // Course is approved but no draft exists - can create draft
        return {
            canEdit: true,
            hasDraft: false,
            needsInitialDraft: true
        };
    } catch (error) {
        console.error('Error checking edit permission:', error);
        throw error;
    }
};

/**
 * Stub function for backward compatibility - changelog removed
 * @deprecated Changelog functionality has been removed
 */
export const logChange = () => {
    // No-op: changelog functionality removed
};
