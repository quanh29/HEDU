import express from 'express';
import { 
    createDirectUpload, 
    handleMuxWebhook,
    getUploadStatus,
    listAllVideos,
    cancelUpload
} from '../controllers/muxUploadController.js';

const muxUploadRouter = express.Router();

// Tạo direct upload URL
muxUploadRouter.post('/create-upload', createDirectUpload);

// Webhook từ MUX (không cần auth middleware)
// Raw body đã được xử lý ở server.js, không cần thêm middleware
muxUploadRouter.post('/webhook', (req, res, next) => {
    console.log('🔔 Webhook received at:', new Date().toISOString());
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body type:', typeof req.body);
    console.log('Body length:', req.body?.length || 0);
    next();
}, handleMuxWebhook);

// Lấy trạng thái upload
muxUploadRouter.get('/status/:videoId', getUploadStatus);

// Cancel upload
muxUploadRouter.delete('/cancel-upload/:uploadId', cancelUpload);

// Debug: List all videos
muxUploadRouter.get('/debug/list-videos', listAllVideos);

export default muxUploadRouter;
