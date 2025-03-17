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

// Middleware
app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, etc)
        if (!origin) return callback(null, true);
        
        // Check allowed origins list
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://localhost:5002',
            'http://127.0.0.1:5002',
            'https://t-shirt-customizer-backend.onrender.com',
            'https://uniqverse-59yxjdrud-jaimin0609s-projects.vercel.app',
            'https://uniqverse-8ub2zql8o-jaimin0609s-projects.vercel.app',
            'https://uniqverse.vercel.app',
            'https://uniqverse-five.vercel.app',
            'https://uniqverse-7dymb389x-jaimin0609s-projects.vercel.app'
        ];
        
        // Check if origin is in allowed list
        if (allowedOrigins.indexOf(origin) !== -1) {
            return callback(null, true);
        }
        
        // Allow all vercel.app domains
        if (origin.endsWith('.vercel.app')) {
            return callback(null, true);
        }
        
        // Log rejected origins in development
        if (process.env.NODE_ENV !== 'production') {
            console.warn(`Origin ${origin} not allowed by CORS`);
        }
        
        // By default, allow the request but log it
        callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept', 'X-Auth-Token'],
    exposedHeaders: ['Content-Length', 'X-Auth-Token'],
    credentials: true,
    maxAge: 86400 // Cache preflight requests for 24 hours
}));

// Special handling for OPTIONS requests
app.options('*', (req, res) => {
    // Get origin from request headers
    const origin = req.headers.origin || '*';
    
    // Handle preflight requests
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, X-Requested-With, Accept, X-Auth-Token');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400'); // Cache preflight requests for 24 hours
    res.status(204).end();
});

// Middleware to ensure CORS headers are properly set on all responses
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Define a 'vary' header to tell caches that the response will vary by Origin header
    res.setHeader('Vary', 'Origin');
    
    // Continue processing the request
    next();
});

// Add a health check endpoint for connectivity testing
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is up and running' });
});

// Log CORS requests in development
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.path} - Origin: ${req.get('origin') || 'No origin'}`);
        next();
    });
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add security headers in production
if (process.env.NODE_ENV === 'production') {
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
                imgSrc: [
                    "'self'", 
                    "data:", 
                    "blob:",
                    "https://cdn.jsdelivr.net", 
                    "https://img.icons8.com", 
                    "https://res.cloudinary.com",
                    "https://*.cloudinary.com",
                    "http://localhost:5002",
                    "https://t-shirt-customizer-backend.onrender.com"
                ],
                connectSrc: [
                    "'self'", 
                    "https://api.cloudinary.com",
                    "https://*.cloudinary.com",
                    "https://t-shirt-customizer-backend.onrender.com",
                    "*"
                ],
                fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'", "https://res.cloudinary.com"],
                frameSrc: ["'self'"],
                scriptSrcAttr: ["'unsafe-inline'"],  // Allow inline event handlers
                upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
            }
        },
        crossOriginEmbedderPolicy: false,
        crossOriginOpenerPolicy: false,
        crossOriginResourcePolicy: { policy: "cross-origin" },
        xssFilter: true,
        noSniff: true,
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
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

// Add this near the database connection setup
// Determine if we're using PostgreSQL
const isPostgres = process.env.DATABASE_URL ? process.env.DATABASE_URL.startsWith('postgres') : false;
console.log(`Using ${isPostgres ? 'PostgreSQL' : 'MySQL/MariaDB'} database`);

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
app.use('/api/notifications', notificationsRoutes);

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

// Remove debug route handlers
app.get('/direct-image/:filename', (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(__dirname, 'public/uploads/products', filename);
    
    if (fs.existsSync(filePath)) {
        return res.sendFile(filePath);
    }
    
    // Fallback to placeholder if file doesn't exist
    res.status(404).json({ error: 'Image not found' });
});

// Custom middleware to log all API requests (remove in production)
if (process.env.NODE_ENV !== 'production') {
    app.use('/api', (req, res, next) => {
        // Only log API requests in non-production environments
        next();
    });
}

// In the database connection section, before 'startServer()' function call
// Add this function:

async function applyResetTokenMigration() {
  try {
    console.log('Checking and adding resetToken/resetTokenExpiry columns if needed...');
    
    // First test if we can connect and run a query
    try {
      await sequelize.query('SELECT 1+1 AS result');
      console.log('Database connection verified for migration');
    } catch (connError) {
      console.error('Cannot connect to database for migration:', connError);
      return; // Exit the migration function but don't throw error
    }
    
    // Determine the actual table name based on the dialect
    let tableName = 'Users';
    
    // In PostgreSQL, we need to check what the actual table name is (case sensitivity)
    if (isPostgres) {
      try {
        const [tables] = await sequelize.query(
          `SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'`
        );
        
        // Find the users table regardless of case
        const usersTable = tables.find(t => 
          (t.tablename || '').toLowerCase() === 'users'
        );
        
        if (usersTable) {
          tableName = usersTable.tablename;
          console.log(`Found actual users table name: "${tableName}"`);
        } else {
          console.log('Could not find Users table, using default: "Users"');
        }
      } catch (err) {
        console.error('Error finding actual table name:', err);
        console.log('Proceeding with default table name: "Users"');
      }
    }
    
    // Use a PostgreSQL compatible query to check if columns exist
    const query = isPostgres 
      ? `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = '${tableName.toLowerCase()}' 
        AND column_name IN ('resettoken', 'resettokenexpiry')
      `
      : `
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = '${tableName}' 
        AND COLUMN_NAME IN ('resetToken', 'resetTokenExpiry')
      `;
    
    console.log('Running column check query:', query);
    const [resetTokenResults] = await sequelize.query(query);
    console.log('Column check results:', resetTokenResults);
    
    // Handle different case sensitivity between PostgreSQL and MySQL
    const existingColumns = resetTokenResults.map(r => 
      (r.column_name || r.COLUMN_NAME || '').toLowerCase()
    );
    
    // For PostgreSQL, we need to use quoted table names
    const tableRef = isPostgres ? `"${tableName}"` : tableName;
    
    // Add resetToken column if it doesn't exist
    if (!existingColumns.includes('resettoken')) {
      console.log(`Adding resetToken column to ${tableName} table...`);
      try {
        await sequelize.query(`
          ALTER TABLE ${tableRef} 
          ADD COLUMN "${isPostgres ? 'resetToken' : 'resetToken'}" VARCHAR(255) NULL
        `);
        console.log('Added resetToken column successfully');
      } catch (error) {
        // Specifically handle column already exists error
        if (error.message && error.message.includes('already exists')) {
          console.log('resetToken column already exists (caught in error handler)');
        } else {
          console.error('Error adding resetToken column:', error.message);
        }
      }
    } else {
      console.log('resetToken column already exists');
    }
    
    // Add resetTokenExpiry column if it doesn't exist
    if (!existingColumns.includes('resettokenexpiry')) {
      console.log(`Adding resetTokenExpiry column to ${tableName} table...`);
      try {
        await sequelize.query(`
          ALTER TABLE ${tableRef} 
          ADD COLUMN "${isPostgres ? 'resetTokenExpiry' : 'resetTokenExpiry'}" TIMESTAMP NULL
        `);
        console.log('Added resetTokenExpiry column successfully');
      } catch (error) {
        // Specifically handle column already exists error
        if (error.message && error.message.includes('already exists')) {
          console.log('resetTokenExpiry column already exists (caught in error handler)');
        } else {
          console.error('Error adding resetTokenExpiry column:', error.message);
        }
      }
    } else {
      console.log('resetTokenExpiry column already exists');
    }
    
    console.log('Reset token migration completed successfully');

    // Now update the User model to exclude these fields temporarily
    try {
      // Use a workaround - modify the User model attributes to exclude resetToken and resetTokenExpiry
      // until the migration is complete to avoid errors with findOne queries
      console.log('Adjusting User model to avoid query errors...');
      if (models.User && models.User.rawAttributes) {
        // Create a temporary model for initial admin check
        models.AdminUser = sequelize.define('AdminUser', {
          id: { type: sequelize.Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          username: sequelize.Sequelize.STRING,
          email: sequelize.Sequelize.STRING,
          password: sequelize.Sequelize.STRING,
          role: sequelize.Sequelize.STRING
        }, {
          tableName: tableName
        });
      }
    } catch (modelError) {
      console.error('Error adjusting User model:', modelError);
    }
  } catch (error) {
    console.error('Error applying reset token migration:', error);
    console.log('Attempting to continue startup despite migration error');
    // Don't throw the error, allow the server to continue starting
  }
}

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
            
            // Check if we need to populate sample products
            const [productCount] = await sequelize.query('SELECT COUNT(*) as count FROM "Products"');
            if (productCount[0].count === 0) {
                console.log('No products found in database. Adding sample products...');
                // Import and run the populate script
                const { populateSampleProducts } = await import('./scripts/populate-sample-products.js');
                await populateSampleProducts();
            } else {
                console.log(`Found ${productCount[0].count} products in the database.`);
            }
        } catch (fixError) {
            console.error('Error during database fixes:', fixError);
            console.log('Continuing with server startup despite fix errors');
        }
        
        // Sync database models
        await sequelize.sync();
        console.log('Database synchronized');
        
        // Add this line before checking for admin users
        await applyResetTokenMigration();
        
        try {
            // Check for admin user, create if it doesn't exist
            // Try using the temporary model first if it exists
            let adminUser = null;
            
            if (models.AdminUser) {
                console.log('Using temporary AdminUser model to check for admin user');
                try {
                    // Create a direct query instead of using the model
                    const [adminResult] = await sequelize.query(
                        `SELECT id, username, email, role FROM "${isPostgres ? 'Users' : 'Users'}" WHERE role = 'admin' LIMIT 1`
                    );
                    adminUser = adminResult.length > 0 ? adminResult[0] : null;
                    console.log('Admin check result:', adminUser ? 'Admin user found' : 'No admin user found');
                } catch (tempModelError) {
                    console.error('Error using temporary model:', tempModelError);
                }
            } else {
                console.log('Using User model to check for admin user');
                adminUser = await models.User.findOne({ where: { role: 'admin' } });
            }
            
            if (!adminUser) {
                console.log('No admin user found, creating one...');
                const hashedPassword = await bcrypt.hash('Admin123!', 10);
                
                // Use a direct query to create admin user without resetToken fields
                const adminData = {
                    username: 'admin',
                    name: 'Administrator',
                    email: 'admin@example.com',
                    password: hashedPassword,
                    role: 'admin',
                    status: 'active',
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                
                if (isPostgres) {
                    const [insertResults] = await sequelize.query(
                        `INSERT INTO "Users" (username, name, email, password, role, status, "createdAt", "updatedAt") 
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
                        { 
                            bind: [
                                adminData.username, 
                                adminData.name, 
                                adminData.email, 
                                adminData.password, 
                                adminData.role, 
                                adminData.status,
                                adminData.createdAt,
                                adminData.updatedAt
                            ]
                        }
                    );
                    console.log('Admin user created successfully via direct query:', insertResults);
                } else {
                    await models.User.create(adminData);
                    console.log('Admin user created successfully via model');
                }
            } else {
                // Ensure admin password is updated to the known password if env var is set
                if (process.env.RESET_ADMIN_PASSWORD === 'true') {
                    console.log('Resetting admin password to known value due to RESET_ADMIN_PASSWORD flag');
                    const hashedPassword = await bcrypt.hash('Admin123!', 10);
                    
                    if (isPostgres) {
                        await sequelize.query(
                            `UPDATE "Users" SET password = $1, "updatedAt" = $2 WHERE id = $3`,
                            { 
                                bind: [hashedPassword, new Date(), adminUser.id] 
                            }
                        );
                    } else if (adminUser.update) {
                        await adminUser.update({ password: hashedPassword });
                    }
                    
                    console.log('Admin password reset successfully');
                }
            }
        } catch (adminError) {
            console.error('Error handling admin user:', adminError);
            console.log('Continuing with server startup despite admin user errors');
        }
        
        // Start listening for requests
        const PORT = process.env.PORT || 5002;
        app.listen(PORT, () => {
            console.log(`✅ Server running on port ${PORT}`);
            console.log(`📁 Serving static files from: ${path.join(__dirname, 'public')}`);
            console.log(`🔗 API Base URL: ${process.env.API_URL || 'http://localhost:' + PORT}`);
            
            // Initialize the email service
            initializeEmailService();
            
            if (process.env.NODE_ENV === 'development') {
                console.log('📋 Available API Routes:');
                printRoutes();
            }
            
            // Now that the server is running, manually add the missing attributes to the User model
            try {
                console.log('Updating User model schema with resetToken fields');
                if (models.User) {
                    // Perform a sync on just this model to ensure it has the latest schema
                    models.User.sync();
                    console.log('User model synchronized with database');
                }
            } catch (modelUpdateError) {
                console.error('Error updating User model schema:', modelUpdateError);
            }
        });
    } catch (error) {
        console.error('Error starting server:', error);
        process.exit(1);
    }
}

startServer();

export default app; 