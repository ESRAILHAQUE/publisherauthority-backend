import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../modules/auth/auth.model';
import AppError from '../utils/AppError';
import asyncHandler from '../utils/asyncHandler';
import config from '../config/env';

/**
 * Extended Request Interface with User
 */
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * Protect Routes - Verify JWT Token
 * Middleware to authenticate users
 */
export const protect = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    let token: string | undefined;

    // Check for token in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      throw new AppError('You are not logged in. Please log in to access this resource.', 401);
    }

    // Verify token
    const decoded = jwt.verify(token, config.JWT_SECRET) as { id: string };

    // Check if user still exists
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      throw new AppError('The user belonging to this token no longer exists.', 401);
    }

    // Check if user is active
    if (!user.isActive || user.accountStatus !== 'active') {
      throw new AppError('Your account has been deactivated or suspended.', 403);
    }

    // Grant access to protected route
    (req as AuthRequest).user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    next();
  }
);

/**
 * Restrict Routes to Specific Roles
 * Middleware to authorize users based on roles
 */
export const restrictTo = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    
    if (!authReq.user || !roles.includes(authReq.user.role)) {
      throw new AppError('You do not have permission to perform this action.', 403);
    }

    next();
  };
};

/**
 * Optional Authentication
 * Middleware that doesn't throw error if no token
 */
export const optionalAuth = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    let token: string | undefined;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, config.JWT_SECRET) as { id: string };
        const user = await User.findById(decoded.id).select('-password');
        
        if (user && user.isActive) {
          (req as AuthRequest).user = {
            id: user._id.toString(),
            email: user.email,
            role: user.role,
          };
        }
      } catch (error) {
        // Token invalid but don't throw error
      }
    }

    next();
  }
);

