import CourseDraft from '../models/CourseDraft.js';
import { getCourseDraft } from '../utils/draftHelper.js';
import Mux from '@mux/mux-node';

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

        // Get all draft videos and materials to delete their files
        const draftVideos = await VideoDraft.find({ courseDraftId: courseId });
        const draftMaterials = await MaterialDraft.find({ courseDraftId: courseId });

        console.log(`🗑️ [Cancel Draft] Found ${draftVideos.length} draft videos and ${draftMaterials.length} draft materials`);

        // Delete MUX assets for NEW draft videos only (don't delete unchanged/modified from published)
        const newDraftVideos = draftVideos.filter(v => v.changeType === 'new');
        console.log(`   🗑️ [MUX] ${newDraftVideos.length} NEW videos to delete (${draftVideos.length - newDraftVideos.length} unchanged/modified will be kept)`);
        
        if (newDraftVideos.length > 0) {
            const { video: muxVideo } = new Mux({
                tokenId: process.env.MUX_TOKEN_ID,
                tokenSecret: process.env.MUX_SECRET_KEY
            });

            for (const video of newDraftVideos) {
                if (video.assetId) {
                    try {
                        await muxVideo.assets.delete(video.assetId);
                        console.log(`   ✅ [MUX] Deleted NEW draft asset: ${video.assetId}`);
                    } catch (err) {
                        console.error(`   ❌ [MUX] Failed to delete draft asset ${video.assetId}:`, err.message);
                    }
                }
            }
        }

        // Delete Cloudinary files for NEW draft materials only (don't delete unchanged/modified from published)
        const newDraftMaterials = draftMaterials.filter(m => m.changeType === 'new');
        console.log(`   🗑️ [Cloudinary] ${newDraftMaterials.length} NEW materials to delete (${draftMaterials.length - newDraftMaterials.length} unchanged/modified will be kept)`);
        
        if (newDraftMaterials.length > 0) {
            const cloudinary = (await import('../config/cloudinary.js')).default;

            for (const material of newDraftMaterials) {
                if (material.contentUrl) {
                    try {
                        await cloudinary.uploader.destroy(
                            material.contentUrl,
                            { 
                                resource_type: material.resource_type || 'raw',
                                type: 'private'
                            }
                        );
                        console.log(`   ✅ [Cloudinary] Deleted NEW draft file: ${material.contentUrl}`);
                    } catch (err) {
                        console.error(`   ❌ [Cloudinary] Failed to delete draft file ${material.contentUrl}:`, err.message);
                    }
                }
            }
        }

        // Delete draft documents from MongoDB
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
        const oldCloudinaryFiles = []; // Array of {publicId, resourceType}

        // STEP 1: Delete published sections that are NOT in draft (user deleted them)
        const draftPublishedSectionIds = draftSections
            .filter(ds => ds.publishedSectionId)
            .map(ds => ds.publishedSectionId.toString());
        
        const allPublishedSections = await Section.find({ course_id: courseId });
        console.log(`🔍 [Cleanup] Found ${allPublishedSections.length} published sections, ${draftPublishedSectionIds.length} in draft`);
        
        for (const publishedSection of allPublishedSections) {
            const sectionIdStr = publishedSection._id.toString();
            if (!draftPublishedSectionIds.includes(sectionIdStr)) {
                // This section was deleted in draft - delete it and all its content
                console.log(`🗑️ [Cleanup] Deleting removed section: ${publishedSection.title} (${sectionIdStr})`);
                
                // Find all lessons in this section
                const lessonsToDelete = await Lesson.find({ section: publishedSection._id });
                console.log(`   Found ${lessonsToDelete.length} lessons to delete`);
                
                for (const lesson of lessonsToDelete) {
                    // Delete video if exists
                    if (lesson.video) {
                        const video = await Video.findById(lesson.video);
                        if (video && video.assetId) {
                            console.log(`   🎥 Marking video asset for deletion: ${video.assetId}`);
                            oldMuxAssets.add(video.assetId);
                        }
                        await Video.findByIdAndDelete(lesson.video);
                    }
                    
                    // Delete material if exists
                    if (lesson.material) {
                        const material = await Material.findById(lesson.material);
                        if (material && material.contentUrl) {
                            console.log(`   📄 Marking material for deletion: ${material.contentUrl}`);
                            oldCloudinaryFiles.push({
                                publicId: material.contentUrl,
                                resourceType: material.resource_type || 'raw'
                            });
                        }
                        await Material.findByIdAndDelete(lesson.material);
                    }
                    
                    // Delete quiz if exists
                    if (lesson.quiz) {
                        await Quiz.findByIdAndDelete(lesson.quiz);
                    }
                    
                    // Delete lesson
                    await Lesson.findByIdAndDelete(lesson._id);
                }
                
                // Delete section
                await Section.findByIdAndDelete(publishedSection._id);
                console.log(`   ✅ Section deleted`);
            }
        }

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

            // STEP 2: Delete published lessons NOT in draft for this section (user deleted them)
            const draftPublishedLessonIds = draftLessons
                .filter(dl => dl.publishedLessonId)
                .map(dl => dl.publishedLessonId.toString());
            
            const allPublishedLessons = await Lesson.find({ section: publishedSection._id });
            console.log(`🔍 [Section ${publishedSection._id}] ${allPublishedLessons.length} published lessons, ${draftPublishedLessonIds.length} in draft`);
            
            for (const publishedLesson of allPublishedLessons) {
                const lessonIdStr = publishedLesson._id.toString();
                if (!draftPublishedLessonIds.includes(lessonIdStr)) {
                    // This lesson was deleted in draft - delete it and its content
                    console.log(`🗑️ [Lesson] Deleting removed lesson: ${publishedLesson.title} (${lessonIdStr})`);
                    
                    // Delete video if exists
                    if (publishedLesson.video) {
                        const video = await Video.findById(publishedLesson.video);
                        if (video && video.assetId) {
                            console.log(`   🎥 Marking video asset for deletion: ${video.assetId}`);
                            oldMuxAssets.add(video.assetId);
                        }
                        await Video.findByIdAndDelete(publishedLesson.video);
                    }
                    
                    // Delete material if exists
                    if (publishedLesson.material) {
                        const material = await Material.findById(publishedLesson.material);
                        if (material && material.contentUrl) {
                            console.log(`   📄 Marking material for deletion: ${material.contentUrl}`);
                            oldCloudinaryFiles.push({
                                publicId: material.contentUrl,
                                resourceType: material.resource_type || 'raw'
                            });
                        }
                        await Material.findByIdAndDelete(publishedLesson.material);
                    }
                    
                    // Delete quiz if exists
                    if (publishedLesson.quiz) {
                        await Quiz.findByIdAndDelete(publishedLesson.quiz);
                    }
                    
                    // Delete lesson
                    await Lesson.findByIdAndDelete(publishedLesson._id);
                    console.log(`   ✅ Lesson deleted`);
                }
            }

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
                        
                        // Check if content type changed - delete old content
                        if (publishedLesson.contentType !== draftLesson.contentType) {
                            console.log(`🔄 [Lesson] Content type changed: ${publishedLesson.contentType} → ${draftLesson.contentType}`);
                            
                            // Delete old content based on old type
                            if (publishedLesson.contentType === 'video' && publishedLesson.video) {
                                const oldVideo = await Video.findById(publishedLesson.video);
                                if (oldVideo && oldVideo.assetId) {
                                    console.log(`   🗑️ Marking old video for deletion: ${oldVideo.assetId}`);
                                    oldMuxAssets.add(oldVideo.assetId);
                                }
                                await Video.findByIdAndDelete(publishedLesson.video);
                                publishedLesson.video = null;
                            } else if (publishedLesson.contentType === 'material' && publishedLesson.material) {
                                const oldMaterial = await Material.findById(publishedLesson.material);
                                if (oldMaterial && oldMaterial.contentUrl) {
                                    console.log(`   🗑️ Marking old material for deletion: ${oldMaterial.contentUrl}`);
                                    oldCloudinaryFiles.push({
                                        publicId: oldMaterial.contentUrl,
                                        resourceType: oldMaterial.resource_type || 'raw'
                                    });
                                }
                                await Material.findByIdAndDelete(publishedLesson.material);
                                publishedLesson.material = null;
                            } else if (publishedLesson.contentType === 'quiz' && publishedLesson.quiz) {
                                await Quiz.findByIdAndDelete(publishedLesson.quiz);
                                publishedLesson.quiz = null;
                            }
                            
                            publishedLesson.contentType = draftLesson.contentType;
                        }
                        
                        await publishedLesson.save();
                    }
                }

                publishedLessonIds.push(publishedLesson._id);

                // Fetch draft content once for reuse
                const draftVideo = await VideoDraft.findOne({ draftLessonId: draftLesson._id });
                const draftMaterials = await MaterialDraft.find({ draftLessonId: draftLesson._id });
                const draftQuiz = await QuizDraft.findOne({ draftLessonId: draftLesson._id });

                // STEP 3: Handle deleted content within the same lesson
                // If draft has no video but published has video, delete it
                if (!draftVideo && publishedLesson.video) {
                    console.log(`🗑️ [Video] Video was deleted from lesson ${publishedLesson._id}`);
                    const oldVideo = await Video.findById(publishedLesson.video);
                    if (oldVideo && oldVideo.assetId) {
                        console.log(`   🗑️ Marking MUX asset for deletion: ${oldVideo.assetId}`);
                        oldMuxAssets.add(oldVideo.assetId);
                    }
                    await Video.findByIdAndDelete(publishedLesson.video);
                    publishedLesson.video = null;
                    await publishedLesson.save();
                }
                
                // If draft has no material but published has material, delete it
                if (draftMaterials.length === 0 && publishedLesson.material) {
                    console.log(`🗑️ [Material] Material was deleted from lesson ${publishedLesson._id}`);
                    const oldMaterial = await Material.findById(publishedLesson.material);
                    if (oldMaterial && oldMaterial.contentUrl) {
                        console.log(`   🗑️ Marking Cloudinary file for deletion: ${oldMaterial.contentUrl}`);
                        oldCloudinaryFiles.push({
                            publicId: oldMaterial.contentUrl,
                            resourceType: oldMaterial.resource_type || 'raw'
                        });
                    }
                    await Material.findByIdAndDelete(publishedLesson.material);
                    publishedLesson.material = null;
                    await publishedLesson.save();
                }
                
                // If draft has no quiz but published has quiz, delete it
                if (!draftQuiz && publishedLesson.quiz) {
                    console.log(`🗑️ [Quiz] Quiz was deleted from lesson ${publishedLesson._id}`);
                    await Quiz.findByIdAndDelete(publishedLesson.quiz);
                    publishedLesson.quiz = null;
                    await publishedLesson.save();
                }

                // Process Video
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
                            oldCloudinaryFiles.push({
                                publicId: oldMaterial.contentUrl,
                                resourceType: oldMaterial.resource_type || 'raw'
                            });
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
                if (draftQuiz) {
                    console.log(`❓ [Quiz] Processing quiz for lesson ${publishedLesson._id}`);

                    // Update or create published quiz
                    let publishedQuiz;
                    
                    // Try to find existing quiz by publishedQuizId OR by lesson.quiz
                    if (draftQuiz.publishedQuizId) {
                        publishedQuiz = await Quiz.findById(draftQuiz.publishedQuizId);
                    } else if (publishedLesson.quiz) {
                        // Fallback: check if lesson already has a quiz
                        publishedQuiz = await Quiz.findById(publishedLesson.quiz);
                    }
                    
                    if (publishedQuiz) {
                        // Update existing quiz
                        console.log(`   🔄 Updating existing quiz: ${publishedQuiz._id}`);
                        publishedQuiz.lesson = publishedLesson._id;
                        publishedQuiz.title = draftQuiz.title;
                        publishedQuiz.questions = draftQuiz.questions;
                        publishedQuiz.passingScore = draftQuiz.passingScore;
                        publishedQuiz.timeLimit = draftQuiz.timeLimit;
                        await publishedQuiz.save();
                        console.log(`   ✅ Quiz updated: ${publishedQuiz._id}`);
                    } else {
                        // Create new quiz
                        console.log(`   ➕ Creating new quiz`);
                        publishedQuiz = new Quiz({
                            lesson: publishedLesson._id,
                            title: draftQuiz.title,
                            questions: draftQuiz.questions,
                            passingScore: draftQuiz.passingScore,
                            timeLimit: draftQuiz.timeLimit
                        });
                        await publishedQuiz.save();
                        console.log(`   ✅ New quiz created: ${publishedQuiz._id}`);
                    }

                    publishedLesson.quiz = publishedQuiz._id;
                    await publishedLesson.save();
                    console.log(`✅ [Quiz] Quiz linked to lesson: ${publishedQuiz._id}`);
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
            const { video: muxVideo } = new Mux({
                tokenId: process.env.MUX_TOKEN_ID,
                tokenSecret: process.env.MUX_SECRET_KEY
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
        if (oldCloudinaryFiles.length > 0) {
            console.log(`🗑️ [Cleanup] Deleting ${oldCloudinaryFiles.length} old Cloudinary files`);
            const cloudinary = (await import('../config/cloudinary.js')).default;

            for (const file of oldCloudinaryFiles) {
                try {
                    // contentUrl is already the public_id, not a full URL
                    // Use the stored resource_type for correct deletion
                    const deleteResult = await cloudinary.uploader.destroy(
                        file.publicId,
                        { 
                            resource_type: file.resourceType,
                            type: 'private'
                        }
                    );
                    console.log(`✅ [Cloudinary] Deleted file: ${file.publicId} (${file.resourceType}), result:`, deleteResult.result);
                } catch (err) {
                    console.error(`❌ [Cloudinary] Failed to delete file ${file.publicId}:`, err.message);
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
                oldCloudinaryFilesDeleted: oldCloudinaryFiles.length
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

