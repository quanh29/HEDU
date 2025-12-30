import Notification from '../models/Notification.js';
import logger from '../utils/logger.js';

/**
 * Create and push a new notification
 * @param {Object} notificationData - Notification data
 * @param {string} notificationData.receiver_id - User ID of the receiver
 * @param {string} notificationData.event_type - Type of event (course_update, system_alert, etc.)
 * @param {string} notificationData.event_title - Title of the notification
 * @param {string} notificationData.event_message - Message content
 * @param {string} notificationData.event_url - Optional URL to navigate to
 * @returns {Promise<Object>} Created notification
 */
export const pushNotification = async (notificationData) => {
  try {
    const { receiver_id, event_type, event_title, event_message, event_url } = notificationData;

    // Validate required fields
    if (!receiver_id || !event_type || !event_title || !event_message) {
      throw new Error('Missing required notification fields');
    }

    // Validate event_type
    const validEventTypes = ['course_update', 'system_alert', 'course_enrollment', 'course_review', 'refund', 'other'];
    if (!validEventTypes.includes(event_type)) {
      throw new Error(`Invalid event_type. Must be one of: ${validEventTypes.join(', ')}`);
    }

    // Create notification
    const notification = new Notification({
      receiver_id,
      event_type,
      event_title,
      event_message,
      event_url: event_url || '',
      is_read: false
    });

    await notification.save();

    logger.info(`Notification created for user ${receiver_id}: ${event_title}`);

    return notification;
  } catch (error) {
    logger.error(`Error pushing notification: ${error.message}`);
    throw error;
  }
};

/**
 * Push multiple notifications
 * @param {Array<Object>} notificationsData - Array of notification data objects
 * @returns {Promise<Array<Object>>} Array of created notifications
 */
export const pushBulkNotifications = async (notificationsData) => {
  try {
    const notifications = await Promise.all(
      notificationsData.map(data => pushNotification(data))
    );

    logger.info(`${notifications.length} notifications created successfully`);

    return notifications;
  } catch (error) {
    logger.error(`Error pushing bulk notifications: ${error.message}`);
    throw error;
  }
};

/**
 * Get user's unread notification count
 * @param {string} userId - User ID
 * @returns {Promise<number>} Count of unread notifications
 */
export const getUnreadCount = async (userId) => {
  try {
    const count = await Notification.countDocuments({
      receiver_id: userId,
      is_read: false
    });

    return count;
  } catch (error) {
    logger.error(`Error getting unread count: ${error.message}`);
    throw error;
  }
};
