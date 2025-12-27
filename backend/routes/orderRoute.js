import express from 'express';
import { 
  createOrder, 
  getOrderDetails, 
  getOrderHistory 
} from '../controllers/orderController.js';
import { protectUserAction } from '../middleware/auth.js';

const orderRouter = express.Router();

// All routes require authentication
orderRouter.use(protectUserAction);

// Create order from cart
orderRouter.post('/create', createOrder);

// Get order history (must be before /:orderId)
orderRouter.get('/history', getOrderHistory);

// Get order details
orderRouter.get('/:orderId', getOrderDetails);

export default orderRouter;
