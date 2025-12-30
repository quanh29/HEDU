import Material from '../models/Material.js';
import MaterialDraft from '../models/MaterialDraft.js';
import cloudinary from '../config/cloudinary.js';
import multer from 'multer';
import { Readable } from 'stream';
import mongoose from 'mongoose';

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

        const { lessonTitle, lessonId } = req.body;

        console.log('📤 [Material Upload] Starting private upload...');
        console.log('   File:', req.file.originalname);
        console.log('   Size:', (req.file.size / 1024 / 1024).toFixed(2) + 'MB');
        console.log('   Type:', req.file.mimetype);
        console.log('   Lesson Title:', lessonTitle);
        console.log('   Lesson ID:', lessonId);

        // Extract file extension
        const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
        console.log('   Extension:', fileExtension);

        // Upload to Cloudinary as private file
        const uploadOptions = {
            folder: 'course-materials',
            resource_type: 'raw',
            type: 'private', // Private file - requires signed URL to access
            use_filename: true,
            unique_filename: true,
            format: fileExtension // Explicitly set format/extension
        };

        const cloudinaryResult = await uploadToCloudinary(req.file.buffer, uploadOptions);

        console.log('✅ [Material Upload] Cloudinary upload successful');
        console.log('   Public ID:', cloudinaryResult.public_id);
        console.log('   Resource Type:', cloudinaryResult.resource_type);
        console.log('   Format:', cloudinaryResult.format);

        // Link material với lesson nếu có lessonId
        if (lessonId) {
            // Check if it's a LessonDraft (draft system)
            const LessonDraft = (await import('../models/LessonDraft.js')).default;
            const draftLesson = await LessonDraft.findById(lessonId);
            
            if (draftLesson) {
                // Create MaterialDraft for draft system
                const materialDraft = new MaterialDraft({
                    contentUrl: cloudinaryResult.public_id,
                    resource_type: cloudinaryResult.resource_type,
                    originalFilename: req.file.originalname,
                    fileSize: cloudinaryResult.bytes,
                    format: cloudinaryResult.format,
                    extension: fileExtension,
                    courseDraftId: draftLesson.courseDraftId,
                    draftLessonId: draftLesson._id,
                    status: 'draft',
                    changeType: 'new'
                });

                await materialDraft.save();

                // Link to lesson draft
                draftLesson.draftMaterialId = materialDraft._id;
                draftLesson.duration = 0; // Materials don't have duration
                await draftLesson.save();

                // Add to CourseDraft.draftMaterials array
                const CourseDraft = mongoose.model('CourseDraft');
                const courseDraft = await CourseDraft.findById(draftLesson.courseDraftId);
                if (courseDraft) {
                    courseDraft.draftMaterials.push(materialDraft._id);
                    await courseDraft.save();
                }

                console.log(`✅ Created MaterialDraft ${materialDraft._id} for LessonDraft ${lessonId}`);

                return res.status(200).json({
                    success: true,
                    message: 'Material uploaded successfully (draft)',
                    isDraft: true,
                    materialId: materialDraft._id.toString(),
                    publicId: cloudinaryResult.public_id,
                    resourceType: cloudinaryResult.resource_type,
                    originalFilename: req.file.originalname,
                    fileSize: cloudinaryResult.bytes,
                    format: cloudinaryResult.format,
                    extension: fileExtension
                });
            }

            // Fallback to published Lesson (old system)
            const Lesson = (await import('../models/Lesson.js')).default;
            const lesson = await Lesson.findById(lessonId);
            if (lesson) {
                // Create published Material
                const material = new Material({
                    contentUrl: cloudinaryResult.public_id,
                    resource_type: cloudinaryResult.resource_type,
                    originalFilename: req.file.originalname,
                    fileSize: cloudinaryResult.bytes,
                    format: cloudinaryResult.format,
                    extension: fileExtension,
                    isTemporary: false
                });

                await material.save();
                
                lesson.material = material._id;
                lesson.duration = 0;
                await lesson.save();
                
                console.log(`✅ Linked material ${material._id} to published lesson ${lessonId}`);

                return res.status(200).json({
                    success: true,
                    message: 'Material uploaded successfully (published)',
                    isDraft: false,
                    materialId: material._id.toString(),
                    publicId: cloudinaryResult.public_id,
                    resourceType: cloudinaryResult.resource_type,
                    originalFilename: req.file.originalname,
                    fileSize: cloudinaryResult.bytes,
                    format: cloudinaryResult.format,
                    extension: fileExtension
                });
            }
            
            console.log(`⚠️ Lesson ${lessonId} not found`);
        }

        // No lessonId provided - create temporary Material
        const material = new Material({
            contentUrl: cloudinaryResult.public_id,
            resource_type: cloudinaryResult.resource_type,
            originalFilename: req.file.originalname,
            fileSize: cloudinaryResult.bytes,
            format: cloudinaryResult.format,
            extension: fileExtension,
            isTemporary: true
        });

        await material.save();

        console.log('✅ [Material Upload] Temporary material created');
        console.log('   Material ID:', material._id);

        res.status(200).json({
            success: true,
            message: 'Material uploaded successfully',
            materialId: material._id.toString(),
            publicId: cloudinaryResult.public_id,
            resourceType: cloudinaryResult.resource_type,
            originalFilename: req.file.originalname,
            fileSize: cloudinaryResult.bytes,
            format: cloudinaryResult.format,
            extension: fileExtension
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
        const { skipCloudinaryDeletion } = req.query; // Flag to skip Cloudinary deletion (for draft mode)

        console.log('🗑️ [Material Delete] Deleting material:', materialId);
        console.log('   Skip Cloudinary Deletion:', skipCloudinaryDeletion === 'true');

        // Try MaterialDraft first
        let material = await MaterialDraft.findById(materialId);
        let isDraft = true;

        if (!material) {
            // Fallback to published Material
            material = await Material.findById(materialId);
            isDraft = false;
        }

        if (!material) {
            return res.status(404).json({
                success: false,
                message: 'Material not found'
            });
        }

        console.log(`   Found ${isDraft ? 'MaterialDraft' : 'Material'} with publicId:`, material.contentUrl);

        // Delete from Cloudinary only if NOT in draft mode (skipCloudinaryDeletion !== 'true')
        let cloudinaryDeleted = false;
        if (skipCloudinaryDeletion !== 'true' && material.contentUrl) {
            try {
                const deleteResult = await cloudinary.uploader.destroy(
                    material.contentUrl,
                    { 
                        resource_type: material.resource_type || 'raw',
                        type: 'private'
                    }
                );
                console.log('   Cloudinary delete result:', deleteResult);
                cloudinaryDeleted = true;
            } catch (cloudinaryError) {
                console.warn('⚠️ [Material Delete] Cloudinary delete failed, continuing with DB deletion:', cloudinaryError.message);
            }
        } else if (skipCloudinaryDeletion === 'true') {
            console.log('⏭️ Skipping Cloudinary deletion (draft mode - will delete on approval)');
        }

        // Remove from CourseDraft.draftMaterials if draft
        if (isDraft && material.courseDraftId) {
            const CourseDraft = mongoose.model('CourseDraft');
            const courseDraft = await CourseDraft.findById(material.courseDraftId);
            if (courseDraft) {
                courseDraft.draftMaterials = courseDraft.draftMaterials.filter(
                    id => id.toString() !== materialId
                );
                await courseDraft.save();
                // delete from cloudinary when changeType of MaterialDraft is 'new'
                console.log('✅ Removed material from CourseDraft.draftMaterials');
                if (material.changeType === 'new' && material.contentUrl) {
                    try {
                        const deleteResult = await cloudinary.uploader.destroy(
                            material.contentUrl,
                            { 
                                resource_type: material.resource_type || 'raw',
                                type: 'private'
                            }
                        );
                        console.log('   Cloudinary delete result for new draft material:', deleteResult);
                    } catch (cloudinaryError) {
                        console.warn('⚠️ [Material Delete] Cloudinary delete failed for new draft material:', cloudinaryError.message);
                    }
                }
            }
        }

        // Delete from MongoDB
        if (isDraft) {
            await MaterialDraft.findByIdAndDelete(materialId);
        } else {
            await Material.findByIdAndDelete(materialId);
        }

        console.log(`✅ [Material Delete] ${isDraft ? 'MaterialDraft' : 'Material'} deleted successfully`);

        res.status(200).json({
            success: true,
            message: 'Material deleted successfully',
            isDraft,
            cloudinaryDeleted
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
        
        console.log('🔑 [Material Signed URL] Full request info:');
        console.log('   Material ID:', materialId);
        console.log('   Request body:', req.body);
        console.log('   Body type:', typeof req.body);
        console.log('   Headers:', req.headers['content-type']);
        
        const expiresIn = (req.body && req.body.expiresIn) ? parseInt(req.body.expiresIn) : 3600;
        console.log('   Expires in:', expiresIn);

        // Try MaterialDraft first
        let material = await MaterialDraft.findById(materialId);
        let isDraft = true;

        if (!material) {
            // Fallback to published Material
            material = await Material.findById(materialId);
            isDraft = false;
        }

        if (!material) {
            return res.status(404).json({
                success: false,
                message: 'Material not found'
            });
        }

        console.log(`   ${isDraft ? 'MaterialDraft' : 'Material'} found:`, {
            publicId: material.contentUrl,
            resourceType: material.resource_type,
            filename: material.originalFilename,
            extension: material.extension
        });

        const expiresAt = Math.floor(Date.now() / 1000) + parseInt(expiresIn);

        console.log('   Using publicId:', material.contentUrl);
        console.log('   Original filename:', material.originalFilename);

        const signedUrl = cloudinary.utils.private_download_url(
            material.contentUrl,
            'raw',
            {
                attachment: material.originalFilename,
                expires_at: expiresAt,
                resource_type: 'raw'
            }
        );

        console.log(`✅ [Material Signed URL] URL generated for ${isDraft ? 'draft' : 'published'}`);
        console.log('   Signed URL:', signedUrl);

        res.status(200).json({
            success: true,
            signedUrl: signedUrl,
            expiresAt: expiresAt,
            filename: material.originalFilename,
            isDraft
        });

    } catch (error) {
        console.error('❌ [Material Signed URL] Error:', error);
        console.error('   Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Failed to generate signed URL',
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};
