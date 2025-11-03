import cloudinary from '../config/cloudinary.js';
import multer from 'multer';
import { Readable } from 'stream';

// Configure multer để xử lý file upload (memory storage)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    // Cho phép tất cả các loại file
    // Có thể customize để chỉ cho phép image, video, documents, etc.
    const allowedMimes = [
        // Images
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        // Documents
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        // Videos
        'video/mp4',
        'video/mpeg',
        'video/quicktime',
        'video/x-msvideo',
        'video/webm'
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`File type not allowed: ${file.mimetype}`), false);
    }
};

export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB max
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

        // Convert buffer to stream and pipe to Cloudinary
        const readable = Readable.from(buffer);
        readable.pipe(uploadStream);
    });
};

/**
 * Upload file to Cloudinary
 * POST /api/cloudinary/upload
 */
export const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false,
                message: 'No file uploaded' 
            });
        }

        const { folder = 'uploads', resourceType = 'auto' } = req.body;

        console.log('📤 [Cloudinary Upload] Starting upload...');
        console.log('   File:', req.file.originalname);
        console.log('   Size:', (req.file.size / 1024 / 1024).toFixed(2) + 'MB');
        console.log('   Type:', req.file.mimetype);
        console.log('   Folder:', folder);

        // Upload options
        const uploadOptions = {
            folder: folder,
            resource_type: resourceType,
            use_filename: true,
            unique_filename: true
        };

        // Upload to Cloudinary
        const result = await uploadToCloudinary(req.file.buffer, uploadOptions);

        console.log('✅ [Cloudinary Upload] Upload successful');
        console.log('   Public ID:', result.public_id);
        console.log('   URL:', result.secure_url);

        res.status(200).json({
            success: true,
            message: 'File uploaded successfully',
            data: {
                publicId: result.public_id,
                url: result.secure_url,
                secureUrl: result.secure_url,
                format: result.format,
                resourceType: result.resource_type,
                width: result.width,
                height: result.height,
                bytes: result.bytes,
                originalFilename: req.file.originalname,
                createdAt: result.created_at
            }
        });
    } catch (error) {
        console.error('❌ [Cloudinary Upload] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload file',
            error: error.message
        });
    }
};

/**
 * Upload multiple files to Cloudinary
 * POST /api/cloudinary/upload-multiple
 */
export const uploadMultipleFiles = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files uploaded'
            });
        }

        const { folder = 'uploads', resourceType = 'auto' } = req.body;

        console.log(`📤 [Cloudinary Upload] Uploading ${req.files.length} files...`);

        const uploadOptions = {
            folder: folder,
            resource_type: resourceType,
            use_filename: true,
            unique_filename: true
        };

        // Upload all files in parallel
        const uploadPromises = req.files.map((file, index) => {
            console.log(`   ${index + 1}. ${file.originalname} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
            return uploadToCloudinary(file.buffer, uploadOptions)
                .then(result => ({
                    success: true,
                    originalFilename: file.originalname,
                    publicId: result.public_id,
                    url: result.secure_url,
                    format: result.format,
                    bytes: result.bytes
                }))
                .catch(error => ({
                    success: false,
                    originalFilename: file.originalname,
                    error: error.message
                }));
        });

        const results = await Promise.all(uploadPromises);

        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);

        console.log(`✅ [Cloudinary Upload] ${successful.length} files uploaded successfully`);
        if (failed.length > 0) {
            console.log(`❌ [Cloudinary Upload] ${failed.length} files failed`);
        }

        res.status(200).json({
            success: true,
            message: `Uploaded ${successful.length} of ${req.files.length} files`,
            data: {
                successful: successful,
                failed: failed,
                total: req.files.length,
                successCount: successful.length,
                failCount: failed.length
            }
        });
    } catch (error) {
        console.error('❌ [Cloudinary Upload] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload files',
            error: error.message
        });
    }
};

/**
 * Delete file from Cloudinary
 * DELETE /api/cloudinary/delete/:publicId
 */
export const deleteFile = async (req, res) => {
    try {
        const { publicId } = req.params;
        const { resourceType = 'image' } = req.body;

        if (!publicId) {
            return res.status(400).json({
                success: false,
                message: 'Public ID is required'
            });
        }

        console.log('🗑️ [Cloudinary Delete] Deleting file...');
        console.log('   Public ID:', publicId);
        console.log('   Resource Type:', resourceType);

        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType
        });

        if (result.result === 'ok') {
            console.log('✅ [Cloudinary Delete] File deleted successfully');
            res.status(200).json({
                success: true,
                message: 'File deleted successfully',
                data: result
            });
        } else {
            console.log('⚠️ [Cloudinary Delete] File not found or already deleted');
            res.status(404).json({
                success: false,
                message: 'File not found or already deleted',
                data: result
            });
        }
    } catch (error) {
        console.error('❌ [Cloudinary Delete] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete file',
            error: error.message
        });
    }
};

/**
 * Upload private file to Cloudinary (requires signed URL to access)
 * POST /api/cloudinary/upload-private
 */
export const uploadPrivateFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false,
                message: 'No file uploaded' 
            });
        }

        const { folder = 'private', resourceType = 'auto' } = req.body;

        console.log('🔒 [Cloudinary Private Upload] Starting private upload...');
        console.log('   File:', req.file.originalname);
        console.log('   Size:', (req.file.size / 1024 / 1024).toFixed(2) + 'MB');
        console.log('   Type:', req.file.mimetype);
        console.log('   Folder:', folder);

        // Upload options với type 'private'
        const uploadOptions = {
            folder: folder,
            resource_type: resourceType,
            type: 'private', // File sẽ chỉ truy cập được qua signed URL
            use_filename: true,
            unique_filename: true
        };

        // Upload to Cloudinary
        const result = await uploadToCloudinary(req.file.buffer, uploadOptions);

        console.log('✅ [Cloudinary Private Upload] Upload successful');
        console.log('   Public ID:', result.public_id);
        console.log('   Type:', result.type);

        res.status(200).json({
            success: true,
            message: 'Private file uploaded successfully',
            data: {
                publicId: result.public_id,
                format: result.format,
                resourceType: result.resource_type,
                type: result.type,
                width: result.width,
                height: result.height,
                bytes: result.bytes,
                originalFilename: req.file.originalname,
                createdAt: result.created_at,
                note: 'This is a private file. Use /generate-signed-url to get access URL'
            }
        });
    } catch (error) {
        console.error('❌ [Cloudinary Private Upload] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload private file',
            error: error.message
        });
    }
};

/**
 * Generate signed URL for private file
 * POST /api/cloudinary/generate-signed-url
 * Body: { publicId, resourceType, expiresIn }
 */
export const generateSignedUrl = async (req, res) => {
    try {
        const { publicId, resourceType = 'raw', expiresIn = 3600 } = req.body;

        if (!publicId) {
            return res.status(400).json({
                success: false,
                message: 'Public ID is required'
            });
        }

        console.log('🔑 [Cloudinary Signed URL] Generating signed URL...');
        console.log('   Public ID:', publicId);
        console.log('   Resource Type:', resourceType);
        console.log('   Expires In:', expiresIn, 'seconds');

        // Tạo timestamp hết hạn (Unix timestamp)
        const expiresAt = Math.floor(Date.now() / 1000) + parseInt(expiresIn);

        // Tạo signed URL
        const signedUrl = cloudinary.utils.private_download_url(
            publicId,
            resourceType,
            {
                expires_at: expiresAt,
                attachment: false // true để force download, false để view trên browser
            }
        );

        console.log('✅ [Cloudinary Signed URL] URL generated successfully');
        console.log('   Expires at:', new Date(expiresAt * 1000).toISOString());

        res.status(200).json({
            success: true,
            message: 'Signed URL generated successfully',
            data: {
                publicId: publicId,
                signedUrl: signedUrl,
                expiresIn: expiresIn,
                expiresAt: expiresAt,
                expiresAtReadable: new Date(expiresAt * 1000).toISOString(),
                note: 'This URL will expire after the specified time'
            }
        });
    } catch (error) {
        console.error('❌ [Cloudinary Signed URL] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate signed URL',
            error: error.message
        });
    }
};

/**
 * Generate signed URL for downloading file (force download)
 * POST /api/cloudinary/generate-download-url
 * Body: { publicId, resourceType, expiresIn, filename }
 */
export const generateDownloadUrl = async (req, res) => {
    try {
        const { publicId, resourceType = 'raw', expiresIn = 3600, filename } = req.body;

        if (!publicId) {
            return res.status(400).json({
                success: false,
                message: 'Public ID is required'
            });
        }

        console.log('⬇️ [Cloudinary Download URL] Generating download URL...');
        console.log('   Public ID:', publicId);
        console.log('   Filename:', filename || 'default');

        const expiresAt = Math.floor(Date.now() / 1000) + parseInt(expiresIn);

        const options = {
            expires_at: expiresAt,
            attachment: true // Force download
        };

        // Thêm custom filename nếu có
        if (filename) {
            options.attachment = filename;
        }

        const downloadUrl = cloudinary.utils.private_download_url(
            publicId,
            resourceType,
            options
        );

        console.log('✅ [Cloudinary Download URL] URL generated successfully');

        res.status(200).json({
            success: true,
            message: 'Download URL generated successfully',
            data: {
                publicId: publicId,
                downloadUrl: downloadUrl,
                filename: filename || 'default',
                expiresIn: expiresIn,
                expiresAt: expiresAt,
                expiresAtReadable: new Date(expiresAt * 1000).toISOString()
            }
        });
    } catch (error) {
        console.error('❌ [Cloudinary Download URL] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate download URL',
            error: error.message
        });
    }
};

/**
 * Get file info from Cloudinary
 * GET /api/cloudinary/info/:publicId
 */
export const getFileInfo = async (req, res) => {
    try {
        const { publicId } = req.params;
        const { resourceType = 'image' } = req.query;

        if (!publicId) {
            return res.status(400).json({
                success: false,
                message: 'Public ID is required'
            });
        }

        console.log('ℹ️ [Cloudinary Info] Getting file info...');
        console.log('   Public ID:', publicId);

        const result = await cloudinary.api.resource(publicId, {
            resource_type: resourceType,
            type: 'upload' // Hoặc 'private' nếu cần
        });

        console.log('✅ [Cloudinary Info] File info retrieved');

        res.status(200).json({
            success: true,
            message: 'File info retrieved successfully',
            data: {
                publicId: result.public_id,
                format: result.format,
                resourceType: result.resource_type,
                type: result.type,
                url: result.secure_url,
                width: result.width,
                height: result.height,
                bytes: result.bytes,
                createdAt: result.created_at
            }
        });
    } catch (error) {
        console.error('❌ [Cloudinary Info] Error:', error);
        
        if (error.error && error.error.http_code === 404) {
            return res.status(404).json({
                success: false,
                message: 'File not found',
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to get file info',
            error: error.message
        });
    }
};
