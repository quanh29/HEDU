import Lesson from '../models/Lesson.js';
import LessonDraft from '../models/LessonDraft.js';
import Section from '../models/Section.js';
import SectionDraft from '../models/SectionDraft.js';
import Video from '../models/video.js';
import Material from '../models/Material.js';
import Quiz from '../models/Quiz.js';
import { isCourseApproved, getOrCreateDraft } from '../utils/draftHelper.js';
import mongoose from 'mongoose';

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

        // Validate contentType
        if (!['video', 'material', 'quiz'].includes(contentType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid content type. Must be: video, material, or quiz'
            });
        }

        // Check if this is a draft section or published section
        const draftSection = await SectionDraft.findById(sectionId);
        const section = await Section.findById(sectionId);

        if (draftSection) {
            // Working with draft section - create LessonDraft
            const draft = await mongoose.model('CourseDraft').findById(draftSection.courseDraftId);

            // Get the next order number if not provided
            let lessonOrder = order;
            if (lessonOrder === undefined) {
                const lastLesson = await LessonDraft.findOne({ draftSectionId: sectionId })
                    .sort({ order: -1 });
                lessonOrder = lastLesson ? lastLesson.order + 1 : 0;
            }

            const draftLesson = new LessonDraft({
                publishedLessonId: null,
                courseDraftId: draft._id,
                draftSectionId: draftSection._id,
                title: title,
                contentType: contentType,
                order: lessonOrder,
                description: description || '',
                isFreePreview: isFreePreview || false,
                status: 'draft',
                changeType: 'new'
            });

            await draftLesson.save();

            draft.draftLessons.push(draftLesson._id);
            await draft.save();

            console.log(`✅ Created draft lesson: ${draftLesson._id} in draft section: ${draftSection._id}`);

            return res.status(201).json({
                success: true,
                isDraft: true,
                message: 'Draft lesson created successfully',
                data: draftLesson
            });
        } else if (section) {
            // Check if course is approved
            const isApproved = await isCourseApproved(section.course_id);

            if (isApproved) {
                // Create draft lesson for approved course
                const draft = await getOrCreateDraft(section.course_id, req.auth?.userId);

                // Ensure section has a draft
                let sectionDraft = await SectionDraft.findOne({
                    publishedSectionId: section._id,
                    courseDraftId: draft._id
                });

                if (!sectionDraft) {
                    // Create section draft (unchanged, just container for new lesson)
                    sectionDraft = new SectionDraft({
                        publishedSectionId: section._id,
                        courseDraftId: draft._id,
                        course_id: section.course_id,
                        title: section.title,
                        order: section.order,
                        status: 'draft',
                        changeType: 'unchanged'
                    });
                    await sectionDraft.save();
                    draft.draftSections.push(sectionDraft._id);
                    await draft.save();
                }

                // Get the next order number if not provided
                let lessonOrder = order;
                if (lessonOrder === undefined) {
                    const lastLesson = await LessonDraft.findOne({ draftSectionId: sectionDraft._id })
                        .sort({ order: -1 });
                    lessonOrder = lastLesson ? lastLesson.order + 1 : 0;
                }

                const draftLesson = new LessonDraft({
                    publishedLessonId: null,
                    courseDraftId: draft._id,
                    draftSectionId: sectionDraft._id,
                    title: title,
                    contentType: contentType,
                    order: lessonOrder,
                    description: description || '',
                    isFreePreview: isFreePreview || false,
                    status: 'draft',
                    changeType: 'new'
                });

                await draftLesson.save();

                draft.draftLessons.push(draftLesson._id);
                await draft.save();

                console.log(`✅ Created draft lesson: ${draftLesson._id} for approved course`);

                return res.status(201).json({
                    success: true,
                    isDraft: true,
                    message: 'Draft lesson created successfully',
                    data: draftLesson
                });
            } else {
                // Course is draft - create regular lesson
                let lessonOrder = order;
                if (lessonOrder === undefined) {
                    const lastLesson = await Lesson.findOne({ section: sectionId })
                        .sort({ order: -1 });
                    lessonOrder = lastLesson ? lastLesson.order + 1 : 0;
                }

                const lesson = new Lesson({
                    section: sectionId,
                    title: title,
                    contentType: contentType,
                    order: lessonOrder,
                    description: description || '',
                    isFreePreview: isFreePreview || false
                });

                await lesson.save();

                console.log(`✅ Created lesson: ${lesson._id}, type: ${contentType}`);

                return res.status(201).json({
                    success: true,
                    isDraft: false,
                    message: 'Lesson created successfully',
                    data: lesson
                });
            }
        } else {
            return res.status(404).json({
                success: false,
                message: 'Section not found'
            });
        }
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
 * Get lesson by ID (supports both draft and published)
 * GET /api/lesson/:lessonId
 */
export const getLessonById = async (req, res) => {
    try {
        const { lessonId } = req.params;

        // Try to find draft lesson first
        let lessonDraft = await LessonDraft.findById(lessonId);
        
        if (lessonDraft) {
            return res.status(200).json({
                success: true,
                isDraft: true,
                data: lessonDraft
            });
        }

        // If not draft, find published lesson
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
            isDraft: false,
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
 * Get all lessons for a section (supports both draft and published)
 * GET /api/lesson/section/:sectionId
 */
export const getLessonsBySection = async (req, res) => {
    try {
        const { sectionId } = req.params;

        // Check if this is a draft section
        const draftSection = await SectionDraft.findById(sectionId);
        
        if (draftSection) {
            // Get draft lessons
            const draftLessons = await LessonDraft.find({ draftSectionId: sectionId })
                .sort({ order: 1 });
            
            return res.status(200).json({
                success: true,
                isDraft: true,
                data: draftLessons
            });
        }

        // Get published lessons
        const lessons = await Lesson.getLessonsForSection(sectionId);

        res.status(200).json({
            success: true,
            isDraft: false,
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
 * Update lesson (draft-aware)
 * PUT /api/lesson/:lessonId
 */
export const updateLesson = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const { title, description, order, isFreePreview, contentType, video, material, quiz } = req.body;

        // Check if this is a draft lesson
        const draftLesson = await LessonDraft.findById(lessonId);
        
        if (draftLesson) {
            // Update draft lesson
            if (title !== undefined) draftLesson.title = title;
            if (description !== undefined) draftLesson.description = description;
            if (order !== undefined) draftLesson.order = order;
            if (isFreePreview !== undefined) draftLesson.isFreePreview = isFreePreview;
            
            // Update content references
            if (video !== undefined) draftLesson.draftVideoId = video;
            if (material !== undefined) draftLesson.draftMaterialId = material;
            if (quiz !== undefined) draftLesson.draftQuizId = quiz;
            
            // Handle content type change
            if (contentType !== undefined && contentType !== draftLesson.contentType) {
                draftLesson.contentType = contentType;
                if (contentType !== 'video') draftLesson.draftVideoId = null;
                if (contentType !== 'material') draftLesson.draftMaterialId = null;
                if (contentType !== 'quiz') draftLesson.draftQuizId = null;
            }
            
            // Mark as modified if it was unchanged
            if (draftLesson.changeType === 'unchanged') {
                draftLesson.changeType = 'modified';
            }
            
            await draftLesson.save();
            
            // Update draft reference
            const draft = await mongoose.model('CourseDraft').findById(draftLesson.courseDraftId);
            if (draft) {
                await draft.save();
            }

            console.log(`✅ Updated draft lesson: ${lessonId}`);

            return res.status(200).json({
                success: true,
                isDraft: true,
                message: 'Draft lesson updated successfully',
                data: draftLesson
            });
        }
        
        // Check published lesson
        const lesson = await Lesson.findById(lessonId);
        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: 'Lesson not found'
            });
        }
        
        // Get section to check course status
        const section = await Section.findById(lesson.section);
        if (!section) {
            return res.status(404).json({
                success: false,
                message: 'Section not found for this lesson'
            });
        }
        
        // Check if course is approved
        const isApproved = await isCourseApproved(section.course_id);
        
        if (isApproved) {
            // Create/update draft for approved course
            const draft = await getOrCreateDraft(section.course_id, req.auth?.userId);
            
            // Ensure section has draft
            let sectionDraft = await SectionDraft.findOne({
                publishedSectionId: section._id,
                courseDraftId: draft._id
            });
            
            if (!sectionDraft) {
                sectionDraft = new SectionDraft({
                    publishedSectionId: section._id,
                    courseDraftId: draft._id,
                    course_id: section.course_id,
                    title: section.title,
                    order: section.order,
                    status: 'draft',
                    changeType: 'unchanged'
                });
                await sectionDraft.save();
                draft.draftSections.push(sectionDraft._id);
            }
            
            // Check if lesson draft already exists
            let existingDraftLesson = await LessonDraft.findOne({
                publishedLessonId: lesson._id,
                courseDraftId: draft._id
            });
            
            if (existingDraftLesson) {
                // Update existing draft
                if (title !== undefined) existingDraftLesson.title = title;
                if (description !== undefined) existingDraftLesson.description = description;
                if (order !== undefined) existingDraftLesson.order = order;
                if (isFreePreview !== undefined) existingDraftLesson.isFreePreview = isFreePreview;
                if (video !== undefined) existingDraftLesson.draftVideoId = video;
                if (material !== undefined) existingDraftLesson.draftMaterialId = material;
                if (quiz !== undefined) existingDraftLesson.draftQuizId = quiz;
                
                if (contentType !== undefined && contentType !== existingDraftLesson.contentType) {
                    existingDraftLesson.contentType = contentType;
                    if (contentType !== 'video') existingDraftLesson.draftVideoId = null;
                    if (contentType !== 'material') existingDraftLesson.draftMaterialId = null;
                    if (contentType !== 'quiz') existingDraftLesson.draftQuizId = null;
                }
                
                existingDraftLesson.changeType = 'modified';
                await existingDraftLesson.save();
                
                console.log(`✅ Updated existing draft lesson: ${existingDraftLesson._id}`);
                
                return res.status(200).json({
                    success: true,
                    isDraft: true,
                    message: 'Draft lesson updated successfully',
                    data: existingDraftLesson
                });
            } else {
                // Create new draft from published lesson
                const newDraftLesson = new LessonDraft({
                    publishedLessonId: lesson._id,
                    courseDraftId: draft._id,
                    draftSectionId: sectionDraft._id,
                    title: title !== undefined ? title : lesson.title,
                    contentType: contentType !== undefined ? contentType : lesson.contentType,
                    order: order !== undefined ? order : lesson.order,
                    description: description !== undefined ? description : lesson.description,
                    isFreePreview: isFreePreview !== undefined ? isFreePreview : lesson.isFreePreview,
                    draftVideoId: video !== undefined ? video : lesson.video,
                    draftMaterialId: material !== undefined ? material : lesson.material,
                    draftQuizId: quiz !== undefined ? quiz : lesson.quiz,
                    status: 'draft',
                    changeType: 'modified'
                });
                
                await newDraftLesson.save();
                draft.draftLessons.push(newDraftLesson._id);
                await draft.save();
                
                console.log(`✅ Created draft from published lesson: ${newDraftLesson._id}`);
                
                return res.status(200).json({
                    success: true,
                    isDraft: true,
                    message: 'Draft lesson created successfully',
                    data: newDraftLesson
                });
            }
        } else {
            // Course is draft - update directly
            if (title !== undefined) lesson.title = title;
            if (description !== undefined) lesson.description = description;
            if (order !== undefined) lesson.order = order;
            if (isFreePreview !== undefined) lesson.isFreePreview = isFreePreview;
            
            if (video !== undefined) lesson.video = video;
            if (material !== undefined) lesson.material = material;
            if (quiz !== undefined) lesson.quiz = quiz;
            
            if (contentType !== undefined && contentType !== lesson.contentType) {
                console.warn(`⚠️ Changing content type from ${lesson.contentType} to ${contentType} for lesson ${lessonId}`);
                lesson.contentType = contentType;
                if (contentType !== 'video') lesson.video = null;
                if (contentType !== 'material') lesson.material = null;
                if (contentType !== 'quiz') lesson.quiz = null;
            }

            await lesson.save();

            console.log(`✅ Updated lesson: ${lessonId}`);

            return res.status(200).json({
                success: true,
                isDraft: false,
                message: 'Lesson updated successfully',
                data: lesson
            });
        }
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
 * Delete lesson (draft-aware, cascade deletes content)
 * DELETE /api/lesson/:lessonId
 */
export const deleteLesson = async (req, res) => {
    try {
        const { lessonId } = req.params;

        // Check if this is a draft lesson
        const draftLesson = await LessonDraft.findById(lessonId);
        
        if (draftLesson) {
            // Delete draft lesson (triggers cascade delete)
            await draftLesson.deleteOne();
            
            // Remove from draft's draftLessons array
            const draft = await mongoose.model('CourseDraft').findById(draftLesson.courseDraftId);
            if (draft) {
                draft.draftLessons = draft.draftLessons.filter(
                    id => id.toString() !== lessonId
                );
                await draft.save();
            }
            
            console.log(`✅ Deleted draft lesson: ${lessonId}`);
            
            return res.status(200).json({
                success: true,
                isDraft: true,
                message: 'Draft lesson deleted successfully'
            });
        }

        // Check published lesson
        const lesson = await Lesson.findById(lessonId);
        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: 'Lesson not found'
            });
        }
        
        // Get section to check course status
        const section = await Section.findById(lesson.section);
        if (!section) {
            return res.status(404).json({
                success: false,
                message: 'Section not found'
            });
        }
        
        // Check if course is approved
        const isApproved = await isCourseApproved(section.course_id);
        
        if (isApproved) {
            // Create "deleted" draft marker
            const draft = await getOrCreateDraft(section.course_id, req.auth?.userId);
            
            // Ensure section has draft
            let sectionDraft = await SectionDraft.findOne({
                publishedSectionId: section._id,
                courseDraftId: draft._id
            });
            
            if (!sectionDraft) {
                sectionDraft = new SectionDraft({
                    publishedSectionId: section._id,
                    courseDraftId: draft._id,
                    course_id: section.course_id,
                    title: section.title,
                    order: section.order,
                    status: 'draft',
                    changeType: 'unchanged'
                });
                await sectionDraft.save();
                draft.draftSections.push(sectionDraft._id);
            }
            
            const deletedDraftLesson = new LessonDraft({
                publishedLessonId: lesson._id,
                courseDraftId: draft._id,
                draftSectionId: sectionDraft._id,
                title: lesson.title,
                contentType: lesson.contentType,
                order: lesson.order,
                description: lesson.description,
                isFreePreview: lesson.isFreePreview,
                status: 'draft',
                changeType: 'deleted'
            });
            
            await deletedDraftLesson.save();
            draft.draftLessons.push(deletedDraftLesson._id);
            await draft.save();
            
            console.log(`✅ Marked lesson for deletion: ${lesson._id}`);
            
            return res.status(200).json({
                success: true,
                isDraft: true,
                message: 'Lesson marked for deletion (pending approval)',
                draftId: deletedDraftLesson._id
            });
        } else {
            // Course is draft - delete directly
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

            return res.status(200).json({
                success: true,
                isDraft: false,
                message: 'Lesson and associated content deleted successfully'
            });
        }
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
 * Reorder lessons in a section (draft-aware)
 * PUT /api/lesson/reorder
 */
export const reorderLessons = async (req, res) => {
    try {
        const { lessons, isDraft } = req.body; // Array of { lessonId, order }, isDraft flag

        if (!Array.isArray(lessons)) {
            return res.status(400).json({
                success: false,
                message: 'Lessons must be an array'
            });
        }

        if (isDraft) {
            // Reorder draft lessons
            const updatePromises = lessons.map(({ lessonId, order }) =>
                LessonDraft.findByIdAndUpdate(lessonId, { order }, { new: true })
            );
            await Promise.all(updatePromises);
            
            console.log(`✅ Reordered ${lessons.length} draft lessons`);
            
            return res.status(200).json({
                success: true,
                isDraft: true,
                message: 'Draft lessons reordered successfully'
            });
        } else {
            // Reorder published lessons
            const updatePromises = lessons.map(({ lessonId, order }) =>
                Lesson.findByIdAndUpdate(lessonId, { order }, { new: true })
            );
            await Promise.all(updatePromises);

            console.log(`✅ Reordered ${lessons.length} lessons`);

            return res.status(200).json({
                success: true,
                isDraft: false,
                message: 'Lessons reordered successfully'
            });
        }
    } catch (error) {
        console.error('Error reordering lessons:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reorder lessons',
            error: error.message
        });
    }
};
