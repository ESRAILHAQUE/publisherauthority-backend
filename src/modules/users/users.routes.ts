import { Router } from 'express';
import usersController from './users.controller';

/**
 * Users Routes
 * Defines all user management routes
 */
const router = Router();

// Get user statistics (must be before /:id route)
router.get('/stats', usersController.getUserStats);

// CRUD operations
router.get('/', usersController.getAllUsers);
router.get('/:id', usersController.getUserById);
router.put('/:id', usersController.updateUser);
router.delete('/:id', usersController.deleteUser);

export default router;

