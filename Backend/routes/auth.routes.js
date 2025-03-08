import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Customer } from '../models/index.js';
import { auth, isAdmin } from '../middleware/auth.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';

const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
    try {
        const { username, name, email, password, role = 'user' } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ 
            where: { 
                [Op.or]: [{ email }, { username }] 
            } 
        });
        
        if (existingUser) {
            if (existingUser.email === email) {
                return res.status(400).json({ message: 'Email already registered' });
            }
            if (existingUser.username === username) {
                return res.status(400).json({ message: 'Username already taken' });
            }
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user
        const user = await User.create({
            username,
            name,
            email,
            password: hashedPassword,
            role
        });
        
        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '1d' }
        );
        
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
        res.status(500).json({ message: 'Error registering user', error: error.message });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password, isAdminLogin } = req.body;
        console.log('Login attempt:', { email, isAdminLogin });
        
        // Find user by email
        const user = await User.findOne({ where: { email } });
        if (!user) {
            console.log('User not found:', email);
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        console.log('User found:', { id: user.id, email: user.email, role: user.role, status: user.status });
        
        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        console.log('Password validation:', { isPasswordValid });
        
        if (!isPasswordValid) {
            console.log('Invalid password for user:', email);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

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
        
        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '1d' }
        );
        
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
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error logging in' });
    }
});

// Get current user
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] },
            include: [
                {
                    model: Customer,
                    as: 'customer',
                    required: false
                }
            ]
        });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
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
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, customerId: customer.id },
            process.env.JWT_SECRET || 'your-secret-key',
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
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'your-secret-key',
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

export default router; 