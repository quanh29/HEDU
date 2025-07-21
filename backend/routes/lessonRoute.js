import express from 'express';
import { getLessonById, getLessonBySectionId } from '../controllers/lessonController.js';

const lessonRouter = express.Router();

lessonRouter.get('/protected/:lessonId', async (req, res) => {
    getLessonById(req, res);
});

lessonRouter.get('/section/:sectionId', async (req, res) => {
    getLessonBySectionId(req, res);
});


export default lessonRouter;