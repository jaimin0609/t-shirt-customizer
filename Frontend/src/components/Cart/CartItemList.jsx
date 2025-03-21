import React from 'react';
import { FiTrash2, FiPlusCircle, FiMinusCircle, FiHeart } from 'react-icons/fi';

const CartItemList = ({
    cart,
    quantities,
    handleQuantityChange,
    handleInputQuantityChange,
    handleInputBlur,
    moveToWishlist,
    removeFromCart,
    formatPrice,
    getImageUrl
}) => {
    return (
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
                                <div className="product-image">
                                    <img
                                        src={item.image || item.product?.image || 'https://placehold.co/200x200?text=No+Image'}
                                        alt={item.name}
                                        className="w-24 h-24 object-cover rounded"
                                        onError={(e) => {
                                            e.target.onerror = null; // Prevent infinite loop
                                            e.target.src = 'https://placehold.co/200x200?text=No+Image';
                                        }}
                                    />
                                </div>

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
                                        <span className="text-gray-900 font-medium">{formatPrice(item.price)}</span>
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
                                <span className="text-lg font-semibold">{formatPrice(parseFloat(item.price) * item.quantity)}</span>
                            </div>
                        </div>

                        {/* Desktop Layout */}
                        <div className="hidden md:grid md:grid-cols-12 md:gap-4 md:items-center">
                            {/* Product */}
                            <div className="col-span-6">
                                <div className="flex items-center">
                                    <div className="product-image">
                                        <img
                                            src={item.image || item.product?.image || 'https://placehold.co/200x200?text=No+Image'}
                                            alt={item.name}
                                            className="w-24 h-24 object-cover rounded"
                                            onError={(e) => {
                                                e.target.onerror = null; // Prevent infinite loop
                                                e.target.src = 'https://placehold.co/200x200?text=No+Image';
                                            }}
                                        />
                                    </div>
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
                                <span className="text-gray-900">{formatPrice(item.price)}</span>
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
                                <span className="font-semibold text-gray-900">{formatPrice(parseFloat(item.price) * item.quantity)}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CartItemList; 