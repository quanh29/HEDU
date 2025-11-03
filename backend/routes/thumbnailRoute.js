import express from 'express';
import { 
    uploadThumbnail,
    deleteThumbnail,
    upload 
} from '../controllers/thumbnailUploadController.js';

const thumbnailRouter = express.Router();

/**
 * Upload thumbnail image (public - no signed URL needed)
 * POST /api/thumbnail/upload
 * Body (multipart/form-data):
 *   - file: Image file to upload
 */
thumbnailRouter.post('/upload', upload.single('file'), uploadThumbnail);

/**
 * Delete thumbnail from Cloudinary
 * DELETE /api/thumbnail/:publicId
 * Params:
 *   - publicId: Cloudinary public ID (URL encoded)
 */
thumbnailRouter.delete('/:publicId', deleteThumbnail);

export default thumbnailRouter;
