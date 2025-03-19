/**
 * Utility service to help debug promotion issues by logging detailed information
 * about products, promotions, and discount calculations
 */

export const promotionLogger = {
  /**
   * Log detailed information about a product and its promotion
   * @param {Object} product - The product object
   * @param {String} source - The source component/function name
   */
  logProductPromotion: (product, source = 'unknown') => {
    if (!product) {
      console.log(`[${source}] Product is undefined or null`);
      return;
    }

    console.group(`[${source}] Product Promotion Info`);
    console.log('Product ID:', product.id);
    console.log('Product Name:', product.name);
    console.log('Product Price:', product.price);
    
    if (product.promotion) {
      console.log('Has Promotion:', true);
      console.log('Promotion ID:', product.promotion.id);
      console.log('Promotion Type:', product.promotion.promotionType);
      console.log('Discount Value:', product.promotion.discountValue);
      console.log('Promotion Active:', product.promotion.active);
      console.log('Promotion Start:', product.promotion.startDate);
      console.log('Promotion End:', product.promotion.endDate);
    } else {
      console.log('Has Promotion:', false);
      console.log('Promotion ID:', product.promotionId || 'None');
    }
    console.groupEnd();
  },

  /**
   * Log detailed information about price calculations
   * @param {Object} priceInfo - The price information object
   * @param {Object} product - The product object
   * @param {String} source - The source component/function name
   */
  logPriceCalculation: (priceInfo, product, source = 'unknown') => {
    console.group(`[${source}] Price Calculation`);
    console.log('Original Price:', priceInfo.originalPrice);
    console.log('Final Price:', priceInfo.finalPrice);
    console.log('Has Discount:', priceInfo.hasDiscount);
    
    if (priceInfo.hasDiscount) {
      console.log('Discounted Price:', priceInfo.discountedPrice);
      console.log('Discount Percentage:', priceInfo.discountPercentage);
      console.log('Discount Badge:', priceInfo.discountBadge);
    }
    
    if (product && product.promotion) {
      console.log('Expected Discount:', product.promotion.discountValue + '%');
      console.log('Expected Price:', (product.price * (1 - product.promotion.discountValue/100)).toFixed(2));
    }
    console.groupEnd();
  },

  /**
   * Log product view for analytics
   * @param {String} productId - The product ID that was viewed
   * @param {String} userId - The user ID who viewed the product (optional)
   */
  logProductView: (productId, userId = null) => {
    console.log('[Analytics] Product View:', {
      productId,
      userId,
      timestamp: new Date().toISOString()
    });
    
    // In a real application, this would send analytics data to a server
    // For now, we just log it to the console
  },

  /**
   * Log add to cart action for analytics
   * @param {String} productId - The product ID added to cart
   * @param {String} size - Selected size
   * @param {String} color - Selected color
   * @param {Number} quantity - Quantity added
   */
  logAddToCart: (productId, size, color, quantity) => {
    console.log('[Analytics] Add to Cart:', {
      productId,
      size,
      color,
      quantity,
      timestamp: new Date().toISOString()
    });
    
    // In a real application, this would send analytics data to a server
    // For now, we just log it to the console
  }
}; 