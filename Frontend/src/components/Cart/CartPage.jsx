import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { FiTrash2, FiPlusCircle, FiMinusCircle, FiHeart, FiX } from 'react-icons/fi';
import { API_URL } from '../../config/api';

const CartPage = () => {
    const { cart, removeFromCart, updateQuantity, cartCount, appliedCoupon, applyCoupon: contextApplyCoupon, removeCoupon: contextRemoveCoupon } = useCart();
    const { user, isAuthenticated } = useAuth();
    const [subtotal, setSubtotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [quantities, setQuantities] = useState({});
    const navigate = useNavigate();

    // Coupon related states
    const [couponCode, setCouponCode] = useState('');
    const [couponError, setCouponError] = useState('');
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
    const [showCouponInput, setShowCouponInput] = useState(false);
    const [discountAmount, setDiscountAmount] = useState(0);

    useEffect(() => {
        if (cart) {
            setIsLoading(false);
            const total = cart.reduce(
                (sum, item) => {
                    // Ensure price is a valid number
                    const price = parseFloat(item.price) || 0;
                    return sum + price * item.quantity;
                },
                0
            );
            setSubtotal(total);

            // Initialize quantities state with current cart quantities
            const initialQuantities = {};
            cart.forEach(item => {
                initialQuantities[item.productId] = item.quantity;
            });
            setQuantities(initialQuantities);
        }
    }, [cart]);

    // Calculate discount amount when subtotal or applied coupon changes
    useEffect(() => {
        if (appliedCoupon) {
            let discount = 0;
            if (appliedCoupon.type === 'percentage') {
                discount = subtotal * (appliedCoupon.value / 100);
            } else if (appliedCoupon.type === 'fixed') {
                discount = Math.min(subtotal, appliedCoupon.value);
            }
            setDiscountAmount(discount);
        } else {
            setDiscountAmount(0);
        }
    }, [subtotal, appliedCoupon]);

    // Handle quantity change via buttons
    const handleQuantityChange = (item, newQty) => {
        // Update local state first for optimistic UI update
        setQuantities(prev => ({
            ...prev,
            [item.productId]: newQty
        }));
        updateQuantity(item, newQty);
    };

    // For direct input changes
    const handleInputQuantityChange = (e, itemId) => {
        const value = parseInt(e.target.value);
        if (!isNaN(value) && value >= 1 && value <= 99) {
            setQuantities({
                ...quantities,
                [itemId]: value
            });
        }
    };

    // Process the quantity change on blur
    const handleInputBlur = (item, newQty) => {
        if (newQty >= 1) {
            updateQuantity(item, newQty);
        } else {
            // Reset to 1 if invalid value
            setQuantities(prev => ({
                ...prev,
                [item.productId]: item.quantity
            }));
        }
    };

    // Apply coupon code
    const applyCoupon = async () => {
        if (!couponCode.trim()) {
            setCouponError('Please enter a coupon code');
            return;
        }

        setIsApplyingCoupon(true);
        setCouponError('');

        try {
            // Call apply coupon function from context
            await contextApplyCoupon(couponCode);
            setShowCouponInput(false);
        } catch (error) {
            setCouponError(error.message || 'Invalid coupon code');
        } finally {
            setIsApplyingCoupon(false);
        }
    };

    // Remove coupon
    const removeCoupon = () => {
        contextRemoveCoupon();
        setCouponCode('');
    };

    // Calculate total with tax and shipping
    const calculateTotal = () => {
        const tax = subtotal * 0.08; // 8% tax
        const shipping = subtotal > 50 ? 0 : 10; // Free shipping over $50
        return subtotal + tax + shipping - discountAmount;
    };

    // Format price for display
    const formatPrice = (price) => {
        return parseFloat(price).toFixed(2);
    };

    // Get image URL helper
    const getImageUrl = (imageSource) => {
        if (!imageSource) return '/assets/placeholder-product.jpg';

        // Handle Cloudinary URLs
        if (typeof imageSource === 'string' && (
            imageSource.startsWith('http') ||
            imageSource.startsWith('data:')
        )) {
            return imageSource;
        }

        // Handle relative image paths
        if (typeof imageSource === 'string' && imageSource.startsWith('/')) {
            if (imageSource.startsWith('/uploads/')) {
                // For backend uploads, use the API URL from config
                return `${API_URL.replace(/\/api$/, '')}${imageSource}`;
            }
            // For absolute paths within the app
            return imageSource;
        }

        // Handle backend paths using API_URL from config
        return `${API_URL}/${imageSource.replace(/^\//, '')}`;
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // If cart is empty, show empty cart message
    if (!cart || cart.length === 0) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-8 mt-16">
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <h2 className="text-2xl font-bold mb-4">Your Cart is Empty</h2>
                    <p className="text-gray-600 mb-6">
                        You don't have any items in your cart yet.
                    </p>
                    <Link
                        to="/products"
                        className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Continue Shopping
                    </Link>
                </div>
            </div>
        );
    }

    // If user is not authenticated but there are items in the cart,
    // we still show the cart but with a login prompt at the top
    const showLoginPrompt = !isAuthenticated && cart.length > 0;

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Your Shopping Cart</h1>

            {showLoginPrompt && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                    <p className="text-blue-800">
                        <span className="font-medium">Sign in to save your cart and checkout.</span>{' '}
                        <Link to="/login?returnUrl=/cart" className="text-blue-600 underline">
                            Sign in
                        </Link>
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                        <div className="p-4 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-semibold">Cart Items ({cart.length})</h2>
                                <button
                                    onClick={() => navigate('/products')}
                                    className="text-blue-600 hover:text-blue-800 text-sm"
                                >
                                    Continue Shopping
                                </button>
                            </div>
                        </div>

                        <div className="divide-y divide-gray-200">
                            {cart.map((item) => (
                                <div key={item.productId} className="p-4 flex flex-col sm:flex-row">
                                    {/* Product Image */}
                                    <div className="sm:w-24 h-24 mb-4 sm:mb-0 flex-shrink-0">
                                        <img
                                            src={getImageUrl(item.image)}
                                            alt={item.name}
                                            className="w-full h-full object-cover rounded"
                                        />
                                    </div>

                                    {/* Product Info */}
                                    <div className="flex-1 sm:ml-4">
                                        <div className="flex flex-col sm:flex-row sm:justify-between mb-4">
                                            <div>
                                                <h3 className="font-medium text-gray-800">{item.name}</h3>
                                                {item.size && item.color && (
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        Size: {item.size}, Color: {item.color}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="mt-2 sm:mt-0 text-right">
                                                <p className="font-medium">${formatPrice(item.price)}</p>
                                            </div>
                                        </div>

                                        {/* Quantity Controls & Remove Button */}
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center border rounded">
                                                <button
                                                    onClick={() => handleQuantityChange(item, Math.max(1, quantities[item.productId] - 1))}
                                                    className="p-2 text-gray-600 hover:text-gray-800"
                                                    aria-label="Decrease quantity"
                                                >
                                                    <FiMinusCircle />
                                                </button>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="99"
                                                    value={quantities[item.productId] || item.quantity}
                                                    onChange={(e) => handleInputQuantityChange(e, item.productId)}
                                                    onBlur={() => handleInputBlur(item, quantities[item.productId])}
                                                    className="w-12 text-center border-0 focus:ring-0"
                                                    aria-label="Quantity"
                                                />
                                                <button
                                                    onClick={() => handleQuantityChange(item, Math.min(99, quantities[item.productId] + 1))}
                                                    className="p-2 text-gray-600 hover:text-gray-800"
                                                    aria-label="Increase quantity"
                                                >
                                                    <FiPlusCircle />
                                                </button>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => removeFromCart(item)}
                                                    className="text-red-500 hover:text-red-700"
                                                    aria-label="Remove item"
                                                >
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
                        <h2 className="text-lg font-semibold mb-6">Order Summary</h2>

                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Subtotal</span>
                                <span>${formatPrice(subtotal)}</span>
                            </div>

                            {/* Discount */}
                            {appliedCoupon && (
                                <div className="flex justify-between text-green-600">
                                    <div className="flex items-center">
                                        <span>Discount {appliedCoupon.code}</span>
                                        <button
                                            onClick={removeCoupon}
                                            className="ml-2 text-gray-400 hover:text-gray-600"
                                            aria-label="Remove coupon"
                                        >
                                            <FiX size={14} />
                                        </button>
                                    </div>
                                    <span>-${formatPrice(discountAmount)}</span>
                                </div>
                            )}

                            {/* Tax */}
                            <div className="flex justify-between">
                                <span className="text-gray-600">Tax (8%)</span>
                                <span>${formatPrice(subtotal * 0.08)}</span>
                            </div>

                            {/* Shipping */}
                            <div className="flex justify-between">
                                <span className="text-gray-600">Shipping</span>
                                <span>{subtotal > 50 ? 'Free' : `$10.00`}</span>
                            </div>

                            {/* Divider */}
                            <div className="border-t pt-4">
                                <div className="flex justify-between font-semibold">
                                    <span>Total</span>
                                    <span>${formatPrice(calculateTotal())}</span>
                                </div>
                            </div>
                        </div>

                        {/* Coupon Section */}
                        {!appliedCoupon && (
                            <div className="mb-6">
                                {showCouponInput ? (
                                    <div className="space-y-2">
                                        <div className="flex">
                                            <input
                                                type="text"
                                                value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value)}
                                                placeholder="Enter coupon code"
                                                className="flex-1 border rounded-l p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            />
                                            <button
                                                onClick={applyCoupon}
                                                disabled={isApplyingCoupon}
                                                className="bg-blue-600 text-white px-4 py-2 rounded-r text-sm hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            >
                                                {isApplyingCoupon ? 'Applying...' : 'Apply'}
                                            </button>
                                        </div>
                                        {couponError && (
                                            <p className="text-red-500 text-xs">{couponError}</p>
                                        )}
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setShowCouponInput(true)}
                                        className="text-blue-600 text-sm hover:text-blue-800"
                                    >
                                        Have a coupon code?
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Checkout Button */}
                        <Link
                            to={isAuthenticated ? "/checkout" : "/login?returnUrl=/checkout"}
                            className="block w-full bg-blue-600 text-white text-center py-3 rounded-md hover:bg-blue-700 transition-colors"
                        >
                            {isAuthenticated ? "Proceed to Checkout" : "Sign in to Checkout"}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage; 