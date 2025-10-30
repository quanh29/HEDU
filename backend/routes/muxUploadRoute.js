import express from 'express';
import { 
    createDirectUpload, 
    handleMuxWebhook,
    getUploadStatus
} from '../controllers/muxUploadController.js';

const muxUploadRouter = express.Router();

// Tạo direct upload URL
muxUploadRouter.post('/create-upload', createDirectUpload);

// Webhook từ MUX (không cần auth middleware)
muxUploadRouter.post('/webhook', (req, res, next) => {
    console.log('🔔 Webhook received at:', new Date().toISOString());
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body (raw):', req.body);
    next();
}, express.raw({ type: 'application/json' }), handleMuxWebhook);

// Lấy trạng thái upload
muxUploadRouter.get('/status/:videoId', getUploadStatus);

export default muxUploadRouter;
