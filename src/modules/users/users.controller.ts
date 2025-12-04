import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import usersService from './users.service';
import asyncHandler from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import AppError from '../../utils/AppError';
import { getProfileImageUrl, deleteProfileImage } from '../../utils/profileUpload';
import path from 'path';
import fs from 'fs';

/**
 * Users Controller
 * Handles HTTP requests for user management
 */
class UsersController {
  /**
   * @route   GET /api/v1/users
   * @desc    Get all users
   * @access  Private/Admin
   */
  getAllUsers = asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
    const users = await usersService.getAllUsers();

    sendSuccess(res, 200, 'Users retrieved successfully', {
      count: users.length,
      users,
    });
  });

  /**
   * @route   GET /api/v1/users/:id
   * @desc    Get user by ID
   * @access  Private
   */
  getUserById = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    const user = await usersService.getUserById(id);

    sendSuccess(res, 200, 'User retrieved successfully', { user });
  });

  /**
   * @route   PUT /api/v1/users/:id
   * @desc    Update user
   * @access  Private
   */
  updateUser = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    const updateData = req.body;

    const user = await usersService.updateUser(id, updateData);

    sendSuccess(res, 200, 'User updated successfully', { user });
  });

  /**
   * @route   DELETE /api/v1/users/:id
   * @desc    Delete user (soft delete)
   * @access  Private/Admin
   */
  deleteUser = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    await usersService.deleteUser(id);

    sendSuccess(res, 200, 'User deleted successfully', null);
  });

  /**
   * @route   GET /api/v1/users/stats
   * @desc    Get user statistics
   * @access  Private/Admin
   */
  getUserStats = asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
    const stats = await usersService.getUserStats();

    sendSuccess(res, 200, 'User statistics retrieved successfully', stats);
  });

  /**
   * @route   PUT /api/v1/users/profile
   * @desc    Update current user's profile
   * @access  Private
   */
  updateProfile = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const userId = req.user!.id;
    const { firstName, lastName, country } = req.body;

    const updateData: any = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (country !== undefined) updateData.country = country;

    const user = await usersService.updateUser(userId, updateData);

    sendSuccess(res, 200, 'Profile updated successfully', { user });
  });

  /**
   * @route   POST /api/v1/users/profile/image
   * @desc    Upload profile image
   * @access  Private
   */
  uploadProfileImage = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const userId = req.user!.id;
    const file = req.file;

    if (!file) {
      throw new AppError('No image file provided', 400);
    }

    // Get user to check for existing profile image
    const user = await usersService.getUserById(userId);
    
    // Delete old profile image if exists
    if (user.profileImage) {
      // Extract filename from URL
      const oldImageUrl = user.profileImage as string;
      const oldFilename = oldImageUrl.split('/').pop();
      if (oldFilename) {
        deleteProfileImage(oldFilename);
      }
    }

    // Generate full URL for the new image
    const imageUrl = getProfileImageUrl(file.filename);
    
    // Log the URL to debug
    console.log('Generated profile image URL:', imageUrl);
    console.log('URL length:', imageUrl.length);

    // Update user's profile image
    const updatedUser = await usersService.updateUser(userId, { profileImage: imageUrl });
    
    // Verify the saved URL
    console.log('Saved profile image URL:', updatedUser.profileImage);
    console.log('Saved URL length:', (updatedUser.profileImage as string)?.length);

    sendSuccess(res, 200, 'Profile image uploaded successfully', {
      user: updatedUser,
      profileImage: imageUrl,
    });
  });

  /**
   * @route   GET /api/v1/users/profile/images/:filename
   * @desc    Serve profile image
   * @access  Public
   */
  getProfileImage = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { filename } = req.params;
    const profileImagesDir = path.join(process.cwd(), 'uploads', 'profile-images');
    const filePath = path.join(profileImagesDir, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new AppError('Image not found', 404);
    }

    // Send file
    res.sendFile(filePath);
  });

  /**
   * @route   POST /api/v1/users/change-password
   * @desc    Change user password
   * @access  Private
   */
  changePassword = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError('Current password and new password are required', 400);
    }

    if (newPassword.length < 6) {
      throw new AppError('New password must be at least 6 characters long', 400);
    }

    await usersService.changePassword(userId, currentPassword, newPassword);

    sendSuccess(res, 200, 'Password changed successfully', {});
  });
}

export default new UsersController();

