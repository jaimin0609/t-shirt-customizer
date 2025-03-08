/**
 * Discount Service
 * Handles price calculations and promotions
 */

// Import API URL from config
import { API_URL } from '../config/api';

/**
 * Format price with currency symbol
 * @param {number|string} price - Price to format
 * @returns {string} Formatted price with currency symbol
 */
const formatPrice = (price) => {
    // Ensure price is a number and handle potential NaN
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice)) {
        console.warn('Invalid price provided to formatPrice:', price);
        return 'AU$0.00';
    }
    return `AU$${numericPrice.toFixed(2)}`;
};

export { formatPrice };

/**
 * Calculate the discounted price for a product based on its promotion
 * @param {number|string} price - Original price
 * @param {Object} promotion - Promotion object with discount information
 * @returns {Object} Object with discounted price information
 */
export const calculateDiscountedPrice = (price, promotion) => {
    // Convert price to number and handle invalid inputs
    const originalPrice = parseFloat(price);
    if (isNaN(originalPrice) || originalPrice <= 0) {
        return {
            originalPrice: formatPrice(0),
            finalPrice: formatPrice(0),
            discountedPrice: 0,
            hasDiscount: false
        };
    }

    // If no promotion or inactive promotion, return original price
    if (!promotion || !promotion.isActive) {
        return {
            originalPrice: formatPrice(originalPrice),
            finalPrice: formatPrice(originalPrice),
            discountedPrice: originalPrice,
            hasDiscount: false
        };
    }

    // Calculate discount based on type
    let discountedPrice = originalPrice;
    let discountBadge = '';

    if (promotion.discountType === 'percentage' && promotion.discountValue) {
        // Percentage discount
        const discountPercent = parseFloat(promotion.discountValue);
        if (!isNaN(discountPercent) && discountPercent > 0) {
            discountedPrice = originalPrice * (1 - discountPercent / 100);
            discountBadge = `${discountPercent}% OFF`;
        }
    } else if (promotion.discountType === 'fixed' && promotion.discountValue) {
        // Fixed amount discount
        const discountAmount = parseFloat(promotion.discountValue);
        if (!isNaN(discountAmount) && discountAmount > 0 && discountAmount < originalPrice) {
            discountedPrice = originalPrice - discountAmount;
            discountBadge = `AU$${discountAmount.toFixed(2)} OFF`;
        }
    }

    // Ensure price doesn't go below zero
    discountedPrice = Math.max(0, discountedPrice);

    return {
        originalPrice: formatPrice(originalPrice),
        finalPrice: formatPrice(discountedPrice),
        discountedPrice: discountedPrice,
        hasDiscount: discountedPrice < originalPrice,
        discountBadge: discountBadge,
        discountPercentage: promotion.discountType === 'percentage' ? parseFloat(promotion.discountValue) : Math.round((originalPrice - discountedPrice) / originalPrice * 100)
    };
};

/**
 * Get all active promotions
 * @returns {Promise<Array>} Array of active promotion objects
 */
export const getActivePromotions = async () => {
    try {
        const response = await fetch(`${API_URL}/promotions/active`);
        
        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching active promotions:', error);
        return [];
    }
};

/**
 * Get products that are currently on sale
 * @returns {Promise<Array>} Array of products on sale
 */
export const getProductsOnSale = async () => {
    try {
        const response = await fetch(`${API_URL}/promotions/products/on-sale`);
        
        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching products on sale:', error);
        return [];
    }
};

/**
 * Get promotions for multiple products in a single request
 * @param {Array<string>} productIds - Array of product IDs to check
 * @returns {Promise<Object>} Object mapping product IDs to their promotions
 */
export const getBatchProductPromotions = async (productIds) => {
    try {
        const response = await fetch(`${API_URL}/promotions/products/batch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ productIds })
        });
        
        if (!response.ok) {
            // If batch endpoint fails, fall back to individual requests
            const promotions = await Promise.all(
                productIds.map(async (id) => {
                    try {
                        const response = await fetch(`${API_URL}/promotions/product/${id}`);
                        if (response.ok) {
                            const data = await response.json();
                            return [id, data];
                        }
                        return [id, null];
                    } catch {
                        return [id, null];
                    }
                })
            );
            
            return Object.fromEntries(promotions);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching batch promotions:', error);
        return {};
    }
};

/**
 * Check if a specific product has an active promotion
 * @param {string} productId - ID of the product to check
 * @returns {Promise<Object|null>} Promotion object or null if no active promotion
 */
export const getProductPromotion = async (productId) => {
    if (!productId) {
        console.warn('No product ID provided to getProductPromotion');
        return null;
    }

    try {
        const response = await fetch(`${API_URL}/promotions/product/${productId}`);
        
        if (response.status === 404) {
            // Product has no promotions, this is a valid state
            return null;
        }
        
        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        return data && data.isActive ? data : null;
    } catch (error) {
        console.error(`Error checking promotion for product ${productId}:`, error);
        return null;
    }
};

/**
 * Calculate price and promotion information for a product
 * @param {string|number} productId - ID of the product
 * @param {number|string} price - Original price
 * @returns {Object} Price and promotion information
 */
export const calculateProductPrice = async (productId, price) => {
    try {
        console.log(`[discountService] Calculating price for product ${productId} at price ${price}`);
        
        // First try the API
        const apiUrl = `${API_URL}/promotions/calculate-price`;
        
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    productId,
                    price
                })
            });
            
            if (!response.ok) {
                throw new Error('Price calculation API failed');
            }
            
            const data = await response.json();
            // Ensure the response has the format we need
            if (!data.discountBadge && data.hasDiscount && data.discountPercentage) {
                data.discountBadge = `${data.discountPercentage}% OFF`;
            }
            return data;
        } catch (error) {
            console.log('[discountService] API failed, using local calculation', error);
            // No longer applying a default discount
            
            // Safe default values
            const safePrice = parseFloat(price) || 0;
            
            // Return no discount information when API fails
            return {
                hasDiscount: false,
                originalPrice: formatPrice(safePrice),
                finalPrice: formatPrice(safePrice),
                discountedPrice: null,
                discountBadge: null,
                condition: null,
                discountAmount: 0,
                discountPercentage: 0,
                promotions: []
            };
        }
    } catch (error) {
        console.error('[discountService] Failed to calculate price:', error);
        // Return a default format if all else fails
        const safePrice = parseFloat(price) || 0;
        return {
            hasDiscount: false,
            originalPrice: formatPrice(safePrice),
            finalPrice: formatPrice(safePrice),
            discountedPrice: null,
            discountBadge: null,
            condition: null,
            promotions: []
        };
    }
};

/**
 * Check if a cart qualifies for any promotions
 * @param {Array} cartItems - Array of cart items
 * @returns {Promise<Object>} Object containing applicable promotions and new cart total
 */
export const checkCartPromotions = async (cartItems) => {
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
        return {
            applicablePromotions: [],
            discountedTotal: null,
            originalTotal: null
        };
    }

    try {
        const response = await fetch(`${API_URL}/promotions/check-cart`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ items: cartItems })
        });
        
        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error checking cart promotions:', error);
        return {
            applicablePromotions: [],
            discountedTotal: null,
            originalTotal: null
        };
    }
}; 