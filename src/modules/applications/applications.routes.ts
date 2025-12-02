import { Router } from 'express';
import applicationsController from './applications.controller';

/**
 * Applications Routes
 */
const router = Router();

// Public routes
router.post('/', applicationsController.submitApplication);
router.get('/', applicationsController.getApplications); // Add GET route for checking applications

export default router;



