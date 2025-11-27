import VideoDraft from '../models/VideoDraft.js';
import MaterialDraft from '../models/MaterialDraft.js';
import SectionDraft from '../models/SectionDraft.js';
import CourseDraft from '../models/CourseDraft.js';
import Mux from '@mux/mux-node';
import { v2 as cloudinary } from 'cloudinary';
import logger from './logger.js';

// Initialize MUX client
const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET,
});

/**
 * Clean up draft content when draft is rejected or deleted
 * Only deletes NEW content (changeType: 'new'), not modified existing content
 * @param {string} courseId - Course ID (same as draft _id)
 * @param {boolean} deleteAll - If true, delete all drafts regardless of changeType
 */
export const cleanupRejectedDraft = async (courseId, deleteAll = false) => {
    try {
        logger.info(`🧹 Starting cleanup for draft: ${courseId}`);
        
        // Get draft
        const draft = await CourseDraft.findById(courseId);
        if (!draft) {
            throw new Error('Draft not found');
        }
        
        // Delete NEW videos from MUX (or all if deleteAll is true)
        const videoQuery = deleteAll 
            ? { courseDraftId: courseId }
            : { courseDraftId: courseId, changeType: 'new' };
        
        const videosToDelete = await VideoDraft.find(videoQuery);
        
        for (const video of videosToDelete) {
            if (video.assetId) {
                try {
                    await mux.video.assets.delete(video.assetId);
                    logger.info(`  ✅ Deleted MUX asset: ${video.assetId} (${video.title})`);
                } catch (error) {
                    logger.error(`  ❌ Failed to delete MUX asset ${video.assetId}:`, error.message);
                }
            }
        }
        
        // Delete NEW materials from Cloudinary (or all if deleteAll is true)
        const materialQuery = deleteAll
            ? { courseDraftId: courseId }
            : { courseDraftId: courseId, changeType: 'new' };
        
        const materialsToDelete = await MaterialDraft.find(materialQuery);
        
        for (const material of materialsToDelete) {
            if (material.contentUrl) {
                try {
                    await cloudinary.uploader.destroy(material.contentUrl, {
                        resource_type: material.resource_type || 'raw'
                    });
                    logger.info(`  ✅ Deleted Cloudinary file: ${material.contentUrl} (${material.title})`);
                } catch (error) {
                    logger.error(`  ❌ Failed to delete Cloudinary file ${material.contentUrl}:`, error.message);
                }
            }
        }
        
        // Delete all draft documents (cascade delete handles relationships)
        const draftSections = await SectionDraft.find({ courseDraftId: courseId });
        logger.info(`  Found ${draftSections.length} draft sections to delete`);
        
        for (const section of draftSections) {
            await section.deleteOne(); // Triggers cascade delete of lessons and content
        }
        
        // Clear draft references from draft document
        draft.draftSections = [];
        draft.draftLessons = [];
        draft.draftVideos = [];
        draft.draftMaterials = [];
        draft.draftQuizzes = [];
        await draft.save();
        
        logger.info(`✅ Cleanup completed for draft: ${courseId}`);
        
        return {
            success: true,
            videosDeleted: videosToDelete.length,
            materialsDeleted: materialsToDelete.length,
            sectionsDeleted: draftSections.length
        };
    } catch (error) {
        logger.error(`❌ Error cleaning up revision ${revisionId}:`, error);
        throw error;
    }
};

/**
 * Clean up abandoned drafts (drafts updated > 30 days ago)
 * Can be run as a scheduled job
 * @returns {Promise<{cleaned: number, errors: number}>}
 */
export const cleanupAbandonedDrafts = async () => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const abandonedDrafts = await CourseDraft.find({
            status: 'draft',
            updatedAt: { $lt: thirtyDaysAgo }
        });
        
        logger.info(`🧹 Found ${abandonedDrafts.length} abandoned drafts`);
        
        let cleaned = 0;
        let errors = 0;
        
        for (const draft of abandonedDrafts) {
            try {
                await cleanupRejectedDraft(draft._id, true);
                
                // Delete the draft document
                await CourseDraft.findByIdAndDelete(draft._id);
                
                cleaned++;
            } catch (error) {
                logger.error(`  ❌ Failed to clean up draft ${draft._id}:`, error.message);
                errors++;
            }
        }
        
        logger.info(`✅ Cleaned up ${cleaned} abandoned drafts (${errors} errors)`);
        
        return { cleaned, errors };
    } catch (error) {
        logger.error('❌ Error cleaning up abandoned drafts:', error);
        throw error;
    }
};

/**
 * Delete a specific draft video and its MUX asset
 * @param {string} videoDraftId - VideoDraft _id
 */
export const deleteDraftVideo = async (videoDraftId) => {
    try {
        const video = await VideoDraft.findById(videoDraftId);
        
        if (!video) {
            throw new Error('Video draft not found');
        }
        
        // Delete from MUX if asset exists
        if (video.assetId) {
            try {
                await mux.video.assets.delete(video.assetId);
                logger.info(`✅ Deleted MUX asset: ${video.assetId}`);
            } catch (error) {
                logger.error(`❌ Failed to delete MUX asset ${video.assetId}:`, error.message);
            }
        }
        
        // Delete from MongoDB
        await VideoDraft.findByIdAndDelete(videoDraftId);
        logger.info(`✅ Deleted video draft: ${videoDraftId}`);
        
        return { success: true };
    } catch (error) {
        logger.error(`❌ Error deleting draft video ${videoDraftId}:`, error);
        throw error;
    }
};

/**
 * Delete a specific draft material and its Cloudinary file
 * @param {string} materialDraftId - MaterialDraft _id
 */
export const deleteDraftMaterial = async (materialDraftId) => {
    try {
        const material = await MaterialDraft.findById(materialDraftId);
        
        if (!material) {
            throw new Error('Material draft not found');
        }
        
        // Delete from Cloudinary if contentUrl exists
        if (material.contentUrl) {
            try {
                await cloudinary.uploader.destroy(material.contentUrl, {
                    resource_type: material.resource_type || 'raw'
                });
                logger.info(`✅ Deleted Cloudinary file: ${material.contentUrl}`);
            } catch (error) {
                logger.error(`❌ Failed to delete Cloudinary file ${material.contentUrl}:`, error.message);
            }
        }
        
        // Delete from MongoDB
        await MaterialDraft.findByIdAndDelete(materialDraftId);
        logger.info(`✅ Deleted material draft: ${materialDraftId}`);
        
        return { success: true };
    } catch (error) {
        logger.error(`❌ Error deleting draft material ${materialDraftId}:`, error);
        throw error;
    }
};

/**
 * Cancel course draft - delete entire draft
 * @param {string} courseId - Course ID
 */
export const cancelCourseDraft = async (courseId) => {
    try {
        const draft = await CourseDraft.findById(courseId);
        
        if (!draft) {
            throw new Error('No draft found for this course');
        }
        
        // Clean up all draft content
        await cleanupRejectedDraft(courseId, true);
        
        // Delete the draft document
        await CourseDraft.findByIdAndDelete(courseId);
        
        logger.info(`✅ Cancelled draft for course: ${courseId}`);
        
        return { success: true, message: 'Draft cancelled and deleted' };
    } catch (error) {
        logger.error(`❌ Error cancelling course draft ${courseId}:`, error);
        throw error;
    }
};

export default {
    cleanupRejectedDraft,
    cleanupAbandonedDrafts,
    deleteDraftVideo,
    deleteDraftMaterial,
    cancelCourseDraft
};
