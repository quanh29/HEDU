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
    getVideoThumbnail 
} from '../controllers/videoPlaybackController.js';

const videoRouter = express.Router();

// Public routes
videoRouter.get('/section/:sectionId', getVideosBySectionId);

// Video playback routes - MUX signed URLs
videoRouter.get('/playback/:videoId', getVideoPlayback);
videoRouter.get('/thumbnail/:videoId', getVideoThumbnail);

// Protected routes
videoRouter.post('/', addVideo);
videoRouter.get('/:videoId', getVideoById);
videoRouter.put('/:videoId', updateVideo);
videoRouter.delete('/:videoId', deleteVideo);

export default videoRouter;
