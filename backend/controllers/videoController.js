import Video from "../models/video.js";
import dotenv from 'dotenv';
import Mux from '@mux/mux-node';
import logger from '../utils/logger.js';

// Khởi tạo Mux client
const { video: muxVideo } = new Mux({
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_SECRET_KEY
});

// Tạo video mới
export const addVideo = async (req, res) => {
    const { section, title, contentUrl, description, order } = req.body;

    if (!section || !title || !contentUrl) {
        return res.status(400).json({ message: 'section, title, and contentUrl are required' });
    }

    try {
        const newVideo = new Video({
            section,
            title,
            contentUrl,
            description,
            order: order || 1,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        const savedVideo = await newVideo.save();
        res.status(201).json(savedVideo);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating video', error: error.message });
    }
};

// Lấy video theo ID (protected - có đầy đủ thông tin)
export const getVideoById = async (req, res) => {
    const { videoId } = req.params;

    try {
        const video = await Video.findById(videoId);
        if (!video) {
            return res.status(404).json({ message: 'Video not found' });
        }
        res.status(200).json(video);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Lấy tất cả videos theo section ID (public - không có contentUrl)
export const getVideosBySectionId = async (req, res) => {
    const { sectionId } = req.params;

    try {
        const videos = await Video.find({ section: sectionId }).sort({ order: 1 }).lean();
        
        if (!videos || videos.length === 0) {
            return res.status(404).json({ message: 'No videos found for this section' });
        }

        // Loại bỏ contentUrl và description cho route public
        const publicVideos = videos.map(video => ({
            _id: video._id,
            section: video.section,
            title: video.title,
            order: video.order
        }));

        res.status(200).json(publicVideos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Cập nhật video
export const updateVideo = async (req, res) => {
    const { videoId } = req.params;
    const { title, contentUrl, description, order } = req.body;

    try {
        const video = await Video.findById(videoId);
        if (!video) {
            return res.status(404).json({ message: 'Video not found' });
        }

        if (title) video.title = title;
        if (contentUrl) video.contentUrl = contentUrl;
        if (description !== undefined) video.description = description;
        if (order) video.order = order;
        video.updatedAt = new Date();

        const updatedVideo = await video.save();
        res.status(200).json(updatedVideo);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating video', error: error.message });
    }
};

// Xóa video
export const deleteVideo = async (req, res) => {
    const { videoId } = req.params;

    try {
        // Find the video first
        const video = await Video.findById(videoId);
        if (!video) {
            logger.warning(`Video not found: ${videoId}`);
            return res.status(404).json({ message: 'Video not found' });
        }

        logger.info(`🗑️ Deleting video: ${videoId}`);
        logger.info(`   Title: ${video.title}`);
        logger.info(`   Asset ID: ${video.assetId || '(none)'}`);
        logger.info(`   Upload ID: ${video.uploadId || '(none)'}`);
        logger.info(`   Status: ${video.status}`);

        // Delete from MUX if assetId exists
        if (video.assetId && video.assetId !== '') {
            try {
                logger.info(`🎬 Deleting MUX asset: ${video.assetId}`);
                await muxVideo.assets.delete(video.assetId);
                logger.success(`✅ MUX asset deleted: ${video.assetId}`);
            } catch (muxError) {
                logger.error(`❌ Failed to delete MUX asset: ${muxError.message}`);
                // Continue with database deletion even if MUX deletion fails
                logger.warning('⚠️ Continuing with database deletion...');
            }
        } else {
            logger.info('ℹ️ No MUX asset to delete (no assetId)');
        }

        // Delete from database
        await Video.findByIdAndDelete(videoId);
        logger.success(`✅ Video deleted from database: ${videoId}`);

        res.status(200).json({ 
            message: 'Video deleted successfully',
            deletedVideo: {
                id: video._id,
                title: video.title,
                assetId: video.assetId
            }
        });
    } catch (error) {
        logger.error(`❌ Error deleting video ${videoId}: ${error.message}`);
        logger.error(`Stack: ${error.stack}`);
        res.status(500).json({ 
            message: 'Error deleting video', 
            error: error.message 
        });
    }
};
