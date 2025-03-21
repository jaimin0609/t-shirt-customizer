import express from 'express';
import { Category, Product } from '../models/index.js';
import { auth, isAdmin } from '../middleware/auth.js';
import { sanitizeInput } from '../utils/requestUtils.js';

const router = express.Router();

// Get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.findAll({
      order: [['name', 'ASC']]
    });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
});

// Get category by ID
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    res.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ message: 'Error fetching category', error: error.message });
  }
});

// Get products by category ID
router.get('/:id/products', async (req, res) => {
  try {
    const categoryId = req.params.id;
    
    // Verify category exists
    const category = await Category.findByPk(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Get products in this category
    const products = await Product.findAll({
      where: { categoryId: categoryId },
      order: [['createdAt', 'DESC']]
    });
    
    res.json(products);
  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({ 
      message: 'Error fetching products by category', 
      error: error.message 
    });
  }
});

// Create new category (admin only)
router.post('/', auth, isAdmin, async (req, res) => {
  try {
    // Sanitize inputs
    const name = sanitizeInput(req.body.name);
    const description = sanitizeInput(req.body.description || '');
    
    // Check if category already exists
    const existingCategory = await Category.findOne({ 
      where: { name } 
    });
    
    if (existingCategory) {
      return res.status(400).json({ 
        message: 'Category with this name already exists' 
      });
    }
    
    // Create new category
    const category = await Category.create({
      name,
      description,
      status: req.body.status || 'active'
    });
    
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Error creating category', error: error.message });
  }
});

// Update category (admin only)
router.put('/:id', auth, isAdmin, async (req, res) => {
  try {
    const categoryId = req.params.id;
    
    // Find category
    const category = await Category.findByPk(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Sanitize inputs
    const updatedFields = {};
    if (req.body.name) updatedFields.name = sanitizeInput(req.body.name);
    if (req.body.description !== undefined) updatedFields.description = sanitizeInput(req.body.description);
    if (req.body.status) updatedFields.status = req.body.status;
    
    // Update category
    await category.update(updatedFields);
    
    res.json({ message: 'Category updated successfully', category });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: 'Error updating category', error: error.message });
  }
});

// Delete category (admin only)
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    const categoryId = req.params.id;
    
    // Find category
    const category = await Category.findByPk(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Check if category has related products
    const productsCount = await Product.count({ where: { categoryId } });
    if (productsCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete category with associated products',
        count: productsCount
      });
    }
    
    // Delete category
    await category.destroy();
    
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Error deleting category', error: error.message });
  }
});

export default router; 