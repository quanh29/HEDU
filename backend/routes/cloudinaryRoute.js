import express from 'express';
import { 
    uploadFile, 
    uploadMultipleFiles,
    uploadPrivateFile,
    generateSignedUrl,
    generateDownloadUrl,
    deleteFile,
    getFileInfo,
    upload 
} from '../controllers/cloudinaryController.js';

const cloudinaryRouter = express.Router();

/**
 * Upload single file (public)
 * POST /api/cloudinary/upload
 * Body (multipart/form-data):
 *   - file: File to upload
 *   - folder: (optional) Cloudinary folder path (default: 'uploads')
 *   - resourceType: (optional) 'image', 'video', 'raw', 'auto' (default: 'auto')
 */
cloudinaryRouter.post('/upload', upload.single('file'), uploadFile);

/**
 * Upload private file (requires signed URL to access)
 * POST /api/cloudinary/upload-private
 * Body (multipart/form-data):
 *   - file: File to upload
 *   - folder: (optional) Cloudinary folder path (default: 'private')
 *   - resourceType: (optional) 'image', 'video', 'raw', 'auto' (default: 'auto')
 */
cloudinaryRouter.post('/upload-private', upload.single('file'), uploadPrivateFile);

/**
 * Upload multiple files
 * POST /api/cloudinary/upload-multiple
 * Body (multipart/form-data):
 *   - files: Array of files to upload
 *   - folder: (optional) Cloudinary folder path (default: 'uploads')
 *   - resourceType: (optional) 'image', 'video', 'raw', 'auto' (default: 'auto')
 */
cloudinaryRouter.post('/upload-multiple', upload.array('files', 10), uploadMultipleFiles);

/**
 * Generate signed URL for private file
 * POST /api/cloudinary/generate-signed-url
 * Body (JSON):
 *   - publicId: Public ID of the private file (required)
 *   - resourceType: (optional) 'raw', 'image', 'video' (default: 'raw')
 *   - expiresIn: (optional) Expiration time in seconds (default: 3600 = 1 hour)
 */
cloudinaryRouter.post('/generate-signed-url', generateSignedUrl);

/**
 * Generate download URL for private file (force download)
 * POST /api/cloudinary/generate-download-url
 * Body (JSON):
 *   - publicId: Public ID of the private file (required)
 *   - resourceType: (optional) 'raw', 'image', 'video' (default: 'raw')
 *   - expiresIn: (optional) Expiration time in seconds (default: 3600 = 1 hour)
 *   - filename: (optional) Custom filename for download
 */
cloudinaryRouter.post('/generate-download-url', generateDownloadUrl);

/**
 * Delete file
 * DELETE /api/cloudinary/delete/:publicId
 * Params:
 *   - publicId: Cloudinary public ID (URL encoded)
 * Body:
 *   - resourceType: (optional) 'image', 'video', 'raw' (default: 'image')
 */
cloudinaryRouter.delete('/delete/:publicId', deleteFile);

/**
 * Get file info
 * GET /api/cloudinary/info/:publicId
 * Params:
 *   - publicId: Cloudinary public ID (URL encoded)
 * Query:
 *   - resourceType: (optional) 'image', 'video', 'raw' (default: 'image')
 */
cloudinaryRouter.get('/info/:publicId', getFileInfo);

export default cloudinaryRouter;
