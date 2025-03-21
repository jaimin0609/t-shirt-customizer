import React from 'react';
import { Link } from 'react-router-dom';

const ProductCard = ({ product, getImageUrl }) => {
    // Format price with proper currency symbol and decimals
    const formatPrice = (price) => {
        if (typeof price !== 'number') {
            // Try to convert to number if it's a string
            price = parseFloat(price);
        }

        if (isNaN(price)) {
            return '$0.00';
        }

        return `$${price.toFixed(2)}`;
    };

    // Calculate discount percentage
    const calculateDiscount = (originalPrice, currentPrice) => {
        if (!originalPrice || !currentPrice) return null;

        const original = parseFloat(originalPrice);
        const current = parseFloat(currentPrice);

        if (isNaN(original) || isNaN(current) || original <= current) {
            return null;
        }

        const discount = Math.round(((original - current) / original) * 100);
        return discount;
    };

    const discount = calculateDiscount(product.originalPrice, product.price);

    return (
        <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 transition-transform duration-300 hover:shadow-md hover:-translate-y-1">
            <Link to={`/product/${product.id}`} className="block relative h-48 overflow-hidden">
                <img
                    src={getImageUrl(product)}
                    alt={product.name}
                    className="object-cover object-center w-full h-full"
                    loading="lazy"
                    onError={(e) => {
                        e.target.src = '/assets/placeholder-product.jpg';
                    }}
                />
                {discount && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                        {discount}% OFF
                    </div>
                )}
            </Link>
            <div className="p-4">
                <Link to={`/product/${product.id}`} className="block">
                    <h3 className="text-gray-900 font-medium text-lg mb-1 hover:text-blue-600 transition-colors">
                        {product.name}
                    </h3>
                </Link>
                <p className="text-gray-500 text-sm mb-2 line-clamp-2">{product.shortDescription || product.description}</p>
                <div className="flex items-center justify-between mt-2">
                    <div>
                        <span className="text-gray-900 font-bold">
                            {formatPrice(product.price)}
                        </span>
                        {discount && (
                            <span className="text-gray-500 text-sm line-through ml-2">
                                {formatPrice(product.originalPrice)}
                            </span>
                        )}
                    </div>
                    {product.rating && (
                        <div className="flex items-center">
                            <svg className="w-4 h-4 text-yellow-500 fill-current" viewBox="0 0 20 20">
                                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                            </svg>
                            <span className="text-gray-600 text-sm ml-1">{product.rating}</span>
                        </div>
                    )}
                </div>
                <div className="mt-3">
                    <Link
                        to={`/product/${product.id}`}
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        View Details
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ProductCard; 