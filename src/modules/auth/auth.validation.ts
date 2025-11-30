import { body } from 'express-validator';

/**
 * Auth Validation Rules
 * Validation rules for authentication endpoints
 */

export const registerValidation = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required'),
  
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required'),
  
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  body('country')
    .trim()
    .notEmpty()
    .withMessage('Country is required'),
];

export const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

