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
    // This route should only be accessible with a security code
    const securityCode = req.query.secret;
    const expectedCode = process.env.ADMIN_RESET_SECRET || 'temporary-dev-secret';
    
    if (securityCode !== expectedCode) {
      console.log('Invalid security code provided for emergency login');
      return res.status(403).json({ 
        message: 'Access denied. Valid security code required.'
      });
    }
    
    // Find the admin user
    const adminUser = await User.findOne({
      where: {
        role: 'admin'
      },
      order: [['createdAt', 'ASC']] // Get the oldest admin user
    });
    
    if (!adminUser) {
      return res.status(404).json({ 
        message: 'Admin user not found. Create one first using the /reset-admin endpoint.'
      });
    }
    
    // Generate JWT token with full admin privileges
    const token = jwt.sign(
      { 
        id: adminUser.id, 
        email: adminUser.email, 
        role: adminUser.role,
        isEmergencyLogin: true,  // Mark this as an emergency login
        timestamp: Date.now()    // Add timestamp for additional security
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1d' }
    );
    
    // Log the emergency access
    console.log(`Emergency login granted for admin user: ${adminUser.email} (ID: ${adminUser.id})`);
    
    // Remove password from response
    const userData = adminUser.toJSON();
    delete userData.password;
    
    // Add emergency login flag to the user data for client-side use
    userData.isEmergencyLogin = true;
    
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
              <p>You now have full administrator access to the system.</p>
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
              <div class="card-header">Access Information</div>
              <div class="card-body">
                <p><strong>Access Type:</strong> <span class="badge bg-warning">Emergency Access</span></p>
                <p><strong>Expires:</strong> 24 hours from now</p>
                <p class="text-danger"><strong>Note:</strong> For security reasons, emergency access is logged and monitored.</p>
              </div>
            </div>
            
            <div class="d-grid gap-2">
              <button class="btn btn-primary" id="loginBtn">Continue to Admin Panel</button>
            </div>
          </div>
          
          <script>
            // Store the token and user data
            localStorage.setItem('token', '${token}');
            localStorage.setItem('user', '${JSON.stringify(userData).replace(/'/g, "\\'")}');
            localStorage.setItem('emergencyLogin', 'true'); // Track this as an emergency login
            localStorage.setItem('isAdminSession', 'true'); // Extra flag to ensure admin privileges
            
            document.getElementById('loginBtn').addEventListener('click', function() {
              window.location.href = '/admin/index.html';
            });
            
            // Auto-redirect after 5 seconds
            setTimeout(() => {
              window.location.href = '/admin/index.html';
            }, 5000);
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

// Verify security code for emergency access
router.post('/verify-security-code', async (req, res) => {
  try {
    const { securityCode } = req.body;
    
    // The expected code - can be configured with environment variable
    const expectedCode = process.env.ADMIN_RESET_SECRET || 'temporary-dev-secret';
    
    // Enhanced security: add a small random delay to prevent timing attacks
    const randomDelay = Math.floor(Math.random() * 500) + 200; // 200-700ms random delay
    await new Promise(resolve => setTimeout(resolve, randomDelay));
    
    // Validate security code - this is a server-side check that can't be bypassed through client inspection
    if (securityCode !== expectedCode) {
      console.log('Invalid security code attempt');
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid security code' 
      });
    }
    
    // If code is valid, allow emergency access
    console.log('Valid security code provided, emergency access granted');
    return res.json({
      success: true,
      message: 'Security code verified'
    });
  } catch (error) {
    console.error('Security code verification error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Error verifying security code', 
      error: error.message 
    });
  }
});

// Add more admin routes as needed

export default router; 