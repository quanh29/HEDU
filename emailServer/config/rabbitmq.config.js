import amqp from 'amqplib';
import dotenv from 'dotenv';

dotenv.config();

class RabbitMQConfig {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.url = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
    this.queueDurable = process.env.QUEUE_DURABLE === 'true';
    this.isConnecting = false;
    this.reconnectTimeout = null;
  }

  async connect() {
    if (this.isConnecting) {
      console.log('⏳ Already attempting to connect...');
      return;
    }

    this.isConnecting = true;

    try {
      // Close existing connections first
      await this.closeConnections();

      // Create new connection
      this.connection = await amqp.connect(this.url);
      console.log('✅ Connected to RabbitMQ');

      // Set up connection event handlers
      this.connection.on('error', (err) => {
        console.error('❌ RabbitMQ connection error:', err.message);
        this.connection = null;
        this.channel = null;
      });

      this.connection.on('close', () => {
        console.log('⚠️ RabbitMQ connection closed');
        this.connection = null;
        this.channel = null;
        
        // Schedule reconnection
        if (!this.reconnectTimeout) {
          console.log('🔄 Reconnecting in 5 seconds...');
          this.reconnectTimeout = setTimeout(() => {
            this.reconnectTimeout = null;
            this.isConnecting = false;
            this.connect();
          }, 5000);
        }
      });

      // Create channel
      this.channel = await this.connection.createChannel();
      console.log('✅ RabbitMQ channel created');

      // Set up channel event handlers
      this.channel.on('error', (err) => {
        console.error('❌ RabbitMQ channel error:', err.message);
      });

      this.channel.on('close', () => {
        console.log('⚠️ RabbitMQ channel closed');
        this.channel = null;
      });

      this.isConnecting = false;
      return this.channel;
    } catch (error) {
      console.error('❌ Failed to connect to RabbitMQ:', error.message);
      console.log('💡 Make sure RabbitMQ is running on:', this.url);
      this.connection = null;
      this.channel = null;
      this.isConnecting = false;
      
      // Schedule reconnection
      if (!this.reconnectTimeout) {
        console.log('🔄 Retrying in 5 seconds...');
        this.reconnectTimeout = setTimeout(() => {
          this.reconnectTimeout = null;
          this.connect();
        }, 5000);
      }
      
      throw error;
    }
  }

  async closeConnections() {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
    } catch (error) {
      // Ignore errors when closing
    }

    try {
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
    } catch (error) {
      // Ignore errors when closing
    }
  }

  async assertQueue(queueName) {
    try {
      const channel = await this.getChannel();
      if (!channel) {
        throw new Error('Channel not available');
      }
      await channel.assertQueue(queueName, {
        durable: this.queueDurable
      });
      console.log(`✅ Queue "${queueName}" asserted`);
    } catch (error) {
      console.error(`❌ Failed to assert queue "${queueName}":`, error.message);
      throw error;
    }
  }

  async consume(queueName, callback) {
    try {
      const channel = await this.getChannel();
      if (!channel) {
        throw new Error('Channel not available');
      }

      await this.assertQueue(queueName);

      console.log(`📬 Waiting for messages in queue "${queueName}"...`);

      await channel.consume(
        queueName,
        async (msg) => {
          if (msg !== null) {
            try {
              const content = JSON.parse(msg.content.toString());
              console.log(`📨 Received message:`, content);
              
              await callback(content);
              
              // Acknowledge the message
              if (this.channel) {
                this.channel.ack(msg);
                console.log('✅ Message processed and acknowledged');
              }
            } catch (error) {
              console.error('❌ Error processing message:', error);
              // Reject the message and requeue it
              if (this.channel) {
                this.channel.nack(msg, false, true);
              }
            }
          }
        },
        {
          noAck: false // Manual acknowledgment
        }
      );
    } catch (error) {
      console.error('❌ Failed to consume messages:', error.message);
      throw error;
    }
  }

  async getChannel() {
    if (!this.channel || !this.connection) {
      await this.connect();
    }
    
    if (!this.channel) {
      throw new Error('Unable to create channel');
    }
    
    return this.channel;
  }

  async close() {
    try {
      // Clear reconnect timeout
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }

      await this.closeConnections();
      console.log('✅ RabbitMQ connection closed');
    } catch (error) {
      console.error('❌ Error closing RabbitMQ connection:', error.message);
    }
  }
}

const rabbitmqConfig = new RabbitMQConfig();
export default rabbitmqConfig;
