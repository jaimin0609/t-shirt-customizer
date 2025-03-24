/**
 * Product Routes Index
 * Combines all product-related route modules
 */
import express from 'express';
import productRoutes from './product.routes.js';
import productVariantRoutes from './productVariant.routes.js';
import productReviewRoutes from './productReview.routes.js';
import productImageRoutes from './productImage.routes.js';
import productCategoryRoutes from './productCategory.routes.js';

const router = express.Router();

// Main product routes (CRUD operations)
router.use('/', productRoutes);

// Product variant routes
router.use('/:productId/variants', productVariantRoutes);

// Product review routes
router.use('/:productId/reviews', productReviewRoutes);

// Product image routes
router.use('/:productId/images', productImageRoutes);

// Product category routes
router.use('/categories', productCategoryRoutes);

export default router; 