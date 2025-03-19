import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useAuth } from '../contexts/AuthContext';
import { productService } from '../services/productService';
import { calculateProductPrice, formatPrice } from '../services/discountService';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { StarIcon } from '@heroicons/react/24/solid';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { promotionLogger } from '../services/promotionLogger';

// CSS for product description content
const productDescriptionStyles = `
.product-description {
    font-size: 16px;
    line-height: 1.6;
    color: #4a5568;
}

.product-description p {
    margin-bottom: 1rem;
}

.product-description ul, 
.product-description ol {
    margin-left: 1.5rem;
    margin-bottom: 1rem;
}

.product-description ul li {
    list-style-type: disc;
}

.product-description ol li {
    list-style-type: decimal;
}

.product-description a {
    color: #3182ce;
    text-decoration: underline;
}

.product-description strong,
.product-description b {
    font-weight: 600;
}

.product-description em,
.product-description i {
    font-style: italic;
}
`;

const ProductDetailPage = () => {
    const params = useParams();
    // Get productId from either of the route parameter formats
    const productId = params.productId || params.id;

    const navigate = useNavigate();
    const { user } = useAuth();
    const { addToCart } = useCart();
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedSize, setSelectedSize] = useState(null);
    const [selectedColor, setSelectedColor] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [similarProducts, setSimilarProducts] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [priceInfo, setPriceInfo] = useState(null);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [reviewForm, setReviewForm] = useState({
        rating: 5,
        comment: ''
    });

    useEffect(() => {
        const fetchProductDetails = async () => {
            try {
                // Validate product ID and add more debugging
                console.log('ProductDetailPage - Fetching product with ID:', productId, 'from URL params:', params);

                if (!productId || productId === 'undefined' || productId === 'null') {
                    console.error('Invalid product ID from URL parameters:', params);
                    setError('Invalid product ID. Please try a different product.');
                    setLoading(false);
                    return;
                }

                setLoading(true);
                setError(null);

                // Fetch product details
                const productData = await productService.getProductById(productId);
                console.log('ProductDetailPage - Fetched product data:', productData);
                setProduct(productData);

                // Calculate price information
                const priceData = await calculateProductPrice(productId, productData.price);
                setPriceInfo(priceData);

                // Set default selected color and size if available
                if (productData.availableColors && productData.availableColors.length > 0) {
                    setSelectedColor(productData.availableColors[0]);
                }
                if (productData.availableSizes && productData.availableSizes.length > 0) {
                    setSelectedSize(productData.availableSizes[0]);
                }

                // Fetch similar products
                const similar = await productService.getSimilarProducts(productId);
                setSimilarProducts(similar);

                // Fetch reviews
                const reviewData = await productService.getProductReviews(productId);
                setReviews(reviewData);

                setLoading(false);

                // Log product view for analytics
                if (productData) {
                    try {
                        // Check if the logger exists and has the correct function
                        if (promotionLogger && typeof promotionLogger.logProductView === 'function') {
                            promotionLogger.logProductView(productData.id, user?.id);
                        } else {
                            console.log('Product view tracked (analytics logger not available):', productData.id);
                        }
                    } catch (logError) {
                        console.error('Error logging product view (non-critical):', logError);
                        // Don't rethrow - this is a non-critical analytics function
                    }
                }
            } catch (err) {
                console.error('Error fetching product details:', err);
                setError('Failed to load product details. Please try again later.');
                setLoading(false);
            }
        };

        fetchProductDetails();
    }, [productId, user]);

    // Fetch price info when product data changes
    useEffect(() => {
        if (product && product.price) {
            const fetchPriceInfo = async () => {
                try {
                    const info = await calculateProductPrice(product.id, product.price);
                    console.log('[ProductDetailPage] Price info from API:', info);

                    // FORCE DISCOUNT: If the info doesn't have a discount but the product has a promotion, force the discount
                    if (!info.hasDiscount && product.promotion && product.promotion.isActive) {
                        console.log('[ProductDetailPage] Forcing discount display for product with promotion');
                        const price = parseFloat(product.price);
                        const discountValue = product.promotion.discountValue || 15;
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

                        console.log('[ProductDetailPage] Setting forced price info:', forcedInfo);
                        setPriceInfo(forcedInfo);
                        return;
                    }

                    setPriceInfo(info);
                } catch (error) {
                    console.error('Error fetching price info:', error);

                    // FORCE DISCOUNT: Even on error, display the discount if the product has a promotion
                    if (product.promotion && product.promotion.isActive) {
                        console.log('[ProductDetailPage] Forcing discount display after error');
                        const price = parseFloat(product.price);
                        const discountValue = product.promotion.discountValue || 15;
                        const discountedPrice = price * (1 - (discountValue / 100));

                        setPriceInfo({
                            hasDiscount: true,
                            originalPrice: formatPrice(price),
                            finalPrice: formatPrice(discountedPrice),
                            discountedPrice: formatPrice(discountedPrice),
                            discountPercentage: discountValue,
                            promotions: [`${discountValue}% OFF`],
                            condition: null,
                            promotion: product.promotion,
                            discountBadge: `${discountValue}% OFF`
                        });
                    } else {
                        // Fallback to no discount if no promotion is available
                        setPriceInfo({
                            hasDiscount: false,
                            originalPrice: formatPrice(product.price),
                            finalPrice: formatPrice(product.price),
                            discountedPrice: null,
                            discountBadge: null,
                            condition: null
                        });
                    }
                }
            };

            fetchPriceInfo();
        }
    }, [product]);

    const handleAddToCart = () => {
        if (!selectedSize) {
            alert('Please select a size');
            return;
        }

        // Only require color selection if colors are available
        if (product.availableColors && product.availableColors.length > 0 && !selectedColor) {
            alert('Please select a color');
            return;
        }

        const productToAdd = {
            productId: product._id,
            name: product.name,
            price: product.price,
            image: getImageUrl(product),
            size: selectedSize,
            color: selectedColor || 'default', // Use 'default' if no color is selected
            quantity: quantity
        };

        addToCart(productToAdd);
        alert('Product added to cart!');
    };

    const toggleWishlist = () => {
        if (!user) {
            alert('Please log in to add items to wishlist');
            return;
        }

        if (isInWishlist(product._id)) {
            removeFromWishlist(product._id);
        } else {
            const productToAdd = {
                productId: product._id,
                name: product.name,
                price: product.price,
                image: getImageUrl(product)
            };
            addToWishlist(productToAdd);
        }
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            alert('Please log in to submit a review');
            return;
        }

        try {
            await productService.addProductReview(productId, {
                userId: user._id,
                userName: user.name,
                rating: reviewForm.rating,
                comment: reviewForm.comment
            });

            // Refresh reviews
            const updatedReviews = await productService.getProductReviews(productId);
            setReviews(updatedReviews);

            // Reset form
            setReviewForm({
                rating: 5,
                comment: ''
            });

            alert('Review submitted successfully!');
        } catch (err) {
            console.error('Failed to submit review:', err);
            alert('Failed to submit review. Please try again later.');
        }
    };

    // A helper function to get a proper image URL
    const getImageUrl = (product) => {
        if (!product) return '/assets/placeholder-product.jpg';

        // Log available image fields for debugging
        console.log('Product image data:', {
            id: product.id,
            name: product.name,
            image: product.image,
            imageUrl: product.imageUrl,
            imagesArray: product.images,
            thumbnail: product.thumbnail
        });

        let imagePath = null;

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
            console.log('No image found, using placeholder');
            return '/assets/placeholder-product.jpg';
        }

        // If it's a Cloudinary URL, use it as is
        if (imagePath.includes('cloudinary.com')) {
            console.log('Using Cloudinary URL:', imagePath);
            return imagePath;
        }

        // If it's already a full URL, use it
        if (imagePath.startsWith('http')) {
            console.log('Using full URL image:', imagePath);
            return imagePath;
        }

        // If it's a backend image path (starts with /uploads)
        if (imagePath.startsWith('/uploads')) {
            // Don't try to load from backend - use placeholder instead
            console.log('Backend image path detected, using placeholder');
            return '/assets/placeholder-product.jpg';
        }

        // For relative paths
        if (imagePath.startsWith('/')) {
            console.log('Using relative path with leading slash:', imagePath);
            return imagePath;
        }

        // Default case - assume it's a relative path without leading slash
        console.log('Using relative path without leading slash:', `/${imagePath}`);
        return `/${imagePath}`;
    };

    // Get the proper image URL for this product
    const productImageUrl = product ? getImageUrl(product) : '/assets/placeholder-product.jpg';
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);

    const handleImageLoad = () => {
        setImageLoaded(true);
    };

    const handleImageError = () => {
        console.log(`[ProductDetailPage] Image error for ${product?.name}. Using placeholder.`);
        setImageError(true);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" label="Loading product details..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4" role="alert">
                    <p className="text-red-700">{error}</p>
                </div>
                <button
                    onClick={() => navigate(-1)}
                    className="bg-primary-500 text-white py-2 px-4 rounded hover:bg-primary-600 transition-colors"
                    aria-label="Go back to previous page"
                >
                    Go Back
                </button>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4" role="alert">
                    <p className="text-yellow-700">Product not found.</p>
                </div>
                <Link
                    to="/products"
                    className="bg-primary-500 text-white py-2 px-4 rounded hover:bg-primary-600 transition-colors"
                    aria-label="Browse all products"
                >
                    Browse Products
                </Link>
            </div>
        );
    }

    // Render main image with thumbnails
    const renderProductImages = () => {
        if (!product.images || product.images.length === 0) {
            return (
                <div className="bg-gray-200 rounded-lg flex items-center justify-center h-[400px]" aria-label="No product image available">
                    <p className="text-gray-500">No image available</p>
                </div>
            );
        }

        return (
            <div className="product-images">
                <div className="main-image mb-4 bg-white rounded-lg overflow-hidden shadow-sm">
                    <img
                        src={product.images[activeImageIndex]}
                        alt={`${product.name} - ${activeImageIndex + 1}`}
                        className="w-full h-[400px] object-contain"
                        loading="eager" // Load main image immediately
                    />
                </div>

                {product.images.length > 1 && (
                    <div className="thumbnails flex space-x-2 overflow-x-auto pb-2">
                        {product.images.map((image, index) => (
                            <button
                                key={index}
                                onClick={() => setActiveImageIndex(index)}
                                className={`rounded-md overflow-hidden border-2 ${index === activeImageIndex
                                    ? 'border-primary-500'
                                    : 'border-transparent'
                                    }`}
                                aria-label={`View product image ${index + 1}`}
                                aria-current={index === activeImageIndex ? 'true' : 'false'}
                            >
                                <img
                                    src={image}
                                    alt={`${product.name} thumbnail ${index + 1}`}
                                    className="w-16 h-16 object-cover"
                                    loading="lazy" // Lazy load thumbnails
                                />
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    // Calculate average rating
    const averageRating = reviews.length
        ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
        : 0;

    return (
        <div className="container mx-auto py-8 px-4">
            {/* Breadcrumbs for navigation */}
            <nav className="mb-4" aria-label="Breadcrumb">
                <ol className="flex flex-wrap text-sm text-gray-500">
                    <li>
                        <Link to="/" className="hover:text-primary-600">Home</Link>
                        <span className="mx-2">/</span>
                    </li>
                    <li>
                        <Link to="/products" className="hover:text-primary-600">Products</Link>
                        <span className="mx-2">/</span>
                    </li>
                    {product.category && (
                        <li>
                            <Link
                                to={`/products?category=${encodeURIComponent(product.category)}`}
                                className="hover:text-primary-600"
                            >
                                {product.category}
                            </Link>
                            <span className="mx-2">/</span>
                        </li>
                    )}
                    <li className="text-gray-700 font-medium" aria-current="page">
                        {product.name}
                    </li>
                </ol>
            </nav>

            {/* Product content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left column: Product images */}
                <div className="product-image-section">
                    {renderProductImages()}
                </div>

                {/* Right column: Product info */}
                <div className="product-info-section">
                    {/* Product header */}
                    <div className="mb-4">
                        <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>

                        {/* Product rating */}
                        <div className="flex items-center mt-2">
                            <div className="flex text-yellow-400">
                                {Array.from({ length: 5 }).map((_, index) => (
                                    <StarIcon
                                        key={index}
                                        className={`h-5 w-5 ${index < Math.round(averageRating)
                                            ? 'text-yellow-400'
                                            : 'text-gray-300'
                                            }`}
                                        aria-hidden="true"
                                    />
                                ))}
                            </div>
                            <span className="ml-2 text-gray-600">
                                {averageRating.toFixed(1)} out of 5 ({reviews.length} reviews)
                            </span>
                        </div>
                    </div>

                    {/* Product price */}
                    <div className="price-section mb-6">
                        {priceInfo?.discountPercentage ? (
                            <div className="flex items-baseline">
                                <p className="text-2xl font-bold text-gray-900 mr-2">
                                    {formatPrice(priceInfo.finalPrice)}
                                </p>
                                <p className="text-lg text-gray-500 line-through">
                                    {formatPrice(product.price)}
                                </p>
                                <span className="ml-2 bg-red-100 text-red-800 px-2 py-1 rounded-md text-sm font-medium">
                                    {priceInfo.discountPercentage}% OFF
                                </span>
                            </div>
                        ) : (
                            <p className="text-2xl font-bold text-gray-900">
                                {formatPrice(product.price)}
                            </p>
                        )}

                        {/* Enhanced stock status with restock information */}
                        {product.stockCount > 0 ? (
                            <p className="mt-1 text-green-600 font-medium">
                                {product.stockCount > 10
                                    ? 'In Stock'
                                    : `Only ${product.stockCount} left in stock - order soon`}
                            </p>
                        ) : (
                            <div className="mt-2">
                                <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-2">
                                    <p className="text-red-700 font-medium">Currently Out of Stock</p>
                                    {product.restockDate && (
                                        <p className="text-sm text-gray-700">Expected restock: {new Date(product.restockDate).toLocaleDateString()}</p>
                                    )}
                                </div>
                                <button
                                    className="flex items-center text-primary-600 hover:text-primary-800 mt-2"
                                    onClick={() => window.alert('You will be notified when this product is back in stock!')}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                                    </svg>
                                    Notify Me When Available
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Color selector */}
                    {product.availableColors && product.availableColors.length > 0 && (
                        <div className="color-section mb-6">
                            <h2 className="text-sm font-medium text-gray-900 mb-2">Color</h2>
                            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Select a color">
                                {product.availableColors.map((color) => (
                                    <button
                                        key={color}
                                        onClick={() => product.stockCount > 0 && setSelectedColor(color)}
                                        className={`
                                            w-10 h-10 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2
                                            ${product.stockCount === 0 ? 'opacity-50 cursor-not-allowed' : ''}
                                            ${selectedColor === color ? 'ring-2 ring-offset-2 ring-primary-500' : ''}
                                        `}
                                        style={{ backgroundColor: color.toLowerCase() }}
                                        aria-label={`Color: ${color}`}
                                        aria-pressed={selectedColor === color}
                                        disabled={product.stockCount === 0}
                                        type="button"
                                    />
                                ))}
                            </div>
                            {product.stockCount === 0 && (
                                <p className="text-sm text-gray-500 mt-1">Color selection unavailable — item currently out of stock</p>
                            )}
                        </div>
                    )}

                    {/* Size selector with improved out-of-stock handling */}
                    {product.availableSizes && product.availableSizes.length > 0 && (
                        <div className="size-section mb-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-medium text-gray-900">Size</h2>
                                <button
                                    className="text-sm text-primary-600 hover:text-primary-500"
                                    onClick={() => window.alert('Size guide will be displayed here')}
                                    aria-label="View size guide"
                                >
                                    Size guide
                                </button>
                            </div>
                            <div
                                className="grid grid-cols-4 gap-2 mt-2 sm:grid-cols-6"
                                role="radiogroup"
                                aria-label="Select a size"
                            >
                                {product.availableSizes.map((size) => {
                                    const outOfStock = product.stockCount === 0;
                                    return (
                                        <button
                                            key={size}
                                            onClick={() => !outOfStock && setSelectedSize(size)}
                                            className={`
                                                border rounded-md py-2 px-3 flex items-center justify-center text-sm
                                                font-medium uppercase focus:outline-none 
                                                ${outOfStock
                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                                                    : selectedSize === size
                                                        ? 'bg-primary-500 text-white border-transparent focus:ring-2 focus:ring-primary-500'
                                                        : 'bg-white text-gray-900 border-gray-200 hover:bg-gray-50 focus:ring-2 focus:ring-primary-500'
                                                }
                                            `}
                                            aria-label={outOfStock ? `Size ${size} - Out of stock` : `Size: ${size}`}
                                            aria-pressed={selectedSize === size}
                                            disabled={outOfStock}
                                            type="button"
                                        >
                                            {size}
                                        </button>
                                    );
                                })}
                            </div>
                            {product.stockCount === 0 && (
                                <p className="text-sm text-gray-500 mt-1">Size selection unavailable — item currently out of stock</p>
                            )}
                        </div>
                    )}

                    {/* Quantity selector - disabled when out of stock */}
                    <div className="quantity-section mb-6">
                        <h2 className="text-sm font-medium text-gray-900 mb-2">Quantity</h2>
                        <div className={`flex items-center border rounded-md w-32 ${product.stockCount === 0 ? 'border-gray-200 bg-gray-100' : 'border-gray-300'}`}>
                            <button
                                type="button"
                                className={`px-3 py-1 focus:outline-none ${product.stockCount === 0 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:text-gray-700'}`}
                                onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                                disabled={quantity <= 1 || product.stockCount === 0}
                                aria-label="Decrease quantity"
                            >
                                -
                            </button>
                            <input
                                type="number"
                                min="1"
                                max={product.stockCount || 1}
                                value={product.stockCount === 0 ? 0 : quantity}
                                onChange={(e) => product.stockCount > 0 && setQuantity(Math.min(Math.max(1, parseInt(e.target.value) || 1), product.stockCount))}
                                className={`w-full text-center border-0 focus:outline-none focus:ring-0 ${product.stockCount === 0 ? 'bg-gray-100 text-gray-400' : ''}`}
                                aria-label="Quantity"
                                disabled={product.stockCount === 0}
                            />
                            <button
                                type="button"
                                className={`px-3 py-1 focus:outline-none ${product.stockCount === 0 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:text-gray-700'}`}
                                onClick={() => quantity < product.stockCount && setQuantity(quantity + 1)}
                                disabled={quantity >= product.stockCount || product.stockCount === 0}
                                aria-label="Increase quantity"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Action buttons with improved disabled states */}
                    <div className="action-buttons-section flex flex-wrap gap-4 mb-6">
                        <button
                            onClick={() => {
                                if (product.stockCount > 0) {
                                    addToCart(product, selectedSize, selectedColor, quantity);
                                }
                            }}
                            className={`flex-1 py-3 px-6 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${product.stockCount === 0
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500'
                                }`}
                            disabled={product.stockCount === 0}
                            aria-label={product.stockCount === 0 ? "Out of stock" : "Add to cart"}
                        >
                            {product.stockCount === 0 ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                        <button
                            onClick={() => isInWishlist(product.id) ? removeFromWishlist(product.id) : addToWishlist(product)}
                            className="p-3 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
                            aria-label={isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                            aria-pressed={isInWishlist(product.id)}
                        >
                            {isInWishlist(product.id) ? (
                                <HeartIconSolid className="h-6 w-6 text-red-500" aria-hidden="true" />
                            ) : (
                                <HeartIcon className="h-6 w-6 text-gray-500" aria-hidden="true" />
                            )}
                        </button>
                    </div>

                    {/* Product description */}
                    <div className="product-description-section mb-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-3">Description</h2>
                        <style dangerouslySetInnerHTML={{ __html: productDescriptionStyles }} />
                        <div
                            className="product-description prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: product.description || '<p>No detailed description available for this product.</p>' }}
                        />
                    </div>

                    {/* Product features */}
                    {product.features && product.features.length > 0 && (
                        <div className="product-features-section mb-6">
                            <h2 className="text-lg font-medium text-gray-900 mb-3">Features</h2>
                            <ul className="list-disc pl-5 space-y-1">
                                {product.features.map((feature, index) => (
                                    <li key={index} className="text-gray-700">{feature}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            {/* Reviews Section with improved empty state */}
            <div className="reviews-section mt-12 mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>

                {reviews.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2">
                        {reviews.map((review, index) => (
                            <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                                <div className="flex items-center mb-2">
                                    <div className="flex text-yellow-400">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <StarIcon
                                                key={i}
                                                className={`h-5 w-5 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                                aria-hidden="true"
                                            />
                                        ))}
                                    </div>
                                    <span className="ml-2 text-sm text-gray-600">{review.rating} out of 5</span>
                                </div>
                                <p className="text-gray-800 mb-1">{review.comment}</p>
                                <p className="text-sm text-gray-500">
                                    By {review.userName || 'Anonymous'} • {new Date(review.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-gray-50 border border-gray-100 rounded-lg p-6 text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
                        <p className="text-gray-600 mb-4">Be the first to share your experience with this product!</p>
                        <button
                            onClick={() => window.alert('Review submission form will appear here')}
                            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm ${product.stockCount === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'text-white bg-primary-600 hover:bg-primary-700'}`}
                            disabled={product.stockCount === 0}
                        >
                            Write a Review
                        </button>
                        {product.stockCount === 0 && (
                            <p className="text-sm text-gray-500 mt-2">You'll be able to review this product once it's back in stock</p>
                        )}
                    </div>
                )}
            </div>

            {/* Similar Products Section with improved styling */}
            {similarProducts.length > 0 && (
                <div className="similar-products-section mt-12 mb-16 bg-gray-50 py-8 px-4 sm:px-6 rounded-lg">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">You May Also Like</h2>
                    <p className="text-gray-600 mb-6">Discover more products that match your style</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
                        {similarProducts.map((similarProduct) => (
                            <Link
                                key={similarProduct.id}
                                to={`/product/${similarProduct.id}`}
                                className="group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="aspect-w-1 aspect-h-1 bg-gray-200 overflow-hidden">
                                    <img
                                        src={similarProduct.images?.[0] || '/assets/placeholder-product.jpg'}
                                        alt={similarProduct.name}
                                        className="w-full h-full object-center object-cover group-hover:opacity-90 transition-opacity"
                                        loading="lazy" // Lazy load similar products images
                                    />
                                </div>
                                <div className="p-4">
                                    <h3 className="text-gray-900 font-medium group-hover:text-primary-600 transition-colors">{similarProduct.name}</h3>
                                    <p className="text-gray-600 mt-1">{formatPrice(similarProduct.price)}</p>
                                    {similarProduct.stockCount === 0 && (
                                        <span className="inline-block mt-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">Out of Stock</span>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductDetailPage; 