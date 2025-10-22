import express from 'express';
import { 
    addQuiz, 
    getQuizById, 
    getQuizForStudent,
    getQuizzesBySectionId, 
    submitQuiz,
    updateQuiz, 
    deleteQuiz 
} from '../controllers/quizController.js';

const quizRouter = express.Router();

// Public routes
quizRouter.get('/section/:sectionId', getQuizzesBySectionId);
quizRouter.get('/student/:quizId', getQuizForStudent);
quizRouter.post('/submit/:quizId', submitQuiz);

// Protected routes (instructor/admin)
quizRouter.post('/', addQuiz);
quizRouter.get('/:quizId', getQuizById);
quizRouter.put('/:quizId', updateQuiz);
quizRouter.delete('/:quizId', deleteQuiz);

export default quizRouter;
