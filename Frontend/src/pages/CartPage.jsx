import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPlus, faMinus, faArrowLeft, faCreditCard } from '@fortawesome/free-solid-svg-icons';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const CartPage = () => {
    const { cart, loading, updateQuantity, removeFromCart, clearCart } = useCart();
    const navigate = useNavigate();

    // Calculate subtotal
    const subtotal = cart.reduce((total, item) => {
        const price = item.discountedPrice || item.price;
        return total + price * item.quantity;
    }, 0);

    // Simulate shipping calculation
    const shipping = subtotal > 50 ? 0 : 5.99;

    // Calculate tax (e.g., 8%)
    const tax = subtotal * 0.08;

    // Calculate total
    const total = subtotal + shipping + tax;

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <LoadingSpinner />
            </div>
        );
    }

    if (cart.length === 0) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-white rounded-lg shadow-md p-6 text-center">
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">Your Cart is Empty</h1>
                    <p className="text-gray-600 mb-6">Looks like you haven't added any items to your cart yet.</p>
                    <Link
                        to="/products"
                        className="inline-block bg-blue-600 text-white font-medium px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-300"
                    >
                        Start Shopping
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Your Shopping Cart</h1>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Cart Items */}
                <div className="lg:w-2/3">
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        <div className="p-4 border-b">
                            <h2 className="text-xl font-semibold">Items ({cart.length})</h2>
                        </div>

                        <ul className="divide-y divide-gray-200">
                            {cart.map((item) => (
                                <li key={`${item.id}-${item.size}-${item.color}`} className="p-4 flex flex-col sm:flex-row">
                                    {/* Product Image */}
                                    <div className="sm:w-24 h-24 flex-shrink-0 mr-4 mb-4 sm:mb-0">
                                        <img
                                            src={item.images?.[0] || '/images/product-placeholder.jpg'}
                                            alt={item.name}
                                            className="w-full h-full object-cover rounded"
                                        />
                                    </div>

                                    {/* Product Details */}
                                    <div className="flex-1">
                                        <div className="flex flex-col sm:flex-row sm:justify-between">
                                            <div>
                                                <h3 className="font-medium text-gray-800">{item.name}</h3>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    Size: {item.size || 'N/A'} | Color: {item.color || 'N/A'}
                                                </p>
                                            </div>
                                            <div className="mt-2 sm:mt-0 text-right">
                                                <p className="font-medium text-gray-800">
                                                    ${(item.discountedPrice || item.price).toFixed(2)}
                                                </p>
                                                {item.discountedPrice && (
                                                    <p className="text-sm text-gray-500 line-through">
                                                        ${item.price.toFixed(2)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Quantity and Remove */}
                                        <div className="flex justify-between items-center mt-4">
                                            <div className="flex items-center border rounded-md">
                                                <button
                                                    onClick={() => updateQuantity(item, Math.max(1, item.quantity - 1))}
                                                    className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                                                    aria-label="Decrease quantity"
                                                >
                                                    <FontAwesomeIcon icon={faMinus} />
                                                </button>
                                                <span className="px-3 py-1 text-gray-800">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item, item.quantity + 1)}
                                                    className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                                                    aria-label="Increase quantity"
                                                >
                                                    <FontAwesomeIcon icon={faPlus} />
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(item)}
                                                className="text-red-500 hover:text-red-700 transition duration-300"
                                                aria-label="Remove item"
                                            >
                                                <FontAwesomeIcon icon={faTrash} className="mr-1" />
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        <div className="p-4 border-t flex justify-between items-center">
                            <button
                                onClick={() => navigate('/products')}
                                className="text-blue-600 hover:text-blue-800 transition duration-300"
                            >
                                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                                Continue Shopping
                            </button>
                            <button
                                onClick={() => clearCart()}
                                className="text-red-500 hover:text-red-700 transition duration-300"
                            >
                                <FontAwesomeIcon icon={faTrash} className="mr-2" />
                                Clear Cart
                            </button>
                        </div>
                    </div>
                </div>

                {/* Order Summary */}
                <div className="lg:w-1/3">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="text-gray-800 font-medium">${subtotal.toFixed(2)}</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-600">Shipping</span>
                                <span className="text-gray-800 font-medium">
                                    {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-600">Tax (8%)</span>
                                <span className="text-gray-800 font-medium">${tax.toFixed(2)}</span>
                            </div>

                            <div className="border-t pt-4 mt-4">
                                <div className="flex justify-between">
                                    <span className="text-lg font-semibold">Total</span>
                                    <span className="text-lg text-blue-600 font-semibold">${total.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="mt-6">
                                <button
                                    onClick={() => navigate('/checkout')}
                                    className="w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 transition duration-300 flex items-center justify-center"
                                >
                                    <FontAwesomeIcon icon={faCreditCard} className="mr-2" />
                                    Proceed to Checkout
                                </button>
                            </div>

                            <div className="mt-4 text-center text-sm text-gray-500">
                                <p>Secure checkout powered by Stripe</p>
                                <p className="mt-2">Free shipping on orders over $50</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage; 