import express from 'express';
import { User } from '../models/index.js';
import { auth, isAdmin } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const bcrypt = require('bcryptjs');
import { Op } from 'sequelize';
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const router = express.Router();

// Protected route - only accessible with admin token
router.get('/check-users', auth, isAdmin, async (req, res) => {
  try {
    // Only allow in development or with special query parameter
    const secretKey = req.query.secret;
    if (process.env.NODE_ENV === 'production' && secretKey !== process.env.ADMIN_CHECK_SECRET) {
      return res.status(403).json({ message: 'Not allowed in production without secret key' });
    }
    
    // Find all admin users
    const adminUsers = await User.findAll({
      where: {
        role: 'admin'
      },
      attributes: ['id', 'username', 'email', 'name', 'status', 'createdAt', 'updatedAt'],
    });
    
    // Get total users count
    const totalUsers = await User.count();
    
    return res.json({
      adminUsers,
      totalUsers,
      message: `Found ${adminUsers.length} admin users out of ${totalUsers} total users`
    });
  } catch (error) {
    console.error('Error checking admin users:', error);
    return res.status(500).json({ message: 'Error checking admin users', error: error.message });
  }
});

// Add a direct admin reset route with secret key protection
router.get('/reset-admin', async (req, res) => {
  try {
    // This route should only be accessible with a secret key
    const secretKey = req.query.secret;
    const expectedSecret = process.env.ADMIN_RESET_SECRET || 'temporary-dev-secret';
    
    if (secretKey !== expectedSecret) {
      console.log('Invalid secret key provided for admin reset');
      return res.status(403).json({ 
        message: 'Access denied. Valid secret key required.'
      });
    }
    
    // Admin user details
    const adminUser = {
      username: 'admin',
      name: 'Administrator',
      email: 'admin@example.com',
      password: await bcrypt.hash('Admin123!', 10),
      role: 'admin',
      status: 'active'
    };

    // Check if admin user already exists
    const existingUser = await User.findOne({
      where: {
        email: adminUser.email
      }
    });

    let message = '';
    let user = null;
    
    if (existingUser) {
      message = 'Admin user updated successfully';
      // Update existing user
      await existingUser.update({
        password: adminUser.password,
        status: 'active',
        role: 'admin'
      });
      user = existingUser;
    } else {
      message = 'Admin user created successfully';
      // Create new admin user
      user = await User.create(adminUser);
    }
    
    // Remove password from response
    const userData = user.toJSON();
    delete userData.password;
    
    return res.json({
      message,
      user: userData,
      loginCredentials: {
        email: 'admin@example.com',
        password: 'Admin123!'
      }
    });
  } catch (error) {
    console.error('Error resetting admin user:', error);
    return res.status(500).json({ 
      message: 'Error resetting admin user', 
      error: error.message 
    });
  }
});

// Add new routes for user management

// Get all users (admin only)
router.get('/users', auth, isAdmin, async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password'] }
        });
        
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create a new user (admin only)
router.post('/users', auth, isAdmin, async (req, res) => {
    try {
        const { username, name, email, password, role, permissions } = req.body;
        
        // Validate role
        const validRoles = ['admin', 'manager', 'editor', 'user'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ 
                message: 'Invalid role. Must be one of: admin, manager, editor, user',
                field: 'role'
            });
        }
        
        // Check if user already exists
        const existingUser = await User.findOne({
            where: {
                [Op.or]: [{ email }, { username }]
            }
        });
        
        if (existingUser) {
            const field = existingUser.email === email ? 'email' : 'username';
            return res.status(400).json({
                message: `User with this ${field} already exists`,
                field
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
            role,
            permissions,
            status: 'active'
        });
        
        // Return user without password
        const userData = user.toJSON();
        delete userData.password;
        
        res.status(201).json({
            message: 'User created successfully',
            user: userData
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update a user (admin only)
router.put('/users/:id', auth, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { username, name, email, role, permissions, status } = req.body;
        
        // Find user
        const user = await User.findByPk(id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Update user
        await user.update({
            username: username || user.username,
            name: name || user.name,
            email: email || user.email,
            role: role || user.role,
            permissions: permissions || user.permissions,
            status: status || user.status
        });
        
        // Return updated user without password
        const userData = user.toJSON();
        delete userData.password;
        
        res.json({
            message: 'User updated successfully',
            user: userData
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete a user (admin only)
router.delete('/users/:id', auth, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Prevent admins from deleting themselves
        if (req.user.id === parseInt(id)) {
            return res.status(400).json({ message: 'You cannot delete your own account' });
        }
        
        // Find user
        const user = await User.findByPk(id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Delete user
        await user.destroy();
        
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Reset user password (admin only)
router.post('/users/:id/reset-password', auth, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;
        
        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({ 
                message: 'New password must be at least 8 characters long',
                field: 'newPassword'
            });
        }
        
        // Find user
        const user = await User.findByPk(id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Hash and update password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        await user.update({
            password: hashedPassword,
            tokenVersion: (user.tokenVersion || 0) + 1 // Invalidate existing tokens
        });
        
        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add a temporary reset endpoint (REMOVE AFTER USE FOR SECURITY)
// This endpoint will reset admin users and can be called without authentication
router.get('/reset-admin-temp', async (req, res) => {
    try {
        // DELETE FROM "Users" WHERE role = 'admin';
        await User.destroy({ where: { role: 'admin' } });
        
        // Create a new admin user
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('Admin123!', salt);
        
        // Prepare admin data - without permissions first in case column doesn't exist yet
        const adminData = {
            username: 'admin',
            name: 'Administrator',
            email: 'admin@example.com',
            password: hashedPassword,
            role: 'admin',
            status: 'active'
        };
        
        // Try to create the admin user
        let admin;
        try {
            admin = await User.create(adminData);
        } catch (err) {
            // If creating with permissions column fails, check if the error is about permissions
            if (err.message.includes('permissions')) {
                console.log('Attempting to create admin without permissions field');
                // Create a simplified model without permissions
                const UserSimple = sequelize.define('User', {
                    username: { type: DataTypes.STRING, allowNull: false, unique: true },
                    name: { type: DataTypes.STRING, allowNull: false },
                    email: { type: DataTypes.STRING, allowNull: false, unique: true },
                    password: { type: DataTypes.STRING, allowNull: false },
                    role: { type: DataTypes.STRING, allowNull: false, defaultValue: 'user' },
                    status: { type: DataTypes.STRING, defaultValue: 'active' }
                }, { tableName: 'Users' });
                
                // Try to create with simplified model
                admin = await UserSimple.create(adminData);
            } else {
                // If it's another error, throw it
                throw err;
            }
        }
        
        res.json({ 
            message: 'Admin user has been reset successfully. Use the following credentials:',
            credentials: {
                email: 'admin@example.com',
                password: 'Admin123!'
            },
            note: 'You may need to run the migration endpoint first if you got a permissions error'
        });
    } catch (error) {
        console.error('Error resetting admin user:', error);
        res.status(500).json({ 
            message: 'Error resetting admin user', 
            error: error.message,
            hint: 'Try running the migration endpoint first: /api/admin/run-migration-temp'
        });
    }
});

// Add a temporary migration endpoint (REMOVE AFTER USE FOR SECURITY)
router.get('/run-migration-temp', async (req, res) => {
    try {
        // Use dynamic import instead of require for ES modules
        const { DataTypes } = require('sequelize');
        
        // Use existing sequelize instance that was already imported at the top
        // instead of requiring the module again
        
        // Step 1: Update the role field to be a STRING instead of ENUM
        try {
            await sequelize.getQueryInterface().changeColumn('Users', 'role', {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: 'user'
            });
            console.log('Column "role" modified successfully');
        } catch (err) {
            console.log('Error modifying role column:', err.message);
        }
        
        // Step 2: Add all missing columns
        const columnsToAdd = [
            {
                name: 'permissions',
                type: DataTypes.JSON,
                allowNull: true,
                defaultValue: null
            },
            {
                name: 'tokenVersion',
                type: DataTypes.INTEGER,
                allowNull: true,
                defaultValue: 0
            },
            {
                name: 'lastPasswordChange',
                type: DataTypes.DATE,
                allowNull: true
            },
            {
                name: 'failedLoginAttempts',
                type: DataTypes.INTEGER,
                allowNull: true,
                defaultValue: 0
            },
            {
                name: 'accountLockedUntil',
                type: DataTypes.DATE,
                allowNull: true
            },
            {
                name: 'status',
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: 'active'
            },
            {
                name: 'resetToken',
                type: DataTypes.STRING,
                allowNull: true
            },
            {
                name: 'resetTokenExpiry',
                type: DataTypes.DATE,
                allowNull: true
            },
            {
                name: 'username',
                type: DataTypes.STRING,
                allowNull: true
            }
        ];
        
        // Add each column if it doesn't exist
        for (const column of columnsToAdd) {
            try {
                // Check if column exists
                const [results] = await sequelize.query(`
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'Users' 
                    AND column_name = '${column.name}'
                `);
                
                if (results.length === 0) {
                    await sequelize.getQueryInterface().addColumn('Users', column.name, {
                        type: column.type,
                        allowNull: column.allowNull,
                        defaultValue: column.defaultValue
                    });
                    console.log(`Column "${column.name}" added successfully`);
                } else {
                    console.log(`Column "${column.name}" already exists, skipping`);
                }
            } catch (err) {
                console.log(`Error adding column ${column.name}:`, err.message);
            }
        }
        
        // Update Users table to use varchar for role if still using enum
        try {
            await sequelize.query(`
                ALTER TABLE "Users"
                ALTER COLUMN "role" TYPE VARCHAR(255)
            `);
            console.log('Changed role column type to VARCHAR');
        } catch (err) {
            console.log('Could not alter role column type:', err.message);
        }
        
        res.json({ 
            message: 'Database migration completed successfully', 
            success: true 
        });
    } catch (error) {
        console.error('Migration error:', error);
        res.status(500).json({ 
            message: 'Error running migration', 
            error: error.message,
            hint: 'Check server logs for details on which columns failed'
        });
    }
});

// Add a super simple admin creation endpoint (REMOVE AFTER USE FOR SECURITY)
router.get('/create-simple-admin', async (req, res) => {
    try {
        // Delete existing admin users to ensure we don't get duplicates
        try {
            await User.destroy({ where: { role: 'admin' } });
            console.log('Existing admin users removed');
        } catch (err) {
            console.log('Error removing existing admin users:', err.message);
            // Continue even if delete fails
        }
        
        // Create a very simple admin directly
        const adminUser = {
            username: 'admin',
            name: 'Administrator',
            email: 'admin@example.com',
            password: bcrypt.hashSync('Admin123!', 10),
            role: 'admin',
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        // Try direct SQL insert to bypass model issues
        const result = await sequelize.query(
            `INSERT INTO "Users" ("username", "name", "email", "password", "role", "status", "createdAt", "updatedAt") 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
            {
                bind: [
                    adminUser.username,
                    adminUser.name,
                    adminUser.email,
                    adminUser.password,
                    adminUser.role,
                    adminUser.status,
                    adminUser.createdAt,
                    adminUser.updatedAt
                ],
                type: sequelize.QueryTypes.INSERT
            }
        );
        
        console.log('Admin created with ID:', result[0][0].id);
        
        res.json({
            success: true,
            message: 'Super simple admin created successfully',
            credentials: {
                email: 'admin@example.com',
                password: 'Admin123!'
            },
            note: 'Please login with these credentials and immediately change the password'
        });
    } catch (error) {
        console.error('Error creating simple admin:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating simple admin',
            error: error.message,
            detailedError: error.toString()
        });
    }
});

// Add a direct admin login endpoint (REMOVE AFTER USE FOR SECURITY)
router.get('/direct-login', async (req, res) => {
    try {
        console.log('Direct login endpoint called');
        
        // Find admin user
        const admin = await User.findOne({
            where: { role: 'admin' }
        });
        
        console.log('Admin user search result:', admin ? 'Found' : 'Not found');
        
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'No admin user found. Please create an admin user first using /api/admin/create-simple-admin'
            });
        }
        
        // Get JWT secret with fallback
        const jwtSecret = process.env.JWT_SECRET || 'your-default-jwt-secret-key-for-development';
        console.log('Using JWT secret:', jwtSecret.substring(0, 3) + '...[redacted]');
        
        try {
            // Generate JWT token directly with explicit parameters
            const token = jwt.sign(
                { 
                    id: admin.id, 
                    email: admin.email, 
                    role: admin.role 
                },
                jwtSecret,
                { expiresIn: '1d' }
            );
            
            console.log('Token generated successfully');
            
            // Return token and user info
            return res.json({
                success: true,
                message: 'Login successful',
                token,
                user: {
                    id: admin.id,
                    username: admin.username,
                    name: admin.name,
                    email: admin.email,
                    role: admin.role
                },
                instructions: 'Copy this token and manually set it in your browser localStorage with key "token"'
            });
        } catch (jwtError) {
            console.error('JWT signing error:', jwtError);
            return res.status(500).json({
                success: false,
                message: 'Error generating JWT token',
                error: jwtError.message,
                suggestion: 'Check if JWT_SECRET is set correctly in environment variables'
            });
        }
    } catch (error) {
        console.error('Error with direct login:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating login token',
            error: error.message,
            stack: error.stack
        });
    }
});

// Add a direct admin login helper page (REMOVE AFTER USE FOR SECURITY)
router.get('/login-helper', (req, res) => {
    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Admin Login Helper</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .container {
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    padding: 20px;
                    margin-bottom: 20px;
                }
                h1 {
                    color: #333;
                }
                button {
                    background-color: #4CAF50;
                    color: white;
                    padding: 10px 15px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    margin: 5px;
                }
                button:hover {
                    background-color: #45a049;
                }
                pre {
                    background-color: #f5f5f5;
                    padding: 10px;
                    border-radius: 5px;
                    overflow-x: auto;
                }
                .response {
                    margin-top: 20px;
                    display: none;
                }
                .success {
                    color: green;
                }
                .error {
                    color: red;
                }
            </style>
        </head>
        <body>
            <h1>Admin Login Helper</h1>
            <p>This page helps you create an admin user and get logged in when other methods fail.</p>
            
            <div class="container">
                <h2>Step 1: Create Admin User</h2>
                <p>Click the button below to create a basic admin user:</p>
                <button id="createAdmin">Create Admin User</button>
                <div id="createResponse" class="response"></div>
            </div>
            
            <div class="container">
                <h2>Step 2: Get Login Token</h2>
                <p>After creating an admin user, click here to get a login token:</p>
                <button id="getToken">Get Login Token</button>
                <div id="tokenResponse" class="response"></div>
            </div>
            
            <div class="container">
                <h2>Step 3: Set Token Manually</h2>
                <div id="tokenInstructions" style="display: none;">
                    <p>Copy the token below:</p>
                    <pre id="tokenValue"></pre>
                    <p>Then run this in your browser console when on the admin panel:</p>
                    <pre>localStorage.setItem('token', 'PASTE_TOKEN_HERE');</pre>
                    <p>Also set the user info:</p>
                    <pre id="userValue"></pre>
                    <pre>localStorage.setItem('user', 'PASTE_USER_JSON_HERE');</pre>
                    <p>Then refresh the page to access the admin panel.</p>
                    <a id="adminLink" href="/admin" target="_blank">Go to Admin Panel</a>
                </div>
            </div>
            
            <script>
                document.getElementById('createAdmin').addEventListener('click', async () => {
                    const response = document.getElementById('createResponse');
                    response.style.display = 'block';
                    response.innerHTML = 'Creating admin user...';
                    
                    try {
                        const result = await fetch('/api/admin/create-simple-admin');
                        const data = await result.json();
                        
                        if (data.success) {
                            response.innerHTML = '<p class="success">Admin user created successfully!</p>' +
                                '<p>Email: ' + data.credentials.email + '</p>' +
                                '<p>Password: ' + data.credentials.password + '</p>';
                        } else {
                            response.innerHTML = '<p class="error">Error: ' + data.message + '</p>';
                            if (data.error) {
                                response.innerHTML += '<p>Details: ' + data.error + '</p>';
                            }
                        }
                    } catch (error) {
                        response.innerHTML = '<p class="error">Error: ' + error.message + '</p>';
                    }
                });
                
                document.getElementById('getToken').addEventListener('click', async () => {
                    const response = document.getElementById('tokenResponse');
                    response.style.display = 'block';
                    response.innerHTML = 'Getting login token...';
                    
                    try {
                        const result = await fetch('/api/admin/direct-login');
                        const data = await result.json();
                        
                        if (data.success) {
                            response.innerHTML = '<p class="success">Login token generated successfully!</p>';
                            document.getElementById('tokenInstructions').style.display = 'block';
                            document.getElementById('tokenValue').textContent = data.token;
                            document.getElementById('userValue').textContent = JSON.stringify(data.user, null, 2);
                            
                            // Auto-set token if possible
                            try {
                                localStorage.setItem('token', data.token);
                                localStorage.setItem('user', JSON.stringify(data.user));
                                localStorage.setItem('isAdminSession', 'true');
                                response.innerHTML += '<p class="success">Token has been automatically set in localStorage!</p>' +
                                    '<p>You can now <a href="/admin" target="_blank">go to the admin panel</a>.</p>';
                            } catch (e) {
                                console.error('Could not auto-set token:', e);
                            }
                        } else {
                            response.innerHTML = '<p class="error">Error: ' + data.message + '</p>';
                        }
                    } catch (error) {
                        response.innerHTML = '<p class="error">Error: ' + error.message + '</p>';
                    }
                });
            </script>
        </body>
        </html>
    `;
    
    res.send(html);
});

// Add an endpoint to check and fix JWT_SECRET (REMOVE AFTER USE FOR SECURITY)
router.get('/check-jwt-secret', async (req, res) => {
    try {
        // Check if JWT_SECRET is set
        const currentSecret = process.env.JWT_SECRET;
        
        if (!currentSecret) {
            console.log('JWT_SECRET not found in environment');
            
            // Set a default JWT secret if it's not set
            process.env.JWT_SECRET = 'temporary-jwt-secret-for-development-only';
            console.log('Set temporary JWT_SECRET in process.env');
            
            return res.json({
                success: true,
                message: 'JWT_SECRET was not set, but has been temporarily set in memory',
                action: 'Please set the JWT_SECRET environment variable permanently in your hosting platform'
            });
        }
        
        return res.json({
            success: true,
            message: 'JWT_SECRET is already set',
            secretFirstChars: currentSecret.substring(0, 3) + '...[redacted]'
        });
    } catch (error) {
        console.error('Error checking JWT_SECRET:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking JWT_SECRET',
            error: error.message
        });
    }
});

// Add more admin routes as needed

export default router; 