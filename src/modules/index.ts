import { Router } from 'express';
import authRoutes from './auth/auth.routes';
import usersRoutes from './users/users.routes';

/**
 * Module Router
 * Aggregates all module routes
 */
const router = Router();

// Mount module routes
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);

export default router;

