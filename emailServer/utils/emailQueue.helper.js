/**
 * Helper utility to push notification messages to RabbitMQ queue
 * Use this in your backend controllers when creating notifications
 */

import amqp from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const NOTIFICATION_QUEUE = 'notification_queue';
const QUEUE_DURABLE = process.env.QUEUE_DURABLE === 'true';

/**
 * Send notification email via RabbitMQ
 * @param {Object} notification - Notification object from database
 * @param {String} userEmail - User's email address
 */
export async function queueNotificationEmail(notification, userEmail) {
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
      courseTitle: notification.courseTitle || '',
      _id: notification._id.toString()
    };
    
    // Send message to queue
    const sent = channel.sendToQueue(
      NOTIFICATION_QUEUE,
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );
    
    if (sent) {
      console.log('✅ Notification queued for email:', {
        notification_id: notification._id,
        email: userEmail,
        event_type: notification.event_type
      });
    }
    
    return { success: true, message: 'Notification queued successfully' };
  } catch (error) {
    console.error('❌ Failed to queue notification email:', error);
    return { success: false, error: error.message };
  } finally {
    // Clean up connections
    try {
      if (channel) await channel.close();
      if (connection) await connection.close();
    } catch (closeError) {
      console.error('Error closing RabbitMQ connection:', closeError);
    }
  }
}

/**
 * Send bulk notification emails via RabbitMQ
 * @param {Array} notificationEmailPairs - Array of { notification, userEmail } objects
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
    for (const { notification, userEmail } of notificationEmailPairs) {
      try {
        const message = {
          receiver_email: userEmail,
          event_type: notification.event_type,
          event_title: notification.event_title,
          event_message: notification.event_message,
          event_url: notification.event_url || '',
          courseTitle: notification.courseTitle || '',
          _id: notification._id.toString()
        };
        
        const sent = channel.sendToQueue(
          NOTIFICATION_QUEUE,
          Buffer.from(JSON.stringify(message)),
          { persistent: true }
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
    
    console.log(`✅ Queued ${results.filter(r => r.success).length}/${results.length} notifications`);
    
    return { success: true, results };
  } catch (error) {
    console.error('❌ Failed to queue bulk notifications:', error);
    return { success: false, error: error.message };
  } finally {
    // Clean up connections
    try {
      if (channel) await channel.close();
      if (connection) await connection.close();
    } catch (closeError) {
      console.error('Error closing RabbitMQ connection:', closeError);
    }
  }
}

// Example usage in a controller:
/*
import { queueNotificationEmail } from '../utils/emailQueue.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

// When creating a notification
const notification = await Notification.create({
  receiver_id: userId,
  event_type: 'course_enrollment',
  event_title: 'Welcome to the course!',
  event_message: 'You have successfully enrolled in React Basics',
  event_url: '/courses/react-basics'
});

// Get user email
const user = await User.findById(userId);

// Queue email
await queueNotificationEmail(notification, user.email);
*/
