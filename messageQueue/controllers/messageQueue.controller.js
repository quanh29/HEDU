import rabbitmqConfig from '../config/rabbitmq.config.js';

class MessageQueueController {
  // Tạo queue mới
  async createQueue(req, res) {
    try {
      const { queueName, durable = false } = req.body;
      
      if (!queueName) {
        return res.status(400).json({ error: 'Queue name is required' });
      }
      
      const channel = rabbitmqConfig.getChannel();
      if (!channel) {
        return res.status(503).json({ error: 'RabbitMQ is not connected' });
      }
      
      await channel.assertQueue(queueName, { durable });
      res.json({ 
        success: true, 
        message: `Queue '${queueName}' created successfully`,
        queueName,
        durable
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Gửi tin nhắn vào queue
  async sendMessage(req, res) {
    try {
      const { queueName, message, persistent = false } = req.body;
      
      if (!queueName || !message) {
        return res.status(400).json({ error: 'Queue name and message are required' });
      }
      
      const channel = rabbitmqConfig.getChannel();
      if (!channel) {
        return res.status(503).json({ error: 'RabbitMQ is not connected' });
      }
      
      // Đảm bảo queue tồn tại
      await channel.assertQueue(queueName, { durable: persistent });
      
      // Gửi tin nhắn
      const options = persistent ? { persistent: true } : {};
      channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), options);
      
      console.log(`✓ Message sent to queue '${queueName}':`, message);
      
      res.json({ 
        success: true,
        message: 'Message sent successfully',
        queueName,
        data: message
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Nhận tin nhắn từ queue (consume)
  async consumeMessage(req, res) {
    try {
      const { queueName, autoAck = false } = req.body;
      
      if (!queueName) {
        return res.status(400).json({ error: 'Queue name is required' });
      }
      
      const channel = rabbitmqConfig.getChannel();
      if (!channel) {
        return res.status(503).json({ error: 'RabbitMQ is not connected' });
      }
      
      // Đảm bảo queue tồn tại
      await channel.assertQueue(queueName, { durable: false });
      
      // Lấy một tin nhắn từ queue
      const msg = await channel.get(queueName, { noAck: autoAck });
      
      if (msg) {
        const content = JSON.parse(msg.content.toString());
        
        if (!autoAck) {
          channel.ack(msg);
        }
        
        console.log(`✓ Message consumed from queue '${queueName}':`, content);
        
        res.json({
          success: true,
          queueName,
          message: content,
          messageCount: msg.fields.messageCount
        });
      } else {
        res.json({
          success: true,
          queueName,
          message: null,
          info: 'Queue is empty'
        });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Bắt đầu lắng nghe queue (subscribe)
  async subscribeQueue(req, res) {
    try {
      const { queueName, prefetch = 1 } = req.body;
      
      if (!queueName) {
        return res.status(400).json({ error: 'Queue name is required' });
      }
      
      const channel = rabbitmqConfig.getChannel();
      if (!channel) {
        return res.status(503).json({ error: 'RabbitMQ is not connected' });
      }
      
      // Đảm bảo queue tồn tại
      await channel.assertQueue(queueName, { durable: false });
      
      // Thiết lập prefetch
      channel.prefetch(prefetch);
      
      // Bắt đầu consume
      channel.consume(queueName, (msg) => {
        if (msg !== null) {
          const content = JSON.parse(msg.content.toString());
          console.log(`✓ [${queueName}] Received:`, content);
          
          // Xử lý tin nhắn ở đây
          // Ví dụ: gọi webhook, lưu vào database, etc.
          
          channel.ack(msg);
        }
      });
      
      console.log(`✓ Started consuming from queue '${queueName}'`);
      
      res.json({
        success: true,
        message: `Subscribed to queue '${queueName}' successfully`,
        queueName
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Xóa queue
  async deleteQueue(req, res) {
    try {
      const { queueName } = req.body;
      
      if (!queueName) {
        return res.status(400).json({ error: 'Queue name is required' });
      }
      
      const channel = rabbitmqConfig.getChannel();
      if (!channel) {
        return res.status(503).json({ error: 'RabbitMQ is not connected' });
      }
      
      await channel.deleteQueue(queueName);
      
      res.json({
        success: true,
        message: `Queue '${queueName}' deleted successfully`,
        queueName
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Xóa tất cả tin nhắn trong queue
  async purgeQueue(req, res) {
    try {
      const { queueName } = req.body;
      
      if (!queueName) {
        return res.status(400).json({ error: 'Queue name is required' });
      }
      
      const channel = rabbitmqConfig.getChannel();
      if (!channel) {
        return res.status(503).json({ error: 'RabbitMQ is not connected' });
      }
      
      const result = await channel.purgeQueue(queueName);
      
      res.json({
        success: true,
        message: `Queue '${queueName}' purged successfully`,
        queueName,
        messagesDeleted: result.messageCount
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Kiểm tra trạng thái kết nối
  getStatus(req, res) {
    const channel = rabbitmqConfig.getChannel();
    res.json({
      rabbitMQ: channel ? 'connected' : 'disconnected',
      server: 'running',
      timestamp: new Date().toISOString()
    });
  }

  // Health check endpoint
  healthCheck(req, res) {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  }
}

export default new MessageQueueController();
