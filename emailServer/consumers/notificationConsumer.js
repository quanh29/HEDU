import rabbitmqConfig from '../config/rabbitmq.config.js';
import emailService from '../services/emailService.js';
import dotenv from 'dotenv';

dotenv.config();

const NOTIFICATION_QUEUE = process.env.NOTIFICATION_QUEUE || 'notification_queue';

class NotificationConsumer {
  async start() {
    try {
      console.log('🚀 Starting Notification Consumer...');
      
      // Connect to RabbitMQ
      await rabbitmqConfig.connect();
      
      // Start consuming messages
      await rabbitmqConfig.consume(NOTIFICATION_QUEUE, async (message) => {
        await this.processNotification(message);
      });
      
      console.log(`✅ Notification Consumer started on queue: ${NOTIFICATION_QUEUE}`);
    } catch (error) {
      console.error('❌ Failed to start Notification Consumer:', error.message);
      console.log('💡 Will retry automatically when RabbitMQ becomes available...');
      // Don't throw - let the auto-reconnect handle it
    }
  }

  async processNotification(message) {
    try {
      console.log('📧 Processing notification:', message);

      // Validate message structure
      if (!message.receiver_email) {
        throw new Error('Missing receiver_email in notification message');
      }

      if (!message.event_type) {
        throw new Error('Missing event_type in notification message');
      }

      // Send email using email service
      const result = await emailService.sendNotificationEmail(message);
      
      console.log('✅ Email sent successfully for notification:', {
        notification_id: message._id || message.notification_id,
        event_type: message.event_type,
        receiver: message.receiver_email,
        messageId: result.messageId
      });

      return result;
    } catch (error) {
      console.error('❌ Failed to process notification:', error);
      throw error; // This will cause the message to be requeued
    }
  }

  async stop() {
    console.log('⏹️ Stopping Notification Consumer...');
    await rabbitmqConfig.close();
  }
}

const notificationConsumer = new NotificationConsumer();
export default notificationConsumer;
