import Mux from '@mux/mux-node';
import Video from '../models/video.js';
import VideoDraft from '../models/VideoDraft.js';
import LessonDraft from '../models/LessonDraft.js';
import CourseDraft from '../models/CourseDraft.js';
import logger from '../utils/logger.js';
import { getAuth } from '@clerk/express';
import { io } from '../server.js';
import { emitVideoStatusUpdate } from '../sockets/videoSocket.js';

// Khởi tạo Mux client với destructuring
const { video } = new Mux({
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_SECRET_KEY
});

/**
 * Tạo direct upload URL cho video
 */
export const createDirectUpload = async (req, res) => {
    let { lessonTitle, sectionId, lessonId } = req.body;

    try {
        // Get userId from Clerk authentication
        const { userId } = getAuth(req);
        
        if (!userId) {
            logger.error('Unauthorized: No userId found');
            return res.status(401).json({ 
                message: 'Unauthorized: User must be authenticated' 
            });
        }

        logger.info(`User ${userId} creating upload`);

        // Tạo lessonTitle tạm thời nếu trống
        if (!lessonTitle || lessonTitle.trim() === '') {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            lessonTitle = `Untitled Video ${timestamp}`;
            logger.warning(`No lessonTitle provided, using temporary title: ${lessonTitle}`);
        }
        
        logger.info(`Creating MUX upload for: ${lessonTitle}`);
        logger.debug(`Section ID: ${sectionId}`);
        logger.debug(`Lesson ID: ${lessonId}`);
        
        // Log credentials status
        logger.envCheck('MUX_TOKEN_ID', process.env.MUX_TOKEN_ID);
        logger.envCheck('MUX_SECRET_KEY', process.env.MUX_SECRET_KEY);

        // Validate input - cần cả sectionId và lessonId
        if (!sectionId || !lessonId) {
            logger.error('Missing required fields: sectionId and lessonId');
            return res.status(400).json({ 
                message: 'Missing required fields: sectionId and lessonId' 
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

        // Check if lesson is a draft lesson OR a regular lesson (for MySQL draft courses)
        const lessonDraft = await LessonDraft.findById(lessonId);
        
        if (lessonDraft) {
            // CASE 1: Lesson is a draft (from approved course with draft system)
            logger.info('📝 Creating video for DRAFT lesson (approved course with changes)');
            
            // Get course draft ID
            const courseDraftId = lessonDraft.courseDraftId;
            
            // Create VideoDraft instead of Video
            const videoDraft = new VideoDraft({
                publishedVideoId: null, // New video, no published version yet
                courseDraftId: courseDraftId,
                draftLessonId: lessonId,
                title: lessonTitle,
                userId: userId,
                uploadId: upload.id,
                assetId: '', // Sẽ được cập nhật khi webhook nhận asset_created
                status: 'uploading',
                order: lessonDraft.order || 1,
                changeType: 'new'
            });
            await videoDraft.save();

            logger.success(`VideoDraft created: ${videoDraft._id}`);
            
            // Link video draft với lesson draft
            lessonDraft.draftVideoId = videoDraft._id;
            await lessonDraft.save();
            logger.success(`Linked VideoDraft ${videoDraft._id} to LessonDraft ${lessonId}`);
            
            // Add to course draft's draftVideos array
            const courseDraft = await CourseDraft.findById(courseDraftId);
            if (courseDraft && !courseDraft.draftVideos.includes(videoDraft._id)) {
                courseDraft.draftVideos.push(videoDraft._id);
                await courseDraft.save();
                logger.success(`Added VideoDraft to CourseDraft ${courseDraftId}`);
            }

            logger.info(`🔗 Draft Mapping created:`);
            logger.info(`   VideoDraft ID: ${videoDraft._id}`);
            logger.info(`   CourseDraft ID: ${courseDraftId}`);
            logger.info(`   LessonDraft ID: ${lessonId}`);
            logger.info(`   User ID: ${videoDraft.userId}`);
            logger.info(`   Upload ID: ${upload.id}`);
            logger.info(`   Title: ${videoDraft.title}`);
            logger.info(`   Initial Status: ${videoDraft.status}`);
            logger.info(`   Created At: ${videoDraft.createdAt}`);

            res.status(200).json({
                uploadUrl: upload.url,
                uploadId: upload.id,
                videoId: videoDraft._id,
                assetId: '' // Tạm thời trống, sẽ có sau khi upload xong
            });
        } else {
            // CASE 2: Regular lesson (for draft/pending/rejected courses from MySQL)
            logger.info('📚 Creating video for REGULAR lesson (MySQL draft course)');
            
            const Lesson = (await import('../models/Lesson.js')).default;
            const lesson = await Lesson.findById(lessonId);
            
            if (!lesson) {
                logger.error(`Lesson ${lessonId} not found (neither draft nor regular)`);
                return res.status(404).json({ message: 'Lesson not found' });
            }
            
            // Create regular Video for regular lesson
            const video = new Video({
                lesson: lessonId,
                title: lessonTitle,
                userId: userId,
                uploadId: upload.id,
                assetId: '', // Sẽ được cập nhật khi webhook nhận asset_created
                status: 'uploading',
                order: lesson.order || 1,
                description: lessonTitle
            });
            await video.save();

            logger.success(`Video created: ${video._id}`);
            
            // Link video với lesson
            lesson.video = video._id;
            await lesson.save();
            logger.success(`Linked Video ${video._id} to Lesson ${lessonId}`);

            logger.info(`🔗 Regular Video Mapping created:`);
            logger.info(`   Video ID: ${video._id}`);
            logger.info(`   Lesson ID: ${lessonId}`);
            logger.info(`   User ID: ${video.userId}`);
            logger.info(`   Upload ID: ${upload.id}`);
            logger.info(`   Title: ${video.title}`);
            logger.info(`   Initial Status: ${video.status}`);
            logger.info(`   Created At: ${video.createdAt}`);

            res.status(200).json({
                uploadUrl: upload.url,
                uploadId: upload.id,
                videoId: video._id,
                assetId: '' // Tạm thời trống, sẽ có sau khi upload xong
            });
        }
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
 * Helper: Tìm video theo uploadId (hỗ trợ cả VideoDraft và Video)
 */
async function findVideoByUploadId(upload_id) {
    // Try to find VideoDraft first (for approved courses with draft system)
    let videoDraft = await VideoDraft.findOne({ uploadId: upload_id });
    
    if (videoDraft) {
        logger.info(`✅ Found VideoDraft: ${videoDraft._id}`);
        return { video: videoDraft, isDraft: true };
    }
    
    // If not found, try regular Video (for MySQL draft courses)
    let video = await Video.findOne({ uploadId: upload_id });
    
    if (video) {
        logger.info(`✅ Found Video: ${video._id}`);
        return { video: video, isDraft: false };
    }
    
    // Not found
    logger.error(`❌ Video not found for upload_id: ${upload_id}`);
    
    // List recent videos to help debug
    const recentVideoDrafts = await VideoDraft.find().sort({ createdAt: -1 }).limit(3).select('_id title uploadId status');
    const recentVideos = await Video.find().sort({ createdAt: -1 }).limit(3).select('_id title uploadId status');
    
    logger.info(`📋 Recent VideoDrafts:`);
    recentVideoDrafts.forEach(v => logger.info(`   - ${v._id}: ${v.title} (${v.uploadId})`));
    
    logger.info(`📋 Recent Videos:`);
    recentVideos.forEach(v => logger.info(`   - ${v._id}: ${v.title} (${v.uploadId})`));
    
    return { video: null, isDraft: null };
}

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
        // Find video (draft or regular)
        const { video, isDraft } = await findVideoByUploadId(upload_id);
        
        if (!video) {
            return; // Error already logged in helper
        }

        logger.success(`✅ Found ${isDraft ? 'VideoDraft' : 'Video'}: ${video._id} (${video.title})`);
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
            logger.warning(`⚠️ AssetId already set!`);
            logger.warning(`   Current assetId: ${video.assetId}`);
            logger.warning(`   New assetId: ${asset_id}`);
            
            if (video.assetId === asset_id) {
                logger.info(`✅ Same assetId - duplicate webhook, skipping`);
                return;
            } else {
                logger.error(`❌ Different assetId - updating anyway...`);
            }
        }

        // Lưu giá trị cũ
        const oldAssetId = video.assetId;
        const oldStatus = video.status;

        // Cập nhật asset_id và status
        video.assetId = asset_id;
        video.status = 'processing';
        
        logger.info(`📝 Updating ${isDraft ? 'VideoDraft' : 'Video'}:`);
        logger.info(`   assetId: ${oldAssetId || '(empty)'} → ${video.assetId}`);
        logger.info(`   status: ${oldStatus} → ${video.status}`);

        await video.save();

        logger.success(`💾 ${isDraft ? 'VideoDraft' : 'Video'} saved successfully!`);
        logger.success(`Updated ${video._id}: asset_id=${asset_id}, status=processing`);
        
        // Emit real-time update via WebSocket
        emitVideoStatusUpdate(io, video.userId, {
            videoId: video._id.toString(),
            status: 'processing',
            assetId: asset_id,
        });
        
        // Verify update
        const Model = isDraft ? VideoDraft : Video;
        const verifyVideo = await Model.findById(video._id);
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
        
        logger.info(`✅ Upload completed successfully!`);
        
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
        // Try VideoDraft first
        let videoDraft = await VideoDraft.findOne({ assetId: asset_id });
        let video = null;
        let isDraft = true;
        
        if (!videoDraft) {
            // Try regular Video
            video = await Video.findOne({ assetId: asset_id });
            isDraft = false;
            
            if (!video) {
                logger.error(`❌ Video not found for asset_id: ${asset_id}`);
                
                // List recent videos to help debug
                const recentVideoDrafts = await VideoDraft.find().sort({ createdAt: -1 }).limit(3).select('_id title assetId status');
                const recentVideos = await Video.find().sort({ createdAt: -1 }).limit(3).select('_id title assetId status');
                
                logger.info(`📋 Recent VideoDrafts:`);
                recentVideoDrafts.forEach(v => logger.info(`   - ${v._id}: ${v.title} (${v.assetId})`))
                
                logger.info(`📋 Recent Videos:`);
                recentVideos.forEach(v => logger.info(`   - ${v._id}: ${v.title} (${v.assetId})`));
                return;
            }
        }
        
        const targetVideo = videoDraft || video;
        
        logger.success(`✅ Found ${isDraft ? 'VideoDraft' : 'Video'}: ${targetVideo._id} (${targetVideo.title})`);
        logger.info(`   Current status: ${targetVideo.status}`);
        logger.info(`   Current playbackId: ${targetVideo.playbackId || '(empty)'}`);
        logger.info(`   Current duration: ${targetVideo.duration || '(empty)'}`)

        // Lưu giá trị cũ
        const oldStatus = targetVideo.status;
        const oldPlaybackId = targetVideo.playbackId;
        const oldDuration = targetVideo.duration;

        // Cập nhật thông tin
        targetVideo.status = 'ready';
        targetVideo.duration = duration || 0;
        
        // Lưu playback_id
        if (playback_ids && playback_ids.length > 0) {
            targetVideo.playbackId = playback_ids[0].id;
            logger.info(`📹 Setting Playback ID: ${playback_ids[0].id}`);
        } else {
            logger.warning(`⚠️ No playback_ids in webhook data!`);
        }

        logger.info(`📝 Attempting to save ${isDraft ? 'VideoDraft' : 'Video'} with:`);
        logger.info(`   status: ${oldStatus} → ${targetVideo.status}`);
        logger.info(`   duration: ${oldDuration} → ${targetVideo.duration}`);
        logger.info(`   playbackId: ${oldPlaybackId || '(empty)'} → ${targetVideo.playbackId || '(empty)'}`)

        // Save
        const savedVideo = await targetVideo.save();

        logger.success(`💾 ${isDraft ? 'VideoDraft' : 'Video'} saved successfully!`);
        logger.info(`✅ Verification after save:`);
        logger.info(`   _id: ${savedVideo._id}`);
        logger.info(`   status: ${savedVideo.status}`);
        logger.info(`   duration: ${savedVideo.duration}`);
        logger.info(`   playbackId: ${savedVideo.playbackId}`);
        logger.info(`   updatedAt: ${savedVideo.updatedAt}`);

        // Emit real-time update
        emitVideoStatusUpdate(io, targetVideo.userId, {
            videoId: targetVideo._id.toString(),
            status: 'ready',
            assetId: targetVideo.assetId,
            playbackId: targetVideo.playbackId,
            duration: targetVideo.duration,
            contentUrl: `https://stream.mux.com/${targetVideo.playbackId}.m3u8`,
        });

        // Verify
        const Model = isDraft ? VideoDraft : Video;
        const verifyVideo = await Model.findById(savedVideo._id);
        logger.info(`🔍 Double-check query result:`);
        logger.info(`   status: ${verifyVideo.status}`);
        logger.info(`   playbackId: ${verifyVideo.playbackId}`);

        logger.success(`✅ ${isDraft ? 'VideoDraft' : 'Video'} ${targetVideo._id} is ready to play!`);
        logger.info(`🎉 Video processing completed successfully!`)
        
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

    // Try VideoDraft first
    let videoDraft = await VideoDraft.findOne({ assetId : asset_id });
    let isDraft = true;
    
    if (!videoDraft) {
        // Try regular Video
        videoDraft = await Video.findOne({ assetId: asset_id });
        isDraft = false;
    }
    
    if (videoDraft) {
        videoDraft.status = 'error';
        await videoDraft.save();
        logger.warning(`${isDraft ? 'VideoDraft' : 'Video'} ${videoDraft._id} marked as error`);
        
        // Emit real-time update via WebSocket
        emitVideoStatusUpdate(io, videoDraft.userId, {
            videoId: videoDraft._id.toString(),
            status: 'error',
            error: 'Asset processing failed',
        });
    } else {
        logger.error(`VideoDraft not found for asset_id: ${asset_id}`);
    }
}

/**
 * Handler: Upload bị lỗi
 */
async function handleUploadError(data) {
    const { upload_id } = data;
    
    logger.error(`Upload error - Upload ID: ${upload_id}`);
    logger.debug(`Error data: ${JSON.stringify(data)}`);

    // Try VideoDraft first
    let videoDraft = await VideoDraft.findOne({ uploadId: upload_id });
    let isDraft = true;
    
    if (!videoDraft) {
        // Try regular Video
        videoDraft = await Video.findOne({ uploadId: upload_id });
        isDraft = false;
    }
    
    if (videoDraft) {
        videoDraft.status = 'error';
        await videoDraft.save();
        logger.warning(`${isDraft ? 'VideoDraft' : 'Video'} ${videoDraft._id} marked as error`);
        
        // Emit real-time update via WebSocket
        emitVideoStatusUpdate(io, videoDraft.userId, {
            videoId: videoDraft._id.toString(),
            status: 'error',
            error: 'Upload failed',
        });
    } else {
        logger.error(`VideoDraft not found for upload_id: ${upload_id}`);
    }
}

/**
 * Handler: Upload bị hủy
 */
async function handleUploadCancelled(data) {
    const { upload_id } = data;
    
    logger.warning(`Upload cancelled - Upload ID: ${upload_id}`);

    // Try VideoDraft first
    let videoDraft = await VideoDraft.findOne({ uploadId: upload_id });
    let isDraft = true;
    
    if (!videoDraft) {
        // Try regular Video
        videoDraft = await Video.findOne({ uploadId: upload_id });
        isDraft = false;
    }
    
    if (videoDraft) {
        videoDraft.status = 'cancelled';
        await videoDraft.save();
        logger.info(`${isDraft ? 'VideoDraft' : 'Video'} ${videoDraft._id} marked as cancelled`);
        
        // Emit real-time update via WebSocket
        emitVideoStatusUpdate(io, videoDraft.userId, {
            videoId: videoDraft._id.toString(),
            status: 'cancelled',
        });
    } else {
        logger.error(`VideoDraft not found for upload_id: ${upload_id}`);
    }
}

/**
 * Lấy trạng thái upload của video
 */
export const getUploadStatus = async (req, res) => {
    const { videoId } = req.params;

    try {
        logger.debug(`📊 Status check for video: ${videoId}`);
        
        // Try VideoDraft first
        let videoDraft = await VideoDraft.findById(videoId).select('status playbackId uploadId assetId title');
        let isDraft = true;
        
        if (!videoDraft) {
            // Try regular Video
            videoDraft = await Video.findById(videoId).select('status playbackId uploadId assetId title');
            isDraft = false;
        }
        
        if (!videoDraft) {
            logger.warning(`❌ Video not found: ${videoId}`);
            return res.status(404).json({ message: 'Video not found' });
        }

        const response = {
            videoId: videoDraft._id,
            status: videoDraft.status,
            assetId: videoDraft.assetId || '',
            playbackId: videoDraft.playbackId || '',
            uploadId: videoDraft.uploadId || ''
        };

        logger.debug(`✅ ${isDraft ? 'VideoDraft' : 'Video'} status: ${videoDraft.status}, Title: ${videoDraft.title}`);
        logger.debug(`   Asset ID: ${videoDraft.assetId || '(empty)'}`);
        logger.debug(`   Playback ID: ${videoDraft.playbackId || '(empty)'}`)

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
        const videoDrafts = await VideoDraft.find()
            .sort({ createdAt: -1 })
            .limit(20)
            .select('_id title status uploadId assetId playbackId courseDraftId createdAt updatedAt');
        
        const videos = await Video.find()
            .sort({ createdAt: -1 })
            .limit(20)
            .select('_id title status uploadId assetId playbackId lesson createdAt updatedAt');
        
        const summary = {
            totalDrafts: videoDrafts.length,
            totalVideos: videos.length,
            byStatus: {},
            drafts: videoDrafts.map(v => ({
                id: v._id,
                title: v.title,
                type: 'draft',
                status: v.status,
                uploadId: v.uploadId?.substring(0, 30) + '...',
                assetId: v.assetId || '(empty)',
                playbackId: v.playbackId || '(empty)',
                courseDraftId: v.courseDraftId,
                createdAt: v.createdAt,
                updatedAt: v.updatedAt
            })),
            videos: videos.map(v => ({
                id: v._id,
                title: v.title,
                type: 'regular',
                status: v.status,
                uploadId: v.uploadId?.substring(0, 30) + '...',
                assetId: v.assetId || '(empty)',
                playbackId: v.playbackId || '(empty)',
                lessonId: v.lesson,
                createdAt: v.createdAt,
                updatedAt: v.updatedAt
            }))
        };

        // Count by status
        [...videoDrafts, ...videos].forEach(v => {
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
        
        // Find video by uploadId (draft or regular)
        let videoDraftDoc = await VideoDraft.findOne({ uploadId });
        let isDraft = true;
        
        if (!videoDraftDoc) {
            videoDraftDoc = await Video.findOne({ uploadId });
            isDraft = false;
        }
        
        if (!videoDraftDoc) {
            logger.warning(`Video not found for uploadId: ${uploadId}`);
            return res.status(404).json({ message: 'Video not found' });
        }

        logger.info(`   ${isDraft ? 'VideoDraft' : 'Video'} ID: ${videoDraftDoc._id}`);
        logger.info(`   Title: ${videoDraftDoc.title}`);
        logger.info(`   Status: ${videoDraftDoc.status}`);
        logger.info(`   Asset ID: ${videoDraftDoc.assetId || '(none)'}`)

        // Cancel upload in MUX if still in uploading state
        try {
            await video.uploads.cancel(uploadId);
            logger.success(`✅ MUX upload cancelled: ${uploadId}`);
        } catch (muxError) {
            logger.warning(`⚠️ Could not cancel MUX upload: ${muxError.message}`);
            // Continue with deletion even if cancel fails
        }

        // Delete the asset if it was created
        if (videoDraftDoc.assetId && videoDraftDoc.assetId !== '') {
            try {
                await video.assets.delete(videoDraftDoc.assetId);
                logger.success(`✅ MUX asset deleted: ${videoDraftDoc.assetId}`);
            } catch (muxError) {
                logger.warning(`⚠️ Could not delete MUX asset: ${muxError.message}`);
            }
        }

        // Delete document from database
        const Model = isDraft ? VideoDraft : Video;
        await Model.findByIdAndDelete(videoDraftDoc._id);
        logger.success(`✅ ${isDraft ? 'VideoDraft' : 'Video'} document deleted: ${videoDraftDoc._id}`);

        res.status(200).json({ 
            message: 'Upload cancelled successfully',
            videoId: videoDraftDoc._id
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
