import express from 'express';
import { 
    addVideo, 
    getVideoById, 
    getVideosBySectionId, 
    updateVideo, 
    deleteVideo 
} from '../controllers/videoController.js';

const videoRouter = express.Router();

// Public routes
videoRouter.get('/section/:sectionId', getVideosBySectionId);

// Protected routes
videoRouter.post('/', addVideo);
videoRouter.get('/:videoId', getVideoById);
videoRouter.put('/:videoId', updateVideo);
videoRouter.delete('/:videoId', deleteVideo);

export default videoRouter;
