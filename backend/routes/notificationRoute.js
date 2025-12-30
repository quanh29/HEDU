import express from 'express';
import { 
  getNotifications, 
  markAsRead, 
  markAllAsRead,
  deleteNotification,
  getUnreadNotificationCount
} from '../controllers/notificationController.js';
import { protectUserAction } from '../middleware/auth.js';

const notificationRouter = express.Router();

// All notification routes require authentication
notificationRouter.use(protectUserAction);

// Get unread notification count - MUST be before /:id routes
notificationRouter.get('/unread-count', getUnreadNotificationCount);

// Mark all notifications as read - MUST be before /:id routes
notificationRouter.put('/read-all', markAllAsRead);

// Get all notifications for the authenticated user
// Query params: page, limit, is_read, event_type
notificationRouter.get('/', getNotifications);

// Mark a specific notification as read
notificationRouter.put('/:id/read', markAsRead);

// Delete a notification
notificationRouter.delete('/:id', deleteNotification);

export default notificationRouter;
