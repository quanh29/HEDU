import express from 'express';
import { protectUserAction } from '../middleware/auth.js';
import {
  getInstructorStats,
  getRevenueChart,
  getRevenueByCourse,
  getCourseRatings,
  getRecentActivities,
  getTopCoursesByStudents,
  getAvailableYears
} from '../controllers/dashboardController.js';

const dashboardRouter = express.Router();

// All routes require authentication
dashboardRouter.use(protectUserAction);

// Get instructor dashboard statistics
dashboardRouter.get('/instructor/stats', getInstructorStats);

// Get revenue over time chart data
dashboardRouter.get('/instructor/revenue-chart', getRevenueChart);

// Get revenue by course
dashboardRouter.get('/instructor/revenue-by-course', getRevenueByCourse);

// Get course ratings
dashboardRouter.get('/instructor/course-ratings', getCourseRatings);

// Get top courses by students
dashboardRouter.get('/instructor/top-courses-by-students', getTopCoursesByStudents);

// Get available years with revenue data
dashboardRouter.get('/instructor/available-years', getAvailableYears);

// Get recent activities
dashboardRouter.get('/instructor/recent-activities', getRecentActivities);

export default dashboardRouter;
