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
    const { lessonTitle, sectionId } = req.body;

    try {
        logger.info(`Creating MUX upload for: ${lessonTitle}`);
        logger.debug(`Section ID: ${sectionId}`);
        
        // Log credentials status
        logger.envCheck('MUX_TOKEN_ID', process.env.MUX_TOKEN_ID);
        logger.envCheck('MUX_SECRET_KEY', process.env.MUX_SECRET_KEY);

        // Validate input
        if (!lessonTitle || !sectionId) {
            logger.error('Missing required fields');
            return res.status(400).json({ 
                message: 'Missing required fields: lessonTitle and sectionId' 
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
            status: 'uploading',
            order: 0 // Sẽ được cập nhật sau
        });
        await videoDoc.save();

        logger.success(`Video document created: ${videoDoc._id}`);

        res.status(200).json({
            uploadUrl: upload.url,
            uploadId: upload.id,
            videoId: videoDoc._id
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
            event = JSON.parse(req.body.toString());
        } else {
            event = req.body;
        }
    } catch (error) {
        logger.error('Failed to parse webhook body');
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
    const { upload_id, asset_id } = data;
    
    logger.success(`Upload complete - Upload ID: ${upload_id}, Asset ID: ${asset_id}`);

    // Tìm video document theo uploadId
    const video = await Video.findOne({ uploadId: upload_id });
    
    if (!video) {
        logger.error(`Video not found for upload_id: ${upload_id}`);
        return;
    }

    // Cập nhật asset_id và status
    video.contentUrl = asset_id; // Lưu MUX asset ID
    video.status = 'processing'; // Đang encode
    await video.save();

    logger.success(`Updated video ${video._id}: asset_id=${asset_id}, status=processing`);
}

/**
 * Handler: Video đã encode xong, sẵn sàng phát
 */
async function handleAssetReady(data) {
    const { id: asset_id, playback_ids, duration } = data;
    
    logger.success(`Asset ready - Asset ID: ${asset_id}`);
    logger.debug(`Duration: ${duration}s, Playback IDs: ${JSON.stringify(playback_ids)}`);

    // Tìm video document theo contentUrl (asset_id)
    const video = await Video.findOne({ contentUrl: asset_id });
    
    if (!video) {
        logger.error(`Video not found for asset_id: ${asset_id}`);
        return;
    }

    // Cập nhật thông tin video
    video.status = 'ready';
    video.duration = duration; // Thời lượng video (giây)
    
    // Lưu playback_id (dùng để phát video)
    if (playback_ids && playback_ids.length > 0) {
        video.playbackId = playback_ids[0].id;
    }

    await video.save();

    logger.success(`Video ${video._id} is ready to play!`);
    logger.info(`Playback ID: ${video.playbackId}`);
}

/**
 * Handler: Asset bị lỗi
 */
async function handleAssetError(data) {
    const { id: asset_id } = data;
    
    logger.error(`Asset error - Asset ID: ${asset_id}`);
    logger.debug(`Error data: ${JSON.stringify(data)}`);

    const video = await Video.findOne({ contentUrl: asset_id });
    
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
        const video = await Video.findById(videoId).select('status contentUrl playbackId uploadId');
        
        if (!video) {
            return res.status(404).json({ message: 'Video not found' });
        }

        res.status(200).json({
            videoId: video._id,
            status: video.status,
            assetId: video.contentUrl,
            playbackId: video.playbackId,
            uploadId: video.uploadId
        });
    } catch (error) {
        console.error('Error getting upload status:', error);
        res.status(500).json({ 
            message: 'Failed to get upload status', 
            error: error.message 
        });
    }
};
