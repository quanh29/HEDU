import express from 'express';
import { requireAuth } from '@clerk/express';
import { protectUserAction, protectAdmin } from '../middleware/auth.js';
import {
  requestRefund,
  getRefundHistory,
  getAllRefunds,
  processRefund,
  getRefundStats
} from '../controllers/refundController.js';

const router = express.Router();

// User routes (require authentication)
router.post('/request', requireAuth(), protectUserAction, requestRefund);
router.get('/history', requireAuth(), protectUserAction, getRefundHistory);

// Admin routes (require authentication + admin role)
router.get('/all', requireAuth(), protectAdmin, getAllRefunds);
router.put('/process/:refundId', requireAuth(), protectAdmin, processRefund);
router.get('/stats', requireAuth(), protectAdmin, getRefundStats);

export default router;
