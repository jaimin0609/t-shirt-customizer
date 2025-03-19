import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { Product, User, ProductVariant, ProductReview } from '../models/index.js';
import { optimizeProductImage } from '../middleware/imageOptimization.js';
import { sequelize } from '../models/index.js';
import { Sequelize } from 'sequelize';
import { auth, isAdmin } from '../middleware/auth.js';
import { cloudinaryStorage, localStorageConfig, cloudinaryEnabled } from '../config/cloudinary.js';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { promisify } from 'util';
import { Op } from 'sequelize';
import productService from '../services/product.service.js';
import productImageService, { formatArrayForPostgres } from '../services/productImage.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define operators - removing duplicate declaration
// const Op = Sequelize.Op; 

const router = express.Router();

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
    
    // The correct way to initialize CloudinaryStorage
    // The package expects the cloudinary object directly, not cloudinary.v2
    storage = new CloudinaryStorage({
        cloudinary: cloudinary,
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

// ======================= GET ROUTES =======================

/**
 * @route   GET /api/products
 * @desc    Get all products with pagination and filtering
 * @access  Public
 */
router.get('/', async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 12,
            search = '',
            category = '',
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            search,
            category,
            sortBy,
            sortOrder
        };

        const result = await productService.getAllProducts(options);
        res.json(result);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Error fetching products', error: error.message });
    }
});

/**
 * @route   GET /api/products/featured
 * @desc    Get featured products
 * @access  Public
 */
router.get('/featured', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 6;
        const products = await productService.getFeaturedProducts(limit);
        res.json(products);
    } catch (error) {
        console.error('Error fetching featured products:', error);
        res.status(500).json({ message: 'Error fetching featured products', error: error.message });
    }
});

/**
 * @route   GET /api/products/:id
 * @desc    Get a product by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
    try {
        const product = await productService.getProductById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        res.json(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ message: 'Error fetching product', error: error.message });
    }
});

// ======================= POST ROUTES =======================

/**
 * @route   POST /api/products
 * @desc    Create a new product
 * @access  Private (Admin only)
 */
router.post('/', 
    auth, 
    isAdmin,
    productImageService.getSingleUploadMiddleware('image'),
    async (req, res) => {
        try {
            // Process the uploaded file
            const imageUrl = productImageService.processUploadedFile(req.file);
            
            // Prepare data
            const productData = {
                ...req.body,
                image: imageUrl,
                // Handle arrays properly for different database types
                colors: formatArrayForPostgres(req.body.colors),
                sizes: formatArrayForPostgres(req.body.sizes),
                tags: formatArrayForPostgres(req.body.tags),
                additionalImages: formatArrayForPostgres(req.body.additionalImages),
            };
            
            // Create the product
            const product = await productService.createProduct(productData);
            
            res.status(201).json(product);
        } catch (error) {
            console.error('Error creating product:', error);
            res.status(500).json({ message: 'Error creating product', error: error.message });
        }
    }
);

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

        // Default categories that should always be available
        const defaultCategories = [
            'T-Shirts',
            'Hoodies',
            'Sweatshirts',
            'Tank Tops',
            'Polo Shirts',
            'Long Sleeves',
            'Caps',
            'Hats',
            'Accessories',
            'Mugs'
        ];

        // Get existing categories from database results
        const existingCategories = categories.map(item => item.category.toLowerCase());
        
        // Add any default categories that don't exist in the database
        const additionalCategories = defaultCategories.filter(
            category => !existingCategories.includes(category.toLowerCase())
        );

        // Create formatted entries for existing categories
        const formattedExistingCategories = categories.map(item => ({
            id: item.category,
            name: item.category.charAt(0).toUpperCase() + item.category.slice(1) // Capitalize first letter
        }));
        
        // Create formatted entries for additional categories
        const formattedAdditionalCategories = additionalCategories.map(category => ({
            id: category.toLowerCase(),
            name: category // Already properly cased
        }));
        
        // Combine both lists and sort alphabetically
        const allCategories = [...formattedExistingCategories, ...formattedAdditionalCategories]
            .sort((a, b) => a.name.localeCompare(b.name));
        
        console.log(`Returning ${allCategories.length} categories (${formattedExistingCategories.length} from products, ${formattedAdditionalCategories.length} defaults)`);
        
        res.json(allCategories);
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

// Get similar products
router.get('/:id/similar', async (req, res) => {
    try {
        const productId = req.params.id;
        
        // Check if productId is undefined, "undefined", or otherwise invalid
        if (!productId || productId === 'undefined' || productId === 'null') {
            console.log(`Invalid product ID provided for similar products: ${productId}`);
            return res.status(400).json({ message: 'Invalid product ID' });
        }
        
        // Find the reference product
        const product = await Product.findByPk(productId);
        
        if (!product) {
            console.log(`Product not found for similar products: ${productId}`);
            // Return empty array instead of 404 to make it more resilient
            return res.status(200).json([]);
        }
        
        // Find products in the same category but exclude current product
        let similarProducts = await Product.findAll({
            where: {
                category: product.category,
                id: { [Op.ne]: productId } // Not equal to current product
            },
            limit: 8
        });
        
        // If not enough products found in the same category, get products from any category
        if (similarProducts.length < 4) {
            console.log(`Not enough similar products found in the same category, getting random products`);
            
            const additionalProducts = await Product.findAll({
                where: {
                    id: { 
                        [Op.ne]: productId, // Not equal to current product
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
        
        // Query the ProductReview model for reviews related to this product
        const reviews = await ProductReview.findAll({
            where: { 
                productId: req.params.id,
                isApproved: true 
            },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'firstName', 'lastName']
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        
        console.log(`Fetched ${reviews.length} reviews for product ID: ${req.params.id}`);
        
        res.json(reviews);
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
        
        const { rating, comment, title } = req.body;
        
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Invalid rating. Must be between 1 and 5.' });
        }
        
        // Check if user has already reviewed this product
        const existingReview = await ProductReview.findOne({
            where: { 
                productId: req.params.id,
                userId: userId
            }
        });
        
        if (existingReview) {
            return res.status(400).json({ message: 'You have already reviewed this product.' });
        }
        
        // Create the review
        const newReview = await ProductReview.create({
            productId: req.params.id,
            userId: userId,
            rating,
            title: title || null,
            comment: comment || null,
            isVerifiedPurchase: false, // This would be set based on order history
            isApproved: true // Auto-approve for now
        });
        
        // Log the review submission
        console.log(`New review submitted for product ${req.params.id} by user ${userId}`);
        console.log('Review data:', newReview);
        
        // Return the created review
        res.status(201).json({ 
            message: 'Review submitted successfully',
            review: newReview
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