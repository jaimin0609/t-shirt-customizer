import { Product, Coupon, Order } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * Service to handle discount calculations and coupons
 */
export const discountService = {
    /**
     * Format price with currency symbol
     * @param {number} price - Price to format
     * @returns {string} Formatted price with currency symbol
     */
    formatPrice(price) {
        return `$${parseFloat(price).toFixed(2)}`;
    },

    /**
     * Calculate the discounted price based on various factors
     * @param {number} originalPrice - Original price of the product
     * @param {number} discountPercentage - Product-specific discount percentage
     * @returns {object} - The calculated price information
     */
    calculateDiscountedPrice(originalPrice, discountPercentage) {
        let finalPrice = originalPrice;
        let hasDiscount = false;
        
        // Apply product-specific discount if available
        if (discountPercentage && discountPercentage > 0) {
            finalPrice = originalPrice - (originalPrice * (discountPercentage / 100));
            hasDiscount = true;
        }
        
        // Ensure price doesn't go below zero and round to 2 decimal places
        finalPrice = Math.max(0, Math.round(finalPrice * 100) / 100);
        
        return {
            originalPrice: this.formatPrice(originalPrice),
            finalPrice: this.formatPrice(finalPrice),
            discountedPrice: finalPrice,
            hasDiscount,
            displayText: this.formatPrice(finalPrice)
        };
    },

    /**
     * Calculate discount for a cart based on a coupon
     * @param {object} cart - Cart object with items and total
     * @param {object} coupon - Coupon object with discount details
     * @returns {object} - The calculated discount information
     */
    calculateCouponDiscount(cart, coupon) {
        if (!coupon || !cart) {
            return {
                hasDiscount: false,
                discountAmount: 0,
                newTotal: cart?.total || 0
            };
        }

        let discountAmount = 0;
        
        // Check if coupon has minimum purchase requirement
        if (coupon.minimumPurchase && cart.total < coupon.minimumPurchase) {
            return {
                hasDiscount: false,
                discountAmount: 0,
                newTotal: cart.total,
                error: `Minimum purchase of ${this.formatPrice(coupon.minimumPurchase)} required`
            };
        }
        
        // Calculate discount based on type
        if (coupon.discountType === 'percentage') {
            discountAmount = (cart.total * coupon.discountValue) / 100;
        } else { // fixed_amount
            discountAmount = coupon.discountValue;
        }
        
        // Cap the discount at the cart total
        discountAmount = Math.min(discountAmount, cart.total);
        
        // Round to 2 decimal places
        discountAmount = Math.round(discountAmount * 100) / 100;
        
        const newTotal = Math.max(0, cart.total - discountAmount);
        
        return {
            hasDiscount: true,
            discountAmount,
            formattedDiscount: this.formatPrice(discountAmount),
            newTotal,
            formattedNewTotal: this.formatPrice(newTotal),
            discountType: coupon.discountType,
            discountValue: coupon.discountValue
        };
    },

    /**
     * Update a product's discounted price based on its direct discount
     * @param {number} productId - ID of the product to update
     */
    async updateProductDiscountedPrice(productId) {
        try {
            const product = await Product.findByPk(productId);
            
            if (!product) return;
            
            // Calculate the discounted price based on product discount
            const priceInfo = this.calculateDiscountedPrice(
                product.price,
                product.discountPercentage
            );
            
            // Update the product with the new discounted price
            await product.update({
                discountedPrice: priceInfo.discountedPrice
            });
            
        } catch (error) {
            console.error('Error updating product discounted price:', error);
        }
    },

    /**
     * Update discounted prices for all products or a subset of products
     * @param {Array} productIds - Optional array of product IDs to update (all if not provided)
     */
    async updateAllDiscountedPrices(productIds = null) {
        try {
            const query = productIds ? { id: { [Op.in]: productIds } } : {};
            const products = await Product.findAll({ where: query });
            
            for (const product of products) {
                await this.updateProductDiscountedPrice(product.id);
            }
            
            console.log(`Updated discounted prices for ${products.length} products`);
        } catch (error) {
            console.error('Error updating all discounted prices:', error);
        }
    },

    /**
     * Find and validate a coupon code
     * @param {string} code - The coupon code to validate
     * @param {number} cartTotal - The current cart total
     * @returns {object} - The coupon object if valid, or error details
     */
    async validateCoupon(code, cartTotal) {
        if (!code) {
            return { valid: false, message: 'Coupon code is required' };
        }

        try {
            const coupon = await Coupon.findOne({
                where: {
                    code: code.toUpperCase(),
                    isActive: true,
                    startDate: { [Op.lte]: new Date() },
                    endDate: { [Op.gte]: new Date() }
                }
            });

            if (!coupon) {
                return { valid: false, message: 'Invalid or expired coupon code' };
            }

            // Check usage limit
            if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
                return { valid: false, message: 'This coupon has reached its usage limit' };
            }

            // Check minimum purchase requirement
            if (coupon.minimumPurchase && cartTotal < coupon.minimumPurchase) {
                return { 
                    valid: false, 
                    message: `This coupon requires a minimum purchase of ${this.formatPrice(coupon.minimumPurchase)}`,
                    minimumPurchase: coupon.minimumPurchase
                };
            }

            return { valid: true, coupon };
        } catch (error) {
            console.error('Error validating coupon:', error);
            return { valid: false, message: 'Error validating coupon', error };
        }
    },

    /**
     * Apply a coupon to an order and increase its usage count
     * @param {number} couponId - ID of the coupon to apply
     * @param {number} orderId - ID of the order
     */
    async applyCouponToOrder(couponId, orderId) {
        try {
            if (!couponId || !orderId) return false;
            
            // Update the order with the coupon ID
            await Order.update({ couponId }, { where: { id: orderId } });
            
            // Increment the coupon usage count
            await Coupon.increment('usageCount', { where: { id: couponId } });
            
            return true;
        } catch (error) {
            console.error('Error applying coupon to order:', error);
            return false;
        }
    },

    // Add the missing function for applying promotions to products
    applyPromotionToProducts: async function(promotionId, productIds) {
        if (!promotionId || !productIds || !Array.isArray(productIds) || productIds.length === 0) {
            console.warn('Invalid parameters provided to applyPromotionToProducts');
            return false;
        }
        
        try {
            console.log(`Applying promotion ${promotionId} to ${productIds.length} products`);
            
            // Update all products to link them to this promotion
            await Product.update(
                { promotionId: promotionId },
                { where: { id: { [Op.in]: productIds } } }
            );
            
            // Update their discounted prices
            await this.updateAllDiscountedPrices(productIds);
            
            return true;
        } catch (error) {
            console.error('Error applying promotion to products:', error);
            return false;
        }
    }
};

// Export specific methods for easier importing
export const { 
    formatPrice, 
    calculateDiscountedPrice, 
    calculateCouponDiscount,
    validateCoupon
} = discountService; 