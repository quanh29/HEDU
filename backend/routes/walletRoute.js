import express from 'express';
import { protectUserAction } from '../middleware/auth.js';
import { 
  getWallet, 
  getTransactions, 
  deposit, 
  withdraw,
  addPaymentMethod,
  removePaymentMethod,
  setDefaultPaymentMethod,
  handleMoMoDepositCallback,
  handleMoMoDisbursementCallback
} from '../controllers/walletController.js';

const walletRouter = express.Router();

// Get wallet information
walletRouter.get('/', protectUserAction, getWallet);

// Get transaction history
walletRouter.get('/transactions', protectUserAction, getTransactions);

// Deposit money
walletRouter.post('/deposit', protectUserAction, deposit);

// Withdraw money
walletRouter.post('/withdraw', protectUserAction, withdraw);

// MoMo callback for wallet deposit
walletRouter.post('/momo/callback', handleMoMoDepositCallback);

// MoMo callback for wallet disbursement (withdrawal)
walletRouter.post('/momo/disbursement-callback', handleMoMoDisbursementCallback);

// Payment method management
walletRouter.post('/payment-methods', protectUserAction, addPaymentMethod);
walletRouter.delete('/payment-methods/:index', protectUserAction, removePaymentMethod);
walletRouter.put('/payment-methods/:index/default', protectUserAction, setDefaultPaymentMethod);

export default walletRouter;
