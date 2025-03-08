import express from 'express';
import { User } from '../models/index.js';
import { auth, isAdmin } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';

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

// Emergency direct login without password check
router.get('/emergency-login', async (req, res) => {
  try {
    // This route should only be accessible with a secret key
    const secretKey = req.query.secret;
    const expectedSecret = process.env.ADMIN_RESET_SECRET || 'temporary-dev-secret';
    
    if (secretKey !== expectedSecret) {
      console.log('Invalid secret key provided for emergency login');
      return res.status(403).json({ 
        message: 'Access denied. Valid secret key required.'
      });
    }
    
    // Find the admin user
    const adminUser = await User.findOne({
      where: {
        email: 'admin@example.com',
        role: 'admin'
      }
    });
    
    if (!adminUser) {
      return res.status(404).json({ 
        message: 'Admin user not found. Create one first using the /reset-admin endpoint.'
      });
    }
    
    // Generate JWT token directly
    const token = jwt.sign(
      { id: adminUser.id, email: adminUser.email, role: adminUser.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1d' }
    );
    
    // Remove password from response
    const userData = adminUser.toJSON();
    delete userData.password;
    
    // Return HTML with auto-login script
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Emergency Admin Login</title>
          <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css" rel="stylesheet">
          <style>
            body { padding: 20px; }
            pre { background: #f8f9fa; padding: 15px; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="alert alert-success">
              <h4>Emergency Login Successful!</h4>
              <p>Your admin token has been generated and will be automatically stored.</p>
            </div>
            
            <div class="card mb-4">
              <div class="card-header">User Details</div>
              <div class="card-body">
                <p><strong>ID:</strong> ${userData.id}</p>
                <p><strong>Email:</strong> ${userData.email}</p>
                <p><strong>Role:</strong> ${userData.role}</p>
                <p><strong>Status:</strong> ${userData.status}</p>
              </div>
            </div>
            
            <div class="card mb-4">
              <div class="card-header">Token</div>
              <div class="card-body">
                <pre class="mb-0">${token.substring(0, 20)}...${token.substring(token.length - 20)}</pre>
              </div>
            </div>
            
            <div class="d-grid gap-2">
              <button class="btn btn-primary" id="loginBtn">Complete Login & Go to Admin Panel</button>
              <a href="/admin/login.html" class="btn btn-outline-secondary">Return to Login Page</a>
            </div>
          </div>
          
          <script>
            // Store the token and user data
            localStorage.setItem('token', '${token}');
            localStorage.setItem('user', '${JSON.stringify(userData).replace(/'/g, "\\'")}');
            
            document.getElementById('loginBtn').addEventListener('click', function() {
              window.location.href = '/admin/index.html';
            });
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Emergency login error:', error);
    res.status(500).json({ 
      message: 'Error during emergency login', 
      error: error.message 
    });
  }
});

// Add more admin routes as needed

export default router; 