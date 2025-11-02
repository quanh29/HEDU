import Mux from '@mux/mux-node';
import Video from '../models/video.js';
import logger from '../utils/logger.js';

// Khởi tạo Mux client với destructuring
const { video } = new Mux({
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_SECRET_KEY
});

/**
 * Tạo direct upload URL cho video
 */
export const createDirectUpload = async (req, res) => {
    let { lessonTitle, sectionId } = req.body;

    try {
        // Tạo lessonTitle tạm thời nếu trống
        if (!lessonTitle || lessonTitle.trim() === '') {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            lessonTitle = `Untitled Video ${timestamp}`;
            logger.warning(`No lessonTitle provided, using temporary title: ${lessonTitle}`);
        }
        
        logger.info(`Creating MUX upload for: ${lessonTitle}`);
        logger.debug(`Section ID: ${sectionId}`);
        
        // Log credentials status
        logger.envCheck('MUX_TOKEN_ID', process.env.MUX_TOKEN_ID);
        logger.envCheck('MUX_SECRET_KEY', process.env.MUX_SECRET_KEY);

        // Validate input - chỉ cần sectionId
        if (!sectionId) {
            logger.error('Missing required field: sectionId');
            return res.status(400).json({ 
                message: 'Missing required field: sectionId' 
            });
        }

        // Tạo direct upload trong MUX
        const upload = await video.uploads.create({
            new_asset_settings: {
                playback_policy: ['signed'], // Private video với signed URLs
                encoding_tier: 'baseline',
                max_resolution_tier: '1080p'
            },
            cors_origin: '*', // Hoặc chỉ định domain cụ thể: process.env.FRONTEND_URL
            test: false
        });

        logger.success(`MUX upload created: ${upload.id}`);
        logger.debug(`Upload URL: ${upload.url}`);

        // Lưu thông tin upload vào database (trạng thái pending)
        const videoDoc = new Video({
            section: sectionId,
            title: lessonTitle,
            uploadId: upload.id,
            assetId: '', // Sẽ được cập nhật khi webhook nhận asset_created
            status: 'uploading',
            order: 0 // Sẽ được cập nhật sau
        });
        await videoDoc.save();

        logger.success(`Video document created: ${videoDoc._id}`);
        logger.info(`🔗 Mapping created:`);
        logger.info(`   Video ID: ${videoDoc._id}`);
        logger.info(`   Upload ID: ${upload.id}`);
        logger.info(`   Title: ${videoDoc.title}`);
        logger.info(`   Section: ${videoDoc.section}`);
        logger.info(`   Initial Status: ${videoDoc.status}`);
        logger.info(`   Initial AssetId: ${videoDoc.assetId || '(empty)'}`);
        logger.info(`   Created At: ${videoDoc.createdAt}`);

        res.status(200).json({
            uploadUrl: upload.url,
            uploadId: upload.id,
            videoId: videoDoc._id,
            assetId: '' // Tạm thời trống, sẽ có sau khi upload xong
        });
    } catch (error) {
        logger.error('Failed to create upload URL');
        logger.error(`Error: ${error.message}`);
        
        if (error.response) {
            logger.error(`Status: ${error.response.status}`);
            logger.error(`Response: ${JSON.stringify(error.response.data)}`);
        }
        
        res.status(500).json({ 
            message: 'Failed to create upload URL', 
            error: error.message,
            details: error.response?.data || error.toString()
        });
    }
};

/**
 * Webhook từ MUX khi video upload hoàn tất
 */
export const handleMuxWebhook = async (req, res) => {
    // Parse body nếu là raw
    let event;
    try {
        if (Buffer.isBuffer(req.body)) {
            const bodyStr = req.body.toString();
            logger.debug(`Raw body string: ${bodyStr.substring(0, 200)}...`);
            event = JSON.parse(bodyStr);
        } else if (typeof req.body === 'string') {
            logger.debug(`String body: ${req.body.substring(0, 200)}...`);
            event = JSON.parse(req.body);
        } else {
            event = req.body;
        }
    } catch (error) {
        logger.error('Failed to parse webhook body');
        logger.error(`Error: ${error.message}`);
        logger.error(`Body type: ${typeof req.body}`);
        logger.error(`Body: ${req.body}`);
        return res.status(400).json({ error: 'Invalid JSON' });
    }

    logger.section('MUX Webhook Received');
    logger.muxEvent(event.type, event.data);
    logger.debug(`Full event: ${JSON.stringify(event, null, 2)}`);

    try {
        // Xử lý các event types khác nhau
        switch (event.type) {
            case 'video.upload.asset_created':
                // Upload hoàn tất, asset đã được tạo
                await handleUploadComplete(event.data);
                break;

            case 'video.asset.ready':
                // Video đã encode xong, sẵn sàng để phát
                await handleAssetReady(event.data);
                break;

            case 'video.asset.errored':
                // Upload hoặc encoding bị lỗi
                await handleAssetError(event.data);
                break;

            case 'video.upload.errored':
                // Upload bị lỗi
                await handleUploadError(event.data);
                break;

            case 'video.upload.cancelled':
                // Upload bị hủy
                await handleUploadCancelled(event.data);
                break;

            default:
                logger.warning(`Unhandled webhook event: ${event.type}`);
        }

        // Luôn trả về 200 OK để MUX biết webhook đã được nhận
        logger.success('Webhook processed successfully');
        res.status(200).json({ received: true });
    } catch (error) {
        logger.error(`Error handling webhook: ${error.message}`);
        logger.error(`Stack: ${error.stack}`);
        // Vẫn trả về 200 để tránh MUX retry liên tục
        res.status(200).json({ received: true, error: error.message });
    }
};

/**
 * Handler: Upload hoàn tất, asset đã được tạo
 */
async function handleUploadComplete(data) {
    // MUX webhook có thể gửi upload_id hoặc id
    const upload_id = data.upload_id || data.id;
    const asset_id = data.asset_id;
    
    logger.success(`Upload complete - Upload ID: ${upload_id}, Asset ID: ${asset_id}`);
    logger.debug(`Full webhook data: ${JSON.stringify(data, null, 2)}`);
    
    // Validate required fields
    if (!upload_id) {
        logger.error(`❌ Missing upload_id in webhook data!`);
        logger.error(`   Available fields: ${Object.keys(data).join(', ')}`);
        return;
    }
    
    if (!asset_id) {
        logger.error(`❌ Missing asset_id in webhook data!`);
        return;
    }
    
    logger.info(`🔍 Searching for video with uploadId: ${upload_id}`);

    try {
        // Tìm video document theo uploadId
        const video = await Video.findOne({ uploadId: upload_id });
        
        if (!video) {
            logger.error(`❌ Video not found for upload_id: ${upload_id}`);
            logger.error(`🔍 This could mean:`);
            logger.error(`   1. Video was not created in database`);
            logger.error(`   2. UploadId mismatch`);
            logger.error(`   3. Video was deleted`);
            
            // List recent videos to help debug
            const recentVideos = await Video.find().sort({ createdAt: -1 }).limit(5).select('_id title uploadId assetId status createdAt');
            logger.info(`📋 Recent videos in database:`);
            recentVideos.forEach(v => {
                logger.info(`   - ${v._id}: ${v.title}`);
                logger.info(`     uploadId: ${v.uploadId || '(empty)'}`);
                logger.info(`     assetId: ${v.assetId || '(empty)'}`);
                logger.info(`     status: ${v.status}`);
                logger.info(`     created: ${v.createdAt}`);
            });
            return;
        }

        logger.success(`✅ Found video: ${video._id} (${video.title})`);
        logger.info(`   Current status: ${video.status}`);
        logger.info(`   Current assetId: ${video.assetId || '(empty)'}`);
        logger.info(`   Current uploadId: ${video.uploadId}`);
        logger.info(`   Created at: ${video.createdAt}`);

        // Verify upload_id matches
        if (video.uploadId !== upload_id) {
            logger.error(`⚠️ WARNING: UploadId mismatch!`);
            logger.error(`   Expected: ${upload_id}`);
            logger.error(`   Found: ${video.uploadId}`);
            return;
        }

        // Check if assetId already set (duplicate webhook)
        if (video.assetId && video.assetId !== '') {
            logger.warning(`⚠️ AssetId already set for this video!`);
            logger.warning(`   Current assetId: ${video.assetId}`);
            logger.warning(`   New assetId: ${asset_id}`);
            
            if (video.assetId === asset_id) {
                logger.info(`✅ Same assetId - this is a duplicate webhook, skipping update`);
                return;
            } else {
                logger.error(`❌ Different assetId - this is wrong! Updating anyway...`);
            }
        }

        // Lưu giá trị cũ
        const oldAssetId = video.assetId;
        const oldStatus = video.status;

        // Cập nhật asset_id và status
        video.assetId = asset_id;
        video.status = 'processing';
        
        logger.info(`📝 Updating video:`);
        logger.info(`   assetId: ${oldAssetId || '(empty)'} → ${video.assetId}`);
        logger.info(`   status: ${oldStatus} → ${video.status}`);

        await video.save();

        logger.success(`💾 Video saved successfully!`);
        logger.success(`Updated video ${video._id}: asset_id=${asset_id}, status=processing`);
        
        // Verify update
        const verifyVideo = await Video.findById(video._id);
        logger.info(`🔍 Verification:`);
        logger.info(`   assetId in DB: ${verifyVideo.assetId}`);
        logger.info(`   status in DB: ${verifyVideo.status}`);
        logger.info(`   updatedAt: ${verifyVideo.updatedAt}`);
        
        if (verifyVideo.assetId === asset_id) {
            logger.success(`✅ AssetId verified successfully!`);
        } else {
            logger.error(`❌ AssetId verification FAILED!`);
            logger.error(`   Expected: ${asset_id}`);
            logger.error(`   Got: ${verifyVideo.assetId}`);
        }
        
        logger.info(`✅ Video upload completed successfully!`);
        
    } catch (error) {
        logger.error(`❌ Error in handleUploadComplete: ${error.message}`);
        logger.error(`Stack: ${error.stack}`);
        throw error;
    }
}

/**
 * Handler: Video đã encode xong, sẵn sàng phát
 */
async function handleAssetReady(data) {
    const { id: asset_id, playback_ids, duration } = data;
    
    logger.success(`Asset ready - Asset ID: ${asset_id}`);
    logger.debug(`Duration: ${duration}s, Playback IDs: ${JSON.stringify(playback_ids)}`);
    logger.info(`🔍 Searching for video with assetId: ${asset_id}`);

    try {
        // Tìm video document theo assetId
        const video = await Video.findOne({ assetId: asset_id });
        
        if (!video) {
            logger.error(`❌ Video not found for asset_id: ${asset_id}`);
            
            // List recent videos to help debug
            const recentVideos = await Video.find().sort({ createdAt: -1 }).limit(3).select('_id title assetId status');
            logger.info(`📋 Recent videos in database:`);
            recentVideos.forEach(v => {
                logger.info(`   - ${v._id}: ${v.title}`);
                logger.info(`     assetId: ${v.assetId || '(empty)'}, status: ${v.status}`);
            });
            return;
        }

        logger.success(`✅ Found video: ${video._id} (${video.title})`);
        logger.info(`   Current status: ${video.status}`);
        logger.info(`   Current playbackId: ${video.playbackId || '(empty)'}`);
        logger.info(`   Current duration: ${video.duration || '(empty)'}`);

        // Lưu giá trị cũ để so sánh
        const oldStatus = video.status;
        const oldPlaybackId = video.playbackId;
        const oldDuration = video.duration;

        // Cập nhật thông tin video
        video.status = 'ready';
        video.duration = duration || 0; // Thời lượng video (giây)
        
        // Lưu playback_id (dùng để phát video)
        if (playback_ids && playback_ids.length > 0) {
            video.playbackId = playback_ids[0].id;
            logger.info(`📹 Setting Playback ID: ${playback_ids[0].id}`);
        } else {
            logger.warning(`⚠️ No playback_ids in webhook data!`);
        }

        logger.info(`📝 Attempting to save video with:`);
        logger.info(`   status: ${oldStatus} → ${video.status}`);
        logger.info(`   duration: ${oldDuration} → ${video.duration}`);
        logger.info(`   playbackId: ${oldPlaybackId || '(empty)'} → ${video.playbackId || '(empty)'}`);

        // Save to database
        const savedVideo = await video.save();

        // Verify save
        logger.success(`💾 Video saved successfully!`);
        logger.info(`✅ Verification after save:`);
        logger.info(`   _id: ${savedVideo._id}`);
        logger.info(`   status: ${savedVideo.status}`);
        logger.info(`   duration: ${savedVideo.duration}`);
        logger.info(`   playbackId: ${savedVideo.playbackId}`);
        logger.info(`   updatedAt: ${savedVideo.updatedAt}`);

        // Double check by querying again
        const verifyVideo = await Video.findById(savedVideo._id);
        logger.info(`🔍 Double-check query result:`);
        logger.info(`   status: ${verifyVideo.status}`);
        logger.info(`   playbackId: ${verifyVideo.playbackId}`);

        logger.success(`✅ Video ${video._id} is ready to play!`);
        logger.info(`🎉 Video processing completed successfully!`);
        
    } catch (error) {
        logger.error(`❌ Error in handleAssetReady: ${error.message}`);
        logger.error(`Stack: ${error.stack}`);
        throw error;
    }
}

/**
 * Handler: Asset bị lỗi
 */
async function handleAssetError(data) {
    const { id: asset_id } = data;
    
    logger.error(`Asset error - Asset ID: ${asset_id}`);
    logger.debug(`Error data: ${JSON.stringify(data)}`);

    const video = await Video.findOne({ assetId : asset_id });
    
    if (video) {
        video.status = 'error';
        await video.save();
        logger.warning(`Video ${video._id} marked as error`);
    } else {
        logger.error(`Video not found for asset_id: ${asset_id}`);
    }
}

/**
 * Handler: Upload bị lỗi
 */
async function handleUploadError(data) {
    const { upload_id } = data;
    
    logger.error(`Upload error - Upload ID: ${upload_id}`);
    logger.debug(`Error data: ${JSON.stringify(data)}`);

    const video = await Video.findOne({ uploadId: upload_id });
    
    if (video) {
        video.status = 'error';
        await video.save();
        logger.warning(`Video ${video._id} marked as error`);
    } else {
        logger.error(`Video not found for upload_id: ${upload_id}`);
    }
}

/**
 * Handler: Upload bị hủy
 */
async function handleUploadCancelled(data) {
    const { upload_id } = data;
    
    logger.warning(`Upload cancelled - Upload ID: ${upload_id}`);

    const video = await Video.findOne({ uploadId: upload_id });
    
    if (video) {
        video.status = 'cancelled';
        await video.save();
        logger.info(`Video ${video._id} marked as cancelled`);
    } else {
        logger.error(`Video not found for upload_id: ${upload_id}`);
    }
}

/**
 * Lấy trạng thái upload của video
 */
export const getUploadStatus = async (req, res) => {
    const { videoId } = req.params;

    try {
        logger.debug(`📊 Status check for video: ${videoId}`);
        
        const video = await Video.findById(videoId).select('status playbackId uploadId assetId title');
        
        if (!video) {
            logger.warning(`❌ Video not found: ${videoId}`);
            return res.status(404).json({ message: 'Video not found' });
        }

        const response = {
            videoId: video._id,
            status: video.status,
            assetId: video.assetId || '',
            playbackId: video.playbackId || '',
            uploadId: video.uploadId || ''
        };

        logger.debug(`✅ Video status: ${video.status}, Title: ${video.title}`);
        logger.debug(`   Asset ID: ${video.assetId || '(empty)'}`);
        logger.debug(`   Playback ID: ${video.playbackId || '(empty)'}`);

        res.status(200).json(response);
    } catch (error) {
        logger.error(`Error getting upload status for ${videoId}:`, error);
        res.status(500).json({ 
            message: 'Failed to get upload status', 
            error: error.message 
        });
    }
};

/**
 * Debug endpoint: List all videos
 */
export const listAllVideos = async (req, res) => {
    try {
        const videos = await Video.find()
            .sort({ createdAt: -1 })
            .limit(20)
            .select('_id title status uploadId assetId playbackId section createdAt updatedAt');
        
        const summary = {
            total: videos.length,
            byStatus: {},
            videos: videos.map(v => ({
                id: v._id,
                title: v.title,
                status: v.status,
                uploadId: v.uploadId?.substring(0, 30) + '...',
                assetId: v.assetId || '(empty)',
                playbackId: v.playbackId || '(empty)',
                section: v.section,
                createdAt: v.createdAt,
                updatedAt: v.updatedAt
            }))
        };

        // Count by status
        videos.forEach(v => {
            summary.byStatus[v.status] = (summary.byStatus[v.status] || 0) + 1;
        });

        res.status(200).json(summary);
    } catch (error) {
        logger.error('Error listing videos:', error);
        res.status(500).json({ 
            message: 'Failed to list videos', 
            error: error.message 
        });
    }
};

/**
 * Cancel upload - delete upload from MUX
 */
export const cancelUpload = async (req, res) => {
    const { uploadId } = req.params;

    try {
        logger.info(`🛑 Cancelling upload: ${uploadId}`);
        
        // Find video by uploadId
        const videoDoc = await Video.findOne({ uploadId });
        
        if (!videoDoc) {
            logger.warning(`Video not found for uploadId: ${uploadId}`);
            return res.status(404).json({ message: 'Video not found' });
        }

        logger.info(`   Video ID: ${videoDoc._id}`);
        logger.info(`   Title: ${videoDoc.title}`);
        logger.info(`   Status: ${videoDoc.status}`);
        logger.info(`   Asset ID: ${videoDoc.assetId || '(none)'}`);

        // Cancel upload in MUX if still in uploading state
        try {
            await video.uploads.cancel(uploadId);
            logger.success(`✅ MUX upload cancelled: ${uploadId}`);
        } catch (muxError) {
            logger.warning(`⚠️ Could not cancel MUX upload: ${muxError.message}`);
            // Continue with deletion even if cancel fails
        }

        // Delete the asset if it was created
        if (videoDoc.assetId && videoDoc.assetId !== '') {
            try {
                await video.assets.delete(videoDoc.assetId);
                logger.success(`✅ MUX asset deleted: ${videoDoc.assetId}`);
            } catch (muxError) {
                logger.warning(`⚠️ Could not delete MUX asset: ${muxError.message}`);
            }
        }

        // Delete video document from database
        await Video.findByIdAndDelete(videoDoc._id);
        logger.success(`✅ Video document deleted: ${videoDoc._id}`);

        res.status(200).json({ 
            message: 'Upload cancelled successfully',
            videoId: videoDoc._id
        });
    } catch (error) {
        logger.error(`Error cancelling upload: ${error.message}`);
        logger.error(`Stack: ${error.stack}`);
        res.status(500).json({ 
            message: 'Failed to cancel upload', 
            error: error.message 
        });
    }
};
