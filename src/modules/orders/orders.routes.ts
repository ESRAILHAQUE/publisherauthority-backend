import { Router } from 'express';
import ordersController from './orders.controller';
import { protect } from '../../middleware/auth';

/**
 * Orders Routes
 */
const router = Router();

// All routes require authentication
router.use(protect);

// Get stats (must be before /:id route)
router.get('/stats', ordersController.getOrderStats);

// Publisher routes
router.get('/', ordersController.getPublisherOrders);
router.get('/:id', ordersController.getOrderById);
router.post('/:id/approve', ordersController.approveOrderTopic);
router.post('/:id/submit', ordersController.submitPostUrl);

export default router;



