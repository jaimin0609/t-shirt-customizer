/**
 * Product Review Routes
 * Handles operations related to product reviews
 */
import express from 'express';
import { auth } from '../../middleware/auth.js';
import { body, param, validationResult } from 'express-validator';
import { ProductReview, User } from '../../models/index.js';
import sanitizeHtml from 'sanitize-html';

const router = express.Router({ mergeParams: true });

/**
 * Validate review input
 */
const validateReview = [
  param('productId').isString().withMessage('Valid product ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('text')
    .isString()
    .trim()
    .isLength({ min: 3, max: 1000 })
    .withMessage('Review text must be between 3 and 1000 characters')
    .customSanitizer(value => sanitizeHtml(value, {
      allowedTags: ['b', 'i', 'em', 'strong'],
      allowedAttributes: {}
    }))
];

/**
 * @route   GET /api/products/:productId/reviews
 * @desc    Get all reviews for a product
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { productId } = req.params;
    
    const reviews = await ProductReview.findAll({
      where: { productId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'username']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    // Format reviews for response
    const formattedReviews = reviews.map(review => {
      const user = review.user || {};
      return {
        id: review.id,
        rating: review.rating,
        text: review.text,
        createdAt: review.createdAt,
        userId: review.userId,
        userName: user.firstName 
          ? `${user.firstName} ${user.lastName || ''}`.trim() 
          : user.username || 'Anonymous',
        isVerifiedPurchase: review.isVerifiedPurchase
      };
    });
    
    res.status(200).json(formattedReviews);
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
});

/**
 * @route   POST /api/products/:productId/reviews
 * @desc    Create a new product review
 * @access  Private
 */
router.post('/', auth, validateReview, async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { productId } = req.params;
    const { rating, text } = req.body;
    const userId = req.user.id;
    
    // Check if user already reviewed this product
    const existingReview = await ProductReview.findOne({
      where: { productId, userId }
    });
    
    if (existingReview) {
      return res.status(400).json({ 
        message: 'You have already reviewed this product. Please edit your existing review instead.' 
      });
    }
    
    // Create the review
    const review = await ProductReview.create({
      productId,
      userId,
      rating,
      text,
      isVerifiedPurchase: false // To be updated based on order history
    });
    
    // Format the review for response
    const user = await User.findByPk(userId, {
      attributes: ['id', 'firstName', 'lastName', 'username']
    });
    
    const formattedReview = {
      id: review.id,
      rating: review.rating,
      text: review.text,
      createdAt: review.createdAt,
      userId: review.userId,
      userName: user.firstName 
        ? `${user.firstName} ${user.lastName || ''}`.trim() 
        : user.username || 'Anonymous',
      isVerifiedPurchase: review.isVerifiedPurchase
    };
    
    res.status(201).json(formattedReview);
  } catch (error) {
    console.error('Error creating product review:', error);
    res.status(500).json({ message: 'Failed to create review' });
  }
});

/**
 * @route   PUT /api/products/:productId/reviews/:reviewId
 * @desc    Update a product review
 * @access  Private
 */
router.put('/:reviewId', auth, validateReview, async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { productId, reviewId } = req.params;
    const { rating, text } = req.body;
    const userId = req.user.id;
    
    // Find the review
    const review = await ProductReview.findOne({
      where: { id: reviewId, productId }
    });
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Check if user owns the review
    if (review.userId !== userId) {
      return res.status(403).json({ message: 'You can only edit your own reviews' });
    }
    
    // Update the review
    await review.update({ rating, text });
    
    // Format the review for response
    const user = await User.findByPk(userId, {
      attributes: ['id', 'firstName', 'lastName', 'username']
    });
    
    const formattedReview = {
      id: review.id,
      rating: review.rating,
      text: review.text,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      userId: review.userId,
      userName: user.firstName 
        ? `${user.firstName} ${user.lastName || ''}`.trim() 
        : user.username || 'Anonymous',
      isVerifiedPurchase: review.isVerifiedPurchase
    };
    
    res.status(200).json(formattedReview);
  } catch (error) {
    console.error('Error updating product review:', error);
    res.status(500).json({ message: 'Failed to update review' });
  }
});

/**
 * @route   DELETE /api/products/:productId/reviews/:reviewId
 * @desc    Delete a product review
 * @access  Private
 */
router.delete('/:reviewId', auth, async (req, res) => {
  try {
    const { productId, reviewId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    // Find the review
    const review = await ProductReview.findOne({
      where: { id: reviewId, productId }
    });
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Check if user owns the review or is admin
    if (review.userId !== userId && !isAdmin) {
      return res.status(403).json({ message: 'You can only delete your own reviews' });
    }
    
    // Delete the review
    await review.destroy();
    
    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting product review:', error);
    res.status(500).json({ message: 'Failed to delete review' });
  }
});

export default router; 