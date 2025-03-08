import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { FiTrash2, FiPlusCircle, FiMinusCircle, FiHeart, FiX } from 'react-icons/fi';

const CartPage = () => {
    const { cart, removeFromCart, updateQuantity, cartCount, appliedCoupon, applyCoupon: contextApplyCoupon, removeCoupon: contextRemoveCoupon } = useCart();
    const { user } = useAuth();
    const [subtotal, setSubtotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [quantities, setQuantities] = useState({});

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
                (sum, item) => sum + parseFloat(item.price) * item.quantity,
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
        if (appliedCoupon && subtotal > 0) {
            // If the backend already calculated the discount amount, use that
            if (appliedCoupon.discountAmount) {
                // Make sure we parse the string to a number correctly
                const discountValue = parseFloat(appliedCoupon.discountAmount);
                setDiscountAmount(discountValue);
                console.log(`Using backend discount amount: ${discountValue} (from ${appliedCoupon.discountAmount})`);
            } else if (appliedCoupon.discountType === 'percentage') {
                // Calculate percentage discount
                const discount = (subtotal * parseFloat(appliedCoupon.discountValue)) / 100;
                setDiscountAmount(parseFloat(discount.toFixed(2)));
                console.log(`Calculated percentage discount: ${discount.toFixed(2)}`);
            } else {
                // Fixed amount discount
                setDiscountAmount(parseFloat(appliedCoupon.discountValue));
                console.log(`Using fixed discount: ${appliedCoupon.discountValue}`);
            }
        } else {
            setDiscountAmount(0);
        }
    }, [appliedCoupon, subtotal]);

    const handleQuantityChange = (productId, newQuantity) => {
        if (newQuantity < 1) {
            newQuantity = 1; // Prevent going below 1
        }
        if (newQuantity <= 20) { // Set a reasonable max quantity
            updateQuantity(productId, newQuantity);
            setQuantities({ ...quantities, [productId]: newQuantity });
        }
    };

    const handleInputQuantityChange = (productId, event) => {
        const value = parseInt(event.target.value) || 1;
        const newQuantity = Math.max(1, Math.min(20, value)); // Between 1 and 20
        setQuantities({ ...quantities, [productId]: newQuantity });
    };

    const handleInputBlur = (productId) => {
        const newQuantity = quantities[productId] || 1;
        updateQuantity(productId, newQuantity);
    };

    const moveToWishlist = (item) => {
        // This would add to wishlist and remove from cart
        // For now just show an alert
        alert(`${item.name} moved to wishlist`);
        removeFromCart(item.productId);
    };

    // Function to validate and apply a coupon code
    const handleApplyCoupon = async (e) => {
        e.preventDefault();

        if (!couponCode.trim()) {
            setCouponError('Please enter a coupon code');
            return;
        }

        setIsApplyingCoupon(true);
        setCouponError('');

        try {
            const result = await contextApplyCoupon(couponCode, subtotal);

            if (!result.success) {
                setCouponError(result.message);
            } else {
                setCouponError('');
            }
        } catch (error) {
            console.error('Error applying coupon:', error);
            setCouponError('An error occurred. Please try again.');
        } finally {
            setIsApplyingCoupon(false);
            setShowCouponInput(false);
        }
    };

    // Function to remove an applied coupon
    const handleRemoveCoupon = () => {
        contextRemoveCoupon();
        setCouponCode('');
        setCouponError('');
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-8 mt-16">
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <h2 className="text-2xl font-bold mb-4">Please Sign In</h2>
                    <p className="text-gray-600 mb-6">
                        You need to be logged in to view your cart.
                    </p>
                    <Link
                        to="/login"
                        className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Sign In
                    </Link>
                </div>
            </div>
        );
    }

    if (cart.length === 0) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-8 mt-16">
                <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <svg
                        className="w-16 h-16 mx-auto mb-4 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                    </svg>
                    <h2 className="text-xl font-semibold mb-4">Your cart is empty</h2>
                    <p className="text-gray-600 mb-6">
                        Looks like you haven't added any items to your cart yet.
                    </p>
                    <Link
                        to="/"
                        className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Start Shopping
                    </Link>
                </div>
            </div>
        );
    }

    // Calculate shipping (free for orders over $50)
    const shippingCost = subtotal >= 50 ? 0 : 5.99;

    // Calculate tax (estimated at 8%)
    const taxEstimate = subtotal * 0.08;

    // Calculate final total
    const orderTotal = subtotal + shippingCost + taxEstimate - discountAmount;

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 mt-16">
            <h1 className="text-3xl font-bold mb-6">Shopping Cart ({cartCount} items)</h1>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Cart Items Section */}
                <div className="lg:w-3/4">
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
                        {/* Cart Header - Desktop only */}
                        <div className="hidden md:grid md:grid-cols-12 bg-gray-50 p-4 border-b text-sm font-medium text-gray-600">
                            <div className="col-span-6">Product</div>
                            <div className="col-span-2 text-center">Price</div>
                            <div className="col-span-2 text-center">Quantity</div>
                            <div className="col-span-2 text-right">Total</div>
                        </div>

                        {/* Cart Items */}
                        <div>
                            {cart.map((item) => (
                                <div key={`${item.productId}-${item.size}-${item.color}`}
                                    className="cart-item border-b last:border-b-0 p-4 hover:bg-gray-50 transition-colors">

                                    {/* Mobile Layout */}
                                    <div className="md:hidden">
                                        <div className="flex items-start">
                                            {/* Product Image */}
                                            <img
                                                src={item.thumbnail || item.image || '/assets/placeholder-product.jpg'}
                                                alt={item.name}
                                                className="w-20 h-20 object-cover rounded"
                                            />

                                            {/* Product Details */}
                                            <div className="ml-4 flex-grow">
                                                <h3 className="font-medium text-gray-900">{item.name}</h3>
                                                {item.size && (
                                                    <p className="text-sm text-gray-600">Size: {item.size}</p>
                                                )}
                                                {item.color && (
                                                    <p className="text-sm text-gray-600">Color: {item.color}</p>
                                                )}

                                                {/* Price */}
                                                <div className="flex justify-between items-center mt-2">
                                                    <span className="text-gray-900 font-medium">${parseFloat(item.price).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Quantity Controls */}
                                        <div className="flex justify-between items-center mt-4">
                                            <div className="flex items-center border rounded-md">
                                                <button
                                                    onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                                                    className="cart-qty-btn px-2 py-1 border-r"
                                                    aria-label="Decrease quantity"
                                                >
                                                    <FiMinusCircle size={16} />
                                                </button>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="20"
                                                    value={quantities[item.productId] || item.quantity}
                                                    onChange={(e) => handleInputQuantityChange(item.productId, e)}
                                                    onBlur={() => handleInputBlur(item.productId)}
                                                    className="cart-qty-input w-12 text-center py-1"
                                                    aria-label="Quantity"
                                                />
                                                <button
                                                    onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                                                    className="cart-qty-btn px-2 py-1 border-l"
                                                    aria-label="Increase quantity"
                                                >
                                                    <FiPlusCircle size={16} />
                                                </button>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center">
                                                <button
                                                    onClick={() => moveToWishlist(item)}
                                                    className="cart-action-btn mr-3"
                                                >
                                                    <FiHeart size={18} />
                                                </button>
                                                <button
                                                    onClick={() => removeFromCart(item.productId)}
                                                    className="cart-action-btn text-red-500"
                                                >
                                                    <FiTrash2 size={18} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Subtotal for Mobile */}
                                        <div className="mt-3 text-right">
                                            <span className="text-sm text-gray-600">Subtotal: </span>
                                            <span className="text-lg font-semibold">${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                                        </div>
                                    </div>

                                    {/* Desktop Layout */}
                                    <div className="hidden md:grid md:grid-cols-12 md:gap-4 md:items-center">
                                        {/* Product */}
                                        <div className="col-span-6">
                                            <div className="flex items-center">
                                                <img
                                                    src={item.thumbnail || item.image || '/assets/placeholder-product.jpg'}
                                                    alt={item.name}
                                                    className="w-16 h-16 object-cover rounded"
                                                />
                                                <div className="ml-4">
                                                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                                                    {item.size && (
                                                        <p className="text-sm text-gray-600">Size: {item.size}</p>
                                                    )}
                                                    {item.color && (
                                                        <p className="text-sm text-gray-600">Color: {item.color}</p>
                                                    )}

                                                    {/* Action Buttons */}
                                                    <div className="flex items-center mt-2 text-sm text-gray-600">
                                                        <button
                                                            onClick={() => removeFromCart(item.productId)}
                                                            className="hover:text-red-500 transition-colors flex items-center"
                                                        >
                                                            <FiTrash2 size={14} className="mr-1" /> Remove
                                                        </button>
                                                        <span className="mx-2">|</span>
                                                        <button
                                                            onClick={() => moveToWishlist(item)}
                                                            className="hover:text-blue-500 transition-colors flex items-center"
                                                        >
                                                            <FiHeart size={14} className="mr-1" /> Save for later
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Price */}
                                        <div className="col-span-2 text-center">
                                            <span className="text-gray-900">${parseFloat(item.price).toFixed(2)}</span>
                                        </div>

                                        {/* Quantity */}
                                        <div className="col-span-2 flex justify-center">
                                            <div className="flex items-center border rounded-md">
                                                <button
                                                    onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                                                    className="cart-qty-btn px-2 py-1 border-r"
                                                >
                                                    <FiMinusCircle size={16} />
                                                </button>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="20"
                                                    value={quantities[item.productId] || item.quantity}
                                                    onChange={(e) => handleInputQuantityChange(item.productId, e)}
                                                    onBlur={() => handleInputBlur(item.productId)}
                                                    className="cart-qty-input w-12 text-center py-1"
                                                />
                                                <button
                                                    onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                                                    className="cart-qty-btn px-2 py-1 border-l"
                                                >
                                                    <FiPlusCircle size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Total */}
                                        <div className="col-span-2 text-right">
                                            <span className="font-semibold text-gray-900">${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Additional Cart Actions */}
                    <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center mb-8">
                        <Link
                            to="/"
                            className="mb-4 sm:mb-0 text-blue-600 hover:text-blue-800 font-medium flex items-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                            </svg>
                            Continue Shopping
                        </Link>
                    </div>
                </div>

                {/* Order Summary Section */}
                <div className="lg:w-1/4">
                    <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
                        <h2 className="text-xl font-bold mb-4">Order Summary</h2>

                        <div className="space-y-4">
                            <div className="flex justify-between pb-4 border-b">
                                <span className="text-gray-600">Subtotal ({cartCount} items)</span>
                                <span className="font-medium">${subtotal.toFixed(2)}</span>
                            </div>

                            {/* Coupon Code Section */}
                            <div className="pb-4 border-b">
                                {!showCouponInput && !appliedCoupon && (
                                    <button
                                        onClick={() => setShowCouponInput(true)}
                                        className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center"
                                    >
                                        + Add Coupon Code
                                    </button>
                                )}

                                {showCouponInput && !appliedCoupon && (
                                    <div className="mt-2">
                                        <form onSubmit={handleApplyCoupon} className="flex flex-col">
                                            <div className="flex mb-2">
                                                <input
                                                    type="text"
                                                    value={couponCode}
                                                    onChange={(e) => setCouponCode(e.target.value)}
                                                    placeholder="Enter coupon code"
                                                    className="flex-grow border border-gray-300 rounded-l-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={isApplyingCoupon}
                                                    className="bg-blue-600 text-white px-3 py-2 rounded-r-md text-sm hover:bg-blue-700 disabled:opacity-50"
                                                >
                                                    {isApplyingCoupon ? 'Applying...' : 'Apply'}
                                                </button>
                                            </div>
                                            {couponError && (
                                                <p className="text-red-500 text-xs mb-2">{couponError}</p>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => setShowCouponInput(false)}
                                                className="text-gray-500 text-xs hover:text-gray-700"
                                            >
                                                Cancel
                                            </button>
                                        </form>
                                    </div>
                                )}

                                {appliedCoupon && (
                                    <div className="mt-2">
                                        <div className="flex justify-between items-center bg-green-50 px-3 py-2 rounded-md border border-green-200">
                                            <div>
                                                <span className="text-green-700 font-medium text-sm">{appliedCoupon.code}</span>
                                                <p className="text-green-600 text-xs">
                                                    {appliedCoupon.discountType === 'percentage'
                                                        ? `${appliedCoupon.discountValue}% off`
                                                        : `$${appliedCoupon.discountValue} off`}
                                                </p>
                                            </div>
                                            <button
                                                onClick={handleRemoveCoupon}
                                                className="text-gray-500 hover:text-red-500"
                                            >
                                                <FiX size={18} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Display discount if a coupon is applied */}
                            {appliedCoupon && (
                                <div className="flex justify-between text-green-600">
                                    <span>Discount</span>
                                    <span>-${discountAmount.toFixed(2)}</span>
                                </div>
                            )}

                            <div className="flex justify-between">
                                <span className="text-gray-600">Shipping</span>
                                {shippingCost === 0 ? (
                                    <span className="font-medium text-green-600">Free</span>
                                ) : (
                                    <span className="font-medium">${shippingCost.toFixed(2)}</span>
                                )}
                            </div>

                            {shippingCost > 0 && (
                                <div className="text-sm text-green-600">
                                    Add ${(50 - subtotal).toFixed(2)} more to qualify for FREE shipping
                                </div>
                            )}

                            <div className="flex justify-between">
                                <span className="text-gray-600">Estimated Tax</span>
                                <span className="font-medium">${taxEstimate.toFixed(2)}</span>
                            </div>

                            <div className="pt-4 border-t">
                                <div className="flex justify-between mb-2">
                                    <span className="font-bold text-lg">Order Total</span>
                                    <span className="font-bold text-lg">${orderTotal.toFixed(2)}</span>
                                </div>

                                {/* Show savings if applicable */}
                                {(shippingCost === 0 || appliedCoupon) && (
                                    <div className="text-green-600 text-sm text-right mb-4">
                                        You're saving ${(() => {
                                            // Calculate shipping savings
                                            const shippingSavings = shippingCost === 0 ? 5.99 : 0;

                                            // Calculate coupon discount (ensure it's a number)
                                            const couponSavings = appliedCoupon ? parseFloat(discountAmount) || 0 : 0;

                                            // Calculate total savings and format to 2 decimal places
                                            const totalSavings = shippingSavings + couponSavings;
                                            return totalSavings.toFixed(2);
                                        })()}!
                                    </div>
                                )}
                            </div>
                        </div>

                        <Link
                            to="/checkout"
                            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md transition-colors duration-300 block text-center"
                        >
                            Proceed to Checkout
                        </Link>

                        <div className="mt-4 text-center">
                            <div className="text-sm text-gray-500 mb-2">We accept</div>
                            <div className="flex justify-center space-x-2">
                                <div className="w-10 h-6 bg-gray-200 rounded"></div>
                                <div className="w-10 h-6 bg-gray-200 rounded"></div>
                                <div className="w-10 h-6 bg-gray-200 rounded"></div>
                                <div className="w-10 h-6 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage; 