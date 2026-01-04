import express from 'express';
import bodyParser from 'body-parser';
import rabbitmqConfig from './config/rabbitmq.config.js';
import messageQueueRoutes from './routes/messageQueue.routes.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api', messageQueueRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Message Queue Server API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      status: '/api/status',
      createQueue: 'POST /api/queue/create',
      deleteQueue: 'DELETE /api/queue/delete',
      purgeQueue: 'POST /api/queue/purge',
      subscribeQueue: 'POST /api/queue/subscribe',
      sendMessage: 'POST /api/message/send',
      consumeMessage: 'POST /api/message/consume'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Xử lý khi server shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await rabbitmqConfig.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...');
  await rabbitmqConfig.close();
  process.exit(0);
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Message Queue Server is running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📡 Status: http://localhost:${PORT}/api/status`);
  console.log(`📖 API Docs: http://localhost:${PORT}/`);
  await rabbitmqConfig.connect();
});

export default app;
