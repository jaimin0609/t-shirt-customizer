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

const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
    try {
        // Sanitize user inputs
        const username = sanitizeInput(req.body.username);
        const name = sanitizeInput(req.body.name);
        const email = sanitizeInput(req.body.email);
        const password = req.body.password; // Don't sanitize passwords
        const role = req.body.role || 'user';
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                message: 'Invalid email format',
                field: 'email'
            });
        }
        
        // Check if user already exists
        const existingUser = await User.findOne({ 
            where: { 
                [Op.or]: [{ email }, { username }] 
            } 
        });
        
        if (existingUser) {
            if (existingUser.email === email) {
                return res.status(400).json({ 
                    message: 'Email already registered',
                    field: 'email'
                });
            }
            if (existingUser.username === username) {
                return res.status(400).json({ 
                    message: 'Username already taken',
                    field: 'username'
                });
            }
        }
        
        // Create user (password will be hashed by model hooks)
        const user = await User.create({
            username,
            name,
            email,
            password,
            role
        });
        
        // Generate JWT token using the new secure function
        const token = generateToken(user);
        
        // Return user data and token (exclude password)
        const userData = user.toJSON();
        delete userData.password;
        
        res.status(201).json({
            message: 'User registered successfully',
            user: userData,
            token
        });
    } catch (error) {
        console.error('Registration error:', error);
        
        // Handle password validation errors from model hooks
        if (error.message === 'Password does not meet security requirements') {
            return res.status(400).json({ 
                message: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character',
                field: 'password'
            });
        }
        
        res.status(500).json({ message: 'Error registering user' });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password, isAdminLogin } = req.body;
        console.log('Login attempt - Details:', { 
            email, 
            isAdminLogin,
            body: JSON.stringify(req.body),
            headers: JSON.stringify(req.headers['content-type']),
            method: req.method
        });
        
        // Find user by email
        const user = await User.findOne({ where: { email } });
        if (!user) {
            console.log('Login failure - User not found:', email);
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        console.log('User found:', { id: user.id, email: user.email, role: user.role, status: user.status });
        
        // Check if account is locked due to too many failed attempts
        if (user.accountLockedUntil && new Date() < new Date(user.accountLockedUntil)) {
            console.log('Account locked for user:', email);
            const waitMinutes = Math.ceil((new Date(user.accountLockedUntil) - new Date()) / 60000);
            return res.status(401).json({ 
                message: `Account temporarily locked. Please try again in ${waitMinutes} minutes`,
                lockedUntil: user.accountLockedUntil
            });
        }
        
        // Verify password
        let isPasswordValid = false;
        
        try {
            // Use the new comparePassword method from the model
            isPasswordValid = await user.comparePassword(password);
            console.log('Standard password validation result:', isPasswordValid);
        } catch (bcryptError) {
            console.error('bcrypt error during password validation:', bcryptError);
            // Don't expose bcrypt errors to client, but log them for debugging
        }
        
        console.log('Password validation:', { isPasswordValid, providedPassword: !!password });
        
        if (!isPasswordValid) {
            // Increment failed login attempts
            await user.incrementFailedLoginAttempts();
            
            console.log('Invalid password for user:', email);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Reset failed login attempts on successful login
        await user.resetFailedLoginAttempts();
        
        // Check if user is active
        if (user.status !== 'active') {
            console.log('User account inactive:', email);
            return res.status(401).json({ message: 'Account is inactive' });
        }

        // If this is an admin login, verify admin role
        if (isAdminLogin && user.role !== 'admin') {
            console.log('Non-admin attempting admin login:', { email, role: user.role });
            return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
        }
        
        // Generate JWT token using the new secure function
        const token = generateToken(user);
        
        // Return user data and token (exclude password)
        const userData = user.toJSON();
        delete userData.password;
        
        console.log('Login successful:', { email, role: user.role });
        
        res.json({
            message: 'Login successful',
            user: userData,
            token
        });
    } catch (error) {
        console.error('Login error - Exception details:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ message: 'Error logging in' });
    }
});

// Logout
router.post('/logout', auth, async (req, res) => {
    try {
        // Add the current token to the blacklist
        blacklistToken(req.token);
        
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ message: 'Error logging out' });
    }
});

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

// Request password reset
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }
        
        // Find user by email
        const user = await User.findOne({ where: { email } });
        
        // Always return success even if user not found (security)
        if (!user) {
            return res.status(200).json({ message: 'If your email exists in our system, you will receive a password reset link shortly' });
        }
        
        // Generate unique reset token
        const resetToken = uuidv4();
        const resetTokenExpiry = new Date();
        resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // Token valid for 1 hour
        
        // Save token to user
        await user.update({
            resetToken,
            resetTokenExpiry
        });
        
        // Send password reset email
        await sendPasswordResetEmail(user.email, user.name, resetToken);
        
        res.status(200).json({ message: 'If your email exists in our system, you will receive a password reset link shortly' });
    } catch (error) {
        console.error('Password reset request error:', error);
        res.status(500).json({ message: 'Error processing password reset request' });
    }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: 'Token and password are required' });
    }

    // Find user with this reset token and token not expired
    const user = await User.findOne({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          [Op.gt]: new Date() // Token expiry greater than current time
        }
      }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Hash the new password (password will be hashed by model hooks)
    // Update the user's password and clear the reset token
    await user.update({
      password,
      resetToken: null,
      resetTokenExpiry: null
    });

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Error resetting password' });
  }
});

export default router; 