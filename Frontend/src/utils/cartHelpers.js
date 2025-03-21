/**
 * Cart helper functions
 */

/**
 * Format price for display
 * @param {number} price - The price to format
 * @param {string} locale - The locale to use for formatting
 * @param {string} currency - The currency code
 * @returns {string} Formatted price
 */
export const formatPrice = (price, locale = 'en-US', currency = 'USD') => {
  if (typeof price !== 'number' || isNaN(price)) {
    return '$0.00';
  }
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
};

/**
 * Calculate subtotal from cart items
 * @param {Array} items - Cart items
 * @returns {number} Subtotal
 */
export const calculateSubtotal = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return 0;
  }
  
  return items.reduce((total, item) => {
    // Handle different item structures
    const price = item.discountedPrice || item.price;
    const quantity = item.quantity || 1;
    return total + (price * quantity);
  }, 0);
};

/**
 * Calculate shipping cost based on subtotal
 * @param {number} subtotal - Cart subtotal
 * @param {number} freeShippingThreshold - Minimum amount for free shipping
 * @param {number} shippingRate - Standard shipping rate
 * @returns {number} Shipping cost
 */
export const calculateShipping = (subtotal, freeShippingThreshold = 50, shippingRate = 5.99) => {
  return subtotal >= freeShippingThreshold ? 0 : shippingRate;
};

/**
 * Calculate tax on subtotal
 * @param {number} subtotal - Cart subtotal
 * @param {number} taxRate - Tax rate as decimal (e.g., 0.08 for 8%)
 * @returns {number} Tax amount
 */
export const calculateTax = (subtotal, taxRate = 0.08) => {
  return subtotal * taxRate;
};

/**
 * Calculate discount amount from coupon
 * @param {number} subtotal - Cart subtotal
 * @param {Object|null} coupon - Coupon object
 * @returns {number} Discount amount
 */
export const calculateDiscount = (subtotal, coupon) => {
  if (!coupon) return 0;
  
  if (coupon.type === 'percentage') {
    return (subtotal * (coupon.value / 100));
  } else if (coupon.type === 'fixed') {
    return Math.min(coupon.value, subtotal); // Don't discount more than the subtotal
  }
  
  return 0;
};

/**
 * Calculate cart total
 * @param {number} subtotal - Cart subtotal
 * @param {number} shipping - Shipping cost
 * @param {number} tax - Tax amount
 * @param {number} discount - Discount amount
 * @returns {number} Cart total
 */
export const calculateTotal = (subtotal, shipping, tax, discount) => {
  return subtotal + shipping + tax - discount;
};

/**
 * Get a standard item key from cart item
 * @param {Object} item - Cart item
 * @returns {string} Unique key
 */
export const getItemKey = (item) => {
  if (!item) return '';
  
  const id = item.id || item.productId;
  const size = item.size || '';
  const color = item.color || '';
  
  return `${id}-${size}-${color}`;
};

/**
 * Get image URL for cart item
 * @param {Object} item - Cart item
 * @param {string} fallbackUrl - URL to use if no image is found
 * @returns {string} Image URL
 */
export const getCartItemImageUrl = (item, fallbackUrl = '/images/product-placeholder.jpg') => {
  if (!item) return fallbackUrl;
  
  if (item.image) return item.image;
  
  if (item.images && Array.isArray(item.images) && item.images.length > 0) {
    return item.images[0];
  }
  
  return fallbackUrl;
}; 