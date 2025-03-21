/**
 * Authentication validation middleware
 */

import { body, validationResult } from 'express-validator';

/**
 * Process validation errors and format response
 */
const processValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const firstError = errors.array()[0];
        return res.status(400).json({
            message: firstError.msg,
            field: firstError.param
        });
    }
    next();
};

/**
 * Validate registration inputs
 */
export const validateRegistration = [
    body('username')
        .notEmpty().withMessage('Username is required')
        .isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters')
        .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers and underscores'),
    
    body('name')
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    
    body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format'),
    
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    
    processValidationErrors
];

/**
 * Validate login inputs
 */
export const validateLogin = [
    body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format'),
    
    body('password')
        .notEmpty().withMessage('Password is required'),
    
    processValidationErrors
];

/**
 * Validate password reset request
 */
export const validatePasswordResetRequest = [
    body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format'),
    
    processValidationErrors
];

/**
 * Validate password reset
 */
export const validatePasswordReset = [
    body('token')
        .notEmpty().withMessage('Reset token is required'),
    
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    
    processValidationErrors
];

export default {
    validateRegistration,
    validateLogin,
    validatePasswordResetRequest,
    validatePasswordReset
}; 