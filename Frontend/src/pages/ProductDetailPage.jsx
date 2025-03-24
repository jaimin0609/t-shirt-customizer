import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useAuth } from '../contexts/AuthContext';
import { productService } from '../services/productService';
import { calculateProductPrice, formatPrice } from '../services/discountService';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { StarIcon } from '@heroicons/react/24/solid';
import { XMarkIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { promotionLogger } from '../services/promotionLogger';

// Import modular components
import ProductImageGallery from '../components/Product/ProductImageGallery';
import ProductPricing from '../components/Product/ProductPricing';
import ProductReviews from '../components/Product/ProductReviews';
import ProductActions from '../components/Product/ProductActions';

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

.product-description h2 {
    font-size: 1.5rem;
    margin-top: 1.5rem;
    margin-bottom: 1rem;
    font-weight: 600;
}

.product-description h3 {
    font-size: 1.25rem;
    margin-top: 1.25rem;
    margin-bottom: 0.75rem;
    font-weight: 600;
}
`;

/**
 * ProductDetailPage Component
 * Shows detailed information about a specific product, including images, pricing,
 * description, options, and reviews.
 */
const ProductDetailPage = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
    const { isAuthenticated } = useAuth();
    const reviewFormRef = useRef(null);

    // Product data state
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedImage, setSelectedImage] = useState(0);

    // Price information state
    const [priceInfo, setPriceInfo] = useState(null);
    const [loadingPrice, setLoadingPrice] = useState(false);

    // Options and variants state
    const [selectedOptions, setSelectedOptions] = useState({});
    const [quantity, setQuantity] = useState(1);
    const [isInStock, setIsInStock] = useState(true);

    // Review state
    const [reviews, setReviews] = useState([]);
    const [reviewText, setReviewText] = useState('');
    const [reviewRating, setReviewRating] = useState(5);
    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviewError, setReviewError] = useState(null);

    // UI state
    const [showSizeGuide, setShowSizeGuide] = useState(false);
    const sizeGuideRef = useRef(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);

    // Fetch product details when component mounts or productId changes
    useEffect(() => {
        const fetchProductDetails = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch product and reviews data
                const productData = await productService.getProductById(productId);
                setProduct(productData);

                // Set default options based on variants if available
                if (productData.variants && productData.variants.length > 0) {
                    const defaultOptions = {};
                    const firstVariant = productData.variants[0];

                    if (firstVariant.options) {
                        Object.entries(firstVariant.options).forEach(([key, value]) => {
                            defaultOptions[key] = value;
                        });
                    }

                    setSelectedOptions(defaultOptions);
                }

                // Fetch product reviews
                const reviewsData = await productService.getProductReviews(productId);
                setReviews(reviewsData);

                // Check stock status
                setIsInStock(productData.stock > 0);

                // Log product view for analytics
                if (productData) {
                    try {
                        await promotionLogger.logProductView(productId);
                    } catch (err) {
                        console.error('Error logging product view:', err);
                        // Non-critical error, don't display to user
                    }
                }
            } catch (err) {
                console.error('Error fetching product details:', err);
                setError(err.message || 'Failed to load product details');
            } finally {
                setLoading(false);
            }
        };

        fetchProductDetails();
    }, [productId]);

    // Fetch price information when product data or selected options change
    useEffect(() => {
        const fetchPriceInfo = async () => {
            if (!product) return;

            try {
                setLoadingPrice(true);

                // Calculate price with any applicable discounts
                const priceData = await calculateProductPrice(
                    product,
                    selectedOptions,
                    quantity
                );

                setPriceInfo({
                    originalPrice: priceData.originalPrice,
                    finalPrice: priceData.finalPrice,
                    discount: priceData.discount
                });
            } catch (err) {
                console.error('Error calculating price:', err);
                // Default to base price if calculation fails
                setPriceInfo({
                    originalPrice: product.price,
                    finalPrice: product.price,
                    discount: null
                });
            } finally {
                setLoadingPrice(false);
            }
        };

        fetchPriceInfo();
    }, [product, selectedOptions, quantity]);

    // Add click outside listener for size guide modal
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sizeGuideRef.current && !sizeGuideRef.current.contains(event.target)) {
                setShowSizeGuide(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Handle review form submission
    const handleReviewSubmit = async (reviewData) => {
        if (!isAuthenticated) {
            setReviewError('You must be logged in to submit a review');
            return;
        }

        try {
            setSubmittingReview(true);
            setReviewError(null);

            const newReview = {
                productId,
                rating: reviewData.rating,
                text: reviewData.text
            };

            const response = await productService.submitProductReview(newReview);

            // Add the new review to the reviews list
            setReviews([...reviews, response]);

            // Clear form
            setReviewText('');
            setReviewRating(5);
        } catch (err) {
            console.error('Error submitting review:', err);
            setReviewError(err.message || 'Failed to submit review');
        } finally {
            setSubmittingReview(false);
        }
    };

    // Handle adding product to cart
    const handleAddToCart = () => {
        if (!product) return;

        const selectedVariant = product.variants?.find(variant => {
            if (!variant.options) return false;

            // Check if all selected options match this variant
            return Object.entries(selectedOptions).every(
                ([key, value]) => variant.options[key] === value
            );
        });

        const itemToAdd = {
            id: selectedVariant?.id || product.id,
            productId: product.id,
            name: product.name,
            price: priceInfo?.finalPrice || product.price,
            image: product.images && product.images.length > 0 ? product.images[0] : null,
            options: selectedOptions,
            quantity: quantity
        };

        addToCart(itemToAdd);
    };

    // Handle toggling wishlist status
    const toggleWishlist = () => {
        if (!product) return;

        if (isInWishlist(product.id)) {
            removeFromWishlist(product.id);
        } else {
            addToWishlist({
                id: product.id,
                name: product.name,
                price: priceInfo?.finalPrice || product.price,
                image: product.images && product.images.length > 0 ? product.images[0] : null,
            });
        }
    };

    // Helper to get full image URL
    const getImageUrl = (imagePath) => {
        if (!imagePath) return '/images/product-placeholder.jpg';

        if (imagePath.startsWith('http')) {
            return imagePath;
        }

        return `${process.env.VITE_API_URL || ''}/uploads/${imagePath}`;
    };

    // Handle option changes (size, color, etc.)
    const handleOptionChange = (name, value) => {
        setSelectedOptions({
            ...selectedOptions,
            [name]: value
        });
    };

    // Calculate average rating
    const calculateAverageRating = () => {
        if (!reviews || reviews.length === 0) return 0;

        const sum = reviews.reduce((total, review) => total + review.rating, 0);
        return sum / reviews.length;
    };

    // Size guide content
    const getSizeGuideContent = () => {
        // This could be fetched from an API or CMS in a real app
        return (
            <div className="size-guide-content">
                <h3 className="text-lg font-semibold mb-4">Size Guide</h3>
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border p-2 text-left">Size</th>
                            <th className="border p-2 text-left">Chest (inches)</th>
                            <th className="border p-2 text-left">Waist (inches)</th>
                            <th className="border p-2 text-left">Length (inches)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="border p-2">XS</td>
                            <td className="border p-2">34-36</td>
                            <td className="border p-2">28-30</td>
                            <td className="border p-2">26</td>
                        </tr>
                        <tr>
                            <td className="border p-2">S</td>
                            <td className="border p-2">36-38</td>
                            <td className="border p-2">30-32</td>
                            <td className="border p-2">27</td>
                        </tr>
                        <tr>
                            <td className="border p-2">M</td>
                            <td className="border p-2">38-40</td>
                            <td className="border p-2">32-34</td>
                            <td className="border p-2">28</td>
                        </tr>
                        <tr>
                            <td className="border p-2">L</td>
                            <td className="border p-2">40-42</td>
                            <td className="border p-2">34-36</td>
                            <td className="border p-2">29</td>
                        </tr>
                        <tr>
                            <td className="border p-2">XL</td>
                            <td className="border p-2">42-44</td>
                            <td className="border p-2">36-38</td>
                            <td className="border p-2">30</td>
                        </tr>
                        <tr>
                            <td className="border p-2">XXL</td>
                            <td className="border p-2">44-46</td>
                            <td className="border p-2">38-40</td>
                            <td className="border p-2">31</td>
                        </tr>
                    </tbody>
                </table>
                <div className="mt-4">
                    <p className="text-sm text-gray-600">
                        Measurements may vary slightly depending on the specific style and cut.
                    </p>
                </div>
            </div>
        );
    };

    // Show loading state
    if (loading) {
        return (
            <div className="container mx-auto px-4 py-16 flex items-center justify-center">
                <LoadingSpinner size="large" />
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="container mx-auto px-4 py-16">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
                    <p className="mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/products')}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Return to Products
                    </button>
                </div>
            </div>
        );
    }

    // Show not found state
    if (!product) {
        return (
            <div className="container mx-auto px-4 py-16">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
                    <p className="mb-6">The product you're looking for doesn't exist or has been removed.</p>
                    <Link
                        to="/products"
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Browse Products
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Breadcrumb Navigation */}
            <nav className="mb-6 text-sm">
                <ol className="flex flex-wrap">
                    <li className="flex items-center">
                        <Link to="/" className="text-gray-600 hover:text-blue-600">Home</Link>
                        <span className="mx-2 text-gray-400">/</span>
                    </li>
                    <li className="flex items-center">
                        <Link to="/products" className="text-gray-600 hover:text-blue-600">Products</Link>
                        <span className="mx-2 text-gray-400">/</span>
                    </li>
                    {product.category && (
                        <li className="flex items-center">
                            <Link to={`/products?category=${product.category.id}`} className="text-gray-600 hover:text-blue-600">
                                {product.category.name}
                            </Link>
                            <span className="mx-2 text-gray-400">/</span>
                        </li>
                    )}
                    <li className="text-gray-900 font-medium">{product.name}</li>
                </ol>
            </nav>

            {/* Product Main Content */}
            <div className="flex flex-col md:flex-row -mx-4">
                {/* Product Images */}
                <ProductImageGallery
                    images={product.images}
                    getImageUrl={getImageUrl}
                />

                {/* Product Info */}
                <div className="w-full md:w-1/2 px-4">
                    <h1 className="text-3xl font-bold mb-2">{product.name}</h1>

                    {/* Product Ratings Preview */}
                    <div className="flex items-center mb-4">
                        <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <svg
                                    key={star}
                                    className={`w-5 h-5 ${star <= Math.round(calculateAverageRating())
                                        ? 'text-yellow-400'
                                        : 'text-gray-300'
                                        }`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            ))}
                        </div>
                        <span className="ml-2 text-gray-600">
                            {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                        </span>
                        <a
                            href="#reviews"
                            className="ml-4 text-blue-600 hover:text-blue-800 text-sm"
                        >
                            See all reviews
                        </a>
                    </div>

                    {/* Product Pricing */}
                    <ProductPricing
                        priceInfo={priceInfo}
                        isLoading={loadingPrice}
                    />

                    {/* Product Actions */}
                    <ProductActions
                        onAddToCart={handleAddToCart}
                        onToggleWishlist={toggleWishlist}
                        isInWishlist={isInWishlist(product.id)}
                        isInStock={isInStock}
                        variants={product.variants}
                        selectedOptions={selectedOptions}
                        onOptionChange={handleOptionChange}
                        quantity={quantity}
                        onQuantityChange={setQuantity}
                    />

                    {/* Size Guide Button */}
                    {product.category &&
                        product.category.name.toLowerCase().includes('clothing') && (
                            <button
                                onClick={() => setShowSizeGuide(true)}
                                className="mt-4 text-sm text-blue-600 hover:text-blue-800"
                            >
                                View Size Guide
                            </button>
                        )}

                    {/* Size Guide Modal */}
                    {showSizeGuide && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                            <div
                                ref={sizeGuideRef}
                                className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold">Size Guide</h2>
                                    <button
                                        onClick={() => setShowSizeGuide(false)}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        <svg
                                            className="w-6 h-6"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M6 18L18 6M6 6l12 12"
                                            />
                                        </svg>
                                    </button>
                                </div>
                                {getSizeGuideContent()}
                            </div>
                        </div>
                    )}

                    {/* Product Description */}
                    <div className="mt-8">
                        <h2 className="text-xl font-semibold mb-4">Description</h2>
                        <style>{productDescriptionStyles}</style>
                        <div
                            className="product-description"
                            dangerouslySetInnerHTML={{ __html: product.description }}
                        />
                    </div>
                </div>
            </div>

            {/* Reviews Section */}
            <div id="reviews" className="mt-12 pt-4 border-t">
                <ProductReviews
                    reviews={reviews}
                    averageRating={calculateAverageRating()}
                    onSubmitReview={handleReviewSubmit}
                    isSubmitting={submittingReview}
                    error={reviewError}
                />
            </div>
        </div>
    );
};

export default ProductDetailPage; 