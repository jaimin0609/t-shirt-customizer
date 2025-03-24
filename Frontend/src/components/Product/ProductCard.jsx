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
import productService from '../../services/productService';
import { API_URL } from '../../config/api';

/**
 * ProductCard component displays product information in a SHEIN-like style
 * @param {Object} props - Component props
 * @param {Object} props.product - Product data
 * @returns {JSX.Element} Rendered component
 */
const ProductCard = ({ product }) => {
    // Safety check for product props
    if (!product) {
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

        const componentName = 'ProductCard:' + safeProduct._id;
        promotionLogger.logProductPromotion(safeProduct, componentName);

        const fetchPriceInfo = async () => {
            try {
                const info = await calculateProductPrice(safeProduct._id, safeProduct.price);

                // FORCE DISCOUNT: If the info doesn't have a discount but the product has a promotion, force the discount
                if (!info.hasDiscount && safeProduct.promotion && safeProduct.promotion.isActive) {
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
                // On error, fall back to basic price display
                if (isMounted) {
                    // FORCE DISCOUNT: Even on error, display the discount if the product has a promotion
                    if (safeProduct.promotion && safeProduct.promotion.isActive) {
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

    /**
     * Helper function to get the proper image URL
     * This handles multiple image formats and sources
     */
    const getImageUrl = (product) => {
        if (!product) return '/assets/placeholder.png';

        console.log('ProductCard - Getting image URL for:', {
            id: product._id || product.id,
            name: product.name
        });

        // First try images array
        if (product.images && Array.isArray(product.images) && product.images.length > 0) {
            const mainImage = product.images[0];
            console.log('Using first image from images array:', mainImage);

            if (typeof mainImage === 'string') {
                // Cloudinary URL handling
                if (mainImage.includes('cloudinary.com')) {
                    console.log('Detected Cloudinary URL:', mainImage);
                    // Ensure HTTPS
                    if (mainImage.startsWith('http://')) {
                        return mainImage.replace('http://', 'https://');
                    }
                    return mainImage;
                }

                // Full URL handling
                if (mainImage.startsWith('http://') || mainImage.startsWith('https://')) {
                    console.log('Using full URL image:', mainImage);
                    return mainImage;
                }

                // Handle relative paths
                if (mainImage.startsWith('/uploads/')) {
                    console.log(`Using backend upload path: ${mainImage}`);
                    // Use the API_URL from config
                    const baseUrl = API_URL.replace(/\/api$/, ''); // Remove /api suffix if present
                    return `${baseUrl}${mainImage}`;
                }
            }

            return mainImage;
        }

        // Fallback to legacy image field
        if (product.image) {
            console.log(`Using legacy image field: ${product.image}`);
            // Apply the same URL processing logic as above
            if (typeof product.image === 'string') {
                // Cloudinary URL handling
                if (product.image.includes('cloudinary.com')) {
                    console.log('Detected Cloudinary URL in image field:', product.image);
                    // Ensure HTTPS
                    if (product.image.startsWith('http://')) {
                        return product.image.replace('http://', 'https://');
                    }
                    return product.image;
                }

                // Full URL handling
                if (product.image.startsWith('http://') || product.image.startsWith('https://')) {
                    console.log('Using full URL from image field:', product.image);
                    return product.image;
                }

                // Handle relative paths
                if (product.image.startsWith('/uploads/')) {
                    console.log(`Using backend upload path from image field: ${product.image}`);
                    // Use the API_URL from config
                    const baseUrl = API_URL.replace(/\/api$/, ''); // Remove /api suffix if present
                    return `${baseUrl}${product.image}`;
                }
            }
            return product.image;
        }

        // No image found
        console.log('No image found for product, using placeholder');
        return '/assets/placeholder.png';
    };

    // Get the proper image URL for this product
    const productImageUrl = getImageUrl(safeProduct);

    const isProduction = import.meta.env.PROD;

    // Helper function to safely log only in development
    const debugLog = (message, data) => {
        if (!isProduction) {
            console.log(message, data);
        }
    };

    // Check if we have a product ID - either id or _id
    const ensureProductLink = (product) => {
        if (!product) return '/products';
        const productId = product._id || product.id;
        if (!productId) return '/products';
        return `/products/${productId}`;
    };

    return (
        <div className="product-card">
            <Link to={ensureProductLink(safeProduct)} className="block">
                {/* Product Image */}
                <div className="product-image-container">
                    <img
                        src={productImageUrl}
                        alt={safeProduct.name}
                        className="product-image"
                        onError={(e) => {
                            console.error(`Image load error for product ${safeProduct.name}: ${productImageUrl}`);
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
                        {renderPriceInfo()}
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

            {/* Product Actions */}
            <div className="product-actions">
                {/* Quick Add to Cart */}
                <button
                    className="add-to-cart-btn"
                    onClick={() => addToCart(safeProduct, 1)}
                    aria-label="Add to Cart"
                >
                    Add to Cart
                </button>

                {/* Wishlist Toggle */}
                <button
                    className={`wishlist-btn ${isInWishlist(safeProduct._id) ? 'active' : ''}`}
                    onClick={() => {
                        if (isInWishlist(safeProduct._id)) {
                            removeFromWishlist(safeProduct._id);
                        } else {
                            addToWishlist(safeProduct);
                        }
                    }}
                    aria-label={isInWishlist(safeProduct._id) ? "Remove from Wishlist" : "Add to Wishlist"}
                >
                    {isInWishlist(safeProduct._id) ? (
                        <HeartIconSolid className="h-5 w-5" />
                    ) : (
                        <HeartIcon className="h-5 w-5" />
                    )}
                </button>
            </div>
        </div>
    );
};

export default ProductCard;