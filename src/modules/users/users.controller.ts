import { Request, Response, NextFunction } from 'express';
import usersService from './users.service';
import asyncHandler from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';

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
}

export default new UsersController();

