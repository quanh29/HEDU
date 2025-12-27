import express from 'express';
import multer from 'multer';
import { protectUserAction } from '../middleware/auth.js';
import {
  getOrCreateConversation,
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  getUnreadCount,
  getImageUrl
} from '../controllers/messageController.js';

const router = express.Router();

// Configure multer for image uploads (memory storage)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Image type not allowed: ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max for images
  }
});

// All routes require authentication
router.use(protectUserAction);

// Get or create conversation
router.post('/conversation', getOrCreateConversation);

// Get all conversations
router.get('/conversations', getConversations);

// Get messages for a conversation
router.get('/conversation/:conversationId', getMessages);

// Send message (with optional image)
router.post('/send', upload.single('image'), sendMessage);

// Mark messages as read
router.put('/read/:conversationId', markAsRead);

// Get total unread count
router.get('/unread-count', getUnreadCount);

// Get signed URL for private image
router.post('/image-url', getImageUrl);

export default router;
