import express from 'express';
import { importCourseContent, deleteAllCourseContent } from '../controllers/importController.js';

const importRouter = express.Router();

// Import sections và lessons cho một khóa học
importRouter.post('/course-content', importCourseContent);

// Xóa tất cả content của một khóa học (để test lại)
importRouter.delete('/course-content/:courseId', deleteAllCourseContent);

export default importRouter;
