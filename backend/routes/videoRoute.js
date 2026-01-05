import express from 'express';
import { 
    addVideo, 
    getVideoById, 
    getVideosBySectionId, 
    updateVideo, 
    deleteVideo 
} from '../controllers/videoController.js';
import { 
    getVideoPlayback, 
    getDraftVideoPlayback,
    getVideoThumbnail 
} from '../controllers/videoController.js';
import { protectEnrolledUser, protectAdmin } from '../middleware/auth.js';

const videoRouter = express.Router();

// Public routes
// videoRouter.get('/section/:sectionId', getVideosBySectionId);

// Video playback routes - MUX signed URLs (protected for enrolled users)
videoRouter.get('/playback/:videoId', protectEnrolledUser, getVideoPlayback);
videoRouter.get('/playback-draft/:videoId', protectAdmin, getDraftVideoPlayback);
// videoRouter.get('/thumbnail/:videoId', protectEnrolledUser, getVideoThumbnail);

// Protected routes
// videoRouter.post('/', addVideo);
// videoRouter.get('/:videoId', getVideoById);
// videoRouter.put('/:videoId', updateVideo);
videoRouter.delete('/:videoId', deleteVideo);

export default videoRouter;
