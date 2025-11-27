import CourseDraft from '../models/CourseDraft.js';
import { getCourseDraft } from '../utils/draftHelper.js';

/**
 * Submit draft for approval
 * POST /api/course-draft/:courseId/submit
 */
export const submitDraftForApproval = async (req, res) => {
    try {
        const { courseId } = req.params;

        console.log(`📤 [Submit Draft] Course ID: ${courseId}`);

        // Get draft
        const draft = await getCourseDraft(courseId);

        if (!draft) {
            return res.status(404).json({
                success: false,
                message: 'Draft not found'
            });
        }

        // Check if already pending or approved
        if (draft.status === 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Draft is already pending approval'
            });
        }

        if (draft.status === 'approved') {
            return res.status(400).json({
                success: false,
                message: 'Draft has already been approved'
            });
        }

        // Update status to pending
        draft.status = 'pending';
        draft.submittedAt = new Date();
        await draft.save();

        console.log(`✅ [Submit Draft] Draft ${courseId} submitted for approval`);

        res.status(200).json({
            success: true,
            message: 'Draft submitted for approval',
            data: {
                courseId: draft._id,
                status: draft.status,
                submittedAt: draft.submittedAt
            }
        });

    } catch (error) {
        console.error('❌ [Submit Draft] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit draft',
            error: error.message
        });
    }
};

/**
 * Get draft by course ID
 * GET /api/course-draft/:courseId
 */
export const getDraft = async (req, res) => {
    try {
        const { courseId } = req.params;

        const draft = await CourseDraft.findById(courseId)
            .populate('draftSections')
            .populate('draftLessons')
            .populate('draftVideos')
            .populate('draftMaterials')
            .populate('draftQuizzes');

        if (!draft) {
            return res.status(404).json({
                success: false,
                message: 'Draft not found'
            });
        }

        res.status(200).json({
            success: true,
            data: draft
        });

    } catch (error) {
        console.error('Error getting draft:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get draft',
            error: error.message
        });
    }
};

/**
 * Cancel/Delete draft
 * DELETE /api/course-draft/:courseId
 */
export const cancelDraft = async (req, res) => {
    try {
        const { courseId } = req.params;

        console.log(`🗑️ [Cancel Draft] Course ID: ${courseId}`);

        const draft = await CourseDraft.findById(courseId);

        if (!draft) {
            return res.status(404).json({
                success: false,
                message: 'Draft not found'
            });
        }

        // Don't allow canceling if already approved
        if (draft.status === 'approved') {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel an approved draft'
            });
        }

        // Delete all draft content
        const SectionDraft = (await import('../models/SectionDraft.js')).default;
        const LessonDraft = (await import('../models/LessonDraft.js')).default;
        const VideoDraft = (await import('../models/VideoDraft.js')).default;
        const MaterialDraft = (await import('../models/MaterialDraft.js')).default;
        const QuizDraft = (await import('../models/QuizDraft.js')).default;

        await SectionDraft.deleteMany({ courseDraftId: courseId });
        await LessonDraft.deleteMany({ courseDraftId: courseId });
        await VideoDraft.deleteMany({ courseDraftId: courseId });
        await MaterialDraft.deleteMany({ courseDraftId: courseId });
        await QuizDraft.deleteMany({ courseDraftId: courseId });

        // Delete draft
        await CourseDraft.findByIdAndDelete(courseId);

        console.log(`✅ [Cancel Draft] Draft ${courseId} deleted`);

        res.status(200).json({
            success: true,
            message: 'Draft cancelled successfully'
        });

    } catch (error) {
        console.error('❌ [Cancel Draft] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel draft',
            error: error.message
        });
    }
};

/**
 * Get draft status
 * GET /api/course-draft/:courseId/status
 */
export const getDraftStatus = async (req, res) => {
    try {
        const { courseId } = req.params;

        const draft = await CourseDraft.findById(courseId).select('status submittedAt approvedAt rejectedAt rejectionReason');

        if (!draft) {
            return res.status(404).json({
                success: false,
                message: 'Draft not found',
                status: null
            });
        }

        res.status(200).json({
            success: true,
            data: {
                status: draft.status,
                submittedAt: draft.submittedAt,
                approvedAt: draft.approvedAt,
                rejectedAt: draft.rejectedAt,
                rejectionReason: draft.rejectionReason
            }
        });

    } catch (error) {
        console.error('Error getting draft status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get draft status',
            error: error.message
        });
    }
};

/**
 * Get all pending drafts (Admin)
 * GET /api/course-draft/pending
 */
export const getPendingDrafts = async (req, res) => {
    try {
        const drafts = await CourseDraft.find({ status: 'pending' })
            .sort({ submittedAt: -1 });

        res.status(200).json({
            success: true,
            count: drafts.length,
            data: drafts
        });

    } catch (error) {
        console.error('Error getting pending drafts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get pending drafts',
            error: error.message
        });
    }
};

/**
 * Approve draft (Admin)
 * POST /api/course-draft/:courseId/approve
 * This will copy all draft content to published collections
 */
export const approveDraft = async (req, res) => {
    try {
        const { courseId } = req.params;

        console.log(`✅ [Approve Draft] Course ID: ${courseId}`);

        const draft = await CourseDraft.findById(courseId)
            .populate('draftSections')
            .populate('draftLessons')
            .populate('draftVideos')
            .populate('draftMaterials')
            .populate('draftQuizzes');

        if (!draft) {
            return res.status(404).json({
                success: false,
                message: 'Draft not found'
            });
        }

        if (draft.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Only pending drafts can be approved'
            });
        }

        console.log(`🚀 [Approve Draft] Starting approval process for course ${courseId}`);

        // Import models
        const SectionDraft = (await import('../models/SectionDraft.js')).default;
        const LessonDraft = (await import('../models/LessonDraft.js')).default;
        const VideoDraft = (await import('../models/VideoDraft.js')).default;
        const MaterialDraft = (await import('../models/MaterialDraft.js')).default;
        const QuizDraft = (await import('../models/QuizDraft.js')).default;
        const Section = (await import('../models/Section.js')).default;
        const Lesson = (await import('../models/Lesson.js')).default;
        const Video = (await import('../models/video.js')).default;
        const Material = (await import('../models/Material.js')).default;
        const Quiz = (await import('../models/Quiz.js')).default;
        const Course = (await import('../models/Course.js')).default;

        // Get all draft sections
        const draftSections = await SectionDraft.find({ courseDraftId: courseId }).sort({ order: 1 });
        console.log(`📦 [Approve Draft] Found ${draftSections.length} draft sections`);

        // Track old assets for cleanup
        const oldMuxAssets = new Set();
        const oldCloudinaryFiles = new Set();

        // Process each section
        for (const draftSection of draftSections) {
            let publishedSection;

            if (draftSection.changeType === 'new') {
                // Create new section
                console.log(`➕ [Section] Creating new section: ${draftSection.title}`);
                publishedSection = new Section({
                    course_id: courseId,
                    title: draftSection.title,
                    order: draftSection.order
                });
                await publishedSection.save();
            } else {
                // Update or keep existing section
                console.log(`🔄 [Section] Updating section ${draftSection.publishedSectionId}: ${draftSection.title}`);
                publishedSection = await Section.findById(draftSection.publishedSectionId);
                
                if (!publishedSection) {
                    console.warn(`⚠️ [Section] Original section ${draftSection.publishedSectionId} not found, creating new`);
                    publishedSection = new Section({
                        course_id: courseId,
                        title: draftSection.title,
                        order: draftSection.order
                    });
                    await publishedSection.save();
                } else {
                    publishedSection.title = draftSection.title;
                    publishedSection.order = draftSection.order;
                    await publishedSection.save();
                }
            }

            // Get all draft lessons for this section
            const draftLessons = await LessonDraft.find({ 
                draftSectionId: draftSection._id 
            }).sort({ order: 1 });

            console.log(`📝 [Section ${publishedSection._id}] Found ${draftLessons.length} draft lessons`);

            const publishedLessonIds = [];

            // Process each lesson
            for (const draftLesson of draftLessons) {
                let publishedLesson;

                if (draftLesson.changeType === 'new') {
                    // Create new lesson
                    console.log(`➕ [Lesson] Creating new lesson: ${draftLesson.title}`);
                    publishedLesson = new Lesson({
                        section: publishedSection._id.toString(),
                        title: draftLesson.title,
                        contentType: draftLesson.contentType,
                        order: draftLesson.order,
                        description: draftLesson.description,
                        duration: draftLesson.duration,
                        isFreePreview: draftLesson.isFreePreview || false,
                        video: null,
                        material: null,
                        quiz: null
                    });
                    await publishedLesson.save();
                } else {
                    // Update or keep existing lesson
                    console.log(`🔄 [Lesson] Updating lesson ${draftLesson.publishedLessonId}: ${draftLesson.title}`);
                    publishedLesson = await Lesson.findById(draftLesson.publishedLessonId);
                    
                    if (!publishedLesson) {
                        console.warn(`⚠️ [Lesson] Original lesson ${draftLesson.publishedLessonId} not found, creating new`);
                        publishedLesson = new Lesson({
                            section: publishedSection._id.toString(),
                            title: draftLesson.title,
                            contentType: draftLesson.contentType,
                            order: draftLesson.order,
                            description: draftLesson.description,
                            duration: draftLesson.duration,
                            isFreePreview: draftLesson.isFreePreview || false,
                            video: null,
                            material: null,
                            quiz: null
                        });
                        await publishedLesson.save();
                    } else {
                        publishedLesson.title = draftLesson.title;
                        publishedLesson.order = draftLesson.order;
                        publishedLesson.description = draftLesson.description;
                        publishedLesson.duration = draftLesson.duration;
                        publishedLesson.isFreePreview = draftLesson.isFreePreview;
                        await publishedLesson.save();
                    }
                }

                publishedLessonIds.push(publishedLesson._id);

                // Process Video
                const draftVideo = await VideoDraft.findOne({ draftLessonId: draftLesson._id });
                if (draftVideo) {
                    console.log(`🎥 [Video] Processing video for lesson ${publishedLesson._id}`);
                    
                    // Check if there's an old video to potentially delete
                    if (publishedLesson.video) {
                        const oldVideo = await Video.findById(publishedLesson.video);
                        if (oldVideo && oldVideo.assetId !== draftVideo.assetId) {
                            // Video changed, mark old MUX asset for deletion
                            console.log(`🗑️ [Video] Marking old MUX asset for deletion: ${oldVideo.assetId}`);
                            oldMuxAssets.add(oldVideo.assetId);
                        }
                    }

                    // Update or create published video
                    let publishedVideo;
                    if (draftVideo.publishedVideoId && draftVideo.changeType !== 'new') {
                        publishedVideo = await Video.findById(draftVideo.publishedVideoId);
                        if (publishedVideo) {
                            publishedVideo.title = draftVideo.title;
                            publishedVideo.userId = draftVideo.userId;
                            publishedVideo.assetId = draftVideo.assetId;
                            publishedVideo.playbackId = draftVideo.playbackId;
                            publishedVideo.duration = draftVideo.duration;
                            publishedVideo.status = draftVideo.status;
                            publishedVideo.description = draftVideo.description;
                            publishedVideo.uploadId = draftVideo.uploadId;
                            publishedVideo.aspectRatio = draftVideo.aspectRatio;
                            publishedVideo.max_resolution = draftVideo.max_resolution;
                            await publishedVideo.save();
                        } else {
                            publishedVideo = new Video({
                                lesson: publishedLesson._id,
                                title: draftVideo.title,
                                userId: draftVideo.userId,
                                assetId: draftVideo.assetId,
                                playbackId: draftVideo.playbackId,
                                duration: draftVideo.duration,
                                status: draftVideo.status,
                                description: draftVideo.description,
                                uploadId: draftVideo.uploadId,
                                aspectRatio: draftVideo.aspectRatio,
                                max_resolution: draftVideo.max_resolution
                            });
                            await publishedVideo.save();
                        }
                    } else {
                        publishedVideo = new Video({
                            lesson: publishedLesson._id,
                            title: draftVideo.title,
                            userId: draftVideo.userId,
                            assetId: draftVideo.assetId,
                            playbackId: draftVideo.playbackId,
                            duration: draftVideo.duration,
                            status: draftVideo.status,
                            description: draftVideo.description,
                            uploadId: draftVideo.uploadId,
                            aspectRatio: draftVideo.aspectRatio,
                            max_resolution: draftVideo.max_resolution
                        });
                        await publishedVideo.save();
                    }

                    publishedLesson.video = publishedVideo._id;
                    await publishedLesson.save();
                    console.log(`✅ [Video] Video saved: ${publishedVideo._id}`);
                }

                // Process Materials
                const draftMaterials = await MaterialDraft.find({ draftLessonId: draftLesson._id });
                console.log(`📄 [Materials] Found ${draftMaterials.length} draft materials`);

                if (draftMaterials.length > 0 && draftLesson.contentType === 'material') {
                    // For now, only take the first material since Lesson schema has singular 'material' field
                    const draftMaterial = draftMaterials[0];
                    
                    // Check if there's an old material to potentially delete
                    if (draftMaterial.publishedMaterialId && draftMaterial.changeType !== 'new') {
                        const oldMaterial = await Material.findById(draftMaterial.publishedMaterialId);
                        if (oldMaterial && oldMaterial.contentUrl !== draftMaterial.contentUrl) {
                            // Material file changed, mark old Cloudinary file for deletion
                            console.log(`🗑️ [Material] Marking old Cloudinary file for deletion: ${oldMaterial.contentUrl}`);
                            oldCloudinaryFiles.add(oldMaterial.contentUrl);
                        }
                    }

                    // Update or create published material
                    let publishedMaterial;
                    if (draftMaterial.publishedMaterialId && draftMaterial.changeType !== 'new') {
                        publishedMaterial = await Material.findById(draftMaterial.publishedMaterialId);
                        if (publishedMaterial) {
                            publishedMaterial.title = draftMaterial.title;
                            publishedMaterial.contentUrl = draftMaterial.contentUrl;
                            publishedMaterial.fileSize = draftMaterial.fileSize;
                            publishedMaterial.originalFilename = draftMaterial.originalFilename;
                            publishedMaterial.extension = draftMaterial.extension;
                            publishedMaterial.isTemporary = false;
                            await publishedMaterial.save();
                        } else {
                            publishedMaterial = new Material({
                                lesson: publishedLesson._id,
                                title: draftMaterial.title,
                                contentUrl: draftMaterial.contentUrl,
                                fileSize: draftMaterial.fileSize,
                                originalFilename: draftMaterial.originalFilename,
                                extension: draftMaterial.extension,
                                isTemporary: false
                            });
                            await publishedMaterial.save();
                        }
                    } else {
                        publishedMaterial = new Material({
                            lesson: publishedLesson._id,
                            title: draftMaterial.title,
                            contentUrl: draftMaterial.contentUrl,
                            fileSize: draftMaterial.fileSize,
                            originalFilename: draftMaterial.originalFilename,
                            extension: draftMaterial.extension,
                            isTemporary: false
                        });
                        await publishedMaterial.save();
                    }

                    publishedLesson.material = publishedMaterial._id;
                    await publishedLesson.save();
                    console.log(`✅ [Material] Material saved: ${publishedMaterial._id}`);
                }

                // Process Quiz
                const draftQuiz = await QuizDraft.findOne({ draftLessonId: draftLesson._id });
                if (draftQuiz) {
                    console.log(`❓ [Quiz] Processing quiz for lesson ${publishedLesson._id}`);

                    // Update or create published quiz
                    let publishedQuiz;
                    if (draftQuiz.publishedQuizId && draftQuiz.changeType !== 'new') {
                        publishedQuiz = await Quiz.findById(draftQuiz.publishedQuizId);
                        if (publishedQuiz) {
                            publishedQuiz.title = draftQuiz.title;
                            publishedQuiz.questions = draftQuiz.questions;
                            publishedQuiz.passingScore = draftQuiz.passingScore;
                            publishedQuiz.timeLimit = draftQuiz.timeLimit;
                            await publishedQuiz.save();
                        } else {
                            publishedQuiz = new Quiz({
                                lesson: publishedLesson._id,
                                title: draftQuiz.title,
                                questions: draftQuiz.questions,
                                passingScore: draftQuiz.passingScore,
                                timeLimit: draftQuiz.timeLimit
                            });
                            await publishedQuiz.save();
                        }
                    } else {
                        publishedQuiz = new Quiz({
                            lesson: publishedLesson._id,
                            title: draftQuiz.title,
                            questions: draftQuiz.questions,
                            passingScore: draftQuiz.passingScore,
                            timeLimit: draftQuiz.timeLimit
                        });
                        await publishedQuiz.save();
                    }

                    publishedLesson.quiz = publishedQuiz._id;
                    await publishedLesson.save();
                    console.log(`✅ [Quiz] Quiz saved: ${publishedQuiz._id}`);
                }
            }

            console.log(`✅ [Section] Section ${publishedSection._id} processed with ${draftLessons.length} lessons`);
        }

        // Update Course document with updated data from draft
        const course = await Course.findById(courseId);
        if (course) {
            if (draft.title) course.title = draft.title;
            if (draft.description) course.description = draft.description;
            if (draft.category) course.category = draft.category;
            if (draft.level) course.level = draft.level;
            if (draft.language) course.language = draft.language;
            if (draft.price !== undefined) course.price = draft.price;
            if (draft.thumbnail) course.thumbnail = draft.thumbnail;
            if (draft.shortDescription) course.shortDescription = draft.shortDescription;
            if (draft.learningObjectives) course.learningObjectives = draft.learningObjectives;
            if (draft.requirements) course.requirements = draft.requirements;
            await course.save();
            console.log(`✅ [Course] Course metadata updated`);
        }

        // Delete old MUX assets
        if (oldMuxAssets.size > 0) {
            console.log(`🗑️ [Cleanup] Deleting ${oldMuxAssets.size} old MUX assets`);
            const Mux = (await import('@mux/mux-node')).default;
            const { video: muxVideo } = new Mux({
                tokenId: process.env.MUX_TOKEN_ID,
                tokenSecret: process.env.MUX_TOKEN_SECRET
            });

            for (const assetId of oldMuxAssets) {
                try {
                    await muxVideo.assets.delete(assetId);
                    console.log(`✅ [MUX] Deleted asset: ${assetId}`);
                } catch (err) {
                    console.error(`❌ [MUX] Failed to delete asset ${assetId}:`, err.message);
                }
            }
        }

        // Delete old Cloudinary files
        if (oldCloudinaryFiles.size > 0) {
            console.log(`🗑️ [Cleanup] Deleting ${oldCloudinaryFiles.size} old Cloudinary files`);
            const cloudinary = (await import('../config/cloudinary.js')).default;

            for (const fileUrl of oldCloudinaryFiles) {
                try {
                    // Extract public_id from Cloudinary URL
                    const urlParts = fileUrl.split('/');
                    const fileName = urlParts[urlParts.length - 1];
                    const publicId = fileName.split('.')[0];
                    
                    await cloudinary.uploader.destroy(`course-materials/${publicId}`);
                    console.log(`✅ [Cloudinary] Deleted file: ${fileUrl}`);
                } catch (err) {
                    console.error(`❌ [Cloudinary] Failed to delete file ${fileUrl}:`, err.message);
                }
            }
        }

        // Mark draft as approved
        draft.status = 'approved';
        draft.approvedAt = new Date();
        await draft.save();

        console.log(`✅ [Approve Draft] Draft ${courseId} fully approved and published`);

        // Delete all draft content after successful approval
        console.log(`🗑️ [Cleanup] Deleting draft content for course ${courseId}`);
        
        try {
            // Delete all draft sections
            const deletedSections = await SectionDraft.deleteMany({ courseDraftId: courseId });
            console.log(`   ✅ Deleted ${deletedSections.deletedCount} draft sections`);

            // Delete all draft lessons
            const deletedLessons = await LessonDraft.deleteMany({ courseDraftId: courseId });
            console.log(`   ✅ Deleted ${deletedLessons.deletedCount} draft lessons`);

            // Delete all draft videos
            const deletedVideos = await VideoDraft.deleteMany({ courseDraftId: courseId });
            console.log(`   ✅ Deleted ${deletedVideos.deletedCount} draft videos`);

            // Delete all draft materials
            const deletedMaterials = await MaterialDraft.deleteMany({ courseDraftId: courseId });
            console.log(`   ✅ Deleted ${deletedMaterials.deletedCount} draft materials`);

            // Delete all draft quizzes
            const deletedQuizzes = await QuizDraft.deleteMany({ courseDraftId: courseId });
            console.log(`   ✅ Deleted ${deletedQuizzes.deletedCount} draft quizzes`);

            // Delete the draft itself
            await CourseDraft.findByIdAndDelete(courseId);
            console.log(`   ✅ Deleted course draft ${courseId}`);
            
            console.log(`✅ [Cleanup] All draft content deleted successfully`);
        } catch (cleanupError) {
            console.error(`⚠️ [Cleanup] Error deleting draft content:`, cleanupError.message);
            // Don't fail the approval if cleanup fails, just log it
        }

        res.status(200).json({
            success: true,
            message: 'Draft approved and published successfully',
            data: {
                courseId: draft._id,
                status: draft.status,
                approvedAt: draft.approvedAt,
                sectionsProcessed: draftSections.length,
                oldMuxAssetsDeleted: oldMuxAssets.size,
                oldCloudinaryFilesDeleted: oldCloudinaryFiles.size
            }
        });

    } catch (error) {
        console.error('❌ [Approve Draft] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to approve draft',
            error: error.message
        });
    }
};

/**
 * Reject draft (Admin)
 * POST /api/course-draft/:courseId/reject
 */
export const rejectDraft = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { reason } = req.body;

        console.log(`❌ [Reject Draft] Course ID: ${courseId}`);

        const draft = await CourseDraft.findById(courseId);

        if (!draft) {
            return res.status(404).json({
                success: false,
                message: 'Draft not found'
            });
        }

        if (draft.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Only pending drafts can be rejected'
            });
        }

        draft.status = 'rejected';
        draft.rejectedAt = new Date();
        draft.rejectionReason = reason || 'No reason provided';
        await draft.save();

        console.log(`✅ [Reject Draft] Draft ${courseId} rejected`);

        res.status(200).json({
            success: true,
            message: 'Draft rejected successfully',
            data: {
                courseId: draft._id,
                status: draft.status,
                rejectedAt: draft.rejectedAt,
                rejectionReason: draft.rejectionReason
            }
        });

    } catch (error) {
        console.error('❌ [Reject Draft] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reject draft',
            error: error.message
        });
    }
};

