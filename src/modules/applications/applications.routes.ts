import { Router } from 'express';
import applicationsController from './applications.controller';

/**
 * Applications Routes
 */
const router = Router();

// Public route
router.post('/', applicationsController.submitApplication);

export default router;

