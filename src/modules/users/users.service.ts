import { User } from './users.model';
import AppError from '../../utils/AppError';
import logger from '../../utils/logger';

/**
 * Users Service
 * Contains business logic for user management operations
 */
class UsersService {
  /**
   * Get All Users
   */
  async getAllUsers(filters: any = {}) {
    const users = await User.find(filters).select('-password');
    return users;
  }

  /**
   * Get User by ID
   */
  async getUserById(userId: string) {
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  /**
   * Update User
   */
  async updateUser(userId: string, updateData: any) {
    // Prevent password update through this method
    if (updateData.password) {
      throw new AppError('Password cannot be updated through this endpoint', 400);
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    logger.info(`User updated: ${user.email}`);
    return user;
  }

  /**
   * Delete User (Soft delete)
   */
  async deleteUser(userId: string) {
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      throw new AppError('User not found', 404);
    }

    logger.info(`User deactivated: ${user.email}`);
    return user;
  }

  /**
   * Get User Statistics
   */
  async getUserStats() {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const verifiedUsers = await User.countDocuments({ isVerified: true });

    return {
      totalUsers,
      activeUsers,
      verifiedUsers,
      inactiveUsers: totalUsers - activeUsers,
    };
  }

  /**
   * Change User Password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    // Find user with password field
    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 400);
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    logger.info(`Password changed for user: ${user.email}`);
    return user;
  }
}

export default new UsersService();

