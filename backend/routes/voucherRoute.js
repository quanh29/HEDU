import express from 'express';
import { 
  validateVoucher,
  getActiveVouchers
} from '../controllers/voucherController.js';
import { protectUserAction } from '../middleware/auth.js';

const voucherRouter = express.Router();

// All routes require authentication
voucherRouter.use(protectUserAction);

// Validate voucher code
voucherRouter.post('/validate', validateVoucher);

// Get active vouchers
voucherRouter.get('/list', getActiveVouchers);

export default voucherRouter;
