import React, { useState } from 'react';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Component for product action buttons (add to cart, wishlist, etc.)
 * 
 * @param {Object} props - Component properties
 * @param {Function} props.onAddToCart - Function to handle add to cart
 * @param {Function} props.onToggleWishlist - Function to handle wishlist toggle
 * @param {boolean} props.isInWishlist - Whether product is in wishlist
 * @param {boolean} props.isInStock - Whether product is in stock
 * @param {Array} props.variants - Product variants if any
 * @param {Object} props.selectedOptions - Currently selected options
 * @param {Function} props.onOptionChange - Function to handle option changes
 * @param {number} props.quantity - Current quantity selected
 * @param {Function} props.onQuantityChange - Function to handle quantity changes
 */
const ProductActions = ({
    onAddToCart,
    onToggleWishlist,
    isInWishlist = false,
    isInStock = true,
    variants = [],
    selectedOptions = {},
    onOptionChange,
    quantity = 1,
    onQuantityChange,
}) => {
    const { isAuthenticated } = useAuth();
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);

    // Handle wishlist toggle with authentication check
    const handleWishlistToggle = () => {
        if (!isAuthenticated) {
            setShowLoginPrompt(true);
            return;
        }

        onToggleWishlist();
        setShowLoginPrompt(false);
    };

    // Handle quantity change
    const handleQuantityChange = (e) => {
        const value = parseInt(e.target.value);
        if (value > 0 && value <= 10) {
            onQuantityChange(value);
        }
    };

    // Generate options for select boxes
    const renderVariantOptions = () => {
        if (!variants || variants.length === 0) return null;

        // Group variants by option type (color, size, etc.)
        const optionTypes = {};
        variants.forEach(variant => {
            if (variant.options) {
                Object.entries(variant.options).forEach(([key, value]) => {
                    if (!optionTypes[key]) {
                        optionTypes[key] = new Set();
                    }
                    optionTypes[key].add(value);
                });
            }
        });

        // Render select boxes for each option type
        return Object.entries(optionTypes).map(([optionName, valuesSet]) => {
            const values = Array.from(valuesSet);
            return (
                <div key={optionName} className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                        {optionName}
                    </label>
                    <select
                        value={selectedOptions[optionName] || ''}
                        onChange={(e) => onOptionChange(optionName, e.target.value)}
                        className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">Select {optionName}</option>
                        {values.map(value => (
                            <option key={value} value={value}>
                                {value}
                            </option>
                        ))}
                    </select>
                </div>
            );
        });
    };

    return (
        <div className="mt-6">
            {/* Variant Selection */}
            {renderVariantOptions()}

            {/* Quantity Selector */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                </label>
                <select
                    value={quantity}
                    onChange={handleQuantityChange}
                    className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    {[...Array(10)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                            {i + 1}
                        </option>
                    ))}
                </select>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <button
                    onClick={onAddToCart}
                    disabled={!isInStock}
                    className={`flex-1 py-3 px-6 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${isInStock
                        ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                        : 'bg-gray-400 cursor-not-allowed'
                        }`}
                >
                    {isInStock ? 'Add to Cart' : 'Out of Stock'}
                </button>

                <button
                    onClick={handleWishlistToggle}
                    className="flex items-center justify-center py-3 px-6 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    {isInWishlist ? (
                        <HeartIconSolid className="h-5 w-5 text-red-500" />
                    ) : (
                        <HeartIcon className="h-5 w-5 text-gray-600" />
                    )}
                    <span className="ml-2">{isInWishlist ? 'Saved' : 'Save'}</span>
                </button>
            </div>

            {/* Login Prompt */}
            {showLoginPrompt && (
                <div className="mt-3 text-sm text-red-600">
                    Please <a href="/login" className="underline">log in</a> to save items to your wishlist
                </div>
            )}

            {/* Stock Status */}
            <div className="mt-4">
                <p className={`text-sm ${isInStock ? 'text-green-600' : 'text-red-600'}`}>
                    {isInStock ? 'In Stock' : 'Currently Out of Stock'}
                </p>
            </div>
        </div>
    );
};

export default ProductActions; 