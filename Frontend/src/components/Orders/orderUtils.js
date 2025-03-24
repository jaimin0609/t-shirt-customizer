/**
 * Utility functions for orders
 */
import { API_URL } from '../../config/api';

/**
 * Get the image URL, handling both backend and frontend image paths
 * @param {string} imagePath - Image path
 * @returns {string} - Full image URL
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return '/assets/placeholder-product.jpg';

  // If it's a backend image path (starts with /uploads)
  if (imagePath.startsWith('/uploads')) {
    // Use API_URL from config
    const baseUrl = API_URL.replace(/\/api$/, ''); // Remove /api suffix if present
    return `${baseUrl}${imagePath}`;
  }

  // Otherwise, use the path as is (for frontend static images)
  return imagePath;
};

/**
 * Format a date string to locale-specific date format
 * @param {string} dateString - ISO date string
 * @param {string} locale - Locale for formatting (default: user's locale)
 * @returns {string} - Formatted date string
 */
export const formatDate = (dateString, locale = navigator.language) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

/**
 * Format price with proper currency symbol and decimal places
 * @param {number|string} price - Price to format
 * @returns {string} - Formatted price
 */
export const formatPrice = (price) => {
  if (price === undefined || price === null) return '$0.00';
  return `$${parseFloat(price).toFixed(2)}`;
};

/**
 * Format shipping address from object or string
 * @param {object|string} address - Shipping address
 * @returns {string} - Formatted address string
 */
export const formatShippingAddress = (address) => {
  if (!address) return 'No address provided';
  
  if (typeof address === 'object') {
    return `${address.street || ''}, ${address.city || ''}, ${address.state || ''} ${address.zipCode || ''}, ${address.country || ''}`.replace(/\s+/g, ' ').trim();
  }
  
  return typeof address === 'string' ? address : JSON.stringify(address);
}; 