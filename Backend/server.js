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
const require = createRequire(import.meta.url);
const bcrypt = require('bcryptjs');

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
import errorHandler from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust proxy - Important for Render and other cloud platforms
// This fixes the "ERR_ERL_UNEXPECTED_X_FORWARDED_FOR" warning
app.set('trust proxy', 1);

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
            'http://127.0.0.1:5173',  // Also allow access via IP
            'http://127.0.0.1:5002',
            'http://127.0.0.1:3000',
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
        
        console.log('CORS request from origin:', origin);
        
        // In development or where needed, print allowed origins for debugging
        if (process.env.NODE_ENV !== 'production') {
            console.log('Allowed origins:', allowedOrigins);
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
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://code.jquery.com"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
                imgSrc: ["'self'", "data:", "https://cdn.jsdelivr.net", "https://img.icons8.com", "http://localhost:5173", "http://localhost:5002", "*"],
                connectSrc: ["'self'", "https://api.stripe.com", "http://localhost:5002", "*"],
                fontSrc: ["'self'", "https://cdn.jsdelivr.net", "https://fonts.gstatic.com"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'self'", "https://js.stripe.com"],
                scriptSrcAttr: ["'unsafe-inline'"]
            },
        },
        crossOriginEmbedderPolicy: false,
    }));
    
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

// Add a special CORS handler for the uploads directory to ensure images are accessible
app.use('/uploads', (req, res, next) => {
    // Allow from any origin
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    
    // Add cache headers for images
    const filePath = req.path;
    if (filePath.match(/\.(jpg|jpeg|png|gif)$/i)) {
        res.header('Cache-Control', 'public, max-age=86400'); // 24 hours
    }
    
    next();
});

// Serve static files with proper MIME types
app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, filePath) => {
        // Set appropriate content type for image files
        if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
            res.setHeader('Content-Type', 'image/jpeg');
        } else if (filePath.endsWith('.png')) {
            res.setHeader('Content-Type', 'image/png');
        } else if (filePath.endsWith('.gif')) {
            res.setHeader('Content-Type', 'image/gif');
        }
        
        // Set caching headers
        res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
    }
}));

// Add more specific static routes with proper URL paths
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads'), {
    setHeaders: (res, filePath) => {
        // Set appropriate content type for image files
        if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
            res.setHeader('Content-Type', 'image/jpeg');
        } else if (filePath.endsWith('.png')) {
            res.setHeader('Content-Type', 'image/png');
        } else if (filePath.endsWith('.gif')) {
            res.setHeader('Content-Type', 'image/gif');
        }
        
        // Set caching headers
        res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
    }
}));

// Add specific handlers for product images
app.use('/uploads/products', express.static(path.join(__dirname, 'public/uploads/products'), {
    setHeaders: (res, filePath) => {
        console.log('Serving product image:', filePath);
        // Set appropriate content type for image files
        if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
            res.setHeader('Content-Type', 'image/jpeg');
        } else if (filePath.endsWith('.png')) {
            res.setHeader('Content-Type', 'image/png');
        } else if (filePath.endsWith('.gif')) {
            res.setHeader('Content-Type', 'image/gif');
        }
        
        // Set caching headers
        res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
    }
}));

// Add explicit route for direct access to images
app.get('/uploads/products/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'public/uploads/products', filename);
    
    console.log(`Direct image request for: ${filename}`);
    console.log(`Looking for file at: ${filePath}`);
    
    if (fs.existsSync(filePath)) {
        console.log('File found, sending response');
        
        // Set MIME type based on extension
        if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) {
            res.setHeader('Content-Type', 'image/jpeg');
        } else if (filename.endsWith('.png')) {
            res.setHeader('Content-Type', 'image/png');
        } else if (filename.endsWith('.gif')) {
            res.setHeader('Content-Type', 'image/gif');
        }
        
        // Set caching headers
        res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
        
        res.sendFile(filePath);
    } else {
        console.log('File not found');
        res.status(404).send('Image not found');
    }
});

// Log the static file paths for debugging
console.log('Static file paths:');
console.log('- Public directory:', path.join(__dirname, 'public'));
console.log('- Uploads directory:', path.join(__dirname, 'public/uploads'));
console.log('- Product images directory:', path.join(__dirname, 'public/uploads/products'));

// Verify uploads directories exist
const uploadsProductsDir = path.join(__dirname, 'public/uploads/products');
if (!fs.existsSync(uploadsProductsDir)) {
    console.log('Creating missing uploads/products directory');
    fs.mkdirSync(uploadsProductsDir, { recursive: true });
} else {
    // List existing files in the directory
    const files = fs.readdirSync(uploadsProductsDir);
    console.log(`Found ${files.length} existing files in uploads/products directory`);
    if (files.length > 0) {
        console.log('Sample files:', files.slice(0, 5));
    }
}

// Path rewrites for common JS and CSS files
app.use('/js', (req, res) => {
    // Redirect requests from /js/* to /admin/js/*
    res.redirect(`/admin/js${req.path}`);
});

app.use('/css', (req, res) => {
    // Redirect requests from /css/* to /admin/css/*
    res.redirect(`/admin/css${req.path}`);
});

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

// Add this before the API Routes section
app.use((req, res, next) => {
    // Log all requests for JavaScript and CSS files
    if (req.path.endsWith('.js') || req.path.endsWith('.css')) {
        console.log(`[DEBUG] Resource request: ${req.method} ${req.path}`, {
            'User-Agent': req.headers['user-agent'],
            'Accept': req.headers['accept'],
            'Referer': req.headers['referer'] || 'not specified'
        });
    }
    next();
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
app.use('/api/admin-tools', adminRoutes);

// Error handler - should be after all routes
app.use(errorHandler);

// Default route
app.get('/', (req, res) => {
    // If user agent is a browser (contains Mozilla, Safari, Chrome, etc.)
    const userAgent = req.headers['user-agent'] || '';
    if (userAgent.includes('Mozilla') || userAgent.includes('Chrome') || userAgent.includes('Safari')) {
        // Redirect browser requests to admin panel
        return res.redirect('/admin');
    }
    
    // For API clients, return JSON
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

// Main startup function
async function startServer() {
    try {
        // Test database connection
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');

        // Run database fixes
        console.log('Fixing database schema and data...');
        try {
            await fixProductImagesColumn();
            console.log('Database fixes completed successfully.');
        } catch (fixError) {
            console.error('Error during database fixes:', fixError);
            console.log('Continuing with server startup despite fix errors');
        }
        
        // Sync database models
        await sequelize.sync();
        console.log('Database synchronized');
        
        // Check for admin user, create if it doesn't exist
        const adminUser = await models.User.findOne({ where: { role: 'admin' } });
        if (!adminUser) {
            console.log('No admin user found, creating one...');
            const hashedPassword = await bcrypt.hash('Admin123!', 10);
            await models.User.create({
                username: 'admin',
                name: 'Administrator',
                email: 'admin@example.com',
                password: hashedPassword,
                role: 'admin',
                status: 'active'
            });
            console.log('Admin user created successfully');
        } else {
            // Ensure admin password is updated to the known password if env var is set
            if (process.env.RESET_ADMIN_PASSWORD === 'true') {
                console.log('Resetting admin password to known value due to RESET_ADMIN_PASSWORD flag');
                const hashedPassword = await bcrypt.hash('Admin123!', 10);
                await adminUser.update({ password: hashedPassword });
                console.log('Admin password reset successfully');
            }
        }
        
        // Start listening for requests
        const PORT = process.env.PORT || 5002;
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Server environment: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        console.error('Error starting server:', error);
        process.exit(1);
    }
}

startServer();

export default app; 