import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { StarIcon } from '@heroicons/react/24/solid';
import { calculateProductPrice, formatPrice } from '../../services/discountService';
import './ProductCard.css';
import classNames from 'classnames';
import { useWishlist } from '../../contexts/WishlistContext';
import { useCart } from '../../contexts/CartContext';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { promotionLogger } from '../../services/promotionLogger';

/**
 * ProductCard component displays product information in a SHEIN-like style
 * @param {Object} props - Component props
 * @param {Object} props.product - Product data
 * @returns {JSX.Element} Rendered component
 */
const ProductCard = ({ product }) => {
    // Safety check for product props
    if (!product) {
        console.error('Product data is missing in ProductCard');
        return null;
    }

    // Ensure product has at least basic properties
    const safeProduct = {
        _id: product._id || product.id || 'unknown',
        name: product.name || 'Unknown Product',
        price: product.price || 0,
        imageUrl: product.imageUrl || '/placeholder.jpg',
        rating: product.rating || 0,
        reviewCount: product.reviewCount || 0,
        ...product
    };

    const [priceInfo, setPriceInfo] = useState({
        hasDiscount: false,
        originalPrice: formatPrice(safeProduct.price),
        finalPrice: formatPrice(safeProduct.price),
        discountedPrice: safeProduct.price,
        discountPercentage: 0,
        promotions: [],
        condition: null,
        promotion: null
    });

    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
    const { addToCart } = useCart();

    // Fetch price information when product changes
    useEffect(() => {
        let isMounted = true;
        console.log(`[ProductCard] Product: ${safeProduct.name}, ID: ${safeProduct._id}`);

        const componentName = 'ProductCard:' + safeProduct._id;
        promotionLogger.logProductPromotion(safeProduct, componentName);

        const fetchPriceInfo = async () => {
            try {
                console.log(`[ProductCard] Fetching price info for product ${safeProduct._id} with price ${safeProduct.price}`);
                const info = await calculateProductPrice(safeProduct._id, safeProduct.price);
                console.log('[ProductCard] Received price info:', info);

                // FORCE DISCOUNT: If the info doesn't have a discount but the product has a promotion, force the discount
                if (!info.hasDiscount && safeProduct.promotion && safeProduct.promotion.isActive) {
                    console.log(`[${componentName}] Found active promotion for product`);
                    const price = parseFloat(safeProduct.price);
                    const discountValue = safeProduct.promotion.discountValue;

                    // Only apply discount if a valid discount value exists
                    if (discountValue && discountValue > 0) {
                        const discountedPrice = price * (1 - (discountValue / 100));

                        // Create a new info object with the discount
                        const forcedInfo = {
                            ...info,
                            hasDiscount: true,
                            discountPercentage: discountValue,
                            finalPrice: formatPrice(discountedPrice),
                            discountedPrice: formatPrice(discountedPrice),
                            originalPrice: formatPrice(price),
                            discountBadge: `${discountValue}% OFF`
                        };

                        if (isMounted) {
                            console.log('[ProductCard] Setting forced price info:', forcedInfo);
                            setPriceInfo(forcedInfo);
                            promotionLogger.logPriceCalculation(forcedInfo, safeProduct, componentName);
                            return;
                        }
                    }
                }

                if (isMounted) {
                    setPriceInfo(info);
                    promotionLogger.logPriceCalculation(info, safeProduct, componentName);
                }
            } catch (error) {
                console.error(`[${componentName}] Error fetching price:`, error);
                // On error, fall back to basic price display
                if (isMounted) {
                    // FORCE DISCOUNT: Even on error, display the discount if the product has a promotion
                    if (safeProduct.promotion && safeProduct.promotion.isActive) {
                        console.log(`[${componentName}] Handling promotion after error`);
                        const price = parseFloat(safeProduct.price);
                        const discountValue = safeProduct.promotion.discountValue;

                        // Only apply discount if a valid discount value exists
                        if (discountValue && discountValue > 0) {
                            const discountedPrice = price * (1 - (discountValue / 100));

                            setPriceInfo({
                                hasDiscount: true,
                                originalPrice: formatPrice(price),
                                finalPrice: formatPrice(discountedPrice),
                                discountedPrice: formatPrice(discountedPrice),
                                discountPercentage: discountValue,
                                promotions: [`${discountValue}% OFF`],
                                condition: null,
                                promotion: safeProduct.promotion,
                                discountBadge: `${discountValue}% OFF`
                            });
                            promotionLogger.logPriceCalculation({
                                hasDiscount: true,
                                discountPercentage: discountValue,
                                finalPrice: formatPrice(discountedPrice),
                                discountedPrice: formatPrice(discountedPrice),
                                originalPrice: formatPrice(price),
                                discountBadge: `${discountValue}% OFF`
                            }, safeProduct, componentName);
                            return;
                        }
                    }

                    setPriceInfo({
                        hasDiscount: false,
                        originalPrice: formatPrice(safeProduct.price),
                        finalPrice: formatPrice(safeProduct.price),
                        discountedPrice: safeProduct.price,
                        discountPercentage: 0,
                        promotions: [],
                        condition: null,
                        promotion: null
                    });
                }
            }
        };

        fetchPriceInfo();

        // Cleanup function to prevent state updates on unmounted component
        return () => {
            isMounted = false;
        };
    }, [safeProduct._id, safeProduct.price, safeProduct.name, safeProduct.promotion]);

    /**
     * Renders star rating with review count
     * @param {number} rating - Product rating
     * @param {number} totalReviews - Number of reviews
     * @returns {JSX.Element} Star rating display
     */
    const renderStars = (rating, totalReviews) => (
        <div className="flex items-center">
            <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon
                        key={star}
                        className={`h-3 w-3 ${star <= rating ? 'text-yellow-400' : 'text-gray-200'
                            }`}
                    />
                ))}
            </div>
            <span className="ml-1 text-xs text-gray-400">
                ({safeProduct.reviewCount || 0} reviews)
            </span>
        </div>
    );

    // Check if product has discount
    const hasPromotion = priceInfo.hasDiscount ||
        (priceInfo.promotion && priceInfo.promotion.isActive) ||
        (priceInfo.discountPercentage > 0);

    // Get discount percentage for display
    const displayDiscountPercentage = priceInfo.discountPercentage > 0
        ? priceInfo.discountPercentage
        : (priceInfo.promotion?.discountValue || 0);

    console.log(`[ProductCard] ${safeProduct.name} - Has promotion: ${hasPromotion}, Discount: ${displayDiscountPercentage}%`);
    console.log(`[ProductCard] ${safeProduct.name} - Original: ${priceInfo.originalPrice}, Final: ${priceInfo.finalPrice}`);

    // Check if there's discount information
    const renderPriceInfo = () => {
        if (priceInfo.hasDiscount) {
            return (
                <>
                    <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-red-600 font-semibold">
                            {priceInfo.discountedPrice}
                        </span>
                        <span className="text-gray-500 text-sm line-through">
                            {priceInfo.originalPrice}
                        </span>
                        {priceInfo.discountBadge && (
                            <span className="text-xs bg-red-100 text-red-600 px-1 py-0.5 rounded">
                                {priceInfo.discountBadge}
                            </span>
                        )}
                    </div>
                    {priceInfo.condition && (
                        <span className="text-xs text-gray-500 block mt-1">
                            {priceInfo.condition}
                        </span>
                    )}
                </>
            );
        } else {
            return (
                <span className="text-gray-800">
                    {priceInfo.originalPrice}
                </span>
            );
        }
    };

    // A helper function to get a proper image URL
    const getImageUrl = (product) => {
        if (!product) return '/assets/placeholder-product.jpg';

        // Try different image properties
        const imagePath = product.image || product.imageUrl || product.images?.[0]?.front || product.thumbnail;

        if (!imagePath) return '/assets/placeholder-product.jpg';

        // If it's already a full URL, use it
        if (imagePath.startsWith('http')) {
            return imagePath;
        }

        // If it's a backend image path (starts with /uploads)
        if (imagePath.startsWith('/uploads')) {
            return `http://localhost:5002${imagePath}`;
        }

        // For relative paths
        if (imagePath.startsWith('/')) {
            return imagePath;
        }

        // Default case - assume it's a relative path
        return `/${imagePath}`;
    };

    // Get the proper image URL for this product
    const productImageUrl = getImageUrl(safeProduct);

    return (
        <div className="product-card">
            <Link to={`/product/${safeProduct._id}`} className="block">
                {/* Product Image */}
                <div className="product-image-container">
                    <img
                        src={productImageUrl}
                        alt={safeProduct.name}
                        className="product-image"
                        onError={(e) => {
                            console.log(`[ProductCard] Image error for ${safeProduct.name}. Using placeholder.`);
                            e.target.src = '/assets/placeholder-product.jpg';
                            e.target.onerror = null; // Prevent infinite error loop
                        }}
                        loading="lazy"
                    />

                    {/* Bestseller Badge */}
                    {safeProduct.isBestseller && (
                        <div className="bestseller-badge">
                            #{safeProduct.bestsellerRank || 1} Bestseller in {safeProduct.category || 'Products'}
                        </div>
                    )}

                    {/* Promotion Badge */}
                    {hasPromotion && (
                        <div className="promotion-badge">
                            {displayDiscountPercentage > 0
                                ? `-${displayDiscountPercentage}%`
                                : 'SALE'
                            }
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="product-info">
                    {/* Title */}
                    <h3 className="product-title">{safeProduct.name}</h3>

                    {/* Price Section */}
                    <div className="price-section">
                        {hasPromotion ? (
                            <div className="flex items-center gap-1 flex-wrap">
                                <span className="text-red-600 font-semibold">
                                    {priceInfo.discountedPrice || priceInfo.finalPrice}
                                </span>
                                <span className="text-gray-500 text-sm line-through">
                                    {priceInfo.originalPrice}
                                </span>
                                {(priceInfo.discountBadge || displayDiscountPercentage > 0) && (
                                    <span className="text-xs bg-red-100 text-red-600 px-1 py-0.5 rounded">
                                        {priceInfo.discountBadge || `-${displayDiscountPercentage}%`}
                                    </span>
                                )}
                            </div>
                        ) : (
                            <span className="text-gray-800">
                                {priceInfo.originalPrice || `$${parseFloat(safeProduct.price).toFixed(2)}`}
                            </span>
                        )}

                        {/* Condition Text (e.g., Min. order amount) */}
                        {priceInfo.condition && (
                            <div className="text-xs text-gray-500 mt-1">
                                {priceInfo.condition}
                            </div>
                        )}
                    </div>

                    {/* Promotion Tags */}
                    {priceInfo.promotions?.length > 0 && (
                        <div className="promotion-tags">
                            {/* Display promotions (limited to 2 for UI cleanliness) */}
                            {priceInfo.promotions.slice(0, 2).map((promo, index) => (
                                <div key={`promo-${index}`} className="promotion-tag">
                                    {promo}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Choices Tag */}
                    {safeProduct.variants && safeProduct.variants.length > 0 && (
                        <div className="choices-tag">
                            Choices
                        </div>
                    )}
                </div>
            </Link>
        </div>
    );
};

export default ProductCard; 