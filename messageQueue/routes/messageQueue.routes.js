import express from 'express';
import messageQueueController from '../controllers/messageQueue.controller.js';

const router = express.Router();

// Queue operations
router.post('/queue/create', messageQueueController.createQueue);
router.post('/queue/subscribe', messageQueueController.subscribeQueue);
router.delete('/queue/delete', messageQueueController.deleteQueue);
router.post('/queue/purge', messageQueueController.purgeQueue);

// Message operations
router.post('/message/send', messageQueueController.sendMessage);
router.post('/message/consume', messageQueueController.consumeMessage);

// Status endpoints
router.get('/status', messageQueueController.getStatus);
router.get('/health', messageQueueController.healthCheck);

export default router;
