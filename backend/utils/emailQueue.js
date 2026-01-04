import amqp from 'amqplib';
import logger from './logger.js';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const NOTIFICATION_QUEUE = process.env.NOTIFICATION_QUEUE || 'notification_queue';
const QUEUE_DURABLE = process.env.QUEUE_DURABLE === 'true';

/**
 * Send notification email via RabbitMQ
 * @param {Object} notification - Notification object from database
 * @param {String} userEmail - User's email address
 * @param {String} courseTitle - Optional course title
 */
export async function queueNotificationEmail(notification, userEmail, courseTitle = '') {
  let connection;
  let channel;
  
  try {
    // Connect to RabbitMQ
    connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    
    // Assert queue exists
    await channel.assertQueue(NOTIFICATION_QUEUE, { durable: QUEUE_DURABLE });
    
    // Prepare message
    const message = {
      receiver_email: userEmail,
      event_type: notification.event_type,
      event_title: notification.event_title,
      event_message: notification.event_message,
      event_url: notification.event_url || '',
      courseTitle: courseTitle,
      _id: notification._id.toString()
    };
    
    // Send message to queue
    const sent = channel.sendToQueue(
      NOTIFICATION_QUEUE,
      Buffer.from(JSON.stringify(message)),
      { persistent: QUEUE_DURABLE }
    );
    
    if (sent) {
      logger.info(`Notification queued for email: ${notification._id} to ${userEmail}`);
    }
    
    return { success: true, message: 'Notification queued successfully' };
  } catch (error) {
    logger.error(`Failed to queue notification email: ${error.message}`);
    // Don't throw - email is optional, main notification still created
    return { success: false, error: error.message };
  } finally {
    // Clean up connections
    try {
      if (channel) await channel.close();
      if (connection) await connection.close();
    } catch (closeError) {
      logger.error(`Error closing RabbitMQ connection: ${closeError.message}`);
    }
  }
}

/**
 * Send bulk notification emails via RabbitMQ
 * @param {Array} notificationEmailPairs - Array of { notification, userEmail, courseTitle } objects
 */
export async function queueBulkNotificationEmails(notificationEmailPairs) {
  let connection;
  let channel;
  const results = [];
  
  try {
    // Connect to RabbitMQ
    connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    
    // Assert queue exists
    await channel.assertQueue(NOTIFICATION_QUEUE, { durable: QUEUE_DURABLE });
    
    // Send all messages
    for (const { notification, userEmail, courseTitle = '' } of notificationEmailPairs) {
      try {
        const message = {
          receiver_email: userEmail,
          event_type: notification.event_type,
          event_title: notification.event_title,
          event_message: notification.event_message,
          event_url: notification.event_url || '',
          courseTitle: courseTitle,
          _id: notification._id.toString()
        };
        
        const sent = channel.sendToQueue(
          NOTIFICATION_QUEUE,
          Buffer.from(JSON.stringify(message)),
          { persistent: QUEUE_DURABLE }
        );
        
        results.push({
          notification_id: notification._id,
          email: userEmail,
          success: sent
        });
      } catch (error) {
        results.push({
          notification_id: notification._id,
          email: userEmail,
          success: false,
          error: error.message
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    logger.info(`Queued ${successCount}/${results.length} notification emails`);
    
    return { success: true, results };
  } catch (error) {
    logger.error(`Failed to queue bulk notifications: ${error.message}`);
    return { success: false, error: error.message };
  } finally {
    // Clean up connections
    try {
      if (channel) await channel.close();
      if (connection) await connection.close();
    } catch (closeError) {
      logger.error(`Error closing RabbitMQ connection: ${closeError.message}`);
    }
  }
}
