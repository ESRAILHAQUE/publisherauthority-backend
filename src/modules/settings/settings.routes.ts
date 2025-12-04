import { Router } from 'express';
import settingsController from './settings.controller';
import { protect, restrictTo } from '../../middleware/auth';

/**
 * Settings Routes
 */
const router = Router();

// All routes require authentication and admin role
router.use(protect);
router.use(restrictTo('admin'));

router.get('/', settingsController.getSettings);
router.put('/', settingsController.updateSettings);

export default router;

