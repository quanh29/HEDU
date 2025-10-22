import express from 'express';
import { 
    addMaterial, 
    getMaterialById, 
    getMaterialsBySectionId, 
    updateMaterial, 
    deleteMaterial 
} from '../controllers/materialController.js';

const materialRouter = express.Router();

// Public routes
materialRouter.get('/section/:sectionId', getMaterialsBySectionId);

// Protected routes
materialRouter.post('/', addMaterial);
materialRouter.get('/:materialId', getMaterialById);
materialRouter.put('/:materialId', updateMaterial);
materialRouter.delete('/:materialId', deleteMaterial);

export default materialRouter;
