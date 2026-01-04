import amqp from 'amqplib';

class RabbitMQConfig {
  constructor() {
    this.RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
    this.connection = null;
    this.channel = null;
  }

  async connect() {
    try {
      this.connection = await amqp.connect(this.RABBITMQ_URL);
      this.channel = await this.connection.createChannel();
      console.log('✓ Connected to RabbitMQ successfully');
      
      // Xử lý khi connection bị đóng
      this.connection.on('close', () => {
        console.error('RabbitMQ connection closed');
        setTimeout(() => this.connect(), 5000);
      });
      
      this.connection.on('error', (err) => {
        console.error('RabbitMQ connection error:', err);
      });
      
      return true;
    } catch (error) {
      console.error('Error connecting to RabbitMQ:', error.message);
      console.log('Retrying in 5 seconds...');
      setTimeout(() => this.connect(), 5000);
      return false;
    }
  }

  getChannel() {
    return this.channel;
  }

  getConnection() {
    return this.connection;
  }

  async close() {
    try {
      if (this.channel) await this.channel.close();
      if (this.connection) await this.connection.close();
      console.log('✓ RabbitMQ connection closed');
    } catch (error) {
      console.error('Error closing RabbitMQ connection:', error);
    }
  }
}

export default new RabbitMQConfig();
