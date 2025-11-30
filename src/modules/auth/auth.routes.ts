import { Router } from 'express';
import authController from './auth.controller';
import { registerValidation, loginValidation } from './auth.validation';
import validateRequest from '../../middleware/validateRequest';

/**
 * Auth Routes
 * Defines all authentication-related routes
 */
const router = Router();

// Public routes
router.post('/register', registerValidation, validateRequest, authController.register);
router.post('/login', loginValidation, validateRequest, authController.login);

// Protected routes (will add auth middleware later)
router.get('/me', authController.getMe);

export default router;

