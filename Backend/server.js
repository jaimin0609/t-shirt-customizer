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

// Static files - make sure these come before API routes
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Admin panel CSS and JS files - serve with correct MIME types
app.use('/admin/js', (req, res, next) => {
    res.set('Content-Type', 'application/javascript');
    next();
}, express.static(path.join(__dirname, 'public/admin/js')));

app.use('/admin/css', (req, res, next) => {
    res.set('Content-Type', 'text/css');
    next();
}, express.static(path.join(__dirname, 'public/admin/css')));

// Image files
app.use('/admin/images', express.static(path.join(__dirname, 'public/admin/images')));
app.use('/admin/img', express.static(path.join(__dirname, 'public/admin/img')));

// Admin panel routes - serve entire admin directory
app.use('/admin', express.static(path.join(__dirname, 'public/admin')));

// Admin panel index route - handle the root admin page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/admin/index.html'));
});

// Admin login page
app.get('/admin/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/admin/login.html'));
});

// Handle 404 errors for admin panel pages
app.get('/admin/*', (req, res, next) => {
    // Check if the requested file exists
    const requestedPath = path.join(__dirname, 'public', req.path);
    if (fs.existsSync(requestedPath)) {
        // If it exists, let express.static handle it
        next();
    } else {
        // If it doesn't exist, send the admin index.html for client-side routing
        res.sendFile(path.join(__dirname, 'public/admin/index.html'));
    }
});

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

// Error handler - should be after all routes
app.use(errorHandler);

// Default route
app.get('/', (req, res) => {
    res.json({ 
        message: 'T-Shirt Customizer API is running',
        docs: 'API Documentation is not available. Please check the frontend application.',
        adminPanel: `${req.protocol}://${req.get('host')}/admin`,
        status: 'healthy'
    });
});

// Global 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        error: 'API endpoint not found',
        path: req.originalUrl
    });
});

// Diagnostic route for admin panel files
app.get('/check-admin-files', (req, res) => {
    try {
        const adminDir = path.join(__dirname, 'public/admin');
        const files = fs.readdirSync(adminDir);
        
        // Check if key files exist
        const hasIndexHtml = files.includes('index.html');
        const hasLoginHtml = files.includes('login.html');
        
        // Check JS directory
        let jsFiles = [];
        const jsDir = path.join(adminDir, 'js');
        if (fs.existsSync(jsDir)) {
            jsFiles = fs.readdirSync(jsDir);
        }
        
        res.json({
            success: true,
            adminDirExists: true,
            adminFiles: files,
            hasIndexHtml,
            hasLoginHtml,
            jsDirectoryExists: fs.existsSync(jsDir),
            jsFiles,
            adminPath: adminDir
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            stack: process.env.NODE_ENV === 'production' ? null : error.stack
        });
    }
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

        // Run migrations in production automatically
        if (process.env.NODE_ENV === 'production' && process.env.AUTO_MIGRATE === 'true') {
            console.log('Running automatic migrations...');
            try {
                // Instead of using Umzug, directly sync the models
                console.log('Using Sequelize sync instead of migrations...');
                
                // Force sync in production only if specifically requested
                // CAUTION: This will drop and recreate all tables
                const forceSync = process.env.FORCE_SYNC === 'true';
                if (forceSync) {
                    console.log('WARNING: Forcing table sync (drop and recreate)');
                }
                
                await sequelize.sync({ force: forceSync });
                console.log('Database schema synchronized successfully');
                
                // Create admin user if it doesn't exist
                try {
                    // Import User model directly
                    const User = (await import('./models/user.js')).default;
                    
                    // Check if admin user exists
                    const adminExists = await User.findOne({ 
                        where: { role: 'admin' } 
                    });
                    
                    if (!adminExists && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
                        // Import bcrypt properly
                        const bcryptjs = await import('bcryptjs');
                        const hashedPassword = await bcryptjs.default.hash(process.env.ADMIN_PASSWORD, 10);
                        
                        // Generate a username from the email
                        const username = process.env.ADMIN_EMAIL.split('@')[0] + '_admin';
                        
                        await User.create({
                            email: process.env.ADMIN_EMAIL,
                            username: username,
                            password: hashedPassword,
                            role: 'admin',
                            name: 'Admin User'
                        });
                        
                        console.log('Default admin user created successfully');
                    } else if (adminExists) {
                        console.log('Admin user already exists, skipping creation');
                    } else {
                        console.log('Missing admin credentials in environment variables');
                    }
                } catch (error) {
                    console.error('Error handling admin user:', error);
                }
            } catch (error) {
                console.error('Error syncing database:', error);
            }
        } else {
            // Standard model sync for non-production or when migrations disabled
            await sequelize.sync();
            console.log('Database models synchronized.');
        }

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