import express from 'express';
import { 
    addMaterial, 
    getMaterialById, 
    getMaterialsBySectionId, 
    updateMaterial, 
    deleteMaterial 
} from '../controllers/materialController.js';
import { 
    uploadMaterial, 
    deleteMaterial as deleteMaterialFile,
    generateMaterialSignedUrl,
    upload 
} from '../controllers/materialUploadController.js';
import { protectEnrolledUser } from '../middleware/auth.js';

const materialRouter = express.Router();

// Upload material file (creates temporary material document)
materialRouter.post('/upload', upload.single('file'), uploadMaterial);

// Delete material with file (from Cloudinary and MongoDB)
materialRouter.delete('/delete/:materialId', deleteMaterialFile);

// Generate signed URL for downloading material (protected for enrolled users)
materialRouter.post('/:materialId/signed-url', protectEnrolledUser, generateMaterialSignedUrl);

// Get material by ID (protected for enrolled users)
materialRouter.get('/:materialId', protectEnrolledUser, getMaterialById);

// Public routes
materialRouter.get('/section/:sectionId', getMaterialsBySectionId);

// Protected routes
materialRouter.post('/', addMaterial);
materialRouter.put('/:materialId', updateMaterial);
materialRouter.delete('/:materialId', deleteMaterial);

export default materialRouter;
