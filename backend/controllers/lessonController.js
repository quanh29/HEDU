import Lesson from '../models/Lesson.js';
import Section from '../models/Section.js';
import Video from '../models/video.js';
import Material from '../models/Material.js';
import Quiz from '../models/Quiz.js';

/**
 * Create a new lesson
 * POST /api/lesson
 */
export const createLesson = async (req, res) => {
    try {
        const { sectionId, title, contentType, order, description, isFreePreview } = req.body;

        // Validate required fields
        if (!sectionId || !title || !contentType) {
            return res.status(400).json({
                success: false,
                message: 'Section ID, title, and content type are required'
            });
        }

        // Verify section exists
        const section = await Section.findById(sectionId);
        if (!section) {
            return res.status(404).json({
                success: false,
                message: 'Section not found'
            });
        }

        // Validate contentType
        if (!['video', 'material', 'quiz'].includes(contentType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid content type. Must be: video, material, or quiz'
            });
        }

        // Get the next order number if not provided
        let lessonOrder = order;
        if (lessonOrder === undefined) {
            const lastLesson = await Lesson.findOne({ section: sectionId })
                .sort({ order: -1 });
            lessonOrder = lastLesson ? lastLesson.order + 1 : 0;
        }

        // Create the lesson
        const lesson = new Lesson({
            section: sectionId,
            title,
            contentType,
            order: lessonOrder,
            description: description || '',
            isFreePreview: isFreePreview || false
        });

        await lesson.save();

        console.log(`✅ Created lesson: ${lesson._id}, type: ${contentType}`);

        res.status(201).json({
            success: true,
            message: 'Lesson created successfully',
            data: lesson
        });
    } catch (error) {
        console.error('Error creating lesson:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create lesson',
            error: error.message
        });
    }
};

/**
 * Get lesson by ID
 * GET /api/lesson/:lessonId
 */
export const getLessonById = async (req, res) => {
    try {
        const { lessonId } = req.params;

        const lesson = await Lesson.findById(lessonId)
            .populate('video')
            .populate('material')
            .populate('quiz');

        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: 'Lesson not found'
            });
        }

        res.status(200).json({
            success: true,
            data: lesson
        });
    } catch (error) {
        console.error('Error getting lesson:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get lesson',
            error: error.message
        });
    }
};

/**
 * Get all lessons for a section
 * GET /api/lesson/section/:sectionId
 */
export const getLessonsBySection = async (req, res) => {
    try {
        const { sectionId } = req.params;

        const lessons = await Lesson.getLessonsForSection(sectionId);

        res.status(200).json({
            success: true,
            data: lessons
        });
    } catch (error) {
        console.error('Error getting lessons:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get lessons',
            error: error.message
        });
    }
};

/**
 * Update lesson
 * PUT /api/lesson/:lessonId
 */
export const updateLesson = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const { title, description, order, isFreePreview, contentType, video, material, quiz } = req.body;

        const lesson = await Lesson.findById(lessonId);
        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: 'Lesson not found'
            });
        }

        // Update fields
        if (title !== undefined) lesson.title = title;
        if (description !== undefined) lesson.description = description;
        if (order !== undefined) lesson.order = order;
        if (isFreePreview !== undefined) lesson.isFreePreview = isFreePreview;
        
        // Update content references
        if (video !== undefined) lesson.video = video;
        if (material !== undefined) lesson.material = material;
        if (quiz !== undefined) lesson.quiz = quiz;
        
        // Handle content type change (requires manual content migration)
        if (contentType !== undefined && contentType !== lesson.contentType) {
            console.warn(`⚠️ Changing content type from ${lesson.contentType} to ${contentType} for lesson ${lessonId}`);
            lesson.contentType = contentType;
            // Clear old content references if contentType changed
            if (contentType !== 'video') lesson.video = null;
            if (contentType !== 'material') lesson.material = null;
            if (contentType !== 'quiz') lesson.quiz = null;
        }

        await lesson.save();

        console.log(`✅ Updated lesson: ${lessonId}`);

        res.status(200).json({
            success: true,
            message: 'Lesson updated successfully',
            data: lesson
        });
    } catch (error) {
        console.error('Error updating lesson:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update lesson',
            error: error.message
        });
    }
};

/**
 * Link content to lesson
 * PUT /api/lesson/:lessonId/content
 */
export const linkContentToLesson = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const { contentId } = req.body;

        const lesson = await Lesson.findById(lessonId);
        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: 'Lesson not found'
            });
        }

        // Link content based on content type
        switch (lesson.contentType) {
            case 'video':
                const video = await Video.findById(contentId);
                if (!video) {
                    return res.status(404).json({
                        success: false,
                        message: 'Video not found'
                    });
                }
                lesson.video = contentId;
                // Update video's lesson reference
                video.lesson = lessonId;
                await video.save();
                break;
            
            case 'material':
                const material = await Material.findById(contentId);
                if (!material) {
                    return res.status(404).json({
                        success: false,
                        message: 'Material not found'
                    });
                }
                lesson.material = contentId;
                // Update material's lesson reference
                material.lesson = lessonId;
                await material.save();
                break;
            
            case 'quiz':
                const quiz = await Quiz.findById(contentId);
                if (!quiz) {
                    return res.status(404).json({
                        success: false,
                        message: 'Quiz not found'
                    });
                }
                lesson.quiz = contentId;
                // Update quiz's lesson reference
                quiz.lesson = lessonId;
                await quiz.save();
                break;
            
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid content type'
                });
        }

        await lesson.save();

        console.log(`✅ Linked ${lesson.contentType} ${contentId} to lesson ${lessonId}`);

        res.status(200).json({
            success: true,
            message: 'Content linked to lesson successfully',
            data: lesson
        });
    } catch (error) {
        console.error('Error linking content to lesson:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to link content to lesson',
            error: error.message
        });
    }
};

/**
 * Delete lesson (cascade deletes content)
 * DELETE /api/lesson/:lessonId
 */
export const deleteLesson = async (req, res) => {
    try {
        const { lessonId } = req.params;

        const lesson = await Lesson.findById(lessonId);
        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: 'Lesson not found'
            });
        }

        // Delete associated content before deleting lesson
        if (lesson.contentType === 'video' && lesson.video) {
            await Video.findByIdAndDelete(lesson.video);
            console.log(`   ✅ Deleted video: ${lesson.video}`);
        } else if (lesson.contentType === 'material' && lesson.material) {
            await Material.findByIdAndDelete(lesson.material);
            console.log(`   ✅ Deleted material: ${lesson.material}`);
        } else if (lesson.contentType === 'quiz' && lesson.quiz) {
            await Quiz.findByIdAndDelete(lesson.quiz);
            console.log(`   ✅ Deleted quiz: ${lesson.quiz}`);
        }

        // Delete the lesson
        await Lesson.findByIdAndDelete(lessonId);

        console.log(`✅ Deleted lesson: ${lessonId}`);

        res.status(200).json({
            success: true,
            message: 'Lesson and associated content deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting lesson:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete lesson',
            error: error.message
        });
    }
};

/**
 * Reorder lessons in a section
 * PUT /api/lesson/reorder
 */
export const reorderLessons = async (req, res) => {
    try {
        const { lessons } = req.body; // Array of { lessonId, order }

        if (!Array.isArray(lessons)) {
            return res.status(400).json({
                success: false,
                message: 'Lessons must be an array'
            });
        }

        // Update each lesson's order
        const updatePromises = lessons.map(({ lessonId, order }) =>
            Lesson.findByIdAndUpdate(lessonId, { order }, { new: true })
        );

        await Promise.all(updatePromises);

        console.log(`✅ Reordered ${lessons.length} lessons`);

        res.status(200).json({
            success: true,
            message: 'Lessons reordered successfully'
        });
    } catch (error) {
        console.error('Error reordering lessons:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reorder lessons',
            error: error.message
        });
    }
};
