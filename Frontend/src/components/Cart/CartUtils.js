/**
 * Format price display with proper currency
 * 
 * @param {number|string} price - The price to format
 * @returns {string} Formatted price string with currency symbol
 */
export const formatPrice = (price) => {
  if (price === undefined || price === null || isNaN(parseFloat(price))) {
    return '$0.00';
  }
  return `$${parseFloat(price).toFixed(2)}`;
};

/**
 * Get correct image URL based on image path
 * 
 * @param {string} imageSource - The image source path
 * @returns {string} Properly formatted image URL
 */
export const getImageUrl = (imageSource) => {
  if (!imageSource) return '/assets/placeholder-product.jpg';

  // Handle Cloudinary URLs
  if (typeof imageSource === 'string' && (
    imageSource.startsWith('http') ||
    imageSource.startsWith('data:')
  )) {
    return imageSource;
  }

  // Handle relative image paths
  if (typeof imageSource === 'string' && imageSource.startsWith('/')) {
    // For absolute paths within the app
    return imageSource;
  }

  // Handle backend paths (assuming backend URL is available)
  const backendUrl = import.meta.env.VITE_API_URL || 'https://t-shirt-customizer-backend.onrender.com/api';
  return `${backendUrl}/${imageSource.replace(/^\//, '')}`;
};

/**
 * Calculate shipping cost based on subtotal
 * 
 * @param {number} subtotal - Cart subtotal
 * @returns {number} Shipping cost
 */
export const calculateShippingCost = (subtotal) => {
  // Free shipping for orders over $50
  return subtotal >= 50 ? 0 : 5.99;
};

/**
 * Calculate tax based on subtotal
 * 
 * @param {number} subtotal - Cart subtotal
 * @param {number} taxRate - Tax rate percentage (default: 8%)
 * @returns {number} Tax amount
 */
export const calculateTaxEstimate = (subtotal, taxRate = 0.08) => {
  return subtotal * taxRate;
};

/**
 * Calculate final order total
 * 
 * @param {number} subtotal - Cart subtotal
 * @param {number} discountAmount - Discount amount
 * @param {number} shippingCost - Shipping cost
 * @param {number} taxEstimate - Tax estimate
 * @returns {number} Final order total
 */
export const calculateOrderTotal = (subtotal, discountAmount, shippingCost, taxEstimate) => {
  return (subtotal - discountAmount + shippingCost + taxEstimate) || 0;
};

/**
 * Calculate savings from free shipping and discounts
 * 
 * @param {number} shippingCost - Current shipping cost
 * @param {object} appliedCoupon - Applied coupon info
 * @param {number} discountAmount - Discount amount from coupon
 * @returns {number} Total savings amount
 */
export const calculateSavings = (shippingCost, appliedCoupon, discountAmount) => {
  // Calculate shipping savings
  const shippingSavings = shippingCost === 0 ? 5.99 : 0;

  // Calculate coupon discount (ensure it's a number)
  const couponSavings = appliedCoupon ? parseFloat(discountAmount) || 0 : 0;

  // Calculate total savings
  return shippingSavings + couponSavings;
}; 