import { Router } from 'express';
import settingsController from './settings.controller';

/**
 * Public Settings Routes
 * Exposes non-sensitive settings for client use
 */
const router = Router();

// Public route for verification instructions
router.get('/public', settingsController.getPublicVerificationSettings);

export default router;


