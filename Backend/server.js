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
import errorHandler from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, Postman)
        if (!origin) return callback(null, true);
        
        // List of allowed origins
        const allowedOrigins = [
            'http://localhost:5173',  // Default Vite dev server
            'http://localhost:5002',  // Backend URL
            'http://localhost:3000',  // Common React dev server
            'http://localhost:8080',  // Another common dev port
        ];
        
        // Add FRONTEND_URL from environment if it exists
        if (process.env.FRONTEND_URL) {
            // Support both exact URL and any subdomain
            allowedOrigins.push(process.env.FRONTEND_URL);
            // Extract domain for wildcard support
            try {
                const url = new URL(process.env.FRONTEND_URL);
                const domain = url.hostname;
                // If not localhost, also allow all subdomains
                if (!domain.includes('localhost')) {
                    allowedOrigins.push(`https://*.${domain}`);
                }
            } catch (e) {
                console.error('Invalid FRONTEND_URL format:', e);
            }
        }
        
        // In production, be more permissive initially to avoid deployment issues
        if (process.env.NODE_ENV === 'production') {
            return callback(null, true); // Allow all origins in production temporarily
        }
        
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            console.log('CORS blocked request from:', origin);
            callback(null, true); // Allow all origins temporarily for debugging
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add security headers in production
if (process.env.NODE_ENV === 'production') {
    app.use(helmet());
    
    // Add rate limiting in production
    const apiLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP, please try again later'
    });
    app.use('/api/', apiLimiter);
    
    console.log('Production security measures enabled');
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ message: 'Invalid JSON' });
    }
    next(err);
});

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/admin', express.static(path.join(__dirname, 'public/admin')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminProfileRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/product-variants', productVariantsRoutes);
app.use('/api/diagnostics', diagnosticsRoutes);

// Error handler
app.use(errorHandler);

// Default route
app.get('/', (req, res) => {
    res.json({ message: 'Server is running' });
});

// Add this route for testing image serving
app.get('/test-image', (req, res) => {
    const testImagePath = path.join(__dirname, 'public/uploads/products');
    fs.readdir(testImagePath, (err, files) => {
        if (err) {
            console.error('Error reading uploads directory:', err);
            return res.status(500).json({ error: 'Cannot read uploads directory' });
        }
        res.json({
            message: 'Image directory contents',
            files: files,
            directory: testImagePath
        });
    });
});

// Start server
const PORT = process.env.PORT || 5002;

async function startServer() {
    try {
        // Test database connection
        await sequelize.authenticate();
        console.log('Database connection established.');

        // Sync database models without dropping tables
        await sequelize.sync();
        console.log('Database models synchronized.');

        // Start server
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Unable to start server:', error);
        console.error('Error stack:', error.stack);
        process.exit(1);
    }
}

startServer();

export default app; 