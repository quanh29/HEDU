import express from 'express';
import { 
  initiateMoMoPayment,
  handleMoMoCallback,
  handleMoMoReturn,
  getPaymentDetails
} from '../controllers/paymentController.js';
import { payWithWallet } from '../controllers/walletController.js';
import { protectUserAction } from '../middleware/auth.js';

const paymentRouter = express.Router();

// MoMo callback (IPN) - No auth required (MoMo server calls this)
paymentRouter.post('/momo/callback', handleMoMoCallback);

// MoMo return URL - No auth required (user redirected from MoMo)
paymentRouter.get('/momo/return', handleMoMoReturn);

// Protected routes require authentication
paymentRouter.use(protectUserAction);

// Initiate MoMo payment
paymentRouter.post('/momo/initiate', initiateMoMoPayment);

// Pay with wallet
paymentRouter.post('/wallet/pay', payWithWallet);

// Get payment details
paymentRouter.get('/:paymentId', getPaymentDetails);

export default paymentRouter;
