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
import { storage, uploadImage } from '../config/cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define operators 
const Op = Sequelize.Op;

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

// Configure multer to use Cloudinary storage
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only image files (jpg, jpeg, png, gif, webp) are allowed!'));
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
        console.log('==== Creating new product - Request received ====');
        
        // Log request body fields (excluding binary data)
        const logBody = { ...req.body };
        delete logBody.images; // Don't log binary data
        console.log('Request body:', JSON.stringify(logBody, null, 2));
        
        // Log files
        console.log('Received files:', req.files ? req.files.length : 0);
        if (req.files && req.files.length > 0) {
            console.log('Files info:', req.files.map(f => ({
                fieldname: f.fieldname,
                originalname: f.originalname,
                mimetype: f.mimetype,
                size: f.size,
                path: f.path,
                url: f.path // Cloudinary returns URL in path
            })));
        }
        
        // Log auth user
        console.log('User ID from auth middleware:', req.user ? req.user.id : 'Not available');
        
        const { 
            name, description, price, category, gender, ageGroup, 
            stock, status, featured, customizationOptions, tags,
            hasVariants, colorVariantsData, sizeVariantsData
        } = req.body;

        // Validate required fields
        if (!name || !description || !price || !category || !stock) {
            console.log('Missing required fields:', { name, description, price, category, stock });
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Process uploaded images
        let images = [];
        if (req.files && req.files.length > 0) {
            try {
                // With Cloudinary, the URL is already in the file.path
                images = req.files.map(file => file.path);
                console.log('Cloudinary image URLs:', images);
            } catch (imageError) {
                console.error('Error processing images:', imageError);
                return res.status(500).json({ 
                    message: 'Image processing error', 
                    error: imageError.message,
                    stack: process.env.NODE_ENV === 'development' ? imageError.stack : undefined
                });
            }
        } else {
            console.log('No images uploaded');
            return res.status(400).json({ message: 'At least one image is required' });
        }

        // Validate price and stock
        const parsedPrice = parseFloat(price);
        const parsedStock = parseInt(stock);
        
        if (isNaN(parsedPrice) || parsedPrice <= 0) {
            console.log('Invalid price:', price);
            return res.status(400).json({ message: 'Price must be a positive number' });
        }
        
        if (isNaN(parsedStock) || parsedStock < 0) {
            console.log('Invalid stock:', stock);
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
            name, description, price: parsedPrice, category,
            gender: gender || 'unisex',
            ageGroup: ageGroup || 'adult',
            stock: parsedStock,
            status: status || 'active',
            featured: featured === 'true',
            imagesCount: images.length
        });
        
        let product;
        try {
            // Process tags - handle string, array, and JSON formats
            let processedTags = [];
            if (tags) {
                try {
                    // Check if tags is already an array
                    if (Array.isArray(tags)) {
                        console.log('Tags is already an array:', tags);
                        // Process each tag in the array - it might be a comma-separated string, a JSON string, or a plain tag
                        for (const tag of tags) {
                            if (typeof tag === 'string') {
                                // If the tag looks like a JSON array string, try to parse it
                                if (tag.trim().startsWith('[') && tag.trim().endsWith(']')) {
                                    try {
                                        const parsedTags = JSON.parse(tag);
                                        if (Array.isArray(parsedTags)) {
                                            processedTags = [...processedTags, ...parsedTags];
                                            continue;
                                        }
                                    } catch (e) {
                                        // Ignore parse error and treat as comma-separated
                                    }
                                }
                                
                                // Check if it's a comma-separated list
                                if (tag.includes(',')) {
                                    const splitTags = tag.split(',').map(t => t.trim()).filter(t => t);
                                    processedTags = [...processedTags, ...splitTags];
                                } else {
                                    // Single tag
                                    processedTags.push(tag.trim());
                                }
                            } else if (tag) {
                                // Non-string tags (should be rare)
                                processedTags.push(String(tag));
                            }
                        }
                    } 
                    // Not an array, try to parse as JSON
                    else if (typeof tags === 'string') {
                        // Try to parse as JSON first
                        if (tags.trim().startsWith('[') && tags.trim().endsWith(']')) {
                            try {
                                processedTags = JSON.parse(tags);
                                console.log('Tags parsed as JSON array:', processedTags);
                            } catch (e) {
                                // If parsing fails, treat as comma-separated string
                                console.log('Tags JSON parsing failed, processing as comma-separated string');
                                processedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
                            }
                        } else {
                            // Plain comma-separated string
                            console.log('Processing tags as comma-separated string');
                            processedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
                        }
                    }
                    
                    // Final check to ensure processedTags is an array
                    if (!Array.isArray(processedTags)) {
                        console.log('Processed tags is not an array, using empty array');
                        processedTags = [];
                    }
                    
                    console.log('Final processed tags:', processedTags);
                } catch (tagError) {
                    console.error('Error processing tags:', tagError);
                    processedTags = [];
                }
            }
            
            // Process customization options
            let processedCustomOptions = [];
            if (customizationOptions) {
                try {
                    processedCustomOptions = JSON.parse(customizationOptions);
                } catch (customError) {
                    console.log('Customization options not in JSON format:', customError);
                    // Keep as empty array if parsing fails
                }
            }
            
            product = await Product.create({
                name,
                description,
                price: parsedPrice,
                category,
                gender: gender || 'unisex',
                ageGroup: ageGroup || 'adult',
                stock: parsedStock,
                status: status || 'active',
                featured: featured === 'true',
                images, // This should be stored as a JSON array in the database
                customizationOptions: processedCustomOptions,
                tags: processedTags
            });
            console.log('Product created successfully, ID:', product.id);
        } catch (productError) {
            console.error('Error creating product in database:', productError);
            // Check for specific database errors
            if (productError.name === 'SequelizeValidationError') {
                console.log('Validation error:', productError.errors.map(e => e.message));
                return res.status(400).json({ 
                    message: 'Validation error', 
                    errors: productError.errors.map(e => e.message)
                });
            }
            
            if (productError.name === 'SequelizeDatabaseError') {
                console.log('Database error type:', productError.parent ? productError.parent.code : 'Unknown');
                // Check if the error is related to the images column
                if (productError.message.includes('images')) {
                    console.log('Error related to images column, checking schema...');
                    try {
                        const tableInfo = await sequelize.getQueryInterface().describeTable('Products');
                        console.log('Products table schema:', tableInfo);
                    } catch (schemaError) {
                        console.error('Error checking schema:', schemaError);
                    }
                }
            }
            
            return res.status(500).json({ 
                message: 'Failed to create product in database', 
                error: productError.message,
                stack: process.env.NODE_ENV === 'development' ? productError.stack : undefined
            });
        }

        // Handle variants if they exist
        if (hasVariants === 'true' && (colorVariantsData || sizeVariantsData)) {
            try {
                console.log('Processing variants...');
                
                // Process color variants
                if (colorVariantsData) {
                    console.log('Processing color variants...');
                    try {
                        let colorVariants = [];
                        
                        // Check if already an array
                        if (Array.isArray(colorVariantsData)) {
                            colorVariants = colorVariantsData;
                        } else {
                            // Parse JSON string
                            colorVariants = JSON.parse(colorVariantsData);
                        }
                        
                        console.log('Parsed color variants:', colorVariants);
                        
                        if (Array.isArray(colorVariants) && colorVariants.length > 0) {
                            for (const variant of colorVariants) {
                                console.log('Creating color variant:', variant);
                                await ProductVariant.create({
                                    productId: product.id,
                                    type: 'color',
                                    color: variant.color,
                                    colorCode: variant.colorCode,
                                    stock: parseInt(variant.stock) || 0,
                                    priceAdjustment: parseFloat(variant.priceAdjustment) || 0,
                                    status: parseInt(variant.stock) > 0 ? 'active' : 'outOfStock'
                                });
                            }
                        } else {
                            console.log('No valid color variants to process');
                        }
                    } catch (colorParseError) {
                        console.error('Error parsing color variants data:', colorParseError);
                        console.error('Raw color variants data:', colorVariantsData);
                    }
                }
                
                // Process size variants
                if (sizeVariantsData) {
                    console.log('Processing size variants...');
                    try {
                        let sizeVariants = [];
                        
                        // Check if already an array
                        if (Array.isArray(sizeVariantsData)) {
                            sizeVariants = sizeVariantsData;
                        } else {
                            // Parse JSON string
                            sizeVariants = JSON.parse(sizeVariantsData);
                        }
                        
                        console.log('Parsed size variants:', sizeVariants);
                        
                        if (Array.isArray(sizeVariants) && sizeVariants.length > 0) {
                            for (const variant of sizeVariants) {
                                console.log('Creating size variant:', variant);
                                await ProductVariant.create({
                                    productId: product.id,
                                    type: 'size',
                                    size: variant.size,
                                    stock: parseInt(variant.stock) || 0,
                                    priceAdjustment: parseFloat(variant.priceAdjustment) || 0,
                                    status: parseInt(variant.stock) > 0 ? 'active' : 'outOfStock'
                                });
                            }
                        } else {
                            console.log('No valid size variants to process');
                        }
                    } catch (sizeParseError) {
                        console.error('Error parsing size variants data:', sizeParseError);
                        console.error('Raw size variants data:', sizeVariantsData);
                    }
                }
                
                // Update product to indicate it has variants
                await product.update({ hasVariants: true });
                console.log('Variants processed successfully');
                
            } catch (variantError) {
                console.error('Error creating variants:', variantError);
                // Continue with product creation even if variants fail
            }
        }

        console.log('Product creation completed successfully');
        res.status(201).json({
            success: true,
            product
        });
    } catch (error) {
        console.error('Error creating product:', error.message);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
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
                
                // Process color variants
                if (colorVariantsData) {
                    console.log('Processing color variants...');
                    try {
                        let colorVariants = [];
                        
                        // Check if already an array
                        if (Array.isArray(colorVariantsData)) {
                            colorVariants = colorVariantsData;
                        } else {
                            // Parse JSON string
                            colorVariants = JSON.parse(colorVariantsData);
                        }
                        
                        console.log('Parsed color variants:', colorVariants);
                        
                        if (Array.isArray(colorVariants) && colorVariants.length > 0) {
                            for (const variant of colorVariants) {
                                console.log('Creating color variant:', variant);
                                await ProductVariant.create({
                                    productId: updatedProduct.id,
                                    type: 'color',
                                    color: variant.color,
                                    colorCode: variant.colorCode,
                                    stock: parseInt(variant.stock) || 0,
                                    priceAdjustment: parseFloat(variant.priceAdjustment) || 0,
                                    status: parseInt(variant.stock) > 0 ? 'active' : 'outOfStock'
                                });
                            }
                        } else {
                            console.log('No valid color variants to process');
                        }
                    } catch (colorParseError) {
                        console.error('Error parsing color variants data:', colorParseError);
                        console.error('Raw color variants data:', colorVariantsData);
                    }
                }
                
                // Process size variants
                if (sizeVariantsData) {
                    console.log('Processing size variants...');
                    try {
                        let sizeVariants = [];
                        
                        // Check if already an array
                        if (Array.isArray(sizeVariantsData)) {
                            sizeVariants = sizeVariantsData;
                        } else {
                            // Parse JSON string
                            sizeVariants = JSON.parse(sizeVariantsData);
                        }
                        
                        console.log('Parsed size variants:', sizeVariants);
                        
                        if (Array.isArray(sizeVariants) && sizeVariants.length > 0) {
                            for (const variant of sizeVariants) {
                                console.log('Creating size variant:', variant);
                                await ProductVariant.create({
                                    productId: updatedProduct.id,
                                    type: 'size',
                                    size: variant.size,
                                    stock: parseInt(variant.stock) || 0,
                                    priceAdjustment: parseFloat(variant.priceAdjustment) || 0,
                                    status: parseInt(variant.stock) > 0 ? 'active' : 'outOfStock'
                                });
                            }
                        } else {
                            console.log('No valid size variants to process');
                        }
                    } catch (sizeParseError) {
                        console.error('Error parsing size variants data:', sizeParseError);
                        console.error('Raw size variants data:', sizeVariantsData);
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