import { Router } from 'express';
import dashboardController from './dashboard.controller';
import { protect } from '../../middleware/auth';

/**
 * Dashboard Routes
 */
const router = Router();

// All routes require authentication
router.use(protect);

router.get('/', dashboardController.getPublisherDashboard);

export default router;

