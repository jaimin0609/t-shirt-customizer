import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import sequelize from './config/database.js';
import * as models from './models/index.js';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { createRequire } from 'module';
// Import the database fix function
import { fixProductImagesColumn } from './scripts/fix-production-images.js';
// Import email service
import { initializeEmailService } from './services/emailService.js';
import morgan from 'morgan';
import { initializeSecurityMiddleware } from './middleware/securityMiddleware.js';
import securityTester from './middleware/securityTester.js';
const require = createRequire(import.meta.url);
const bcrypt = require('bcryptjs');

// Create a mock Sharp module if it fails to load
let sharpAvailable = true;
try {
  require('sharp');
  console.log('✅ Sharp module loaded successfully');
} catch (e) {
  console.warn('⚠️ Sharp module failed to load, using fallbacks for image processing');
  console.warn('Original error:', e.message);
  sharpAvailable = false;
  
  // Create a global mock for Sharp to prevent application crashes
  global.mockSharp = {
    // Mock basic Sharp functionality for fallback
    resize: () => global.mockSharp,
    toFormat: () => global.mockSharp,
    toBuffer: () => Promise.resolve(Buffer.from([])),
    // Add other required mock methods as needed
  };
  
  // Replace the Sharp module with our mock
  require.cache[require.resolve('sharp')] = {
    exports: () => global.mockSharp
  };
}

// Import routes
import authRoutes from './routes/auth.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import productsRoutes from './routes/products.routes.js';
import cartRoutes from './routes/cart.routes.js';
import orderRoutes from './routes/order.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import adminProfileRoutes from './routes/adminProfile.routes.js';
import customerRoutes from './routes/customer.routes.js';
import couponRoutes from './routes/coupons.routes.js';
import promotionRoutes from './routes/promotions.routes.js';
import productVariantsRoutes from './routes/productVariants.routes.js';
import diagnosticsRoutes from './routes/diagnostics.routes.js';
import adminRoutes from './routes/admin.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import errorHandler from './middleware/errorHandler.js';
import userRoutes from './routes/users.routes.js';
import categoryRoutes from './routes/categories.routes.js';
import reviewRoutes from './routes/reviews.routes.js';
import uploadRoutes from './routes/uploadRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust proxy - Important for Render and other cloud platforms
// This fixes the "ERR_ERL_UNEXPECTED_X_FORWARDED_FOR" warning
app.set('trust proxy', 1);

// Security middleware initialization
const securityMiddleware = initializeSecurityMiddleware();

// Apply basic security headers
app.use(securityMiddleware.configureHelmet);

// Configure CORS
app.use(securityMiddleware.configureCors);

// Apply rate limiting to all requests
const apiLimiter = rateLimit({
    windowMs: 3 * 60 * 1000, // 3 minutes
    max: process.env.NODE_ENV === 'production' ? 300 : 2000, // Much higher limit, especially in development
    message: 'Too many requests from this IP, please try again after 3 minutes',
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting for admin panel routes in development and testing
    skip: (req, res) => {
        // Skip for admin panel API requests in development and testing
        if (process.env.NODE_ENV !== 'production' && 
            (req.path.startsWith('/admin') || req.path.startsWith('/api/admin'))) {
            return true;
        }
        return false;
    }
});
app.use(apiLimiter);

// Middleware for parsing request bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser middleware
app.use(cookieParser());

// Logging middleware
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat, {
    skip: (req, res) => process.env.NODE_ENV === 'test'
}));

// Add security testing middleware in development
if (process.env.NODE_ENV !== 'production') {
    app.use(securityTester);
    console.log('🔍 Security testing middleware enabled for development');
}

// Validate Origin header for cross-origin requests that modify state
app.use(securityMiddleware.validateOrigin);

// Apply CSRF protection to routes that need it
// This is applied selectively to routes that modify state, excluding authentication endpoints
app.use(securityMiddleware.validateCsrfToken);

// Provide CSRF token for forms
app.get('/api/csrf-token', securityMiddleware.csrfProtection, (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

// Security headers for all responses
app.use((req, res, next) => {
    // Additional security headers not covered by helmet
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/admin/profile', adminProfileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationsRoutes);

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static files from the public/admin directory (CSS, JS, images, etc.)
app.use('/admin', express.static(path.join(__dirname, 'public', 'admin')));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Route to redirect to admin panel
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Redirecting to Admin Panel</title>
            <meta http-equiv="refresh" content="3;url=/admin">
            <style>
                body {
                    font-family: Arial, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    background-color: #f5f5f5;
                }
                .container {
                    text-align: center;
                    padding: 2rem;
                    background-color: white;
                    border-radius: 8px;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                    max-width: 500px;
                }
                h1 {
                    color: #4a6cf7;
                }
                .spinner {
                    margin: 20px auto;
                    border: 4px solid rgba(0,0,0,0.1);
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    border-left-color: #4a6cf7;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                a {
                    display: inline-block;
                    margin-top: 20px;
                    color: #4a6cf7;
                    text-decoration: none;
                    font-weight: bold;
                }
                a:hover {
                    text-decoration: underline;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Welcome to Uniqverse Admin Panel</h1>
                <p>If you are not redirected automatically, click the link below to go to the admin panel.</p>
                <div class="spinner"></div>
                <a href="/admin">Go to Admin Panel</a>
            </div>
        </body>
        </html>
    `);
});

// Admin panel specific routes - ensure these come BEFORE the wildcard route
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

// Fallback route for client-side routing in the admin panel
app.get('/admin/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

// Error handling middleware
app.use(errorHandler);

// Handle 404 routes
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource does not exist'
    });
});

// Catch unhandled errors
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Server Error',
        message: process.env.NODE_ENV === 'production' 
            ? 'An unexpected error occurred' 
            : err.message
    });
});

// Start server
const PORT = process.env.PORT || 3001;

// Connect to database and start server
const startServer = async () => {
    try {
        // Test database connection
        await sequelize.authenticate();
        console.log('✅ Database connection has been established successfully');
        
        // Initialize email service
        await initializeEmailService();
        console.log('✅ Email service initialized successfully');
        
        // Start server after database connection is established
        app.listen(PORT, () => {
            console.log(`✅ Server running on port ${PORT}`);
            console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log('🔒 Security features enabled with enhanced CORS and Helmet');
        });
    } catch (error) {
        console.error('❌ Unable to connect to the database or start server:', error);
        process.exit(1);
    }
};

startServer(); 