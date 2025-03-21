/**
 * Input validation utilities for preventing XSS and other injection attacks
 */

import { sanitizeInput } from './requestUtils.js';

/**
 * Validate and sanitize user inputs to prevent XSS attacks
 * @param {Object} inputs - Object containing all inputs to validate
 * @param {Object} rules - Validation rules for each input
 * @returns {Object} Object with sanitized values and validation errors
 */
export const validateInputs = (inputs, rules) => {
    const sanitized = {};
    const errors = {};
    
    // Process each input according to its rules
    for (const [field, value] of Object.entries(inputs)) {
        // Skip if field doesn't have rules
        if (!rules[field]) continue;
        
        const fieldRules = rules[field];
        
        // Required field validation
        if (fieldRules.required && (value === undefined || value === null || value === '')) {
            errors[field] = `${field} is required`;
            continue;
        }
        
        // Skip further validation if value is undefined/null and not required
        if ((value === undefined || value === null) && !fieldRules.required) {
            continue;
        }
        
        // Type validation
        if (fieldRules.type && typeof value !== fieldRules.type) {
            errors[field] = `${field} must be a ${fieldRules.type}`;
            continue;
        }
        
        // String-specific validations
        if (typeof value === 'string') {
            // Minimum length validation
            if (fieldRules.minLength && value.length < fieldRules.minLength) {
                errors[field] = `${field} must be at least ${fieldRules.minLength} characters`;
                continue;
            }
            
            // Maximum length validation
            if (fieldRules.maxLength && value.length > fieldRules.maxLength) {
                errors[field] = `${field} must be at most ${fieldRules.maxLength} characters`;
                continue;
            }
            
            // Pattern validation
            if (fieldRules.pattern && !fieldRules.pattern.test(value)) {
                errors[field] = fieldRules.patternError || `${field} is invalid`;
                continue;
            }
            
            // Email validation
            if (fieldRules.isEmail) {
                const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailPattern.test(value)) {
                    errors[field] = `${field} must be a valid email address`;
                    continue;
                }
            }
            
            // URL validation
            if (fieldRules.isUrl) {
                try {
                    new URL(value);
                } catch (e) {
                    errors[field] = `${field} must be a valid URL`;
                    continue;
                }
            }
            
            // Apply sanitization unless explicitly disabled
            sanitized[field] = fieldRules.noSanitize ? value : sanitizeInput(value);
        } else if (Array.isArray(value)) {
            // Handle arrays - sanitize each string item
            if (fieldRules.isArray) {
                sanitized[field] = value.map(item => 
                    typeof item === 'string' ? sanitizeInput(item) : item
                );
            } else {
                errors[field] = `${field} must be a ${fieldRules.type || 'string'}`;
            }
        } else {
            // For non-string, non-array values, keep as is
            sanitized[field] = value;
        }
    }
    
    return { sanitized, errors, isValid: Object.keys(errors).length === 0 };
};

/**
 * Common validation rules for reuse across the application
 */
export const validationRules = {
    // User validation rules
    username: {
        required: true,
        type: 'string',
        minLength: 3,
        maxLength: 30,
        pattern: /^[a-zA-Z0-9_-]+$/,
        patternError: 'Username can only contain letters, numbers, underscores and hyphens'
    },
    email: {
        required: true,
        type: 'string',
        isEmail: true,
        maxLength: 100
    },
    password: {
        required: true,
        type: 'string',
        minLength: 8,
        noSanitize: true // Don't sanitize passwords
    },
    name: {
        required: true,
        type: 'string',
        minLength: 2,
        maxLength: 100
    },
    
    // Product validation rules
    productName: {
        required: true,
        type: 'string',
        minLength: 3,
        maxLength: 100
    },
    description: {
        required: true,
        type: 'string',
        minLength: 10,
        maxLength: 2000
    },
    price: {
        required: true,
        type: 'number',
        min: 0
    },
    
    // Comment/review validation rules
    comment: {
        required: true,
        type: 'string',
        minLength: 2,
        maxLength: 500
    },
    rating: {
        required: true,
        type: 'number',
        min: 1,
        max: 5
    }
};

export default {
    validateInputs,
    validationRules
}; 