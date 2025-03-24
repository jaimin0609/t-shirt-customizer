/**
 * Product Service
 * Handles all product-related API requests with consistent data processing
 */
import apiClient from './apiClient';
import { notifyError } from './errorHandler';

// Constants
const ENDPOINTS = {
  ALL: '/products',
  FEATURED: '/products/featured',
  DETAIL: (id) => `/products/${id}`,
  REVIEWS: (id) => `/products/${id}/reviews`,
  CATEGORIES: '/categories',
  SEARCH: '/products/search',
  SIMILAR: (id) => `/products/${id}/similar`,
  VARIANTS: (id) => `/products/${id}/variants`
};

// Fallback image for products without images
const FALLBACK_IMAGE = '/images/product-placeholder.jpg';

/**
 * Process a single product to normalize data structure
 * @param {Object} product - Raw product data from API
 * @returns {Object} Normalized product object
 */
const normalizeProduct = (product) => {
  if (!product) return null;
  
  // Create a normalized product object with consistent properties
  return {
    // Ensure ID is available in all formats
    id: product.id || product._id,
    _id: product._id || product.id,
    
    // Basic product info
    name: product.name || 'Unnamed Product',
    description: product.description || '',
    price: typeof product.price === 'string' ? parseFloat(product.price) : (product.price || 0),
    
    // Handle different image structures
    images: Array.isArray(product.images) ? product.images : 
            (product.image ? [product.image] : [FALLBACK_IMAGE]),
    
    // Ensure image property exists for backward compatibility
    image: Array.isArray(product.images) && product.images.length > 0 ? 
            product.images[0] : (product.image || FALLBACK_IMAGE),
            
    // Inventory data
    stock: product.stock ?? product.stockCount ?? 0,
    stockCount: product.stockCount ?? product.stock ?? 0,
    
    // Additional properties
    category: product.category || null,
    variants: Array.isArray(product.variants) ? product.variants : [],
    ratings: {
      average: product.averageRating || product.rating || 0,
      count: product.ratingCount || 0
    },
    
    // Pass through any other properties
    ...product
  };
};

/**
 * Normalize an array of products
 * @param {Array} products - Array of product objects
 * @returns {Array} Normalized products array
 */
const normalizeProducts = (products) => {
  if (!Array.isArray(products)) return [];
  return products.map(normalizeProduct).filter(Boolean);
};

/**
 * Process review data for consistency
 * @param {Object} review - Review data
 * @returns {Object} Normalized review
 */
const normalizeReview = (review) => {
  if (!review) return null;
  
  return {
    id: review.id || review._id,
    userName: review.userName || review.user?.name || 'Anonymous',
    rating: review.rating || 0,
    text: review.text || review.comment || '',
    createdAt: review.createdAt || new Date().toISOString(),
    // Preserve original data
    ...review
  };
};

/**
 * Get full image URL based on image path
 * @param {string} imagePath - Relative or absolute image path
 * @returns {string} Full image URL
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return FALLBACK_IMAGE;
  
  // If already a full URL, return as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // If path starts with slash, append to API URL
  if (imagePath.startsWith('/')) {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';
    return `${baseUrl}${imagePath}`;
  }
  
  // Otherwise assume it's a relative path to uploads
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';
  return `${baseUrl}/uploads/${imagePath}`;
};

/**
 * Product service with methods for product-related operations
 */
const productService = {
  /**
   * Get all products with optional filtering
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} Products array
   */
  async getAllProducts(params = {}) {
    try {
      const data = await apiClient.get(ENDPOINTS.ALL, params);
      return normalizeProducts(data.products || data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      throw error;
    }
  },
  
  /**
   * Get featured products
   * @param {number} limit - Maximum number of products to return
   * @returns {Promise<Array>} Featured products
   */
  async getFeaturedProducts(limit = 8) {
    try {
      const data = await apiClient.get(ENDPOINTS.FEATURED, { limit });
      return normalizeProducts(data.products || data);
    } catch (error) {
      console.error('Failed to fetch featured products:', error);
      // Return empty array instead of throwing to avoid breaking the UI
      return [];
    }
  },
  
  /**
   * Get a single product by ID
   * @param {string} productId - Product ID
   * @returns {Promise<Object>} Product data
   */
  async getProductById(productId) {
    if (!productId) {
      throw new Error('Product ID is required');
    }
    
    try {
      const data = await apiClient.get(ENDPOINTS.DETAIL(productId));
      return normalizeProduct(data.product || data);
    } catch (error) {
      console.error(`Failed to fetch product ${productId}:`, error);
      throw error;
    }
  },
  
  /**
   * Search for products
   * @param {string} query - Search term
   * @param {Object} filters - Search filters
   * @returns {Promise<Array>} Search results
   */
  async searchProducts(query, filters = {}) {
    try {
      const data = await apiClient.get(ENDPOINTS.SEARCH, {
        q: query,
        ...filters
      });
      return {
        products: normalizeProducts(data.products || data),
        total: data.total || (Array.isArray(data) ? data.length : 0),
        page: data.page || 1,
        pages: data.pages || 1
      };
    } catch (error) {
      console.error('Product search failed:', error);
      return { products: [], total: 0, page: 1, pages: 1 };
    }
  },
  
  /**
   * Get similar products to a given product
   * @param {string} productId - Product ID
   * @param {number} limit - Maximum number of similar products
   * @returns {Promise<Array>} Similar products
   */
  async getSimilarProducts(productId, limit = 4) {
    if (!productId) return [];
    
    try {
      const data = await apiClient.get(ENDPOINTS.SIMILAR(productId), { limit });
      return normalizeProducts(data.products || data);
    } catch (error) {
      console.error(`Failed to fetch similar products for ${productId}:`, error);
      return [];
    }
  },
  
  /**
   * Get product variants
   * @param {string} productId - Product ID
   * @returns {Promise<Array>} Product variants
   */
  async getProductVariants(productId) {
    if (!productId) return [];
    
    try {
      const data = await apiClient.get(ENDPOINTS.VARIANTS(productId));
      return data.variants || [];
    } catch (error) {
      console.error(`Failed to fetch variants for ${productId}:`, error);
      return [];
    }
  },
  
  /**
   * Get product reviews
   * @param {string} productId - Product ID
   * @returns {Promise<Array>} Product reviews
   */
  async getProductReviews(productId) {
    if (!productId) return [];
    
    try {
      const data = await apiClient.get(ENDPOINTS.REVIEWS(productId));
      const reviews = data.reviews || data;
      return Array.isArray(reviews) ? reviews.map(normalizeReview) : [];
    } catch (error) {
      console.error(`Failed to fetch reviews for ${productId}:`, error);
      return [];
    }
  },
  
  /**
   * Submit a product review
   * @param {Object} reviewData - Review data
   * @returns {Promise<Object>} Created review
   */
  async submitProductReview(reviewData) {
    if (!reviewData.productId) {
      throw new Error('Product ID is required for submitting a review');
    }
    
    try {
      const data = await apiClient.post(
        ENDPOINTS.REVIEWS(reviewData.productId), 
        reviewData
      );
      return normalizeReview(data.review || data);
    } catch (error) {
      console.error('Failed to submit review:', error);
      throw error;
    }
  },
  
  /**
   * Get product categories
   * @returns {Promise<Array>} Categories
   */
  async getCategories() {
    try {
      const data = await apiClient.get(ENDPOINTS.CATEGORIES);
      return data.categories || data;
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      return [];
    }
  },
  
  /**
   * Get products by category
   * @param {string} categoryId - Category ID
   * @param {Object} params - Additional query params
   * @returns {Promise<Array>} Products in category
   */
  async getProductsByCategory(categoryId, params = {}) {
    try {
      const data = await apiClient.get(ENDPOINTS.ALL, {
        category: categoryId,
        ...params
      });
      return normalizeProducts(data.products || data);
    } catch (error) {
      console.error(`Failed to fetch products in category ${categoryId}:`, error);
      return [];
    }
  }
};

export { getImageUrl };
export default productService; 