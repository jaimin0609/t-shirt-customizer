import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const bcrypt = require('bcryptjs');
import jwt from 'jsonwebtoken';
import { User, Customer } from '../models/index.js';
import { generateToken, blacklistToken } from '../middleware/auth.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { sendPasswordResetEmail } from '../services/emailService.js';
import { sanitizeInput } from '../utils/requestUtils.js';

/**
 * Register a new user
 */
export const register = async (req, res) => {
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
                [Op.or]: [
                    { email: email },
                    { username: username }
                ]
            }
        });

        if (existingUser) {
            const field = existingUser.email === email ? 'email' : 'username';
            return res.status(400).json({
                message: `User with this ${field} already exists`,
                field: field
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await User.create({
            username,
            name,
            email,
            password: hashedPassword,
            role
        });

        // Create customer profile if user is not admin
        if (role !== 'admin') {
            await Customer.create({
                userId: user.id,
                name: name,
                email: email
            });
        }

        // Generate token
        const token = generateToken(user);

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

/**
 * Login user
 */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ 
                message: 'Invalid credentials', 
                field: 'email' 
            });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ 
                message: 'Invalid credentials', 
                field: 'password' 
            });
        }

        // Generate token
        const token = generateToken(user);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

/**
 * Refresh token
 */
export const refreshToken = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }
        
        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }
        
        // Get user
        const user = await User.findByPk(decoded.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Generate new token
        const newToken = generateToken(user);
        
        res.json({
            message: 'Token refreshed successfully',
            token: newToken
        });
    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({ message: 'Server error during token refresh' });
    }
};

/**
 * Logout user
 */
export const logout = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (token) {
            // Blacklist the token
            await blacklistToken(token);
            console.log('Token blacklisted successfully:', token.substring(0, 10) + '...');
        } else {
            console.log('No token provided in logout request');
        }
        
        // Always return success, even if token was missing
        // This ensures the client-side logout still works
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        
        // Still return success to client to ensure they can complete logout
        res.status(200).json({ message: 'Logged out successfully' });
    }
};

/**
 * Request password reset
 */
export const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;
        
        // Find user by email
        const user = await User.findOne({ where: { email } });
        if (!user) {
            // For security reasons, don't disclose that the email doesn't exist
            return res.json({ message: 'If your email is registered, you will receive a password reset link' });
        }
        
        // Generate reset token
        const resetToken = uuidv4();
        const resetExpires = new Date(Date.now() + 3600000); // 1 hour
        
        // Update user with reset token
        await user.update({
            resetToken,
            resetExpires
        });
        
        // Send email
        await sendPasswordResetEmail(email, resetToken);
        
        res.json({ message: 'If your email is registered, you will receive a password reset link' });
    } catch (error) {
        console.error('Password reset request error:', error);
        res.status(500).json({ message: 'Server error during password reset request' });
    }
};

/**
 * Reset password
 */
export const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        
        // Find user by reset token
        const user = await User.findOne({
            where: {
                resetToken: token,
                resetExpires: { [Op.gt]: new Date() }
            }
        });
        
        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }
        
        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Update user
        await user.update({
            password: hashedPassword,
            resetToken: null,
            resetExpires: null
        });
        
        res.json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ message: 'Server error during password reset' });
    }
};

export default {
    register,
    login,
    refreshToken,
    logout,
    requestPasswordReset,
    resetPassword
}; 