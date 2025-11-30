import jwt from 'jsonwebtoken';
import User, { IUser } from './auth.model';
import AppError from '../../utils/AppError';
import config from '../../config/env';
import logger from '../../utils/logger';

/**
 * Auth Service
 * Contains business logic for authentication operations
 */
class AuthService {
  /**
   * Generate JWT Token
   */
  private generateToken(userId: string): string {
    return jwt.sign({ id: userId }, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN,
    });
  }

  /**
   * Register New User
   */
  async register(userData: {
    name: string;
    email: string;
    password: string;
  }): Promise<{ user: IUser; token: string }> {
    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    // Create new user
    const user = await User.create(userData);
    logger.info(`New user registered: ${user.email}`);

    // Generate token
    const token = this.generateToken(user._id.toString());

    return { user, token };
  }

  /**
   * Login User
   */
  async login(credentials: {
    email: string;
    password: string;
  }): Promise<{ user: IUser; token: string }> {
    const { email, password } = credentials;

    // Find user and include password field
    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !(await user.comparePassword(password))) {
      throw new AppError('Invalid email or password', 401);
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AppError('Your account has been deactivated', 403);
    }

    logger.info(`User logged in: ${user.email}`);

    // Generate token
    const token = this.generateToken(user._id.toString());

    // Remove password from response
    user.password = undefined as any;

    return { user, token };
  }

  /**
   * Get User by ID
   */
  async getUserById(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  /**
   * Verify JWT Token
   */
  verifyToken(token: string): { id: string } {
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET) as { id: string };
      return decoded;
    } catch (error) {
      throw new AppError('Invalid or expired token', 401);
    }
  }
}

export default new AuthService();

