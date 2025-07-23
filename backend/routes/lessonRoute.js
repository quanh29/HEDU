import express from 'express';
import { getLessonById, getLessonBySectionId } from '../controllers/lessonController.js';
import { get } from 'mongoose';

const lessonRouter = express.Router();

lessonRouter.get('/protected/:lessonId', getLessonById);

lessonRouter.get('/section/:sectionId', async (req, res) => {
    getLessonBySectionId(req, res);
});


export default lessonRouter;