import Material from '../models/Material.js';
import cloudinary from '../config/cloudinary.js';
import multer from 'multer';
import { Readable } from 'stream';

// Configure multer để xử lý file upload (memory storage - không lưu file local)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedMimes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`File type not allowed: ${file.mimetype}. Only PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX are allowed.`), false);
    }
};

export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB max
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
 * Upload material file to Cloudinary (private) và tạo Material document tạm thời
 * POST /api/material/upload
 */
export const uploadMaterial = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false,
                message: 'No file uploaded' 
            });
        }

        const { lessonTitle } = req.body;

        console.log('📤 [Material Upload] Starting private upload...');
        console.log('   File:', req.file.originalname);
        console.log('   Size:', (req.file.size / 1024 / 1024).toFixed(2) + 'MB');
        console.log('   Type:', req.file.mimetype);
        console.log('   Lesson Title:', lessonTitle);

        // Upload to Cloudinary as private file
        const uploadOptions = {
            folder: 'course-materials',
            resource_type: 'raw',
            type: 'private', // Private file - requires signed URL to access
            use_filename: true,
            unique_filename: true
        };

        const cloudinaryResult = await uploadToCloudinary(req.file.buffer, uploadOptions);

        console.log('✅ [Material Upload] Cloudinary upload successful');
        console.log('   Public ID:', cloudinaryResult.public_id);
        console.log('   Resource Type:', cloudinaryResult.resource_type);

        // Tạo Material document tạm thời trong MongoDB
        const material = new Material({
            contentUrl: cloudinaryResult.public_id, // Lưu publicId của Cloudinary
            resource_type: cloudinaryResult.resource_type,
            originalFilename: req.file.originalname,
            fileSize: cloudinaryResult.bytes,
            format: cloudinaryResult.format,
            isTemporary: true // Material tạm thời, chưa link với course
        });

        await material.save();

        console.log('✅ [Material Upload] Material document created');
        console.log('   Material ID:', material._id);

        res.status(200).json({
            success: true,
            message: 'Material uploaded successfully',
            materialId: material._id.toString(),
            publicId: cloudinaryResult.public_id,
            resourceType: cloudinaryResult.resource_type,
            originalFilename: req.file.originalname,
            fileSize: cloudinaryResult.bytes,
            format: cloudinaryResult.format
        });

    } catch (error) {
        console.error('❌ [Material Upload] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload material',
            error: error.message
        });
    }
};

/**
 * Delete material from Cloudinary và MongoDB
 * DELETE /api/material/:materialId
 */
export const deleteMaterial = async (req, res) => {
    try {
        const { materialId } = req.params;

        console.log('🗑️ [Material Delete] Deleting material:', materialId);

        // Find material in MongoDB
        const material = await Material.findById(materialId);

        if (!material) {
            return res.status(404).json({
                success: false,
                message: 'Material not found'
            });
        }

        console.log('   Found material with publicId:', material.contentUrl);

        // Delete from Cloudinary
        try {
            const deleteResult = await cloudinary.uploader.destroy(
                material.contentUrl,
                { 
                    resource_type: material.resource_type || 'raw',
                    type: 'private' // Specify type for private files
                }
            );
            console.log('   Cloudinary delete result:', deleteResult);
        } catch (cloudinaryError) {
            console.warn('⚠️ [Material Delete] Cloudinary delete failed, continuing with DB deletion:', cloudinaryError.message);
        }

        // Delete from MongoDB
        await Material.findByIdAndDelete(materialId);

        console.log('✅ [Material Delete] Material deleted successfully');

        res.status(200).json({
            success: true,
            message: 'Material deleted successfully'
        });

    } catch (error) {
        console.error('❌ [Material Delete] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete material',
            error: error.message
        });
    }
};

/**
 * Generate signed URL for material download
 * POST /api/material/:materialId/signed-url
 */
export const generateMaterialSignedUrl = async (req, res) => {
    try {
        const { materialId } = req.params;
        const { expiresIn = 3600 } = req.body; // Default 1 hour

        console.log('🔑 [Material Signed URL] Generating for:', materialId);

        const material = await Material.findById(materialId);

        if (!material) {
            return res.status(404).json({
                success: false,
                message: 'Material not found'
            });
        }

        const expiresAt = Math.floor(Date.now() / 1000) + parseInt(expiresIn);

        // Generate signed URL with custom filename
        const signedUrl = cloudinary.utils.private_download_url(
            material.contentUrl,
            material.resource_type || 'raw',
            {
                expires_at: expiresAt,
                attachment: material.originalFilename || true
            }
        );

        console.log('✅ [Material Signed URL] URL generated');

        res.status(200).json({
            success: true,
            signedUrl: signedUrl,
            expiresAt: expiresAt,
            filename: material.originalFilename
        });

    } catch (error) {
        console.error('❌ [Material Signed URL] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate signed URL',
            error: error.message
        });
    }
};
