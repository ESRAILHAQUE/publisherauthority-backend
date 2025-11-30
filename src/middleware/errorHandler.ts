import { Request, Response, NextFunction } from 'express';
import AppError from '../utils/AppError';
import logger from '../utils/logger';
import { sendError } from '../utils/apiResponse';

/**
 * Handle Mongoose CastError (Invalid MongoDB ObjectId)
 */
const handleCastErrorDB = (err: any): AppError => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

/**
 * Handle Mongoose Duplicate Key Error
 */
const handleDuplicateFieldsDB = (err: any): AppError => {
  const value = err.errmsg?.match(/(["'])(\\?.)*?\1/)?.[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

/**
 * Handle Mongoose Validation Error
 */
const handleValidationErrorDB = (err: any): AppError => {
  const errors = Object.values(err.errors).map((el: any) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

/**
 * Handle JWT Invalid Token Error
 */
const handleJWTError = (): AppError => {
  return new AppError('Invalid token. Please log in again!', 401);
};

/**
 * Handle JWT Expired Token Error
 */
const handleJWTExpiredError = (): AppError => {
  return new AppError('Your token has expired! Please log in again.', 401);
};

/**
 * Send Error Response in Development Mode
 */
const sendErrorDev = (err: AppError, res: Response): void => {
  sendError(res, err.statusCode, err.message, {
    status: err.status,
    error: err,
    message: err.message,
  }, err.stack);
};

/**
 * Send Error Response in Production Mode
 */
const sendErrorProd = (err: AppError, res: Response): void => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    sendError(res, err.statusCode, err.message);
  } 
  // Programming or other unknown error: don't leak error details
  else {
    // Log error for debugging
    logger.error('ERROR 💥', err);
    
    // Send generic message
    sendError(res, 500, 'Something went wrong!');
  }
};

/**
 * Global Error Handling Middleware
 * Catches all errors and sends appropriate response
 */
const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    // Handle specific error types
    if (err.name === 'CastError') error = handleCastErrorDB(err);
    if (err.code === 11000) error = handleDuplicateFieldsDB(err);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};

export default errorHandler;

