import amqp from 'amqplib';
import dotenv from 'dotenv';

dotenv.config();

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';

async function checkRabbitMQ() {
  console.log('🔍 Checking RabbitMQ connection...');
  console.log(`📍 URL: ${RABBITMQ_URL}`);
  console.log('');

  try {
    console.log('⏳ Attempting to connect...');
    const connection = await amqp.connect(RABBITMQ_URL);
    console.log('✅ Successfully connected to RabbitMQ!');

    const channel = await connection.createChannel();
    console.log('✅ Successfully created channel!');

    await channel.close();
    await connection.close();
    
    console.log('');
    console.log('🎉 RabbitMQ is running and accessible!');
    console.log('✅ You can now start the email server.');
    process.exit(0);
  } catch (error) {
    console.log('');
    console.error('❌ Failed to connect to RabbitMQ');
    console.error('Error:', error.message);
    console.log('');
    console.log('💡 Please make sure RabbitMQ is running:');
    console.log('');
    console.log('   Windows (if installed):');
    console.log('   - Check services: rabbitmq-server should be running');
    console.log('   - Or run: rabbitmq-server start');
    console.log('');
    console.log('   Docker:');
    console.log('   - docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management');
    console.log('');
    console.log('   Check if RabbitMQ is installed:');
    console.log('   - rabbitmqctl status');
    console.log('');
    process.exit(1);
  }
}

checkRabbitMQ();
