import express from 'express';
import { ProductReview, Product, User } from '../models/index.js';
import { auth } from '../middleware/auth.js';
import { sanitizeInput } from '../utils/requestUtils.js';

const router = express.Router();

// Get all reviews
router.get('/', async (req, res) => {
  try {
    const reviews = await ProductReview.findAll({
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'slug']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Error fetching reviews', error: error.message });
  }
});

// Get reviews by product ID
router.get('/product/:productId', async (req, res) => {
  try {
    const productId = req.params.productId;
    
    // Verify product exists
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Get reviews for this product
    const reviews = await ProductReview.findAll({
      where: { productId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    res.status(500).json({ 
      message: 'Error fetching product reviews', 
      error: error.message 
    });
  }
});

// Get reviews by user ID
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Only allow users to see their own reviews unless they're an admin
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Get reviews by this user
    const reviews = await ProductReview.findAll({
      where: { userId },
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'slug', 'image']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({ 
      message: 'Error fetching user reviews', 
      error: error.message 
    });
  }
});

// Get a specific review by ID
router.get('/:id', async (req, res) => {
  try {
    const reviewId = req.params.id;
    
    const review = await ProductReview.findByPk(reviewId, {
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'slug']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username']
        }
      ]
    });
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    res.json(review);
  } catch (error) {
    console.error('Error fetching review:', error);
    res.status(500).json({ message: 'Error fetching review', error: error.message });
  }
});

// Create a new review
router.post('/', auth, async (req, res) => {
  try {
    const { productId, rating, title, content } = req.body;
    const userId = req.user.id;
    
    // Validate input
    if (!productId || !rating) {
      return res.status(400).json({ message: 'Product ID and rating are required' });
    }
    
    // Verify product exists
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Check if user already reviewed this product
    const existingReview = await ProductReview.findOne({
      where: { userId, productId }
    });
    
    if (existingReview) {
      return res.status(400).json({ 
        message: 'You have already reviewed this product',
        existingReview
      });
    }
    
    // Create the review
    const review = await ProductReview.create({
      userId,
      productId,
      rating,
      title: sanitizeInput(title || ''),
      content: sanitizeInput(content || ''),
      status: 'published'
    });
    
    res.status(201).json(review);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ message: 'Error creating review', error: error.message });
  }
});

// Update a review
router.put('/:id', auth, async (req, res) => {
  try {
    const reviewId = req.params.id;
    const { rating, title, content, status } = req.body;
    
    // Find the review
    const review = await ProductReview.findByPk(reviewId);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Check if user is the author or an admin
    if (review.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Update the review
    const updatedFields = {};
    if (rating) updatedFields.rating = rating;
    if (title !== undefined) updatedFields.title = sanitizeInput(title);
    if (content !== undefined) updatedFields.content = sanitizeInput(content);
    
    // Only admins can change status
    if (req.user.role === 'admin' && status) {
      updatedFields.status = status;
    }
    
    await review.update(updatedFields);
    
    res.json({ message: 'Review updated successfully', review });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ message: 'Error updating review', error: error.message });
  }
});

// Delete a review
router.delete('/:id', auth, async (req, res) => {
  try {
    const reviewId = req.params.id;
    
    // Find the review
    const review = await ProductReview.findByPk(reviewId);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Check if user is the author or an admin
    if (review.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Delete the review
    await review.destroy();
    
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: 'Error deleting review', error: error.message });
  }
});

export default router; 