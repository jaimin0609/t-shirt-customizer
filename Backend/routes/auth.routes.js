import express from 'express';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const bcrypt = require('bcryptjs');
import jwt from 'jsonwebtoken';
import { User, Customer } from '../models/index.js';
import { auth, isAdmin, generateToken, blacklistToken } from '../middleware/auth.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { sendPasswordResetEmail } from '../services/emailService.js';
import { sanitizeInput } from '../utils/requestUtils.js';
import authController from '../controllers/authController.js';
import errorController from '../controllers/errorController.js';
import { 
    validateLogin, 
    validateRegistration, 
    validatePasswordResetRequest, 
    validatePasswordReset 
} from '../validators/authValidators.js';

const router = express.Router();

// Register a new user
router.post('/register', 
    validateRegistration, 
    errorController.catchAsync(authController.register)
);

// Login user
router.post('/login', 
    validateLogin, 
    errorController.catchAsync(authController.login)
);

// Refresh token
router.post('/refresh-token', 
    errorController.catchAsync(authController.refreshToken)
);

// Logout user
router.post('/logout', 
    errorController.catchAsync(authController.logout)
);

// Request password reset
router.post('/request-reset', 
    validatePasswordResetRequest, 
    errorController.catchAsync(authController.requestPasswordReset)
);

// Reset password
router.post('/reset-password', 
    validatePasswordReset, 
    errorController.catchAsync(authController.resetPassword)
);

// Get current user
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password', 'resetToken', 'resetTokenExpiry'] }
        });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json(user);
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ message: 'Error fetching user data' });
    }
});

// Verify admin access
router.get('/verify-admin', auth, isAdmin, (req, res) => {
    res.json({ message: 'Admin access verified', user: req.user });
});

// Customer registration (frontend users)
router.post('/customer/register', async (req, res) => {
    const t = await sequelize.transaction();
    
    try {
        const { email, password, firstName, lastName } = req.body;
        
        // Check if user/customer already exists
        const existingUser = await User.findOne({ 
            where: { email },
            transaction: t
        });
        
        if (existingUser) {
            await t.rollback();
            return res.status(400).json({ message: 'Email already registered' });
        }
        
        // Generate username from email
        const username = email.split('@')[0] + Math.floor(Math.random() * 1000);
        
        // Create user - no need to hash password, the model hooks will do it
        const user = await User.create({
            username,
            name: `${firstName} ${lastName}`,
            email,
            password, // Don't hash here, the model hooks will do it
            role: 'customer',
            status: 'active'
        }, { transaction: t });
        
        // Create customer profile
        const customer = await Customer.create({
            userId: user.id,
            firstName,
            lastName,
            email,
            status: 'active'
        }, { transaction: t });
        
        // Generate JWT token
        if (!process.env.JWT_SECRET) {
            console.error('ERROR: JWT_SECRET environment variable is not set!');
            await t.rollback();
            return res.status(500).json({ message: 'Server configuration error' });
        }
        
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, customerId: customer.id },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );
        
        // Commit transaction
        await t.commit();
        
        // Return user data and token (exclude password)
        const userData = user.toJSON();
        delete userData.password;
        
        res.status(201).json({
            message: 'Registration successful',
            user: userData,
            customer,
            token
        });
    } catch (error) {
        await t.rollback();
        console.error('Customer registration error:', error);
        res.status(500).json({ 
            message: 'Error during registration', 
            error: error.message 
        });
    }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
    try {
        // Get user ID from auth middleware
        const userId = req.user.id;
        
        // Find user by ID, exclude password
        const user = await User.findByPk(userId, {
            attributes: { exclude: ['password'] }
        });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Check if user has an associated customer profile
        const customer = await Customer.findOne({ where: { userId } });
        
        // Return user data with customer profile if exists
        return res.status(200).json({
            user: {
                ...user.toJSON(),
                customer: customer || null
            }
        });
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ message: 'Error fetching profile', error: error.message });
    }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
    try {
        const { 
            name, 
            email, 
            phone, 
            address, 
            city, 
            state, 
            zipCode, 
            country,
            isDefaultShippingAddress 
        } = req.body;
        
        console.log('Profile update request received:', req.body);
        
        // Find user
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Update user basic info
        await user.update({
            name,
            email
        });
        
        // Find and update customer profile if exists
        const customer = await Customer.findOne({ where: { userId: req.user.id } });
        if (customer) {
            // Debug before update
            console.log('Customer before update:', customer.toJSON());
            
            await customer.update({
                email,
                phone,
                address,
                city,
                state,
                zipCode,
                country,
                isDefaultShippingAddress: isDefaultShippingAddress, // Use the value directly
                // Split name into first and last name if it's not already set
                ...((!customer.firstName || !customer.lastName) && {
                    firstName: name.split(' ')[0] || '',
                    lastName: name.split(' ').slice(1).join(' ') || ''
                })
            });
            
            // Debug after update
            console.log('Customer after update:', customer.toJSON());
        }
        
        // Return updated user (exclude password)
        const userData = user.toJSON();
        delete userData.password;
        
        // Add customer data if available
        let responseData = { ...userData };
        if (customer) {
            responseData.customer = customer.toJSON();
        }
        
        // Generate a fresh token to ensure continued authentication
        if (!process.env.JWT_SECRET) {
            console.error('ERROR: JWT_SECRET environment variable is not set!');
            return res.status(500).json({ message: 'Server configuration error' });
        }
        
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );
        
        console.log('Sending response data with fresh token');
        res.json({
            ...responseData,
            token
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ message: 'Error updating profile', error: error.message });
    }
});

// JWT check endpoint - helpful for debugging JWT issues
router.get('/jwt-check', (req, res) => {
  try {
    // Check if JWT_SECRET is set
    const jwtSecret = process.env.JWT_SECRET;
    let secretStatus = 'Not configured';
    
    if (jwtSecret) {
      secretStatus = jwtSecret.length > 30 ? 'Properly configured (long secret)' : 'Configured but potentially weak';
    }
    
    // Create a test token
    const testToken = jwt.sign({ test: true }, jwtSecret || 'test-secret', { expiresIn: '1m' });
    
    // Try to verify it
    const verified = jwt.verify(testToken, jwtSecret || 'test-secret');
    
    res.json({
      status: 'JWT system operational',
      jwtSecretStatus: secretStatus,
      testTokenCreated: !!testToken,
      verificationSuccessful: !!verified,
      environment: process.env.NODE_ENV || 'development',
      bcryptAvailable: typeof bcrypt === 'object'
    });
  } catch (error) {
    console.error('JWT check error:', error);
    res.status(500).json({
      status: 'JWT system error',
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack
    });
  }
});

// For debugging password issues - create a test hash
router.post('/test-password', async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }
    
    // Create a hash
    const hash = await bcrypt.hash(password, 10);
    
    // Test comparison
    const isMatch = await bcrypt.compare(password, hash);
    
    res.json({
      original: password,
      hash,
      matchesOriginal: isMatch
    });
  } catch (error) {
    console.error('Password test error:', error);
    res.status(500).json({ 
      message: 'Error testing password', 
      error: error.message 
    });
  }
});

// Check if first-time setup is needed
router.get('/check-setup', 
    errorController.catchAsync(authController.checkFirstTimeSetup)
);

// Handle first-time admin setup
router.post('/first-time-setup', 
    errorController.catchAsync(authController.firstTimeAdminSetup)
);

export default router; 