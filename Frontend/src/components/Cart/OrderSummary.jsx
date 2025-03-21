import React from 'react';
import { Link } from 'react-router-dom';
import { FiX } from 'react-icons/fi';

const OrderSummary = ({
    cartCount,
    subtotal,
    showCouponInput,
    setShowCouponInput,
    couponCode,
    setCouponCode,
    appliedCoupon,
    handleApplyCoupon,
    handleRemoveCoupon,
    isApplyingCoupon,
    couponError,
    discountAmount,
    shippingCost,
    taxEstimate,
    orderTotal,
    formatPrice
}) => {
    return (
        <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>

            <div className="space-y-4">
                <div className="flex justify-between pb-4 border-b">
                    <span className="text-gray-600">Subtotal ({cartCount} items)</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
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
                        <span>-{formatPrice(discountAmount)}</span>
                    </div>
                )}

                <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    {shippingCost === 0 ? (
                        <span className="font-medium text-green-600">Free</span>
                    ) : (
                        <span className="font-medium">{formatPrice(shippingCost)}</span>
                    )}
                </div>

                {shippingCost > 0 && (
                    <div className="text-sm text-green-600">
                        Add ${Math.max(0, (50 - subtotal)).toFixed(2)} more to qualify for FREE shipping
                    </div>
                )}

                <div className="flex justify-between">
                    <span className="text-gray-600">Estimated Tax</span>
                    <span className="font-medium">{formatPrice(taxEstimate)}</span>
                </div>

                <div className="pt-4 border-t">
                    <div className="flex justify-between mb-2">
                        <span className="font-bold text-lg">Order Total</span>
                        <span className="font-bold text-lg">{formatPrice(orderTotal)}</span>
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
    );
};

export default OrderSummary; 