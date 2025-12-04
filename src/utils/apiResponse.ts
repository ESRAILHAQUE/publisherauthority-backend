import { Response } from 'express';

/**
 * Standardized API Response Utility
 * Provides consistent response format across all endpoints
 */

interface ApiResponseData {
  success: boolean;
  message: string;
  data?: any;
  error?: any;
  stack?: string;
}

/**
 * Send Success Response
 * @param res - Express Response object
 * @param statusCode - HTTP status code
 * @param message - Success message
 * @param data - Response data
 */
export const sendSuccess = (
  res: Response,
  statusCode: number,
  message: string,
  data?: any
): Response => {
  const response: ApiResponseData = {
    success: true,
    message,
    data,
  };

  return res.status(statusCode).json(response);
};

/**
 * Send Error Response
 * @param res - Express Response object
 * @param statusCode - HTTP status code
 * @param message - Error message
 * @param error - Error details
 * @param stack - Error stack trace (only in development)
 */
export const sendError = (
  res: Response,
  statusCode: number,
  message: string,
  error?: any,
  stack?: string
): Response => {
  const response: ApiResponseData = {
    success: false,
    message,
    error,
  };

  // Include stack trace only in development
  if (process.env.NODE_ENV === 'development' && stack) {
    response.stack = stack;
  }

  return res.status(statusCode).json(response);
};

