import { Router } from 'express';
import usersController from './users.controller';
import { protect } from '../../middleware/auth';
import { profileImageUpload } from '../../utils/profileUpload';

/**
 * Users Routes
 * Defines all user management routes
 */
const router = Router();

// Get user statistics (must be before /:id route)
router.get('/stats', usersController.getUserStats);

// Profile routes (must be before /:id route)
router.put('/profile', protect, usersController.updateProfile);
router.post('/profile/image', protect, profileImageUpload.single('image'), usersController.uploadProfileImage);
router.get('/profile/images/:filename', usersController.getProfileImage);
router.post('/change-password', protect, usersController.changePassword);

// CRUD operations
router.get('/', usersController.getAllUsers);
router.get('/:id', usersController.getUserById);
router.put('/:id', usersController.updateUser);
router.delete('/:id', usersController.deleteUser);

export default router;

