import Notification from '../models/Notification.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import { queueNotificationEmail, queueBulkNotificationEmails } from '../utils/emailQueue.js';

/**
 * Create and push a new notification
 * @param {Object} notificationData - Notification data
 * @param {string} notificationData.receiver_id - User ID of the receiver
 * @param {string} notificationData.event_type - Type of event (course_update, system_alert, etc.)
 * @param {string} notificationData.event_title - Title of the notification
 * @param {string} notificationData.event_message - Message content
 * @param {string} notificationData.event_url - Optional URL to navigate to
 * @param {string} notificationData.courseTitle - Optional course title for email template
 * @returns {Promise<Object>} Created notification
 */
export const pushNotification = async (notificationData) => {
  try {
    const { receiver_id, event_type, event_title, event_message, event_url, courseTitle } = notificationData;

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

    // Queue email notification (async, non-blocking)
    try {
      const user = await User.findById(receiver_id);
      if (user && user.email) {
        await queueNotificationEmail(notification, user.email, courseTitle || '');
      } else {
        logger.warn(`User ${receiver_id} not found or has no email - skipping email notification`);
      }
    } catch (emailError) {
      logger.error(`Failed to queue email for notification ${notification._id}: ${emailError.message}`);
      // Don't throw - notification is still created successfully
    }

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
    // Create all notifications first
    const notifications = [];
    for (const data of notificationsData) {
      const { receiver_id, event_type, event_title, event_message, event_url, courseTitle } = data;

      // Validate required fields
      if (!receiver_id || !event_type || !event_title || !event_message) {
        logger.warn('Skipping notification with missing required fields');
        continue;
      }

      // Validate event_type
      const validEventTypes = ['course_update', 'system_alert', 'course_enrollment', 'course_review', 'refund', 'other'];
      if (!validEventTypes.includes(event_type)) {
        logger.warn(`Skipping notification with invalid event_type: ${event_type}`);
        continue;
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
      notifications.push({ notification, courseTitle });
    }

    logger.info(`${notifications.length} notifications created successfully`);

    // Queue all emails (async, non-blocking)
    try {
      const emailPairs = [];
      for (const { notification, courseTitle } of notifications) {
        const user = await User.findById(notification.receiver_id);
        if (user && user.email) {
          emailPairs.push({
            notification,
            userEmail: user.email,
            courseTitle: courseTitle || ''
          });
        }
      }

      if (emailPairs.length > 0) {
        await queueBulkNotificationEmails(emailPairs);
      }
    } catch (emailError) {
      logger.error(`Failed to queue bulk emails: ${emailError.message}`);
      // Don't throw - notifications are still created successfully
    }

    return notifications.map(n => n.notification);
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
