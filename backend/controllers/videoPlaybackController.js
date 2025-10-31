import Video from "../models/video.js";
import Mux from '@mux/mux-node';
import dotenv from 'dotenv';

dotenv.config();

// Khởi tạo MUX client
const mux = new Mux();

/**
 * Lấy thông tin video playback với signed URL
 * GET /api/videos/playback/:videoId
 */
export const getVideoPlayback = async (req, res) => {
    const { videoId } = req.params;

    try {
        // Kiểm tra credentials
        const keyId = process.env.MUX_SIGNING_KEY_ID;
        const keySecretBase64 = process.env.MUX_SIGNING_PRIVATE_KEY;

        if (!keyId || !keySecretBase64) {
            throw new Error('MUX signing credentials not configured');
        }

        // Giải mã private key từ base64
        let keySecret = Buffer.from(keySecretBase64, 'base64').toString('utf-8');
        
        // Đảm bảo có newlines đúng format (MUX cần line breaks thực sự)
        // Nếu key không có \n thật, thêm vào
        if (!keySecret.includes('\n')) {
            keySecret = keySecret.replace(/-----BEGIN (RSA )?PRIVATE KEY-----/, '-----BEGIN $1PRIVATE KEY-----\n')
                                 .replace(/-----END (RSA )?PRIVATE KEY-----/, '\n-----END $1PRIVATE KEY-----')
                                 .replace(/(.{64})/g, '$1\n')
                                 .replace(/\n\n/g, '\n');
        }

        // Lấy thông tin video từ database
        const video = await Video.findById(videoId);
        
        if (!video) {
            return res.status(404).json({ 
                success: false,
                message: 'Video not found' 
            });
        }

        // Lấy playback ID từ contentUrl
        // contentUrl có thể có format: "mux://playbackId" hoặc chỉ là playbackId
        let playbackId = video.playbackId;
        if (playbackId.startsWith('mux://')) {
            playbackId = playbackId.replace('mux://', '');
        } else if (playbackId.includes('mux.com')) {
            // Nếu là URL đầy đủ, extract playback ID
            const match = playbackId.match(/\/([a-zA-Z0-9]+)\.m3u8/);
            if (match) {
                playbackId = match[1];
            }
        }

        console.log('Signing playback with:', {
            playbackId,
            keyId,
            keySecretLength: keySecret.length,
            keySecretStart: keySecret.substring(0, 60) + '...',
            keySecretEnd: '...' + keySecret.substring(keySecret.length - 60),
            hasNewlines: keySecret.includes('\n'),
            keyType: keySecret.includes('BEGIN RSA PRIVATE KEY') ? 'RSA' : 'PKCS8',
            lineCount: keySecret.split('\n').length
        });

        // Tạo signed token sử dụng MUX SDK
        const token = await mux.jwt.signPlaybackId(playbackId, {
            keyId: keyId,
            keySecret: keySecret,
            expiration: '1h', // Hết hạn sau 1 giờ
            type: 'video'
        });

        // Tạo signed playback URL
        const playbackUrl = `https://stream.mux.com/${playbackId}.m3u8?token=${token}`;

        res.status(200).json({
            success: true,
            data: {
                videoId: video._id,
                title: video.title,
                description: video.description,
                playbackId: playbackId,
                playbackUrl: playbackUrl,
                token: token,
                expiresIn: 3600 // seconds
            }
        });

    } catch (error) {
        console.error('Error getting video playback:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error generating video playback URL', 
            error: error.message 
        });
    }
};

/**
 * Tạo thumbnail URL với signed token
 * GET /api/videos/thumbnail/:videoId
 */
export const getVideoThumbnail = async (req, res) => {
    const { videoId } = req.params;
    const { width, height, time } = req.query;

    try {
        // Kiểm tra credentials
        const keyId = process.env.MUX_SIGNING_KEY_ID;
        const keySecretBase64 = process.env.MUX_SIGNING_PRIVATE_KEY;

        if (!keyId || !keySecretBase64) {
            throw new Error('MUX signing credentials not configured');
        }

        // Giải mã private key từ base64
        let keySecret = Buffer.from(keySecretBase64, 'base64').toString('utf-8');
        
        // Đảm bảo có newlines đúng format
        if (!keySecret.includes('\n')) {
            keySecret = keySecret.replace(/-----BEGIN (RSA )?PRIVATE KEY-----/, '-----BEGIN $1PRIVATE KEY-----\n')
                                 .replace(/-----END (RSA )?PRIVATE KEY-----/, '\n-----END $1PRIVATE KEY-----')
                                 .replace(/(.{64})/g, '$1\n')
                                 .replace(/\n\n/g, '\n');
        }

        // Lấy thông tin video từ database
        const video = await Video.findById(videoId);
        
        if (!video) {
            return res.status(404).json({ 
                success: false,
                message: 'Video not found' 
            });
        }

        // Extract playback ID
        let playbackId = video.playbackId;
        if (playbackId.startsWith('mux://')) {
            playbackId = playbackId.replace('mux://', '');
        } else if (playbackId.includes('mux.com')) {
            const match = playbackId.match(/\/([a-zA-Z0-9]+)\.m3u8/);
            if (match) {
                playbackId = match[1];
            }
        }

        // Tạo params cho thumbnail
        const params = {};
        if (width) params.width = width;
        if (height) params.height = height;
        if (time) params.time = time;

        // Tạo signed token sử dụng MUX SDK
        const token = await mux.jwt.signPlaybackId(playbackId, {
            keyId: keyId,
            keySecret: keySecret,
            expiration: '1h',
            type: 'thumbnail',
            params: params
        });

        // Tạo thumbnail URL với parameters
        let thumbnailUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg?token=${token}`;

        res.status(200).json({
            success: true,
            data: {
                videoId: video._id,
                thumbnailUrl: thumbnailUrl,
                token: token,
                expiresIn: 3600
            }
        });

    } catch (error) {
        console.error('Error getting video thumbnail:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error generating thumbnail URL', 
            error: error.message 
        });
    }
};
