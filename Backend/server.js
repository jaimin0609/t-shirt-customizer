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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust proxy - Important for Render and other cloud platforms
// This fixes the "ERR_ERL_UNEXPECTED_X_FORWARDED_FOR" warning
app.set('trust proxy', 1);

// Create and configure allowlist of domains for CORS
const createCorsAllowList = () => {
  // Start with essential domains
  const staticAllowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5002',
    'http://127.0.0.1:5002',
    'https://t-shirt-customizer-backend.onrender.com',
    'https://uniqverse-five.vercel.app',
    'https://uniqverse.vercel.app'
  ];
  
  // Add any additional domains from environment variable if present
  const envAllowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : [];
  
  // Combine both lists
  return [...new Set([...staticAllowedOrigins, ...envAllowedOrigins])];
};

const corsAllowList = createCorsAllowList();

// Middleware
app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, etc)
        if (!origin) return callback(null, true);
        
        // Check if origin is in allowlist
        if (corsAllowList.includes(origin)) {
            callback(null, true);
        } else if (origin.endsWith('.vercel.app')) {
            // Allow specific vercel subdomains for development
            callback(null, true);
        } else {
            console.warn(`Origin rejected by CORS policy: ${origin}`);
            callback(new Error(`Origin ${origin} not allowed by CORS policy`));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400 // 24 hours
}));

// Enhanced security headers with Helmet
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", 'https://js.stripe.com', 'https://cdn.jsdelivr.net'],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdn.jsdelivr.net'],
            imgSrc: ["'self'", 'https://res.cloudinary.com', 'data:', 'blob:'],
            connectSrc: ["'self'", ...corsAllowList],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'self'", 'https://js.stripe.com'],
            upgradeInsecureRequests: [],
        },
    },
    crossOriginEmbedderPolicy: false, // Allow embedding resources from approved domains
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }, // Needed for OAuth flows
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Required for loading resources from CDNs
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    xssFilter: true,
    noSniff: true,
    dnsPrefetchControl: { allow: false },
}));

// Body parser middleware
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());

// Rate limiting for all routes
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // limit each IP to 500 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: 'Too many requests from this IP, please try again after 15 minutes',
    skip: (req) => {
        // Skip rate limiting for development environment
        return process.env.NODE_ENV === 'development' || 
               req.ip === '127.0.0.1' || 
               req.ip === '::1';
    }
});

// Apply rate limiter to all routes
app.use(apiLimiter);

// Stricter rate limiting for authentication routes to prevent brute force attacks
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 30, // limit each IP to 30 login/register requests per hour
    message: 'Too many login attempts, please try again after an hour',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV === 'development'
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Additional security: clear sensitive headers that might be added by underlying platforms
app.use((req, res, next) => {
    res.removeHeader('X-Powered-By');
    next();
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin-profile', adminProfileRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/product-variants', productVariantsRoutes);
app.use('/api/diagnostics', diagnosticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is healthy', environment: process.env.NODE_ENV || 'development' });
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

// Admin panel route
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

// Fallback route - handle React router for admin panel
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