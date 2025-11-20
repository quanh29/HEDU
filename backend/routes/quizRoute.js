import express from 'express';
import { 
    addQuiz, 
    getQuizById, 
    getQuizForStudent,
    getQuizForEnrolledUser,
    getQuizzesBySectionId, 
    submitQuiz,
    updateQuiz, 
    deleteQuiz 
} from '../controllers/quizController.js';
import { protectEnrolledUser } from '../middleware/auth.js';

const quizRouter = express.Router();

// Public routes
quizRouter.get('/section/:sectionId', getQuizzesBySectionId);
quizRouter.get('/student/:quizId', getQuizForStudent);

// Protected routes - for enrolled users
quizRouter.get('/enrolled/:courseId/:quizId', protectEnrolledUser, getQuizForEnrolledUser);
quizRouter.post('/submit/:quizId', protectEnrolledUser, submitQuiz);

// Protected routes (instructor/admin)
quizRouter.post('/', addQuiz);
quizRouter.get('/:quizId', getQuizById);
quizRouter.put('/:quizId', updateQuiz);
quizRouter.delete('/:quizId', deleteQuiz);

export default quizRouter;
