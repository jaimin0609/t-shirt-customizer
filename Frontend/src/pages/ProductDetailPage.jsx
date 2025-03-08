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

const ProductDetailPage = () => {
    const { productId } = useParams();
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
    const [reviewForm, setReviewForm] = useState({
        rating: 5,
        comment: ''
    });

    useEffect(() => {
        const fetchProductDetails = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch product details
                const productData = await productService.getProductById(productId);
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

                // Fetch similar products (try-catch to handle errors separately)
                try {
                    const similar = await productService.getSimilarProducts(productId);
                    if (similar && similar.length > 0) {
                        setSimilarProducts(similar);
                    } else {
                        setSimilarProducts([]);
                    }
                } catch (err) {
                    console.error('Failed to fetch similar products:', err);
                    // Don't set main error - this is not critical
                    setSimilarProducts([]);
                }

                // Fetch product reviews (try-catch to handle errors separately)
                try {
                    const productReviews = await productService.getProductReviews(productId);
                    setReviews(productReviews);
                } catch (err) {
                    console.error('Failed to fetch product reviews:', err);
                    // Don't set main error - this is not critical
                    setReviews([]);
                }

                setLoading(false);
            } catch (err) {
                console.error('Failed to fetch product details:', err);
                setError('Failed to load product details. Please try again later.');
                setLoading(false);
            }
        };

        fetchProductDetails();
    }, [productId]);

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

    if (loading) return <LoadingSpinner />;

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-red-50 border-l-4 border-red-500 p-4">
                    <p className="text-red-700">{error}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="mt-4 text-blue-600 hover:text-blue-800"
                    >
                        Return to Home
                    </button>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
                    <p className="text-yellow-700">Product not found.</p>
                    <button
                        onClick={() => navigate('/')}
                        className="mt-4 text-blue-600 hover:text-blue-800"
                    >
                        Return to Home
                    </button>
                </div>
            </div>
        );
    }

    // Calculate average rating
    const averageRating = reviews.length
        ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
        : 0;

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Product Detail Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                {/* Product Image */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    {!imageLoaded && !imageError && (
                        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                            <span className="sr-only">Loading...</span>
                        </div>
                    )}
                    <img
                        src={productImageUrl}
                        alt={product.name}
                        className="w-full h-auto object-cover"
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                        style={{ opacity: imageLoaded ? 1 : 0 }}
                    />

                    {/* Promotion Badge */}
                    {priceInfo.hasDiscount && (
                        <div className="promotion-badge">
                            {priceInfo.discountPercentage || '15% OFF'}
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>

                    {/* Price and Rating */}
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            {/* Price Display Section */}
                            <div className="mb-4">
                                {priceInfo.hasDiscount ? (
                                    <div className="flex items-center flex-wrap gap-2">
                                        <span className="text-2xl font-bold text-red-600">
                                            {priceInfo.discountedPrice}
                                        </span>
                                        <span className="text-lg text-gray-500 line-through">
                                            {priceInfo.originalPrice}
                                        </span>
                                        {priceInfo.discountBadge && (
                                            <span className="text-sm bg-red-100 text-red-600 rounded-md px-2 py-1 font-medium">
                                                {priceInfo.discountBadge}
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <span className="text-2xl font-bold text-gray-900">
                                        {priceInfo.originalPrice}
                                    </span>
                                )}

                                {/* Add debug info when a promotion exists but discount isn't showing */}
                                {!priceInfo.hasDiscount && product.promotion && (
                                    <div className="mt-2 text-xs text-gray-500">
                                        <span className="font-medium">Note:</span> There is a promotion associated with this product that isn't being applied.
                                        <button
                                            onClick={() => window.location.href = "promotion-status.html"}
                                            className="ml-2 text-blue-500 underline"
                                        >
                                            Check Promotion Status
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Rating Stars */}
                            <div className="flex items-center">
                                <div className="flex items-center">
                                    {[0, 1, 2, 3, 4].map((rating) => (
                                        <StarIcon
                                            key={rating}
                                            className={`h-5 w-5 ${averageRating > rating ? 'text-yellow-400' : 'text-gray-200'
                                                }`}
                                        />
                                    ))}
                                </div>
                                <span className="ml-2 text-sm text-gray-600">
                                    ({reviews.length} reviews)
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
                        <p className="text-gray-700">{product.description || 'No description available.'}</p>
                    </div>

                    {/* Tags */}
                    {product.tags && product.tags.length > 0 && (
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-2">Tags</h2>
                            <div className="flex flex-wrap gap-2">
                                {product.tags.map(tag => (
                                    <span
                                        key={tag}
                                        className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Size Selection */}
                    {product.availableSizes && product.availableSizes.length > 0 && (
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-2">Size</h2>
                            <div className="flex flex-wrap gap-2">
                                {product.availableSizes.map(size => (
                                    <button
                                        key={size}
                                        className={`px-4 py-2 border ${selectedSize === size
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-gray-300 text-gray-700 hover:border-gray-400'
                                            } rounded-md text-sm font-medium`}
                                        onClick={() => setSelectedSize(size)}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Color Selection */}
                    {product.availableColors && product.availableColors.length > 0 && (
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-2">Color</h2>
                            <div className="flex flex-wrap gap-2">
                                {product.availableColors.map(color => (
                                    <button
                                        key={color}
                                        className={`w-10 h-10 rounded-full border-2 ${selectedColor === color ? 'border-blue-500' : 'border-transparent'
                                            }`}
                                        style={{ backgroundColor: color.toLowerCase() }}
                                        onClick={() => setSelectedColor(color)}
                                        aria-label={color}
                                    ></button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Quantity */}
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">Quantity</h2>
                        <div className="flex items-center">
                            <button
                                className="bg-gray-200 text-gray-700 py-1 px-3 rounded-l-md"
                                onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                            >
                                -
                            </button>
                            <span className="bg-gray-100 py-1 px-4 text-center">{quantity}</span>
                            <button
                                className="bg-gray-200 text-gray-700 py-1 px-3 rounded-r-md"
                                onClick={() => setQuantity(quantity + 1)}
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-4 mt-8">
                        <button
                            onClick={handleAddToCart}
                            className="bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
                        >
                            Add to Cart
                        </button>

                        <button
                            onClick={toggleWishlist}
                            className={`flex items-center justify-center py-3 px-6 rounded-md transition-colors ${isInWishlist(product._id)
                                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {isInWishlist(product._id) ? (
                                <>
                                    <HeartIconSolid className="h-5 w-5 mr-2 text-red-600" />
                                    Added to Wishlist
                                </>
                            ) : (
                                <>
                                    <HeartIcon className="h-5 w-5 mr-2" />
                                    Add to Wishlist
                                </>
                            )}
                        </button>

                        {/* Customize Button (if product is customizable) */}
                        {product.customizable && (
                            <Link
                                to={`/custom-design-studio?type=${product.type || product._id}`}
                                className="col-span-2 bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center"
                            >
                                Customize This Product
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Product Reviews Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>

                {/* Reviews Summary */}
                <div className="flex items-center mb-6">
                    <div className="flex items-center mr-4">
                        {[0, 1, 2, 3, 4].map((rating) => (
                            <StarIcon
                                key={rating}
                                className={`h-6 w-6 ${Math.round(averageRating) > rating ? 'text-yellow-400' : 'text-gray-300'
                                    }`}
                            />
                        ))}
                    </div>
                    <span className="text-lg font-medium text-gray-900">
                        {averageRating.toFixed(1)} out of 5 ({reviews.length} reviews)
                    </span>
                </div>

                {/* Review Form */}
                {user && (
                    <div className="border-t border-b border-gray-200 py-6 mb-6">
                        <h3 className="text-lg font-semibold mb-4">Write a Review</h3>
                        <form onSubmit={handleReviewSubmit}>
                            {/* Rating Selection */}
                            <div className="mb-4">
                                <label className="block text-gray-700 mb-2">Rating</label>
                                <div className="flex items-center">
                                    {[1, 2, 3, 4, 5].map((rating) => (
                                        <button
                                            key={rating}
                                            type="button"
                                            onClick={() => setReviewForm({ ...reviewForm, rating })}
                                            className="focus:outline-none"
                                        >
                                            <StarIcon
                                                className={`h-6 w-6 ${reviewForm.rating >= rating ? 'text-yellow-400' : 'text-gray-300'
                                                    }`}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Review Comment */}
                            <div className="mb-4">
                                <label htmlFor="comment" className="block text-gray-700 mb-2">Your Review</label>
                                <textarea
                                    id="comment"
                                    rows="4"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={reviewForm.comment}
                                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                                    required
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Submit Review
                            </button>
                        </form>
                    </div>
                )}

                {/* Review List */}
                {reviews.length > 0 ? (
                    <div className="space-y-6">
                        {reviews.map((review, index) => (
                            <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center">
                                        <div className="font-medium text-gray-900 mr-2">{review.userName}</div>
                                        <div className="flex">
                                            {[0, 1, 2, 3, 4].map((rating) => (
                                                <StarIcon
                                                    key={rating}
                                                    className={`h-4 w-4 ${review.rating > rating ? 'text-yellow-400' : 'text-gray-300'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {new Date(review.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                                <p className="text-gray-700">{review.comment}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
                )}
            </div>

            {/* Similar Products Section */}
            {similarProducts.length > 0 && (
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">You May Also Like</h2>
                    <div className="relative">
                        {/* Left arrow for mobile scrolling indicator */}
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-75 p-2 rounded-full shadow-md hidden md:block">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </div>

                        {/* Scrollable container */}
                        <div className="flex overflow-x-auto pb-4 scrollbar-hide hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            <div className="flex space-x-6">
                                {similarProducts.map(product => (
                                    <div key={product._id || product.id} className="bg-white rounded-lg shadow-md overflow-hidden min-w-[200px] md:min-w-[250px] flex-shrink-0">
                                        <Link to={`/product/${product._id || product.id}`} className="block">
                                            <div className="aspect-square bg-gray-200">
                                                <img
                                                    src={product.image || '/assets/placeholder-product.jpg'}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        console.error('Failed to load product image, using placeholder');
                                                        e.target.src = '/assets/placeholder-product.jpg';
                                                        e.target.onerror = null; // Prevent infinite error loops
                                                    }}
                                                />
                                            </div>
                                            <div className="p-4">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">{product.name}</h3>
                                                <p className="text-gray-700">${parseFloat(product.price).toFixed(2)}</p>
                                            </div>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right arrow for mobile scrolling indicator */}
                        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-75 p-2 rounded-full shadow-md hidden md:block">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>

                    {/* Mobile scroll hint */}
                    <p className="text-center text-gray-500 text-sm mt-3 md:hidden">
                        Swipe to see more products
                    </p>
                </div>
            )}
        </div>
    );
};

export default ProductDetailPage; 