import { Request, Response, NextFunction } from 'express';
import AppError from '../utils/AppError';

/**
 * 404 Not Found Middleware
 * Handles all undefined routes
 */
const notFound = (req: Request, _res: Response, next: NextFunction): void => {
  const message = `Can't find ${req.originalUrl} on this server!`;
  next(new AppError(message, 404));
};

export default notFound;

