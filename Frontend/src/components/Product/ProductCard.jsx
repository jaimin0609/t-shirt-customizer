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

    // A helper function to get a proper image URL
    const getImageUrl = (product) => {
        if (!product) return '/assets/placeholder-product.jpg';

        let imagePath = null;

        // For debugging
        console.log('Product image data:', {
            hasImages: !!product.images,
            imagesType: typeof product.images,
            image: product.image,
            imageUrl: product.imageUrl
        });

        // Check for images array first (our newest format)
        if (product.images && Array.isArray(product.images) && product.images.length > 0) {
            // Use the first image from the array
            imagePath = product.images[0];
            console.log('Using first image from images array:', imagePath);
        }
        // Then look for legacy image fields
        else if (product.image) {
            imagePath = product.image;
            console.log('Using legacy image field:', imagePath);
        }
        // Then check for other possible image fields
        else if (product.imageUrl) {
            imagePath = product.imageUrl;
            console.log('Using imageUrl field:', imagePath);
        }
        else if (product.images && product.images.front) {
            imagePath = product.images.front;
            console.log('Using images.front field:', imagePath);
        }
        else if (product.thumbnail) {
            imagePath = product.thumbnail;
            console.log('Using thumbnail field:', imagePath);
        }

        // If no image found, use placeholder
        if (!imagePath) {
            console.log('No image path found, using placeholder');
            return '/assets/placeholder-product.jpg';
        }

        // Try to parse if it's a JSON string
        if (typeof imagePath === 'string' && (imagePath.startsWith('[') || imagePath.startsWith('{'))) {
            try {
                const parsed = JSON.parse(imagePath);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    imagePath = parsed[0];
                    console.log('Parsed JSON array, using first item:', imagePath);
                } else if (parsed && typeof parsed === 'object') {
                    imagePath = parsed.url || parsed.secure_url || parsed;
                    console.log('Parsed JSON object, using url property:', imagePath);
                }
            } catch (e) {
                console.log('Failed to parse image path as JSON, using as-is');
            }
        }

        // If after parsing it's an object with URL properties, extract the URL
        if (typeof imagePath === 'object' && imagePath !== null) {
            imagePath = imagePath.secure_url || imagePath.url || imagePath.path || imagePath;
            console.log('Extracted URL from object:', imagePath);
        }

        // Ensure we have a string at this point
        if (typeof imagePath !== 'string') {
            console.log('Image path is not a string after processing, using placeholder');
            return '/assets/placeholder-product.jpg';
        }

        // If it contains 'cloudinary.com', process it as a Cloudinary URL
        if (imagePath.includes('cloudinary.com') || imagePath.includes('res.cloudinary.com')) {
            console.log('Using Cloudinary URL:', imagePath);
            return imagePath;
        }

        // If it's already a full URL, use it
        if (imagePath.startsWith('http')) {
            console.log('Using full URL:', imagePath);
            return imagePath;
        }

        // If it's a backend image path (starts with /uploads)
        if (imagePath.startsWith('/uploads')) {
            // For backend image paths, try to use the full URL if we have a backend URL defined
            const apiUrl = import.meta.env.VITE_API_URL || '';
            if (apiUrl && !apiUrl.endsWith('/api')) {
                const baseUrl = apiUrl.replace(/\/api$/, '');
                console.log(`Converting uploads path to full URL: ${baseUrl}${imagePath}`);
                return `${baseUrl}${imagePath}`;
            }
            console.log('Using uploads path as-is:', imagePath);
            return imagePath;
        }

        // For relative paths
        if (imagePath.startsWith('/')) {
            console.log('Using relative path with leading slash:', imagePath);
            return imagePath;
        }

        // Default case - assume it's a relative path without leading slash
        console.log('Using relative path without leading slash:', imagePath);
        return `/${imagePath}`;
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

    return (
        <div className="product-card">
            <Link to={`/product/${safeProduct._id || safeProduct.id}`} className="block">
                {/* Product Image */}
                <div className="product-image-container">
                    <img
                        src={productImageUrl}
                        alt={safeProduct.name}
                        className="product-image"
                        onError={(e) => {
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