import Notification from '../models/Notification.js';

/**
 * Setup notification socket handlers
 * @param {Socket} socket - Socket.IO socket instance
 * @param {Server} io - Socket.IO server instance
 */
export const setupNotificationSocketHandlers = (socket, io) => {
  console.log(`🔔 [Notification Socket] Setting up handlers for user: ${socket.userId}`);

  /**
   * Join user's personal notification room
   * Each user has their own room: `notification:${userId}`
   */
  socket.join(`notification:${socket.userId}`);
  console.log(`✅ [Notification Socket] User ${socket.userId} joined notification room`);

  /**
   * Send acknowledgment to client
   */
  socket.emit('notificationReady', {
    message: 'Notification system ready',
    userId: socket.userId
  });

  /**
   * Handle disconnect
   */
  socket.on('disconnect', () => {
    console.log(`🔌 [Notification Socket] User ${socket.userId} disconnected from notifications`);
  });
};

/**
 * Push notification to a specific user via socket
 * This function is called from controllers to send real-time notifications
 * @param {Server} io - Socket.IO server instance
 * @param {string} userId - User ID to send notification to
 * @param {Object} notification - Notification object
 */
export const pushNotificationToUser = (io, userId, notification) => {
  try {
    console.log(`📤 [Notification Socket] Pushing notification to user ${userId}`);
    
    // Emit to user's personal notification room
    io.to(`notification:${userId}`).emit('newNotification', notification);
    
    console.log(`✅ [Notification Socket] Notification sent to user ${userId}`);
  } catch (error) {
    console.error(`❌ [Notification Socket] Error pushing notification:`, error);
  }
};

/**
 * Push notification to multiple users via socket
 * @param {Server} io - Socket.IO server instance
 * @param {Array<string>} userIds - Array of user IDs
 * @param {Object} notificationData - Notification data (will create individual notifications)
 */
export const pushNotificationToMultipleUsers = async (io, userIds, notificationData) => {
  try {
    console.log(`📤 [Notification Socket] Pushing notifications to ${userIds.length} users`);
    
    for (const userId of userIds) {
      // Create individual notification for each user
      const notification = new Notification({
        receiver_id: userId,
        event_type: notificationData.event_type,
        event_title: notificationData.event_title,
        event_message: notificationData.event_message,
        event_url: notificationData.event_url || '',
        is_read: false
      });
      
      await notification.save();
      
      // Push via socket
      io.to(`notification:${userId}`).emit('newNotification', notification);
    }
    
    console.log(`✅ [Notification Socket] Notifications sent to ${userIds.length} users`);
  } catch (error) {
    console.error(`❌ [Notification Socket] Error pushing notifications:`, error);
  }
};
