import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { Product, User, ProductVariant } from '../models/index.js';
import { optimizeProductImage } from '../middleware/imageOptimization.js';
import { sequelize } from '../models/index.js';
import { Sequelize } from 'sequelize';
import { auth, isAdmin } from '../middleware/auth.js';
import { cloudinaryStorage, localStorageConfig, cloudinaryEnabled } from '../config/cloudinary.js';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { promisify } from 'util';
import { Op } from 'sequelize';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define operators - removing duplicate declaration
// const Op = Sequelize.Op; 

const router = express.Router();

// Helper function for proper PostgreSQL JSON handling
const formatArrayForPostgres = (value) => {
    if (process.env.DATABASE_URL) { // PostgreSQL needs proper JSON strings
        if (value === null || value === undefined) {
            return '[]';
        }
        if (typeof value === 'string') {
            try {
                // If it's already a valid JSON string, just return it
                JSON.parse(value);
                return value;
            } catch (e) {
                // Not valid JSON, stringify it
                return JSON.stringify(value);
            }
        }
        // Not a string, stringify it
        return JSON.stringify(value || []);
    } else {
        // MySQL can handle arrays directly
        return value;
    }
};

// Ensure uploads directory exists for local development fallback
const uploadDir = path.join(__dirname, '../public/uploads/products');

// Create uploads directory if it doesn't exist (for local development)
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('Created upload directory:', uploadDir);
} else {
    console.log('Upload directory exists:', uploadDir);
}

// Initialize multer with appropriate storage
let storage;
if (cloudinaryEnabled) {
    console.log('🚀 Configuring multer with Cloudinary storage');
    console.log('Cloudinary config:', {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        hasApiKey: !!process.env.CLOUDINARY_API_KEY,
        hasApiSecret: !!process.env.CLOUDINARY_API_SECRET
    });
    
    // Make sure we're using cloudinary v2 and not the old version
    storage = new CloudinaryStorage({
        cloudinary: cloudinary.v2,
        params: {
            folder: 'products',
            allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
            format: 'jpg', // Force consistent format
            transformation: [{ width: 1000, crop: "limit" }],
            public_id: (req, file) => {
                // Generate a unique ID using timestamp and random string
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const filename = file.originalname.split('.')[0];
                return `product-${filename}-${uniqueSuffix}`;
            }
        }
    });
} else {
    console.log('Configuring multer with local storage');
    storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, uploadDir);
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        }
    });
}

// Configure multer with the selected storage
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB size limit
    fileFilter: (req, file, cb) => {
        console.log('🔍 Processing file upload:', {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size
        });
        
        if (file.mimetype.startsWith('image/')) {
            console.log('✅ File type accepted:', file.mimetype);
            cb(null, true);
        } else {
            console.log('❌ File type rejected:', file.mimetype);
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Get all products - Removed auth middleware to make it public
router.get('/', async (req, res) => {
    try {
        console.log('=== Fetching Products ===');
        // Check database connection
        await sequelize.authenticate();
        console.log('Database connection is OK');
        
        // Log the query parameters
        console.log('Query parameters:', req.query);
        
        // Build where clause based on query parameters
        const whereClause = {};
        
        // Handle recommendations request
        if (req.query.recommended === 'true') {
            // This would normally involve a more sophisticated recommendation algorithm
            // For now, we'll just get popular items or items from a specific category
            
            // If there's a related_to parameter, try to extract information from it
            if (req.query.related_to) {
                const relatedTerm = req.query.related_to.trim().toLowerCase();
                
                // Try to find a category match first
                const categoryMatch = await Product.findOne({
                    attributes: ['category'],
                    where: {
                        [Op.or]: [
                            { name: { [Op.like]: `%${relatedTerm}%` } },
                            { category: { [Op.like]: `%${relatedTerm}%` } }
                        ]
                    }
                });
                
                if (categoryMatch && categoryMatch.category) {
                    // If we found a category match, recommend products from that category
                    whereClause.category = categoryMatch.category;
                }
            }
            
            // If we aren't filtering by category, just get featured or popular items
            if (!whereClause.category) {
                whereClause.status = 'active';
                // Get products with sales
                whereClause.sales = { [Op.gt]: 0 };
            }
        } else {
            // Regular product filtering logic
            if (req.query.category) {
                whereClause.category = req.query.category;
            }
            
            if (req.query.gender) {
                whereClause.gender = req.query.gender;
            }
            
            if (req.query.ageGroup) {
                whereClause.ageGroup = req.query.ageGroup;
            }
            
            if (req.query.status) {
                whereClause.status = req.query.status;
            } else {
                // By default, only show active products
                whereClause.status = 'active';
            }
            
            if (req.query.featured === 'true') {
                whereClause.featured = true;
            }
            
            if (req.query.minPrice || req.query.maxPrice) {
                const priceFilter = {};
                
                if (req.query.minPrice) {
                    priceFilter[Op.gte] = parseFloat(req.query.minPrice);
                }
                
                if (req.query.maxPrice) {
                    priceFilter[Op.lte] = parseFloat(req.query.maxPrice);
                }
                
                whereClause.price = priceFilter;
            }

            // Search functionality
            if (req.query.search) {
                whereClause[Op.or] = [
                    { name: { [Op.like]: `%${req.query.search}%` } },
                    { description: { [Op.like]: `%${req.query.search}%` } },
                    { category: { [Op.like]: `%${req.query.search}%` } }
                ];
            }
            
            // Add filtering for customizable products
            if (req.query.customizable === 'true') {
                whereClause.isCustomizable = true;
            }
        }
        
        // Get pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        
        // Get sorting parameters
        let order = [['createdAt', 'DESC']];
        if (req.query.sort) {
            switch (req.query.sort.toLowerCase()) {
                case 'price_asc':
                    order = [['price', 'ASC']];
                    break;
                case 'price_desc':
                    order = [['price', 'DESC']];
                    break;
                case 'newest':
                    order = [['createdAt', 'DESC']];
                    break;
                case 'name_asc':
                    order = [['name', 'ASC']];
                    break;
                case 'name_desc':
                    order = [['name', 'DESC']];
                    break;
                case 'popular':
                    order = [['sales', 'DESC']];
                    break;
                default:
                    order = [['createdAt', 'DESC']];
            }
        }
        
        console.log('Finding products with where clause:', JSON.stringify(whereClause));
        console.log('Order:', order);
        console.log('Limit:', limit, 'Offset:', offset);
        
        // Create include array - make it resilient against association issues
        let includeOptions = [];
        try {
            // Check if the association exists
            if (Product.associations && Product.associations.variants) {
                includeOptions.push({
                    model: ProductVariant,
                    as: 'variants',
                    required: false,
                    attributes: ['id', 'type', 'size', 'color', 'colorCode', 'stock', 'status']
                });
            } else {
                console.log('Warning: variants association is not defined on Product model');
                // Try to define it dynamically
                Product.hasMany(ProductVariant, {
                    foreignKey: 'productId',
                    as: 'variants'
                });
                
                ProductVariant.belongsTo(Product, {
                    foreignKey: 'productId',
                    as: 'product'
                });
                
                // Try to include it now
                includeOptions.push({
                    model: ProductVariant,
                    as: 'variants',
                    required: false,
                    attributes: ['id', 'type', 'size', 'color', 'colorCode', 'stock', 'status']
                });
            }
        } catch (associationError) {
            console.error('Error setting up Product-ProductVariant association:', associationError);
            // Continue without including variants
        }
        
        // Query the database with filters, sorting, and pagination
        let products = [];
        let count = 0;
        
        try {
            // Try with associations
            const result = await Product.findAndCountAll({
                where: whereClause,
                order,
                limit,
                offset,
                include: includeOptions
            });
            products = result.rows;
            count = result.count;
        } catch (queryError) {
            console.error('Error with full query, trying without variants:', queryError);
            
            // Fallback query without associations
            const result = await Product.findAndCountAll({
                where: whereClause,
                order,
                limit,
                offset
            });
            products = result.rows;
            count = result.count;
        }
        
        // Process the products to ensure images are properly set
        const processedProducts = products.map(product => {
            const productData = product.toJSON();
            
            // If images is null/undefined or empty array, but image exists, use image instead
            if ((!productData.images || 
                 (Array.isArray(productData.images) && productData.images.length === 0) ||
                 productData.images === '[]' ||
                 productData.images === '""') && 
                productData.image) {
                productData.images = [productData.image];
            }
            
            // Ensure images is always at least an empty array
            if (!productData.images || 
                productData.images === '[]' ||
                productData.images === '""') {
                productData.images = [];
            }
            
            return productData;
        });
        
        console.log(`Found ${count} products, returning ${processedProducts.length} for this page`);
        
        // IMPORTANT: For backward compatibility, always return an array format
        // This ensures old frontend components continue to work
        return res.json(processedProducts);
        
        // The following code is commented out until frontend is updated
        /*
        // Check if the client expects the legacy format (just the array)
        if (req.query.format === 'legacy' || req.headers['x-api-version'] === 'legacy') {
            // Return just the array for backward compatibility
            return res.json(processedProducts);
        }
        
        // Otherwise return the new format with metadata
        res.json({
            products: processedProducts,
            totalProducts: count,
            currentPage: page,
            totalPages: Math.ceil(count / limit)
        });
        */
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Error fetching products', error: error.message });
    }
});

// Test endpoint for Cloudinary uploads - MUST be before /:id route to avoid conflict!
router.post('/test-cloudinary', auth, isAdmin, (req, res) => {
    console.log('POST /products/test-cloudinary - Request received');
    console.log('Request headers:', JSON.stringify(req.headers, null, 2));
    console.log('Content-Type:', req.headers['content-type']);
    
    // Important: Use the multer middleware directly here
    upload.array('images', 5)(req, res, async function(err) {
        try {
            console.log('=== Testing Cloudinary Upload ===');
            console.log('Cloudinary enabled:', cloudinaryEnabled);
            console.log('Cloudinary config:', {
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                api_key: process.env.CLOUDINARY_API_KEY ? '***' : 'not set',
                api_secret: process.env.CLOUDINARY_API_SECRET ? '***' : 'not set'
            });
            
            if (err) {
                console.error('Error during file upload:', err);
                
                // Ensure proper Content-Type header even on error
                res.setHeader('Content-Type', 'application/json');
                
                return res.status(400).json({ 
                    success: false, 
                    message: err.message,
                    error: err.toString()
                });
            }
            
            if (!req.files || req.files.length === 0) {
                console.error('No image files provided');
                
                // Ensure proper Content-Type header even on error
                res.setHeader('Content-Type', 'application/json');
                
                return res.status(400).json({ 
                    success: false, 
                    message: 'No image files provided' 
                });
            }
            
            console.log('Files received:', req.files.map(file => ({
                originalname: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                path: file.path || 'No path',
                filename: file.filename || 'No filename',
                destination: file.destination || 'No destination',
                cloudinary: file.cloudinary || 'No cloudinary data'
            })));
            
            // Check if the files were uploaded to Cloudinary
            const uploadedFiles = req.files.map(file => {
                // For Cloudinary uploads, the file will have a path property with the Cloudinary URL
                // or the file.cloudinary object will contain the Cloudinary details
                if (cloudinaryEnabled && file.path && file.path.includes('cloudinary.com')) {
                    return {
                        success: true,
                        originalname: file.originalname,
                        cloudinaryUrl: file.path,
                        fullFile: file
                    };
                } else if (cloudinaryEnabled && file.cloudinary) {
                    return {
                        success: true,
                        originalname: file.originalname,
                        cloudinaryUrl: file.cloudinary.secure_url || file.cloudinary.url,
                        fullFile: file
                    };
                } else {
                    return {
                        success: false,
                        originalname: file.originalname,
                        localPath: file.path,
                        fullFile: file
                    };
                }
            });
            
            // Ensure proper Content-Type header
            res.setHeader('Content-Type', 'application/json');
            
            return res.status(200).json({
                success: true,
                message: cloudinaryEnabled ? 'Files uploaded to Cloudinary' : 'Files saved locally',
                files: uploadedFiles
            });
        } catch (error) {
            console.error('Error in test-cloudinary endpoint:', error);
            
            // Ensure proper Content-Type header even on error
            res.setHeader('Content-Type', 'application/json');
            
            return res.status(500).json({
                success: false,
                message: 'Error processing upload',
                error: error.message,
                stack: process.env.NODE_ENV === 'production' ? null : error.stack
            });
        }
    });
});

// Add a diagnostic route for testing image uploads - MUST be before /:id route
router.post('/diagnostic-upload', auth, isAdmin, (req, res) => {
    console.log('POST /products/diagnostic-upload - Request received');
    console.log('Request headers:', JSON.stringify(req.headers, null, 2));
    console.log('Content-Type:', req.headers['content-type']);
    
    upload.single('testImage')(req, res, async function(err) {
        try {
            console.log('=== UPLOAD DIAGNOSTIC TEST ===');
            console.log('Request IP:', req.ip);
            console.log('Request headers:', req.headers);
            console.log('User:', req.user ? `${req.user.email} (ID: ${req.user.id})` : 'Not authenticated');
            console.log('Cloudinary enabled:', cloudinaryEnabled);
            
            if (err) {
                console.error('❌ Upload error:', err);
                
                // Ensure proper Content-Type header even on error
                res.setHeader('Content-Type', 'application/json');
                
                return res.status(400).json({
                    success: false,
                    message: err.message,
                    diagnosticInfo: {
                        requestHeaders: req.headers,
                        cloudinaryEnabled: cloudinaryEnabled,
                        formFields: req.body
                    }
                });
            }
            
            // Check if file was received
            if (!req.file) {
                console.error('❌ No file received');
                
                // Ensure proper Content-Type header even on error
                res.setHeader('Content-Type', 'application/json');
                
                return res.status(400).json({
                    success: false,
                    message: 'No file received',
                    diagnosticInfo: {
                        requestHeaders: req.headers,
                        cloudinaryEnabled: cloudinaryEnabled,
                        formFields: req.body
                    }
                });
            }
            
            // Log file details
            console.log('File received:', {
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                path: req.file.path || 'No path',
                filename: req.file.filename || 'No filename',
                destination: req.file.destination || 'No destination'
            });
            
            // Determine the URL to return
            let imageUrl = '';
            if (cloudinaryEnabled && req.file.path) {
                imageUrl = req.file.path;
                console.log('Using Cloudinary URL:', imageUrl);
            } else {
                const filename = req.file.filename || path.basename(req.file.path || '');
                imageUrl = `/uploads/products/${filename}`;
                console.log('Using local URL:', imageUrl);
            }
            
            // Ensure proper Content-Type header
            res.setHeader('Content-Type', 'application/json');
            
            return res.status(200).json({
                success: true,
                message: 'Diagnostic upload test successful',
                imageUrl: imageUrl,
                diagnosticInfo: {
                    file: {
                        originalname: req.file.originalname,
                        size: req.file.size,
                        mimetype: req.file.mimetype,
                        path: req.file.path,
                        cloudinaryData: req.file.cloudinary
                    },
                    cloudinaryEnabled: cloudinaryEnabled,
                    serverTime: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('❌ Diagnostic upload test error:', error);
            
            // Ensure proper Content-Type header even on error
            res.setHeader('Content-Type', 'application/json');
            
            return res.status(500).json({
                success: false,
                message: 'Diagnostic upload test failed',
                error: error.message,
                stack: process.env.NODE_ENV === 'production' ? 'Hidden in production' : error.stack
            });
        }
    });
});

// Get all product categories
router.get('/categories/all', async (req, res) => {
    try {
        // Get distinct categories from all products
        const categories = await Product.findAll({
            attributes: [[sequelize.fn('DISTINCT', sequelize.col('category')), 'category']],
            where: {
                category: {
                    [Op.not]: null,
                    [Op.ne]: ''
                }
            },
            raw: true
        });

        // Transform to expected format with id and name properties
        const formattedCategories = categories.map(item => ({
            id: item.category,
            name: item.category.charAt(0).toUpperCase() + item.category.slice(1) // Capitalize first letter
        }));
        
        res.json(formattedCategories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Failed to fetch categories' });
    }
});

// Get all product genders
router.get('/genders/all', async (req, res) => {
    try {
        // Get distinct genders from all products
        const genders = await Product.findAll({
            attributes: [[sequelize.fn('DISTINCT', sequelize.col('gender')), 'gender']],
            where: {
                gender: {
                    [Op.not]: null,
                    [Op.ne]: ''
                }
            },
            raw: true
        });

        // Transform to expected format with id and name properties
        const formattedGenders = genders.map(item => ({
            id: item.gender,
            name: item.gender.charAt(0).toUpperCase() + item.gender.slice(1) // Capitalize first letter
        }));
        
        // Ensure we have these basic genders
        const defaultGenders = [
            { id: 'men', name: 'Men' },
            { id: 'women', name: 'Women' },
            { id: 'unisex', name: 'Unisex' }
        ];
        
        // Add any default genders that might be missing
        defaultGenders.forEach(gender => {
            if (!formattedGenders.some(g => g.id === gender.id)) {
                formattedGenders.push(gender);
            }
        });
        
        res.json(formattedGenders);
    } catch (error) {
        console.error('Error fetching genders:', error);
        res.status(500).json({ message: 'Failed to fetch genders' });
    }
});

// Get all product age groups
router.get('/age-groups/all', async (req, res) => {
    try {
        // Get distinct age groups from all products
        const ageGroups = await Product.findAll({
            attributes: [[sequelize.fn('DISTINCT', sequelize.col('ageGroup')), 'ageGroup']],
            where: {
                ageGroup: {
                    [Op.not]: null,
                    [Op.ne]: ''
                }
            },
            raw: true
        });

        // Transform to expected format with id and name properties
        const formattedAgeGroups = ageGroups.map(item => ({
            id: item.ageGroup,
            name: item.ageGroup.charAt(0).toUpperCase() + item.ageGroup.slice(1) // Capitalize first letter
        }));
        
        // Ensure we have these basic age groups
        const defaultAgeGroups = [
            { id: 'adult', name: 'Adults' },
            { id: 'youth', name: 'Youth' },
            { id: 'kids', name: 'Kids' }
        ];
        
        // Add any default age groups that might be missing
        defaultAgeGroups.forEach(ageGroup => {
            if (!formattedAgeGroups.some(a => a.id === ageGroup.id)) {
                formattedAgeGroups.push(ageGroup);
            }
        });
        
        res.json(formattedAgeGroups);
    } catch (error) {
        console.error('Error fetching age groups:', error);
        res.status(500).json({ message: 'Failed to fetch age groups' });
    }
});

// Get single product - Now this comes AFTER all other routes with specific endpoints
router.get('/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        console.log(`Fetching product with ID: ${productId}`);
        
        // Create include array - make it resilient against association issues
        let includeOptions = [];
        try {
            // Check if the association exists
            if (Product.associations && Product.associations.variants) {
                includeOptions.push({
                    model: ProductVariant,
                    as: 'variants',
                    required: false
                });
            } else {
                console.log('Warning: variants association is not defined on Product model');
                // Try to define it dynamically
                Product.hasMany(ProductVariant, {
                    foreignKey: 'productId',
                    as: 'variants'
                });
                
                ProductVariant.belongsTo(Product, {
                    foreignKey: 'productId',
                    as: 'product'
                });
                
                // Try to include it now
                includeOptions.push({
                    model: ProductVariant,
                    as: 'variants',
                    required: false
                });
            }
        } catch (associationError) {
            console.error('Error setting up Product-ProductVariant association:', associationError);
            // Continue without including variants
        }
        
        // Try to fetch the product with variants
        let product;
        try {
            product = await Product.findByPk(productId, {
                include: includeOptions
            });
        } catch (queryError) {
            console.error('Error fetching product with variants, trying without:', queryError);
            // Fallback without variants
            product = await Product.findByPk(productId);
        }
        
        if (!product) {
            console.log(`Product with ID ${productId} not found`);
            return res.status(404).json({ message: 'Product not found' });
        }
        
        // Fix for images column - ensure product has an images array
        const productData = product.toJSON();
        
        // If images is null/undefined or empty array, but image exists, use image instead
        if ((!productData.images || productData.images.length === 0) && productData.image) {
            productData.images = [productData.image];
        }
        
        // Ensure images is always at least an empty array
        if (!productData.images) {
            productData.images = [];
        }
        
        res.json(productData);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ message: 'Error fetching product details' });
    }
});

// Create new product endpoint
router.post('/', auth, isAdmin, (req, res) => {
    console.log('POST /products - Product creation request received');
    console.log('Request headers:', JSON.stringify(req.headers, null, 2));
    console.log('Content-Type:', req.headers['content-type']);
    
    upload.array('images', 5)(req, res, async function(err) {
        try {
            console.log('Creating new product...');
            console.log('Storage mode:', cloudinaryEnabled ? 'Cloudinary' : 'Local Storage');
            
            if (err) {
                console.error('Error during file upload:', err);
                
                // Ensure proper Content-Type header even on error
                res.setHeader('Content-Type', 'application/json');
                
                return res.status(400).json({ 
                    success: false, 
                    message: err.message,
                    error: err.toString()
                });
            }
            
            // Log request details
            console.log('Request details:', {
                ip: req.ip,
                user: req.user ? req.user.email : 'Unknown',
                origin: req.get('origin') || 'No origin header',
                filesReceived: req.files ? req.files.length : 0,
                contentType: req.get('content-type')
            });
            
            // Log body details
            console.log('Request body keys:', Object.keys(req.body));
            
            // Validate required fields
            const requiredFields = ['name', 'price', 'description', 'category'];
            const missingFields = requiredFields.filter(field => !req.body[field]);
            
            if (missingFields.length > 0) {
                console.error('Missing required fields:', missingFields);
                
                // Ensure proper Content-Type header even on error
                res.setHeader('Content-Type', 'application/json');
                
                return res.status(400).json({
                    success: false,
                    message: `Missing required fields: ${missingFields.join(', ')}`
                });
            }
            
            // Process uploaded images
            let imageUrls = [];
            if (req.files && req.files.length > 0) {
                try {
                    console.log('Processing uploaded images...');
                    console.log('Files received:', req.files.map(f => ({
                        originalname: f.originalname,
                        mimetype: f.mimetype,
                        size: f.size,
                        path: f.path || 'No path',
                        filename: f.filename || 'No filename',
                        destination: f.destination || 'No destination',
                        cloudinary: f.cloudinary || 'No cloudinary data'
                    })));
                    
                    imageUrls = req.files.map(file => {
                        // For Cloudinary uploads, use the secure URL
                        let url;
                        
                        if (cloudinaryEnabled && file.path && file.path.includes('cloudinary.com')) {
                            url = file.path;
                            console.log(`Using Cloudinary URL from path: ${url}`);
                        } else if (cloudinaryEnabled && file.cloudinary) {
                            url = file.cloudinary.secure_url || file.cloudinary.url;
                            console.log(`Using Cloudinary URL from cloudinary object: ${url}`);
                        } else {
                            url = `/uploads/products/${file.filename}`;
                            console.log(`Using local URL: ${url}`);
                        }
                        
                        return url;
                    });
                    
                    console.log('Final image URLs:', imageUrls);
                } catch (imageError) {
                    console.error('Error processing images:', imageError);
                    
                    // Ensure proper Content-Type header even on error
                    res.setHeader('Content-Type', 'application/json');
                    
                    return res.status(500).json({
                        success: false,
                        message: 'Error processing uploaded images',
                        error: imageError.message
                    });
                }
            } else {
                console.warn('No image files received with the product');
            }
            
            // Create product in database
            const product = await Product.create({
                name: req.body.name,
                description: req.body.description,
                price: req.body.price,
                category: req.body.category,
                gender: req.body.gender || 'unisex',
                ageGroup: req.body.ageGroup || 'adult',
                stock: parseInt(req.body.stock) || 0,
                status: req.body.status || 'active',
                isCustomizable: req.body.isCustomizable === 'true',
                hasVariants: req.body.hasVariants === 'true',
                images: imageUrls,
                image: imageUrls.length > 0 ? imageUrls[0] : null // Set first image as main image
            });
            
            console.log('Product created successfully:', {
                id: product.id,
                name: product.name,
                imageCount: imageUrls.length,
                imageUrls: imageUrls
            });
            
            // Ensure proper Content-Type header
            res.setHeader('Content-Type', 'application/json');
            
            return res.status(201).json({
                success: true,
                message: 'Product created successfully',
                product: product
            });
            
        } catch (error) {
            console.error('Error creating product:', error);
            
            // Ensure proper Content-Type header even on error
            res.setHeader('Content-Type', 'application/json');
            
            return res.status(500).json({
                success: false,
                message: 'Error creating product',
                error: error.message
            });
        }
    });
});

// Update product
router.put('/:id', auth, isAdmin, upload.array('images', 5), async (req, res) => {
    try {
        const productId = req.params.id;
        console.log(`Updating product with ID: ${productId}`);
        
        // Log request body (excluding binary data)
        const logBody = { ...req.body };
        delete logBody.images;
        console.log('Update request body:', JSON.stringify(logBody, null, 2));
        
        // Find the product
        const product = await Product.findByPk(productId);
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        // Get fields from request
        const { 
            name, description, price, category, gender, ageGroup,
            stock, status, featured, customizationOptions, tags,
            hasVariants, colorVariantsData, sizeVariantsData,
            keepExistingImages
        } = req.body;
        
        // Process uploaded images
        let newImages = [];
        if (req.files && req.files.length > 0) {
            try {
                // With Cloudinary, the secure URL is in file.path
                newImages = req.files.map(file => file.path);
                console.log('New Cloudinary image URLs:', newImages);
            } catch (error) {
                console.error('Error processing uploaded images:', error);
                return res.status(500).json({ message: 'Error processing images', error: error.message });
            }
        }
        
        // Determine final images array based on keepExistingImages flag
        let finalImages = [];
        
        if (keepExistingImages === 'true') {
            // Keep existing images and add new ones
            const existingImages = product.images || [];
            finalImages = [...existingImages, ...newImages];
            console.log('Keeping existing images and adding new ones:', finalImages);
        } else if (newImages.length > 0) {
            // Replace with new images only
            finalImages = newImages;
            console.log('Replacing with new images only:', finalImages);
        } else {
            // If no new images and not keeping existing, keep the existing anyway to avoid having no images
            finalImages = product.images || [];
            console.log('No new images uploaded, keeping existing:', finalImages);
        }
        
        // Update the product
        const updatedProduct = await product.update({
            name: name || product.name,
            description: description || product.description,
            price: price || product.price,
            category: category || product.category,
            gender: gender || product.gender,
            ageGroup: ageGroup || product.ageGroup,
            stock: stock !== undefined ? stock : product.stock,
            status: status || product.status,
            featured: featured === 'true' ? true : featured === 'false' ? false : product.featured,
            images: finalImages,
            // Always set the main image to be the first image in the array
            image: finalImages.length > 0 ? finalImages[0] : product.image,
            // Update customization options if provided
            ...(customizationOptions ? { customizationOptions: JSON.parse(customizationOptions) } : {}),
            // Update has variants flag
            hasVariants: hasVariants === 'true' ? true : hasVariants === 'false' ? false : product.hasVariants
        });
        
        // Handle variants if they exist
        if (hasVariants === 'true' && (colorVariantsData || sizeVariantsData)) {
            try {
                console.log('Processing variants...');
                
                // Process color variants - simplified approach
                if (colorVariantsData) {
                    console.log('Processing color variants...');
                    try {
                        let colorVariants;
                        
                        // Safely parse color variants
                        if (typeof colorVariantsData === 'string') {
                            try {
                                colorVariants = JSON.parse(colorVariantsData);
                                console.log('Parsed color variants from string:', colorVariants);
                            } catch (parseError) {
                                console.error('Error parsing color variants JSON:', parseError);
                                colorVariants = [];
                            }
                        } else if (Array.isArray(colorVariantsData)) {
                            colorVariants = colorVariantsData;
                            console.log('Color variants already an array');
                        } else {
                            colorVariants = [];
                            console.log('Invalid color variants format, using empty array');
                        }
                        
                        if (Array.isArray(colorVariants) && colorVariants.length > 0) {
                            for (const variant of colorVariants) {
                                console.log('Creating color variant:', variant);
                                try {
                                    await ProductVariant.create({
                                        productId: updatedProduct.id,
                                        type: 'color',
                                        color: variant.color || 'Unknown',
                                        colorCode: variant.colorCode || '#000000',
                                        stock: parseInt(variant.stock) || 0,
                                        priceAdjustment: parseFloat(variant.priceAdjustment) || 0,
                                        status: parseInt(variant.stock) > 0 ? 'active' : 'outOfStock'
                                    });
                                } catch (variantCreateError) {
                                    console.error('Error creating specific color variant:', variantCreateError);
                                    // Continue to next variant
                                }
                            }
                        } else {
                            console.log('No valid color variants to process');
                        }
                    } catch (colorError) {
                        console.error('Overall error processing color variants:', colorError);
                    }
                }
                
                // Process size variants - simplified with same pattern as color variants
                if (sizeVariantsData) {
                    console.log('Processing size variants...');
                    try {
                        let sizeVariants;
                        
                        // Safely parse size variants
                        if (typeof sizeVariantsData === 'string') {
                            try {
                                sizeVariants = JSON.parse(sizeVariantsData);
                                console.log('Parsed size variants from string:', sizeVariants);
                            } catch (parseError) {
                                console.error('Error parsing size variants JSON:', parseError);
                                sizeVariants = [];
                            }
                        } else if (Array.isArray(sizeVariantsData)) {
                            sizeVariants = sizeVariantsData;
                            console.log('Size variants already an array');
                        } else {
                            sizeVariants = [];
                            console.log('Invalid size variants format, using empty array');
                        }
                        
                        if (Array.isArray(sizeVariants) && sizeVariants.length > 0) {
                            for (const variant of sizeVariants) {
                                console.log('Creating size variant:', variant);
                                try {
                                    await ProductVariant.create({
                                        productId: updatedProduct.id,
                                        type: 'size',
                                        size: variant.size || 'Unknown',
                                        stock: parseInt(variant.stock) || 0,
                                        priceAdjustment: parseFloat(variant.priceAdjustment) || 0,
                                        status: parseInt(variant.stock) > 0 ? 'active' : 'outOfStock'
                                    });
                                } catch (variantCreateError) {
                                    console.error('Error creating specific size variant:', variantCreateError);
                                    // Continue to next variant
                                }
                            }
                        } else {
                            console.log('No valid size variants to process');
                        }
                    } catch (sizeError) {
                        console.error('Overall error processing size variants:', sizeError);
                    }
                }
                
                // Update product to indicate it has variants
                await updatedProduct.update({ hasVariants: true });
                console.log('Variants processed successfully');
                
            } catch (variantError) {
                console.error('Error creating variants:', variantError);
                // Continue with product update even if variants fail
            }
        }
        
        res.json(updatedProduct);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Error updating product', error: error.message });
    }
});

// Delete product
router.delete('/:id', auth, isAdmin, async (req, res) => {
    try {
        console.log(`Attempting to delete product with ID: ${req.params.id}`);
        console.log('User:', req.user ? `ID: ${req.user.id}, Role: ${req.user.role}` : 'Not authenticated');
        
        // Verify user has admin rights
        if (!req.user || req.user.role !== 'admin') {
            console.log('User is not an admin');
            return res.status(403).json({ message: 'Not authorized to delete products' });
        }
        
        // Find the product with explicit error handling
        let product;
        try {
            product = await Product.findByPk(req.params.id);
        } catch (findError) {
            console.error('Database error finding product:', findError);
            return res.status(500).json({ message: 'Database error', error: findError.message });
        }
        
        // Check if product exists
        if (!product) {
            console.log(`Product with ID ${req.params.id} not found`);
            return res.status(404).json({ message: 'Product not found' });
        }
        
        console.log(`Found product: ${product.name} (ID: ${product.id})`);

        // ALWAYS attempt to delete variants first, regardless of hasVariants flag
        console.log(`Attempting to delete any variants for product ${req.params.id}...`);
        
        try {
            // First check if there are any variants
            const variantCount = await ProductVariant.count({
                where: { productId: req.params.id }
            });
            
            console.log(`Found ${variantCount} variants for product ${req.params.id}`);
            
            if (variantCount > 0) {
                // Delete all related product variants first
                const deletedVariants = await ProductVariant.destroy({
                    where: { productId: req.params.id }
                });
                
                console.log(`Successfully deleted ${deletedVariants} product variants`);
                
                // Double-check that all variants were deleted
                const remainingVariants = await ProductVariant.count({
                    where: { productId: req.params.id }
                });
                
                if (remainingVariants > 0) {
                    console.error(`Failed to delete all variants. ${remainingVariants} variants remain.`);
                    return res.status(500).json({ 
                        message: 'Failed to delete all product variants',
                        remainingVariants
                    });
                }
            }
        } catch (variantError) {
            console.error('Error deleting product variants:', variantError);
            return res.status(500).json({ 
                message: 'Error deleting product variants',
                error: variantError.message
            });
        }

        // Handle image processing in a try/catch block to prevent it from aborting the delete
        try {
            console.log('Processing product images...');
            
            // Handle the 'images' array field
            if (product.images) {
                let imagesArray = product.images;
                
                // If it's a string (JSON), parse it
                if (typeof imagesArray === 'string') {
                    try {
                        imagesArray = JSON.parse(imagesArray);
                    } catch (e) {
                        console.warn(`Failed to parse images JSON: ${e.message}`);
                        imagesArray = [];
                    }
                }
                
                if (Array.isArray(imagesArray)) {
                    console.log(`Processing ${imagesArray.length} images from images array`);
                    // Just log the images, don't try to delete Cloudinary images
                    imagesArray.forEach((imgPath, index) => {
                        console.log(`Image ${index + 1}:`, imgPath);
                    });
                }
            }
        } catch (imageError) {
            console.error('Error processing images (non-fatal):', imageError);
            // Continue with product deletion
        }

        // Check for any other potential foreign key constraints
        try {
            // Check for order items referencing this product
            const { OrderItem } = require('../models'); // Import the OrderItem model
            const orderItemCount = await OrderItem.count({
                where: { productId: req.params.id }
            });
            
            if (orderItemCount > 0) {
                console.error(`Product is referenced in ${orderItemCount} order items`);
                return res.status(400).json({
                    message: 'Cannot delete product because it is referenced in orders',
                    orderCount: orderItemCount
                });
            }
            
            // Add checks for any other tables that might reference products here
        } catch (refCheckError) {
            console.error('Error checking product references:', refCheckError);
            // Continue anyway as it's not critical
        }

        // Finally delete the product
        try {
            console.log(`Deleting product with ID: ${product.id}`);
            await product.destroy();
            console.log(`Product successfully deleted`);
            
            return res.status(200).json({ 
                success: true, 
                message: 'Product deleted successfully',
                productId: req.params.id
            });
        } catch (deleteError) {
            console.error('Error during product.destroy():', deleteError);
            
            // Check for foreign key constraint violations
            if (deleteError.name === 'SequelizeForeignKeyConstraintError') {
                const referringTable = deleteError.table || 
                                     (deleteError.original && deleteError.original.table) || 
                                     'unknown';
                                     
                const errorDetail = deleteError.original && deleteError.original.detail 
                    ? deleteError.original.detail 
                    : 'Unknown constraint violation';
                
                console.error(`Foreign key constraint error: ${errorDetail}`);
                
                return res.status(400).json({ 
                    message: `Cannot delete product because it is referenced by other records in ${referringTable}`,
                    error: errorDetail,
                    table: referringTable
                });
            }
            
            throw deleteError; // Re-throw to be caught by the outer catch
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        
        return res.status(500).json({ 
            message: 'Error deleting product',
            error: error.message
        });
    }
});

// Add a route to apply discount to a product
router.post('/:id/discount', auth, isAdmin, async (req, res) => {
    try {
        const { discountPercentage } = req.body;
        
        if (discountPercentage === undefined || discountPercentage < 0 || discountPercentage > 100) {
            return res.status(400).json({ message: 'Valid discount percentage between 0-100 is required' });
        }
        
        const product = await Product.findByPk(req.params.id);
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        // Update the product with the discount
        await product.update({
            discountPercentage: discountPercentage
        });
        
        // Calculate and update the discounted price
        const originalPrice = parseFloat(product.price);
        const discountAmount = originalPrice * (discountPercentage / 100);
        const discountedPrice = originalPrice - discountAmount;
        
        await product.update({
            discountedPrice: discountedPrice
        });
        
        res.json({
            message: `Discount of ${discountPercentage}% applied to product`,
            product: {
                id: product.id,
                name: product.name,
                originalPrice: originalPrice,
                discountPercentage: product.discountPercentage,
                discountedPrice: product.discountedPrice
            }
        });
    } catch (error) {
        console.error('Error applying discount to product:', error);
        res.status(500).json({ message: 'Error applying discount', error: error.message });
    }
});

// Get similar products
router.get('/:id/similar', async (req, res) => {
    try {
        // Find the reference product
        const product = await Product.findByPk(req.params.id);
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        // Find products in the same category but exclude current product
        let similarProducts = await Product.findAll({
            where: {
                category: product.category,
                id: { [Op.ne]: req.params.id } // Not equal to current product
            },
            limit: 8
        });
        
        // If not enough products found in the same category, get products from any category
        if (similarProducts.length < 4) {
            console.log(`Not enough similar products found in the same category, getting random products`);
            
            const additionalProducts = await Product.findAll({
                where: {
                    id: { 
                        [Op.ne]: req.params.id, // Not equal to current product
                        [Op.notIn]: similarProducts.map(p => p.id) // Not already in similar products
                    }
                },
                limit: 8 - similarProducts.length
            });
            
            similarProducts = [...similarProducts, ...additionalProducts];
        }
        
        res.json(similarProducts);
    } catch (error) {
        console.error('Error fetching similar products:', error);
        res.status(500).json({ 
            message: 'Error fetching similar products', 
            error: error.message 
        });
    }
});

// Get product reviews
router.get('/:id/reviews', async (req, res) => {
    try {
        // Check if product exists
        const product = await Product.findByPk(req.params.id);
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        // For now, return an empty array since we don't have a Review model yet
        // In the future, this would query the database for reviews related to this product
        console.log(`Fetching reviews for product ID: ${req.params.id}`);
        
        // Return empty array for now
        res.json([]);
    } catch (error) {
        console.error('Error fetching product reviews:', error);
        res.status(500).json({ 
            message: 'Error fetching product reviews', 
            error: error.message 
        });
    }
});

// Add review to a product
router.post('/:id/reviews', auth, async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        // Get user from request (set by auth middleware)
        const userId = req.user.id;
        
        // Log the review submission
        console.log(`New review submitted for product ${req.params.id} by user ${userId}`);
        console.log('Review data:', req.body);
        
        // Since we don't have a Review model yet, just acknowledge the submission
        res.status(201).json({ 
            message: 'Review submitted successfully',
            review: {
                id: 'temp-' + Date.now(),
                productId: req.params.id,
                userId: userId,
                rating: req.body.rating || 5,
                comment: req.body.comment || '',
                createdAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error adding product review:', error);
        res.status(500).json({ 
            message: 'Error adding product review', 
            error: error.message 
        });
    }
});

export default router; 