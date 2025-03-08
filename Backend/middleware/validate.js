import { body, validationResult } from 'express-validator';

const productValidation = [
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('stock').isInt({ min: 0 }).withMessage('Stock must be a positive number'),
    // Add more validation rules as needed
];

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

export const validateLogin = [
    // ... validation rules ...
];

export const validateRegistration = [
    // ... validation rules ...
];

export const validateProduct = {
    productValidation,
    validate
}; 