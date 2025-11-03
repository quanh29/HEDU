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

const materialRouter = express.Router();

// Upload material file (creates temporary material document)
materialRouter.post('/upload', upload.single('file'), uploadMaterial);

// Delete material with file (from Cloudinary and MongoDB)
materialRouter.delete('/delete/:materialId', deleteMaterialFile);

// Generate signed URL for downloading material
materialRouter.post('/:materialId/signed-url', generateMaterialSignedUrl);

// Public routes
materialRouter.get('/section/:sectionId', getMaterialsBySectionId);

// Protected routes
materialRouter.post('/', addMaterial);
materialRouter.get('/:materialId', getMaterialById);
materialRouter.put('/:materialId', updateMaterial);
materialRouter.delete('/:materialId', deleteMaterial);

export default materialRouter;
