import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { Promotion, Product } from '../models/index.js';
import { auth, isAdmin } from '../middleware/auth.js';
import { discountService } from '../services/discountService.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Configure multer for banner image upload
const uploadDir = path.join(__dirname, '../public/uploads/promotions');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'promotion-' + uniqueSuffix + path.extname(file.originalname));
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

// GET all promotions (admin only)
router.get('/', auth, isAdmin, async (req, res) => {
    try {
        const promotions = await Promotion.findAll({
            order: [
                ['priority', 'DESC'],
                ['createdAt', 'DESC']
            ]
        });
        res.json(promotions);
    } catch (error) {
        console.error('Error fetching promotions:', error);
        res.status(500).json({ message: 'Error fetching promotions', error: error.message });
    }
});

// GET active promotions (public access for storefront)
router.get('/active', async (req, res) => {
    try {
        const now = new Date();
        const activePromotions = await Promotion.findAll({
            where: {
                isActive: true,
                startDate: { [Op.lte]: now },
                endDate: { [Op.gte]: now }
            },
            order: [['priority', 'DESC']]
        });
        res.json(activePromotions);
    } catch (error) {
        console.error('Error fetching active promotions:', error);
        res.status(500).json({ message: 'Error fetching active promotions', error: error.message });
    }
});

// GET single promotion
router.get('/:id', auth, isAdmin, async (req, res) => {
    try {
        const promotion = await Promotion.findByPk(req.params.id, {
            include: [
                {
                    model: Product,
                    as: 'promotionProducts'
                }
            ]
        });
        
        if (!promotion) {
            return res.status(404).json({ message: 'Promotion not found' });
        }
        
        res.json(promotion);
    } catch (error) {
        console.error('Error fetching promotion:', error);
        res.status(500).json({ message: 'Error fetching promotion details', error: error.message });
    }
});

// POST create new promotion
router.post('/', auth, isAdmin, upload.single('bannerImage'), async (req, res) => {
    try {
        const promotionData = {
            name: req.body.name,
            description: req.body.description,
            discountType: req.body.discountType,
            discountValue: parseFloat(req.body.discountValue),
            startDate: new Date(req.body.startDate),
            endDate: new Date(req.body.endDate),
            isActive: req.body.isActive === 'true' || req.body.isActive === true,
            promotionType: req.body.promotionType,
            applicableCategories: req.body.applicableCategories ? JSON.parse(req.body.applicableCategories) : null,
            applicableProducts: req.body.applicableProducts ? JSON.parse(req.body.applicableProducts) : null,
            minimumPurchase: req.body.minimumPurchase ? parseFloat(req.body.minimumPurchase) : null,
            usageLimit: req.body.usageLimit ? parseInt(req.body.usageLimit) : null,
            highlightColor: req.body.highlightColor || null,
            priority: req.body.priority ? parseInt(req.body.priority) : 0,
            bannerImage: req.file ? `/uploads/promotions/${req.file.filename}` : null
        };
        
        const promotion = await Promotion.create(promotionData);
        
        // If this is a product-specific promotion and we have products, apply it to them
        if (promotion.promotionType === 'product_specific' && promotion.applicableProducts && promotion.applicableProducts.length > 0) {
            await discountService.applyPromotionToProducts(promotion.id, promotion.applicableProducts);
        }
        
        // If this is a category promotion, find all products in those categories and update their prices
        if (promotion.promotionType === 'category' && promotion.applicableCategories && promotion.applicableCategories.length > 0) {
            const products = await Product.findAll({
                where: {
                    category: {
                        [Op.in]: promotion.applicableCategories
                    }
                }
            });
            
            const productIds = products.map(p => p.id);
            if (productIds.length > 0) {
                await discountService.updateAllDiscountedPrices(productIds);
            }
        }
        
        // If this is a store-wide promotion, update all product prices
        if (promotion.promotionType === 'store_wide') {
            await discountService.updateAllDiscountedPrices();
        }
        
        res.status(201).json(promotion);
    } catch (error) {
        console.error('Error creating promotion:', error);
        res.status(500).json({ message: 'Error creating promotion', error: error.message });
    }
});

// PUT update promotion
router.put('/:id', auth, isAdmin, upload.single('bannerImage'), async (req, res) => {
    try {
        const promotion = await Promotion.findByPk(req.params.id);
        
        if (!promotion) {
            return res.status(404).json({ message: 'Promotion not found' });
        }
        
        const updatedData = {
            name: req.body.name,
            description: req.body.description,
            discountType: req.body.discountType,
            discountValue: parseFloat(req.body.discountValue),
            startDate: new Date(req.body.startDate),
            endDate: new Date(req.body.endDate),
            isActive: req.body.isActive === 'true' || req.body.isActive === true,
            promotionType: req.body.promotionType,
            applicableCategories: req.body.applicableCategories ? JSON.parse(req.body.applicableCategories) : null,
            applicableProducts: req.body.applicableProducts ? JSON.parse(req.body.applicableProducts) : null,
            minimumPurchase: req.body.minimumPurchase ? parseFloat(req.body.minimumPurchase) : null,
            usageLimit: req.body.usageLimit ? parseInt(req.body.usageLimit) : null,
            highlightColor: req.body.highlightColor || null,
            priority: req.body.priority ? parseInt(req.body.priority) : 0
        };
        
        // Update banner image if a new one was uploaded
        if (req.file) {
            // Delete old banner image if it exists
            if (promotion.bannerImage) {
                const oldImagePath = path.join(__dirname, '../public', promotion.bannerImage);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            
            updatedData.bannerImage = `/uploads/promotions/${req.file.filename}`;
        }
        
        await promotion.update(updatedData);
        
        // Update related products
        // This will recalculate prices for any products affected by this promotion
        if (promotion.promotionType === 'product_specific' && promotion.applicableProducts && promotion.applicableProducts.length > 0) {
            await discountService.updateAllDiscountedPrices(promotion.applicableProducts);
        } else if (promotion.promotionType === 'category' && promotion.applicableCategories && promotion.applicableCategories.length > 0) {
            const products = await Product.findAll({
                where: {
                    category: {
                        [Op.in]: promotion.applicableCategories
                    }
                }
            });
            
            const productIds = products.map(p => p.id);
            if (productIds.length > 0) {
                await discountService.updateAllDiscountedPrices(productIds);
            }
        } else if (promotion.promotionType === 'store_wide') {
            await discountService.updateAllDiscountedPrices();
        }
        
        const updatedPromotion = await Promotion.findByPk(req.params.id, {
            include: [
                {
                    model: Product,
                    as: 'promotionProducts'
                }
            ]
        });
        
        res.json(updatedPromotion);
    } catch (error) {
        console.error('Error updating promotion:', error);
        res.status(500).json({ message: 'Error updating promotion', error: error.message });
    }
});

// DELETE promotion
router.delete('/:id', auth, isAdmin, async (req, res) => {
    try {
        const promotion = await Promotion.findByPk(req.params.id, {
            include: [
                {
                    model: Product,
                    as: 'promotionProducts'
                }
            ]
        });
        
        if (!promotion) {
            return res.status(404).json({ message: 'Promotion not found' });
        }
        
        // Remove promotion connection from products and recalculate their prices
        const productIds = promotion.promotionProducts.map(p => p.id);
        
        if (productIds.length > 0) {
            await Product.update(
                { promotionId: null },
                { where: { id: { [Op.in]: productIds } } }
            );
            
            await discountService.updateAllDiscountedPrices(productIds);
        }
        
        // Delete banner image if it exists
        if (promotion.bannerImage) {
            const imagePath = path.join(__dirname, '../public', promotion.bannerImage);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }
        
        await promotion.destroy();
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting promotion:', error);
        res.status(500).json({ message: 'Error deleting promotion', error: error.message });
    }
});

// GET products on promotion
router.get('/products/on-sale', async (req, res) => {
    try {
        const productsOnSale = await Product.findAll({
            where: {
                [Op.or]: [
                    { promotionId: { [Op.not]: null } },
                    { discountPercentage: { [Op.gt]: 0 } },
                    { isOnClearance: true }
                ]
            },
            include: [{
                model: Promotion,
                as: 'promotion'
            }]
        });
        
        res.json(productsOnSale);
    } catch (error) {
        console.error('Error fetching products on sale:', error);
        res.status(500).json({ message: 'Error fetching products on sale', error: error.message });
    }
});

// GET promotion for a specific product
router.get('/product/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        
        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required' });
        }
        
        // Find the product with its promotion
        const product = await Product.findByPk(productId, {
            include: [{
                model: Promotion,
                as: 'promotion'
            }]
        });
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        // If the product doesn't have a promotion or the promotion is not active
        if (!product.promotion) {
            return res.status(404).json({ message: 'No active promotion for this product' });
        }
        
        // Return the promotion details
        res.json(product.promotion);
    } catch (error) {
        console.error(`Error fetching promotion for product ${req.params.id}:`, error);
        res.status(500).json({ message: 'Error fetching product promotion', error: error.message });
    }
});

// POST batch get promotions for multiple products
router.post('/products/batch', async (req, res) => {
    try {
        const { productIds } = req.body;
        
        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({ message: 'Product IDs array is required' });
        }
        
        // Find all products with their promotions
        const products = await Product.findAll({
            where: {
                id: { [Op.in]: productIds }
            },
            include: [{
                model: Promotion,
                as: 'promotion'
            }]
        });
        
        // Create a map of product ID to promotion
        const promotionMap = {};
        products.forEach(product => {
            promotionMap[product.id] = product.promotion;
        });
        
        res.json(promotionMap);
    } catch (error) {
        console.error('Error fetching batch product promotions:', error);
        res.status(500).json({ message: 'Error fetching batch product promotions', error: error.message });
    }
});

// POST bulk update products for clearance
router.post('/clearance', auth, isAdmin, async (req, res) => {
    try {
        const { productIds, discountPercentage } = req.body;
        
        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({ message: 'Product IDs array is required' });
        }
        
        if (!discountPercentage || discountPercentage <= 0 || discountPercentage > 100) {
            return res.status(400).json({ message: 'Valid discount percentage between 1-100 is required' });
        }
        
        // Update the products to be on clearance
        await Product.update(
            {
                isOnClearance: true,
                discountPercentage: discountPercentage
            },
            {
                where: {
                    id: { [Op.in]: productIds }
                }
            }
        );
        
        // Update discounted prices
        await discountService.updateAllDiscountedPrices(productIds);
        
        res.json({ message: `${productIds.length} products marked for clearance with ${discountPercentage}% discount` });
    } catch (error) {
        console.error('Error marking products for clearance:', error);
        res.status(500).json({ message: 'Error marking products for clearance', error: error.message });
    }
});

// Check and update promotion statuses based on dates
router.post('/check-status', auth, isAdmin, async (req, res) => {
    try {
        const result = await discountService.checkAndUpdatePromotionStatus();
        
        if (result) {
            res.json({ message: 'Promotion statuses updated successfully' });
        } else {
            res.status(500).json({ message: 'Error updating promotion statuses' });
        }
    } catch (error) {
        console.error('Error updating promotion statuses:', error);
        res.status(500).json({ message: 'Error updating promotion statuses', error: error.message });
    }
});

// Calculate price for a product
router.post('/calculate-price', async (req, res) => {
    try {
        const { productId, price } = req.body;
        
        // Get the product with its promotion
        const product = await Product.findByPk(productId, {
            include: [{
                model: Promotion,
                as: 'promotion'
            }]
        });
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        // Calculate price information
        const priceInfo = discountService.calculateDiscountedPrice(
            price,
            product.discountPercentage,
            product.promotion
        );
        
        res.json(priceInfo);
    } catch (error) {
        console.error('Error calculating price:', error);
        res.status(500).json({ message: 'Error calculating price', error: error.message });
    }
});

// Route to fix or create a store-wide promotion
router.post('/fix-store-wide', auth, isAdmin, async (req, res) => {
    try {
        console.log('Fixing store-wide promotion');
        
        // Find all store-wide promotions
        const storeWidePromotions = await Promotion.findAll({
            where: {
                promotionType: 'store_wide'
            }
        });
        
        console.log(`Found ${storeWidePromotions.length} store-wide promotions`);
        
        // If no store-wide promotions exist, create a default one
        if (storeWidePromotions.length === 0) {
            console.log('No store-wide promotions found, creating a default one');
            
            // Create a new store-wide promotion with 15% discount
            const now = new Date();
            const thirtyDaysFromNow = new Date(now);
            thirtyDaysFromNow.setDate(now.getDate() + 30);
            
            const newPromotion = await Promotion.create({
                name: 'Store-Wide Sale',
                description: '15% off everything',
                discountType: 'percentage',
                discountValue: 15,
                startDate: now,
                endDate: thirtyDaysFromNow,
                isActive: true,
                promotionType: 'store_wide',
                priority: 100,
                highlightColor: '#ff6b6b'
            });
            
            console.log('Created new store-wide promotion:', newPromotion.id);
            
            // Update all products to use this promotion
            await discountService.updateAllDiscountedPrices();
            
            return res.status(201).json({ 
                message: 'Created new store-wide promotion', 
                promotion: newPromotion 
            });
        }
        
        // If we have store-wide promotions but none are active, activate the first one
        const activePromotions = storeWidePromotions.filter(p => p.isActive);
        
        if (activePromotions.length === 0 && storeWidePromotions.length > 0) {
            console.log('No active store-wide promotions found, activating the first one');
            
            // Get the first promotion
            const promotionToActivate = storeWidePromotions[0];
            
            // Update its dates and set it to active
            const now = new Date();
            const thirtyDaysFromNow = new Date(now);
            thirtyDaysFromNow.setDate(now.getDate() + 30);
            
            await promotionToActivate.update({
                startDate: now,
                endDate: thirtyDaysFromNow,
                isActive: true
            });
            
            console.log('Activated store-wide promotion:', promotionToActivate.id);
            
            // Update all products to use this promotion
            await discountService.updateAllDiscountedPrices();
            
            return res.status(200).json({ 
                message: 'Activated existing store-wide promotion', 
                promotion: promotionToActivate 
            });
        }
        
        // If we already have active store-wide promotions, just return them
        return res.status(200).json({ 
            message: 'Store-wide promotions are already set up', 
            promotions: activePromotions 
        });
        
    } catch (error) {
        console.error('Error fixing store-wide promotion:', error);
        res.status(500).json({ 
            message: 'Error fixing store-wide promotion', 
            error: error.message 
        });
    }
});

// Public route to check and ensure store-wide promotions exist
router.get('/ensure-store-wide', async (req, res) => {
    try {
        console.log('Checking store-wide promotions');
        
        // Find all active store-wide promotions
        const now = new Date();
        const storeWidePromotions = await Promotion.findAll({
            where: {
                promotionType: 'store_wide',
                isActive: true,
                startDate: { [Op.lte]: now },
                endDate: { [Op.gte]: now }
            }
        });
        
        console.log(`Found ${storeWidePromotions.length} active store-wide promotions`);
        
        // If we have active store-wide promotions, return them
        if (storeWidePromotions.length > 0) {
            return res.status(200).json({ 
                success: true,
                message: 'Active store-wide promotions found',
                count: storeWidePromotions.length
            });
        } else {
            // No active store-wide promotions found
            return res.status(200).json({ 
                success: false,
                message: 'No active store-wide promotions found',
                count: 0
            });
        }
    } catch (error) {
        console.error('Error checking store-wide promotions:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error checking store-wide promotions', 
            error: error.message 
        });
    }
});

// Direct route to create store-wide promotion and apply to all products
router.post('/direct-fix', async (req, res) => {
    try {
        console.log('[PromotionFix] Starting direct promotion fix...');
        
        // Find all store-wide promotions
        const storeWidePromotions = await Promotion.findAll({
            where: { promotionType: 'store_wide' }
        });
        
        console.log(`[PromotionFix] Found ${storeWidePromotions.length} store-wide promotions`);
        
        let activePromotion;
        let isNew = false;
        
        // If no store-wide promotions exist, create one
        if (storeWidePromotions.length === 0) {
            console.log('[PromotionFix] Creating a new store-wide promotion...');
            
            const now = new Date();
            const thirtyDaysFromNow = new Date(now);
            thirtyDaysFromNow.setDate(now.getDate() + 30);
            
            activePromotion = await Promotion.create({
                name: 'Store-Wide Sale',
                description: '15% off everything!',
                discountType: 'percentage',
                discountValue: 15,
                startDate: now,
                endDate: thirtyDaysFromNow,
                isActive: true,
                promotionType: 'store_wide',
                priority: 100,
                highlightColor: '#ff6b6b'
            });
            
            isNew = true;
            console.log(`[PromotionFix] Created new store-wide promotion with ID: ${activePromotion.id}`);
        } else {
            // If we have store-wide promotions, use the first one and ensure it's active
            activePromotion = storeWidePromotions[0];
            
            if (!activePromotion.isActive) {
                // Update its dates and set it to active
                const now = new Date();
                const thirtyDaysFromNow = new Date(now);
                thirtyDaysFromNow.setDate(now.getDate() + 30);
                
                await activePromotion.update({
                    startDate: now,
                    endDate: thirtyDaysFromNow,
                    isActive: true
                });
                
                console.log(`[PromotionFix] Activated existing store-wide promotion: ${activePromotion.id}`);
            } else {
                console.log(`[PromotionFix] Using existing active store-wide promotion: ${activePromotion.id}`);
            }
        }
        
        // Now, apply the promotion to ALL products by directly updating the database
        console.log('[PromotionFix] Applying promotion to all products...');
        
        // Direct SQL update for better performance with many products
        const [updatedRows] = await sequelize.query(
            `UPDATE Products SET promotionId = ? WHERE deletedAt IS NULL`,
            {
                replacements: [activePromotion.id],
                type: sequelize.QueryTypes.UPDATE
            }
        );
        
        console.log(`[PromotionFix] Updated ${updatedRows} products with promotion ID: ${activePromotion.id}`);
        
        return res.status(isNew ? 201 : 200).json({
            success: true,
            message: isNew ? 'Created new store-wide promotion' : 'Updated existing store-wide promotion',
            promotionId: activePromotion.id,
            productsUpdated: updatedRows
        });
    } catch (error) {
        console.error('[PromotionFix] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fixing promotions',
            error: error.message
        });
    }
});

// Public endpoints to get store-wide promotions
router.get('/store-wide', async (req, res) => {
    try {
        console.log('[API] Fetching store-wide promotions');
        
        const now = new Date();
        // Find all active store-wide promotions
        const storeWidePromotions = await Promotion.findAll({
            where: {
                promotionType: 'store_wide',
                isActive: true,
                startDate: { [Op.lte]: now },
                endDate: { [Op.gte]: now }
            }
        });
        
        console.log(`[API] Found ${storeWidePromotions.length} active store-wide promotions`);
        
        res.json(storeWidePromotions);
    } catch (error) {
        console.error('[API] Error fetching store-wide promotions:', error);
        res.status(500).json({ 
            message: 'Error fetching store-wide promotions', 
            error: error.message 
        });
    }
});

// Super simple public API for store-wide promotions
router.get('/public-store-wide', (req, res) => {
    // Return a mock promotion without any database calls
    const mockPromotion = {
        id: 999999,
        name: "Store-Wide Sale",
        description: "15% off everything!",
        discountType: "percentage", 
        discountValue: 15,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
        promotionType: "store_wide",
        priority: 100
    };
    
    res.json([mockPromotion]);
});

export default router; 