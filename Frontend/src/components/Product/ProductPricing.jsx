import React from 'react';
import { formatPrice } from '../../services/discountService';

/**
 * Component for displaying product pricing information including discounts
 * 
 * @param {Object} props - Component properties
 * @param {Object} props.priceInfo - Information about product price and discounts
 * @param {number} props.priceInfo.originalPrice - Original price before discounts
 * @param {number} props.priceInfo.finalPrice - Final price after discounts
 * @param {Object} props.priceInfo.discount - Discount information if available
 * @param {boolean} props.isLoading - Whether price information is loading
 */
const ProductPricing = ({ priceInfo, isLoading }) => {
    if (isLoading) {
        return (
            <div className="mb-4">
                <div className="h-7 w-24 bg-gray-200 animate-pulse rounded"></div>
            </div>
        );
    }

    if (!priceInfo) {
        return (
            <div className="mb-4">
                <p className="text-xl font-bold text-gray-900">Price unavailable</p>
            </div>
        );
    }

    const { originalPrice, finalPrice, discount } = priceInfo;
    const hasDiscount = originalPrice !== finalPrice;

    return (
        <div className="mb-4">
            <div className="flex items-baseline">
                <p className="text-2xl font-bold text-gray-900 mr-2">
                    {formatPrice(finalPrice)}
                </p>

                {hasDiscount && (
                    <>
                        <p className="text-lg text-gray-500 line-through">
                            {formatPrice(originalPrice)}
                        </p>
                        <span className="ml-2 px-2 py-1 text-sm font-semibold text-white bg-red-500 rounded">
                            {discount?.percentage ? `${discount.percentage}% OFF` : 'SALE'}
                        </span>
                    </>
                )}
            </div>

            {hasDiscount && discount?.name && (
                <p className="text-sm text-gray-600 mt-1">
                    {discount.name} applied
                </p>
            )}

            {hasDiscount && discount?.endsAt && (
                <p className="text-sm text-red-600 mt-1">
                    Offer ends: {new Date(discount.endsAt).toLocaleDateString()}
                </p>
            )}
        </div>
    );
};

export default ProductPricing; 