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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define operators 
const Op = Sequelize.Op;

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../public/uploads/products');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for image upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Ensure directory exists before saving
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only image files (jpg, jpeg, png, gif) are allowed!'));
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
                } else {
                    // If no category match, return popular products (no specific where clause)
                    // Just use the default sort below
                }
            }
            
            // Sort by popularity or rating for recommendations
            const limit = parseInt(req.query.limit) || 10;
            const recommendedProducts = await Product.findAll({
                where: whereClause,
                order: [
                    ['popularity', 'DESC'],
                    ['averageRating', 'DESC'],
                    ['createdAt', 'DESC']
                ],
                limit
            });
            
            return res.json(recommendedProducts);
        }
        
        // Handle search
        if (req.query.search) {
            const searchTerm = req.query.search.trim();
            const isFuzzySearch = req.query.fuzzy === 'true';
            
            if (isFuzzySearch) {
                // Enhanced fuzzy search with improved handling for word variations
                // Create fuzzy patterns that are more effective for common word stems
                const fuzzyPattern = searchTerm.split('').join('%');
                
                // Common word stem mappings for clothing-related terms
                const stemMappings = {
                    'cloth': ['cloth', 'clothes', 'clothing', 'clothe'],
                    'shirt': ['shirt', 'tshirt', 't-shirt', 'tee'],
                    'pant': ['pant', 'pants', 'trouser', 'trousers'],
                    'jack': ['jacket', 'jackets'],
                    'hood': ['hood', 'hoodie', 'hoodies'],
                    'sweat': ['sweat', 'sweater', 'sweatshirt'],
                };
                
                // Check if the search term matches any stems
                const relatedTerms = [];
                for (const [stem, variations] of Object.entries(stemMappings)) {
                    if (searchTerm.includes(stem) || variations.some(v => v === searchTerm)) {
                        relatedTerms.push(...variations);
                    }
                }
                
                // Build a more comprehensive OR condition for the search
                whereClause[Op.or] = [
                    // Exact match gets highest priority
                    { name: { [Op.like]: `%${searchTerm}%` } },
                    { description: { [Op.like]: `%${searchTerm}%` } },
                    { category: { [Op.like]: `%${searchTerm}%` } },
                    
                    // Fuzzy match - more flexible for typos
                    { name: { [Op.like]: `%${fuzzyPattern}%` } },
                    { description: { [Op.like]: `%${fuzzyPattern}%` } },
                    
                    // Check for related terms based on stem mappings
                    ...(relatedTerms.length > 0 ? relatedTerms.map(term => ({
                        [Op.or]: [
                            { name: { [Op.like]: `%${term}%` } },
                            { description: { [Op.like]: `%${term}%` } },
                            { category: { [Op.like]: `%${term}%` } }
                        ]
                    })) : []),
                    
                    // Individual word matching for multi-word queries
                    ...searchTerm.split(' ').filter(word => word.length > 2).map(word => ({
                        [Op.or]: [
                            { name: { [Op.like]: `%${word}%` } },
                            { description: { [Op.like]: `%${word}%` } },
                            { category: { [Op.like]: `%${word}%` } }
                        ]
                    }))
                ];
            } else {
                // Standard search (without fuzzy matching)
                whereClause[Op.or] = [
                    { name: { [Op.like]: `%${searchTerm}%` } },
                    { description: { [Op.like]: `%${searchTerm}%` } },
                    { category: { [Op.like]: `%${searchTerm}%` } }
                ];
            }
        }
        
        // Handle category filter
        if (req.query.category) {
            // Handle multiple categories as an array
            const categories = Array.isArray(req.query.category) 
                ? req.query.category 
                : [req.query.category];
                
            whereClause.category = {
                [Op.in]: categories
            };
        }
        
        // Handle gender filter
        if (req.query.gender) {
            // Handle multiple genders as an array
            const genders = Array.isArray(req.query.gender) 
                ? req.query.gender 
                : [req.query.gender];
                
            whereClause.gender = {
                [Op.in]: genders
            };
        }
        
        // Handle age group filter
        if (req.query.ageGroup) {
            // Handle multiple age groups as an array
            const ageGroups = Array.isArray(req.query.ageGroup) 
                ? req.query.ageGroup 
                : [req.query.ageGroup];
                
            whereClause.ageGroup = {
                [Op.in]: ageGroups
            };
        }
        
        // Determine sort order
        let order = [['createdAt', 'DESC']]; // Default sort
        
        if (req.query.sortBy) {
            switch (req.query.sortBy) {
                case 'price-low-to-high':
                    order = [['price', 'ASC']];
                    break;
                case 'price-high-to-low':
                    order = [['price', 'DESC']];
                    break;
                case 'newest':
                    order = [['createdAt', 'DESC']];
                    break;
                // Default case uses the initial value
            }
        }
        
        console.log('Where clause:', JSON.stringify(whereClause, null, 2));
        console.log('Sort order:', JSON.stringify(order, null, 2));
        
        const products = await Product.findAll({
            order,
            where: whereClause
        });
        
        console.log('Found products count:', products.length);
        
        if (!products || products.length === 0) {
            console.log('No products found in database');
            return res.json([]);
        }
        
        res.json(products);
    } catch (error) {
        console.error('=== Error Fetching Products ===');
        console.error('Error details:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ 
            message: 'Error fetching products',
            error: error.message 
        });
    }
});

// Get single product - Move this BEFORE other routes with :id parameter
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ message: 'Error fetching product details' });
    }
});

// Create new product - Updated to handle multiple images and variants
router.post('/', auth, isAdmin, upload.array('images', 5), async (req, res) => {
    try {
        const { 
            name, description, price, category, gender, ageGroup, 
            stock, status, featured, customizationOptions, tags,
            hasVariants, colorVariantsData, sizeVariantsData
        } = req.body;

        // Validate required fields
        if (!name || !description || !price || !category || !stock) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Process uploaded images
        let images = [];
        if (req.files && req.files.length > 0) {
            images = req.files.map(file => `/uploads/${file.filename}`);
        } else {
            return res.status(400).json({ message: 'At least one image is required' });
        }

        // Create product
        const product = await Product.create({
            name,
            description,
            price: parseFloat(price),
            category,
            gender: gender || 'unisex',
            ageGroup: ageGroup || 'adult',
            stock: parseInt(stock),
            status: status || 'active',
            featured: featured === 'true',
            images,
            customizationOptions: customizationOptions ? JSON.parse(customizationOptions) : [],
            tags: tags ? JSON.parse(tags) : []
        });

        // Handle variants if they exist
        if (hasVariants === 'true' && (colorVariantsData || sizeVariantsData)) {
            try {
                // Process color variants
                if (colorVariantsData) {
                    const colorVariants = JSON.parse(colorVariantsData);
                    for (const variant of colorVariants) {
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
                }
                
                // Process size variants
                if (sizeVariantsData) {
                    const sizeVariants = JSON.parse(sizeVariantsData);
                    for (const variant of sizeVariants) {
                        await ProductVariant.create({
                            productId: product.id,
                            type: 'size',
                            size: variant.size,
                            stock: parseInt(variant.stock) || 0,
                            priceAdjustment: parseFloat(variant.priceAdjustment) || 0,
                            status: parseInt(variant.stock) > 0 ? 'active' : 'outOfStock'
                        });
                    }
                }
                
                // Update product to indicate it has variants
                await product.update({ hasVariants: true });
                
            } catch (variantError) {
                console.error('Error creating variants:', variantError);
                // Continue with product creation even if variants fail
            }
        }

        res.status(201).json({
            success: true,
            product
        });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update product
router.put('/:id', auth, isAdmin, upload.array('images', 5), async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        // Process variants if they exist (similar to create)
        const variantKeys = Object.keys(req.body).filter(key => key.match(/variants\[\d+\]/));
        const variants = [];
        
        if (variantKeys.length > 0) {
            const variantIndices = [...new Set(variantKeys.map(key => {
                const match = key.match(/variants\[(\d+)\]/);
                return match ? match[1] : null;
            }).filter(Boolean))];
            
            variantIndices.forEach(index => {
                const attribute = req.body[`variants[${index}][attribute]`];
                const value = req.body[`variants[${index}][value]`];
                const priceAdjustment = req.body[`variants[${index}][priceAdjustment]`];
                const stock = req.body[`variants[${index}][stock]`];
                
                if (attribute && value) {
                    variants.push({
                        attribute,
                        value,
                        priceAdjustment: parseFloat(priceAdjustment || 0),
                        stock: parseInt(stock || 0)
                    });
                }
            });
        }
        
        // Handle image files
        let imagePaths = [];
        
        // If new images were uploaded
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                imagePaths.push(`/uploads/products/${file.filename}`);
            });
            
            // Delete old images if they exist
            if (product.image) {
                const mainImagePath = path.join(__dirname, '../public', product.image);
                if (fs.existsSync(mainImagePath)) {
                    fs.unlinkSync(mainImagePath);
                }
            }
            
            if (product.thumbnail && product.thumbnail !== product.image) {
                const thumbnailPath = path.join(__dirname, '../public', product.thumbnail);
                if (fs.existsSync(thumbnailPath)) {
                    fs.unlinkSync(thumbnailPath);
                }
            }
            
            // Delete additional images
            if (product.imageMetadata && product.imageMetadata.additionalImages) {
                product.imageMetadata.additionalImages.forEach(imgPath => {
                    const fullPath = path.join(__dirname, '../public', imgPath);
                    if (fs.existsSync(fullPath)) {
                        fs.unlinkSync(fullPath);
                    }
                });
            }
        } else {
            // Keep existing images
            imagePaths = [product.image];
            if (product.imageMetadata && product.imageMetadata.additionalImages) {
                imagePaths = imagePaths.concat(product.imageMetadata.additionalImages);
            }
        }
        
        // Update product data
        await product.update({
            name: req.body.name,
            description: req.body.description,
            price: parseFloat(req.body.price || 0),
            category: req.body.category,
            gender: req.body.gender || product.gender || 'unisex',  // Add gender field with fallback
            ageGroup: req.body.ageGroup || product.ageGroup || 'adult',  // Add ageGroup field with fallback
            stock: parseInt(req.body.stock || 0),
            // Handle sizes and colors
            availableSizes: req.body.availableSizes ? 
                (typeof req.body.availableSizes === 'string' ? 
                    JSON.parse(req.body.availableSizes) : req.body.availableSizes) : 
                product.availableSizes || ["S", "M", "L", "XL"],
            availableColors: req.body.availableColors ? 
                (typeof req.body.availableColors === 'string' ? 
                    JSON.parse(req.body.availableColors) : req.body.availableColors) : 
                product.availableColors || ["black", "white", "gray"],
            status: req.body.status === 'active' ? 'active' : 'inactive',
            isCustomizable: req.body.isCustomizable === 'on' || req.body.isCustomizable === true,
            image: req.files?.length > 0 ? imagePaths[0] : product.image,
            thumbnail: req.files?.length > 0 ? imagePaths[0] : product.thumbnail,
            imageMetadata: {
                additionalImages: req.files?.length > 1 ? imagePaths.slice(1) : 
                    (product.imageMetadata?.additionalImages || []),
                variants: variants.length > 0 ? variants : 
                    (product.imageMetadata?.variants || [])
            }
        });
        
        const updatedProduct = await Product.findByPk(req.params.id);
        res.json(updatedProduct);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Error updating product', error: error.message });
    }
});

// Delete product
router.delete('/:id', auth, isAdmin, async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Delete main image
        if (product.image) {
            const imagePath = path.join(__dirname, '../public', product.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }
        
        // Delete thumbnail
        if (product.thumbnail && product.thumbnail !== product.image) {
            const thumbnailPath = path.join(__dirname, '../public', product.thumbnail);
            if (fs.existsSync(thumbnailPath)) {
                fs.unlinkSync(thumbnailPath);
            }
        }
        
        // Delete additional images
        if (product.imageMetadata && product.imageMetadata.additionalImages) {
            product.imageMetadata.additionalImages.forEach(imgPath => {
                const fullPath = path.join(__dirname, '../public', imgPath);
                if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                }
            });
        }

        await product.destroy();
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: 'Error deleting product' });
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