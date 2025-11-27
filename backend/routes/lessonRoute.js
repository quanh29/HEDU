import express from 'express';
import {
    createLesson,
    getLessonById,
    getLessonsBySection,
    updateLesson,
    linkContentToLesson,
    deleteLesson,
    reorderLessons
} from '../controllers/lessonController.js';
import { protectCourseOwner } from '../middleware/auth.js';

const lessonRouter = express.Router();

// Create new lesson
lessonRouter.post('/', createLesson);

// Get lesson by ID
lessonRouter.get('/:lessonId', getLessonById);

// Get all lessons for a section
lessonRouter.get('/section/:sectionId', getLessonsBySection);

// Update lesson
lessonRouter.put('/:lessonId', updateLesson);

// Link content (video/material/quiz) to lesson
lessonRouter.put('/:lessonId/content', linkContentToLesson);

// Delete lesson (cascade deletes content)
lessonRouter.delete('/:lessonId', deleteLesson);

// Reorder lessons
lessonRouter.put('/reorder', reorderLessons);

export default lessonRouter;
