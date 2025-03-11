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
import { storage, uploadImage, getCloudinaryUrl, cloudinaryEnabled } from '../config/cloudinary.js';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { promisify } from 'util';
import { Op } from 'sequelize';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define operators - removing duplicate declaration
// const Op = Sequelize.Op; 

const router = express.Router();

// Add a proper formatForDB helper at the top of the file
const formatForDB = (value) => {
    if (process.env.DATABASE_URL) { // PostgreSQL needs proper JSON strings
        if (value === null || value === undefined) {
            return JSON.stringify([]);
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

// Configure multer to use Cloudinary storage
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB size limit
    fileFilter: (req, file, cb) => {
        // Accept image files only
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Test endpoint for Cloudinary uploads
router.post('/test-cloudinary', auth, isAdmin, upload.single('image'), async (req, res) => {
    try {
        console.log('=== Testing Cloudinary Upload ===');
        console.log('Cloudinary config:', {
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY ? '***' : 'not set',
            api_secret: process.env.CLOUDINARY_API_SECRET ? '***' : 'not set'
        });
        
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'No image file provided' 
            });
        }
        
        console.log('File received:', {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: req.file.path // This should be the Cloudinary URL if upload succeeded
        });
        
        // Check if the file was uploaded to Cloudinary
        if (req.file.path && req.file.path.includes('cloudinary.com')) {
            console.log('✅ Image successfully uploaded to Cloudinary');
            return res.status(200).json({
                success: true,
                message: 'Image uploaded to Cloudinary successfully',
                imageUrl: req.file.path
            });
        } else {
            console.log('❌ Image not uploaded to Cloudinary');
            return res.status(500).json({
                success: false,
                message: 'Image was not uploaded to Cloudinary',
                localPath: req.file.path
            });
        }
    } catch (error) {
        console.error('Error testing Cloudinary upload:', error);
        return res.status(500).json({
            success: false,
            message: 'Error testing Cloudinary upload',
            error: error.message
        });
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
            if ((!productData.images || productData.images.length === 0) && productData.image) {
                productData.images = [productData.image];
            }
            
            // Ensure images is always at least an empty array
            if (!productData.images) {
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

// Get single product - Move this BEFORE other routes with :id parameter
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

// Create new product - Updated to handle multiple images and variants
router.post('/', auth, isAdmin, upload.array('images', 5), async (req, res) => {
    try {
        console.log('Creating new product...');
        // Log request body (excluding binary data)
        const logBody = { ...req.body };
        delete logBody.images;
        console.log('Request body:', JSON.stringify(logBody, null, 2));
        console.log('Files received:', req.files ? req.files.length : 0);
        
        if (req.files && req.files.length > 0) {
            console.log('File details:', req.files.map(f => ({
                fieldname: f.fieldname,
                originalname: f.originalname,
                mimetype: f.mimetype,
                size: f.size,
                path: f.path || 'no path'
            })));
        }

        // Validate required fields
        if (!req.body.name || !req.body.description || !req.body.price || !req.body.category) {
            return res.status(400).json({ message: 'Name, description, price and category are required' });
        }

        // Process uploaded images
        let imageUrls = [];
        if (req.files && req.files.length > 0) {
            try {
                // Check if using Cloudinary or local storage
                if (cloudinaryEnabled) {
                    // With Cloudinary, the secure URL is in file.path
                    imageUrls = req.files.map(file => file.path);
                    console.log('Cloudinary image URLs:', imageUrls);
                } else {
                    // For local storage, construct the URL from the filename
                    imageUrls = req.files.map(file => {
                        const filename = file.filename || path.basename(file.path);
                        return `/uploads/products/${filename}`;
                    });
                    console.log('Local image URLs:', imageUrls);
                }
            } catch (error) {
                console.error('Error processing uploaded images:', error);
                return res.status(500).json({ message: 'Error processing images', error: error.message });
            }
        }

        // Ensure we have at least one image
        if (imageUrls.length === 0) {
            // Use a default placeholder image
            const placeholderUrl = getCloudinaryUrl();
            imageUrls = [placeholderUrl];
            console.log('No images uploaded, using placeholder:', placeholderUrl);
        }

        // Validate price and stock
        const parsedPrice = parseFloat(req.body.price);
        const parsedStock = parseInt(req.body.stock);
        
        if (isNaN(parsedPrice) || parsedPrice <= 0) {
            console.log('Invalid price:', req.body.price);
            return res.status(400).json({ message: 'Price must be a positive number' });
        }
        
        if (isNaN(parsedStock) || parsedStock < 0) {
            console.log('Invalid stock:', req.body.stock);
            return res.status(400).json({ message: 'Stock must be a non-negative integer' });
        }

        // Log database connection status
        try {
            await sequelize.authenticate();
            console.log('Database connection is OK before creating product');
        } catch (dbError) {
            console.error('Database connection error:', dbError);
            return res.status(500).json({ message: 'Database connection error', error: dbError.message });
        }

        // Create product with detailed error handling
        console.log('Creating product in database with fields:', {
            name: req.body.name,
            description: req.body.description,
            price: parsedPrice,
            category: req.body.category,
            gender: req.body.gender || 'unisex',
            ageGroup: req.body.ageGroup || 'adult',
            stock: parsedStock,
            status: req.body.status || 'active',
            featured: req.body.featured === 'true',
            imagesCount: imageUrls.length
        });
        
        // Process tags - simplified approach for reliability
        let processedTags = [];
        if (req.body.tags) {
            try {
                // Handle string format (most common from form submissions)
                if (typeof req.body.tags === 'string') {
                    // Split by comma and clean up
                    processedTags = req.body.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
                    console.log('Processed tags from string:', processedTags);
                } 
                // Handle array format
                else if (Array.isArray(req.body.tags)) {
                    processedTags = req.body.tags.map(tag => tag.trim()).filter(tag => tag);
                    console.log('Processed tags from array:', processedTags);
                }
            } catch (tagError) {
                console.error('Error processing tags:', tagError);
                // Use empty array if there's an error
                processedTags = [];
            }
        }
        
        // Process customization options - simplified
        let processedCustomOptions = [];
        if (req.body.customizationOptions) {
            try {
                if (typeof req.body.customizationOptions === 'string') {
                    processedCustomOptions = JSON.parse(req.body.customizationOptions);
                } else if (Array.isArray(req.body.customizationOptions)) {
                    processedCustomOptions = req.body.customizationOptions;
                }
            } catch (error) {
                console.error('Error processing customization options:', error);
            }
        }
            
        // Prepare product data with proper PostgreSQL JSON formatting
        const productData = {
            name: req.body.name,
            description: req.body.description,
            price: parsedPrice,
            category: req.body.category,
            gender: req.body.gender || 'unisex',
            ageGroup: req.body.ageGroup || 'adult',
            stock: parsedStock,
            status: req.body.status || 'active',
            featured: req.body.featured === 'true',
            // Use the formatForDB helper to ensure proper JSON formatting
            images: formatForDB(imageUrls),
            customizationOptions: formatForDB(processedCustomOptions),
            tags: formatForDB(processedTags)
        };
        
        // Add a single image field for backward compatibility
        if (imageUrls.length > 0) {
            productData.image = imageUrls[0];
        }
        
        console.log('Attempting to create product in database now...');
        let product;
        try {
            product = await Product.create(productData);
            console.log('Product created successfully, ID:', product.id);
            
            // Process variants with better error handling
            if (req.body.hasVariants === 'true') {
                try {
                    console.log('Processing variants...');
                    
                    // Process color variants
                    if (req.body.colorVariantsData) {
                        try {
                            let colorVariants;
                            
                            // Parse safely
                            if (typeof req.body.colorVariantsData === 'string') {
                                try {
                                    colorVariants = JSON.parse(req.body.colorVariantsData);
                                } catch (e) {
                                    console.error('Error parsing color variants JSON:', e);
                                    colorVariants = [];
                                }
                            } else if (Array.isArray(req.body.colorVariantsData)) {
                                colorVariants = req.body.colorVariantsData;
                            } else {
                                colorVariants = [];
                            }
                            
                            // Create each variant with individual error handling
                            for (const variant of colorVariants) {
                                if (!variant) continue;
                                
                                try {
                                    await ProductVariant.create({
                                        productId: product.id,
                                        type: 'color',
                                        color: variant.color || 'Unknown',
                                        colorCode: variant.colorCode || '#000000',
                                        stock: parseInt(variant.stock) || 0,
                                        priceAdjustment: parseFloat(variant.priceAdjustment) || 0,
                                        status: parseInt(variant.stock) > 0 ? 'active' : 'outOfStock'
                                    });
                                } catch (variantError) {
                                    console.error('Error creating color variant:', variantError);
                                    // Continue to next variant
                                }
                            }
                        } catch (error) {
                            console.error('Error processing color variants:', error);
                        }
                    }
                    
                    // Process size variants - similar pattern
                    if (req.body.sizeVariantsData) {
                        try {
                            let sizeVariants;
                            
                            // Parse safely
                            if (typeof req.body.sizeVariantsData === 'string') {
                                try {
                                    sizeVariants = JSON.parse(req.body.sizeVariantsData);
                                } catch (e) {
                                    console.error('Error parsing size variants JSON:', e);
                                    sizeVariants = [];
                                }
                            } else if (Array.isArray(req.body.sizeVariantsData)) {
                                sizeVariants = req.body.sizeVariantsData;
                            } else {
                                sizeVariants = [];
                            }
                            
                            // Create each variant with individual error handling
                            for (const variant of sizeVariants) {
                                if (!variant) continue;
                                
                                try {
                                    await ProductVariant.create({
                                        productId: product.id,
                                        type: 'size',
                                        size: variant.size || 'Unknown',
                                        stock: parseInt(variant.stock) || 0,
                                        priceAdjustment: parseFloat(variant.priceAdjustment) || 0,
                                        status: parseInt(variant.stock) > 0 ? 'active' : 'outOfStock'
                                    });
                                } catch (variantError) {
                                    console.error('Error creating size variant:', variantError);
                                    // Continue to next variant
                                }
                            }
                        } catch (error) {
                            console.error('Error processing size variants:', error);
                        }
                    }
                    
                    // Update product to indicate it has variants
                    await product.update({ hasVariants: true });
                    
                } catch (variantError) {
                    console.error('Overall error in variant processing:', variantError);
                    // Continue with product creation even if variants fail
                }
            }
            
            // Always return a response
            console.log('Product creation completed successfully');
            return res.status(201).json({
                success: true,
                product
            });
        } catch (productError) {
            console.error('Error creating product in database:', productError);
            console.error('Error name:', productError.name);
            console.error('Error message:', productError.message);
            
            return res.status(500).json({ 
                message: 'Failed to create product in database', 
                error: productError.message
            });
        }
    } catch (error) {
        console.error('Error creating product:', error.message);
        console.error('Error stack:', error.stack);
        return res.status(500).json({ 
            message: 'Server error', 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
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
        
        const product = await Product.findByPk(req.params.id);
        
        if (!product) {
            console.log(`Product with ID ${req.params.id} not found`);
            return res.status(404).json({ message: 'Product not found' });
        }

        // First, check if product has variants
        if (product.hasVariants) {
            console.log(`Product has variants. Deleting variants first...`);
            
            try {
                // Delete all related product variants first
                const deletedVariants = await ProductVariant.destroy({
                    where: { productId: product.id }
                });
                
                console.log(`Successfully deleted ${deletedVariants} product variants`);
            } catch (variantError) {
                console.error('Error deleting product variants:', variantError);
                return res.status(500).json({ 
                    message: 'Error deleting product variants',
                    error: variantError.message
                });
            }
        }

        // Now proceed with image deletion
        console.log('Deleting product images...');
        
        // Handle the 'images' array field
        if (product.images && Array.isArray(product.images)) {
            console.log(`Processing ${product.images.length} images from images array`);
            for (const imgPath of product.images) {
                if (typeof imgPath === 'string') {
                    const fullPath = path.join(__dirname, '../public', imgPath);
                    console.log(`Checking image at: ${fullPath}`);
                    if (fs.existsSync(fullPath)) {
                        console.log(`Deleting image: ${fullPath}`);
                        fs.unlinkSync(fullPath);
                    } else {
                        console.log(`Image not found at: ${fullPath}`);
                    }
                }
            }
        }

        // Delete main image (legacy field)
        if (product.image) {
            const imagePath = path.join(__dirname, '../public', product.image);
            console.log(`Checking main image at: ${imagePath}`);
            if (fs.existsSync(imagePath)) {
                console.log(`Deleting main image: ${imagePath}`);
                fs.unlinkSync(imagePath);
            } else {
                console.log(`Main image not found at: ${imagePath}`);
            }
        }
        
        // Delete thumbnail
        if (product.thumbnail && product.thumbnail !== product.image) {
            const thumbnailPath = path.join(__dirname, '../public', product.thumbnail);
            console.log(`Checking thumbnail at: ${thumbnailPath}`);
            if (fs.existsSync(thumbnailPath)) {
                console.log(`Deleting thumbnail: ${thumbnailPath}`);
                fs.unlinkSync(thumbnailPath);
            } else {
                console.log(`Thumbnail not found at: ${thumbnailPath}`);
            }
        }
        
        // Delete additional images from metadata
        if (product.imageMetadata && product.imageMetadata.additionalImages) {
            console.log(`Processing additional images from metadata`);
            product.imageMetadata.additionalImages.forEach(imgPath => {
                const fullPath = path.join(__dirname, '../public', imgPath);
                console.log(`Checking additional image at: ${fullPath}`);
                if (fs.existsSync(fullPath)) {
                    console.log(`Deleting additional image: ${fullPath}`);
                    fs.unlinkSync(fullPath);
                } else {
                    console.log(`Additional image not found at: ${fullPath}`);
                }
            });
        }

        // Finally delete the product
        console.log(`Deleting product with ID: ${product.id}`);
        await product.destroy();
        console.log(`Product successfully deleted`);
        
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting product:', error);
        
        // Provide more detailed error information
        let errorMessage = 'Error deleting product';
        
        // Check for foreign key constraint error
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            errorMessage = 'Cannot delete product because it is referenced by other records in the database';
            
            // Check which tables still reference this product
            if (error.table) {
                errorMessage += ` (in table: ${error.table})`;
            }
        }
        
        res.status(500).json({ 
            message: errorMessage,
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
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