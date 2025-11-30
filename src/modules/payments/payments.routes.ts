import { Router } from 'express';
import paymentsController from './payments.controller';
import { protect } from '../../middleware/auth';

/**
 * Payments Routes
 */
const router = Router();

// All routes require authentication
router.use(protect);

// Get stats (must be before /:id route)
router.get('/stats', paymentsController.getPaymentStats);

// Publisher routes
router.get('/', paymentsController.getUserPayments);
router.get('/:id', paymentsController.getPaymentById);
router.put('/settings', paymentsController.updatePaymentSettings);

export default router;

