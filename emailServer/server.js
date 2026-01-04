import dotenv from 'dotenv';
import smtpConfig from './config/smtp.config.js';
import notificationConsumer from './consumers/notificationConsumer.js';

dotenv.config();

const PORT = process.env.PORT || 3002;

async function startEmailServer() {
  try {
    console.log('🚀 Starting Email Server...');
    console.log('='.repeat(50));
    
    // Verify SMTP connection
    const isSmtpConnected = await smtpConfig.verifyConnection();
    if (!isSmtpConnected) {
      console.warn('⚠️ SMTP connection failed. Please check your configuration.');
      console.log('📧 Email sending will not work until SMTP is configured correctly.');
    }
    
    // Start notification consumer (will auto-retry if RabbitMQ is not available)
    await notificationConsumer.start();
    
    console.log('='.repeat(50));
    console.log('✅ Email Server is running!');
    console.log(`📧 SMTP: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`);
    console.log(`📬 Queue: ${process.env.NOTIFICATION_QUEUE || 'notification_queue'}`);
    console.log(`🔗 RabbitMQ: ${process.env.RABBITMQ_URL || 'amqp://localhost:5672'}`);
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ Error starting Email Server:', error.message);
    console.log('⚠️ Server will continue running and retry connections automatically...');
  }
}

// Graceful shutdown handlers
process.on('SIGINT', async () => {
  console.log('\n⏹️ Shutting down Email Server gracefully...');
  await notificationConsumer.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⏹️ Shutting down Email Server gracefully...');
  await notificationConsumer.stop();
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startEmailServer();
