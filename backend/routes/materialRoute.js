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
    upload 
} from '../controllers/materialUploadController.js';

const materialRouter = express.Router();

// Upload material file
materialRouter.post('/upload', upload.single('file'), uploadMaterial);

// Delete material with file
materialRouter.delete('/delete/:materialId', deleteMaterialFile);

// Public routes
materialRouter.get('/section/:sectionId', getMaterialsBySectionId);

// Protected routes
materialRouter.post('/', addMaterial);
materialRouter.get('/:materialId', getMaterialById);
materialRouter.put('/:materialId', updateMaterial);
materialRouter.delete('/:materialId', deleteMaterial);

export default materialRouter;
