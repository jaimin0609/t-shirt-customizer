/**
 * Product Routes
 * Handles core CRUD operations for products
 */
import express from 'express';
import { auth, isAdmin } from '../../middleware/auth.js';
import { Product, ProductVariant } from '../../models/index.js';
import { Sequelize } from 'sequelize';
import { Op } from 'sequelize';
import productService from '../../services/product.service.js';

const router = express.Router();

/**
 * @route   GET /api/products
 * @desc    Get all products with filtering, sorting and pagination
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sort = 'createdAt', 
      order = 'DESC',
      category,
      minPrice,
      maxPrice,
      search,
      inStock
    } = req.query;

    // Parse pagination params
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    // Build filter conditions
    const whereConditions = {};
    
    // Category filter
    if (category) {
      whereConditions.categoryId = category;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      whereConditions.price = {};
      if (minPrice) whereConditions.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) whereConditions.price[Op.lte] = parseFloat(maxPrice);
    }

    // Stock filter
    if (inStock === 'true') {
      whereConditions.stock = { [Op.gt]: 0 };
    }

    // Search filter
    if (search) {
      whereConditions[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` }},
        { description: { [Op.iLike]: `%${search}%` }}
      ];
    }

    // Execute query with filters and pagination
    const { products, total } = await productService.findProducts({
      whereConditions,
      limit: limitNum,
      offset,
      sort,
      order
    });

    // Return paginated response
    res.status(200).json({
      products,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      total
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

/**
 * @route   GET /api/products/:id
 * @desc    Get single product by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productService.findProductById(id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Failed to fetch product' });
  }
});

/**
 * @route   POST /api/products
 * @desc    Create a new product
 * @access  Admin
 */
router.post('/', auth, isAdmin, async (req, res) => {
  try {
    const { 
      name, 
      description, 
      price, 
      stock, 
      categoryId, 
      images = [],
      variants = []
    } = req.body;

    // Validate required fields
    if (!name || !price) {
      return res.status(400).json({ message: 'Name and price are required' });
    }

    // Create product
    const product = await productService.createProduct({
      name,
      description,
      price: parseFloat(price),
      stock: parseInt(stock, 10) || 0,
      categoryId,
      images
    });

    // Create variants if provided
    if (variants && variants.length > 0) {
      await productService.addProductVariants(product.id, variants);
    }

    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Failed to create product' });
  }
});

/**
 * @route   PUT /api/products/:id
 * @desc    Update a product
 * @access  Admin
 */
router.put('/:id', auth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      description, 
      price, 
      stock, 
      categoryId, 
      images,
      isActive
    } = req.body;

    // Check if product exists
    const product = await productService.findProductById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Update product
    const updatedProduct = await productService.updateProduct(id, {
      name,
      description,
      price: price ? parseFloat(price) : undefined,
      stock: stock !== undefined ? parseInt(stock, 10) : undefined,
      categoryId,
      images,
      isActive
    });

    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Failed to update product' });
  }
});

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete a product
 * @access  Admin
 */
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if product exists
    const product = await productService.findProductById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Delete product
    await productService.deleteProduct(id);
    
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Failed to delete product' });
  }
});

/**
 * @route   GET /api/products/featured
 * @desc    Get featured products
 * @access  Public
 */
router.get('/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 8;
    const featuredProducts = await productService.getFeaturedProducts(limit);
    
    res.status(200).json(featuredProducts);
  } catch (error) {
    console.error('Error fetching featured products:', error);
    res.status(500).json({ message: 'Failed to fetch featured products' });
  }
});

/**
 * @route   GET /api/products/search
 * @desc    Search products
 * @access  Public
 */
router.get('/search', async (req, res) => {
  try {
    const { 
      q = '', 
      page = 1, 
      limit = 10, 
      category,
      minPrice,
      maxPrice
    } = req.query;
    
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    
    const searchResults = await productService.searchProducts({
      query: q,
      page: pageNum,
      limit: limitNum,
      categoryId: category,
      minPrice,
      maxPrice
    });
    
    res.status(200).json(searchResults);
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ message: 'Failed to search products' });
  }
});

export default router; 