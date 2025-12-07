import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User, { IUser } from './auth.model';
import AppError from '../../utils/AppError';
import config from '../../config/env';
import logger from '../../utils/logger';
import { sendEmail } from '../../utils/email';

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
      expiresIn: config.JWT_EXPIRES_IN as any,
    });
  }

  /**
   * Register New User (Admin only - or use application flow)
   */
  async register(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    country: string;
    role?: string;
  }): Promise<{ user: IUser; token: string }> {
    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    // Create new user
    const user = await User.create({
      ...userData,
      role: userData.role || 'publisher',
      accountLevel: 'silver',
      accountStatus: 'active',
      applicationStatus: 'approved',
    });
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

    // Normalize email (lowercase and trim)
    const normalizedEmail = email.toLowerCase().trim();

    // Find user and include password field
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    
    if (!user) {
      logger.warn(`Login attempt failed: User not found for email: ${normalizedEmail}`);
      throw new AppError('Invalid email or password', 401);
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      logger.warn(`Login attempt failed: Invalid password for email: ${normalizedEmail}`);
      throw new AppError('Invalid email or password', 401);
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AppError('Your account has been deactivated', 403);
    }

    // Check if user's application has been approved
    // For publisher role, applicationStatus must be 'approved'
    if (user.role === 'publisher' && user.applicationStatus !== 'approved') {
      throw new AppError(
        'Your application is still pending approval. Please wait for admin approval before logging in.',
        403
      );
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

  /**
   * Forgot Password - Generate reset token and send email
   * Only sends email if user exists in database and application is approved
   */
  async forgotPassword(email: string): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();
    
    logger.info(`Password reset requested for email: ${normalizedEmail}`);
    
    // Find user in database - try exact match first
    let user = await User.findOne({ email: normalizedEmail });
    
    // If not found, try case-insensitive regex match
    if (!user) {
      const escapedEmail = normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      user = await User.findOne({ 
        email: { $regex: new RegExp(`^${escapedEmail}$`, 'i') }
      });
    }
    
    // If still not found, try to handle dot variations (common typo)
    // e.g., "saigejhonseo@gmail.com" should match "saigejhon.seo@gmail.com"
    if (!user) {
      const emailParts = normalizedEmail.split('@');
      if (emailParts.length === 2) {
        const localPart = emailParts[0];
        const domain = emailParts[1];
        
        // Try to find emails where dots might be missing or added
        // Create a pattern that matches the local part with or without dots
        // This is a fuzzy match for common typos
        const localPartPattern = localPart.split('').join('[.]?'); // Match with optional dots
        const fuzzyPattern = `^${localPartPattern}@${domain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`;
        
        const similarUsers = await User.find({ 
          email: { $regex: new RegExp(fuzzyPattern, 'i') }
        }).select('email').limit(5);
        
        if (similarUsers.length === 1) {
          // If exactly one match found, use it
          user = await User.findById(similarUsers[0]._id);
          logger.info(`Found user with similar email: ${similarUsers[0].email} (matched ${normalizedEmail})`);
        } else if (similarUsers.length > 1) {
          // Multiple matches - log for debugging but don't auto-select
          logger.warn(`Multiple similar emails found for ${normalizedEmail}: ${similarUsers.map(u => u.email).join(', ')}`);
        }
      }
    }
    
    // If still not found, log for debugging
    if (!user) {
      logger.warn(`Password reset requested for non-existent email: ${normalizedEmail}`);
      
      // Debug: Check what emails exist in database (only in development)
      if (process.env.NODE_ENV === 'development') {
        const allUsers = await User.find({}).select('email').limit(10);
        logger.warn(`Sample emails in database: ${allUsers.map(u => `"${u.email}"`).join(', ')}`);
        
        // Try to find similar emails by prefix
        const emailPrefix = normalizedEmail.split('@')[0];
        const similarUsers = await User.find({ 
          email: { $regex: emailPrefix, $options: 'i' }
        }).select('email').limit(5);
        if (similarUsers.length > 0) {
          logger.warn(`Similar emails found: ${similarUsers.map(u => `"${u.email}"`).join(', ')}`);
        }
      }
      
      throw new AppError('No account found with this email address. Please check your email or sign up.', 404);
    }
    
    logger.info(`User found for password reset: ${user.email} (ID: ${user._id})`);

    // Check if user's application has been approved (for publisher role)
    // Only check if applicationStatus exists and is not approved
    if (user.role === 'publisher' && user.applicationStatus && user.applicationStatus !== 'approved') {
      throw new AppError(
        'Your application is still pending approval. Please wait for admin approval before resetting your password.',
        403
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Set token and expiry (1 hour from now)
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetURL = `${config.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;

    // Send email
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3F207F;">Password Reset Request</h2>
        <p>Hi ${user.firstName},</p>
        <p>You requested to reset your password. Click the button below to reset it:</p>
        <p style="margin: 30px 0;">
          <a href="${resetURL}" style="background-color: #3F207F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </p>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetURL}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>The Publisher Authority Team</p>
      </div>
    `;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Reset Request - Publisher Authority',
        html,
      });
      logger.info(`Password reset email sent to: ${user.email}`);
    } catch (error: any) {
      // If email fails, clear the reset token
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      
      logger.error(`Failed to send password reset email:`, error);
      throw new AppError('Failed to send email. Please try again later.', 500);
    }
  }

  /**
   * Reset Password - Verify token and update password
   */
  async resetPassword(token: string, password: string): Promise<void> {
    // Hash the token to compare with stored token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    // Update password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    logger.info(`Password reset successful for user: ${user.email}`);
  }
}

export default new AuthService();

