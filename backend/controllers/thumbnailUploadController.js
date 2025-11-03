import cloudinary from '../config/cloudinary.js';
import multer from 'multer';
import { Readable } from 'stream';

// Configure multer để xử lý image upload (memory storage)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedMimes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml'
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`File type not allowed: ${file.mimetype}. Only images are allowed.`), false);
    }
};

export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max
    }
});

/**
 * Helper function to upload buffer to Cloudinary
 */
const uploadToCloudinary = (buffer, options = {}) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            options,
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        );

        const readable = Readable.from(buffer);
        readable.pipe(uploadStream);
    });
};

/**
 * Upload thumbnail to Cloudinary (public - no signed URL needed)
 * POST /api/thumbnail/upload
 */
export const uploadThumbnail = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false,
                message: 'No file uploaded' 
            });
        }

        console.log('📤 [Thumbnail Upload] Starting public upload...');
        console.log('   File:', req.file.originalname);
        console.log('   Size:', (req.file.size / 1024 / 1024).toFixed(2) + 'MB');
        console.log('   Type:', req.file.mimetype);

        // Upload to Cloudinary as public image (type: 'upload' = public)
        const uploadOptions = {
            folder: 'course-thumbnails',
            resource_type: 'image',
            type: 'upload', // Public file - no signed URL needed
            use_filename: true,
            unique_filename: true,
            transformation: [
                { width: 1280, height: 720, crop: 'limit' }, // Max dimensions
                { quality: 'auto:good' },
                { fetch_format: 'auto' }
            ]
        };

        const cloudinaryResult = await uploadToCloudinary(req.file.buffer, uploadOptions);

        console.log('✅ [Thumbnail Upload] Cloudinary upload successful');
        console.log('   Public ID:', cloudinaryResult.public_id);
        console.log('   URL:', cloudinaryResult.secure_url);

        res.status(200).json({
            success: true,
            message: 'Thumbnail uploaded successfully',
            publicId: cloudinaryResult.public_id,
            url: cloudinaryResult.secure_url,
            width: cloudinaryResult.width,
            height: cloudinaryResult.height,
            format: cloudinaryResult.format,
            bytes: cloudinaryResult.bytes
        });

    } catch (error) {
        console.error('❌ [Thumbnail Upload] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload thumbnail',
            error: error.message
        });
    }
};

/**
 * Delete thumbnail from Cloudinary
 * DELETE /api/thumbnail/:publicId
 */
export const deleteThumbnail = async (req, res) => {
    try {
        const { publicId } = req.params;

        console.log('🗑️ [Thumbnail Delete] Deleting thumbnail:', publicId);

        const deleteResult = await cloudinary.uploader.destroy(
            publicId,
            { 
                resource_type: 'image',
                type: 'upload' // Public images
            }
        );

        console.log('   Delete result:', deleteResult);

        if (deleteResult.result === 'ok') {
            console.log('✅ [Thumbnail Delete] Thumbnail deleted successfully');
            res.status(200).json({
                success: true,
                message: 'Thumbnail deleted successfully'
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Thumbnail not found or already deleted'
            });
        }

    } catch (error) {
        console.error('❌ [Thumbnail Delete] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete thumbnail',
            error: error.message
        });
    }
};
