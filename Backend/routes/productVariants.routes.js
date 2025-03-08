import express from 'express';
import { Product, ProductVariant } from '../models/index.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(process.cwd(), 'public/uploads/variants');
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'variant-' + uniqueSuffix + ext);
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
        
        cb(new Error('Only image files are allowed!'));
    }
});

/**
 * @route   POST /api/product-variants
 * @desc    Create a new product variant
 * @access  Private (Admin)
 */
router.post('/', auth, upload.single('image'), async (req, res) => {
    try {
        const { productId, type, color, colorCode, size, stock, priceAdjustment } = req.body;
        
        // Validate required fields
        if (!productId || !type) {
            return res.status(400).json({ message: 'Product ID and variant type are required' });
        }
        
        // Check if product exists
        const product = await Product.findByPk(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        // Create variant data
        const variantData = {
            productId,
            type,
            stock: stock || 0,
            priceAdjustment: priceAdjustment || 0
        };
        
        // Add type-specific fields
        if (type === 'color' || type === 'color_size') {
            if (!color) {
                return res.status(400).json({ message: 'Color name is required for color variants' });
            }
            variantData.color = color;
            variantData.colorCode = colorCode || '#000000';
        }
        
        if (type === 'size' || type === 'color_size') {
            if (!size) {
                return res.status(400).json({ message: 'Size is required for size variants' });
            }
            variantData.size = size;
        }
        
        // Add image if uploaded
        if (req.file) {
            variantData.image = `/uploads/variants/${req.file.filename}`;
        }
        
        // Create the variant
        const variant = await ProductVariant.create(variantData);
        
        res.status(201).json({
            success: true,
            variant
        });
    } catch (error) {
        console.error('Error creating product variant:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/**
 * @route   GET /api/product-variants/product/:productId
 * @desc    Get all variants for a specific product
 * @access  Public
 */
router.get('/product/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        
        // Find all variants for the product
        const variants = await ProductVariant.findAll({
            where: { productId },
            order: [['type', 'ASC'], ['id', 'ASC']]
        });
        
        res.json({
            success: true,
            count: variants.length,
            variants
        });
    } catch (error) {
        console.error('Error fetching product variants:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/**
 * @route   GET /api/product-variants/:id
 * @desc    Get a specific variant by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Find the variant
        const variant = await ProductVariant.findByPk(id);
        
        if (!variant) {
            return res.status(404).json({ message: 'Variant not found' });
        }
        
        res.json({
            success: true,
            variant
        });
    } catch (error) {
        console.error('Error fetching product variant:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/**
 * @route   PUT /api/product-variants/:id
 * @desc    Update a product variant
 * @access  Private (Admin)
 */
router.put('/:id', auth, upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const { color, colorCode, size, stock, priceAdjustment, status } = req.body;
        
        // Find the variant
        const variant = await ProductVariant.findByPk(id);
        
        if (!variant) {
            return res.status(404).json({ message: 'Variant not found' });
        }
        
        // Update fields
        if (color !== undefined) variant.color = color;
        if (colorCode !== undefined) variant.colorCode = colorCode;
        if (size !== undefined) variant.size = size;
        if (stock !== undefined) variant.stock = parseInt(stock);
        if (priceAdjustment !== undefined) variant.priceAdjustment = parseFloat(priceAdjustment);
        if (status !== undefined) variant.status = status;
        
        // Update image if uploaded
        if (req.file) {
            // Delete old image if exists
            if (variant.image) {
                const oldImagePath = path.join(process.cwd(), 'public', variant.image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            
            variant.image = `/uploads/variants/${req.file.filename}`;
        }
        
        // Save changes
        await variant.save();
        
        res.json({
            success: true,
            variant
        });
    } catch (error) {
        console.error('Error updating product variant:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/**
 * @route   DELETE /api/product-variants/:id
 * @desc    Delete a product variant
 * @access  Private (Admin)
 */
router.delete('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Find the variant
        const variant = await ProductVariant.findByPk(id);
        
        if (!variant) {
            return res.status(404).json({ message: 'Variant not found' });
        }
        
        // Delete image if exists
        if (variant.image) {
            const imagePath = path.join(process.cwd(), 'public', variant.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }
        
        // Delete the variant
        await variant.destroy();
        
        res.json({
            success: true,
            message: 'Variant deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting product variant:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/**
 * @route   PUT /api/product-variants/:id/stock
 * @desc    Update a product variant's stock
 * @access  Private (Admin)
 */
router.put('/:id/stock', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { stock } = req.body;
        
        if (stock === undefined) {
            return res.status(400).json({ message: 'Stock value is required' });
        }
        
        // Find the variant
        const variant = await ProductVariant.findByPk(id);
        
        if (!variant) {
            return res.status(404).json({ message: 'Variant not found' });
        }
        
        // Update stock
        variant.stock = parseInt(stock);
        
        // Update status if needed
        if (variant.stock <= 0) {
            variant.status = 'outOfStock';
        } else if (variant.status === 'outOfStock') {
            variant.status = 'active';
        }
        
        // Save changes
        await variant.save();
        
        res.json({
            success: true,
            variant
        });
    } catch (error) {
        console.error('Error updating product variant stock:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export default router; 