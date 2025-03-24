/**
 * Product Router
 * Main router for all product-related endpoints that uses the modular route structure
 */
import express from 'express';
import productRoutes from './product/index.js';

const router = express.Router();

// Forward all requests to the product routes
router.use('/', productRoutes);

export default router; 