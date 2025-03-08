import express from 'express';
import { User } from '../models/index.js';
import { auth, isAdmin } from '../middleware/auth.js';

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
    
    const bcrypt = await import('bcryptjs');
    
    // Admin user details
    const adminUser = {
      username: 'admin',
      name: 'Administrator',
      email: 'admin@example.com',
      password: await bcrypt.default.hash('Admin123!', 10),
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

// Add more admin routes as needed

export default router; 