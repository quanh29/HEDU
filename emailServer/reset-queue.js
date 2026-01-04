import amqp from 'amqplib';
import dotenv from 'dotenv';

dotenv.config();

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const NOTIFICATION_QUEUE = process.env.NOTIFICATION_QUEUE || 'notification_queue';
const QUEUE_DURABLE = process.env.QUEUE_DURABLE === 'true';

async function resetQueue() {
  console.log('🔧 Resetting RabbitMQ Queue...');
  console.log(`📍 URL: ${RABBITMQ_URL}`);
  console.log(`📬 Queue: ${NOTIFICATION_QUEUE}`);
  console.log('');

  let connection;
  let channel;

  try {
    // Connect to RabbitMQ
    console.log('⏳ Connecting to RabbitMQ...');
    connection = await amqp.connect(RABBITMQ_URL);
    console.log('✅ Connected!');

    // Create channel
    channel = await connection.createChannel();
    console.log('✅ Channel created!');
    console.log('');

    // Delete existing queue if it exists
    try {
      console.log(`🗑️  Deleting existing queue "${NOTIFICATION_QUEUE}"...`);
      await channel.deleteQueue(NOTIFICATION_QUEUE);
      console.log('✅ Queue deleted successfully!');
    } catch (error) {
      if (error.message.includes('NOT_FOUND')) {
        console.log('ℹ️  Queue does not exist (this is fine)');
      } else {
        throw error;
      }
    }
    console.log('');

    // Create new queue with correct configuration
    console.log(`📦 Creating queue "${NOTIFICATION_QUEUE}" with durable=${QUEUE_DURABLE}...`);
    await channel.assertQueue(NOTIFICATION_QUEUE, {
      durable: QUEUE_DURABLE
    });
    console.log('✅ Queue created successfully!');
    console.log('');

    // Get queue info
    const queueInfo = await channel.checkQueue(NOTIFICATION_QUEUE);
    console.log('📊 Queue Information:');
    console.log(`   - Messages: ${queueInfo.messageCount}`);
    console.log(`   - Consumers: ${queueInfo.consumerCount}`);
    console.log('');

    console.log('🎉 Queue reset completed successfully!');
    console.log('✅ You can now start the email server.');

    await channel.close();
    await connection.close();
    process.exit(0);
  } catch (error) {
    console.log('');
    console.error('❌ Failed to reset queue');
    console.error('Error:', error.message);
    console.log('');
    console.log('💡 Make sure RabbitMQ is running and accessible.');
    
    try {
      if (channel) await channel.close();
      if (connection) await connection.close();
    } catch (closeError) {
      // Ignore close errors
    }
    
    process.exit(1);
  }
}

resetQueue();
