import React from 'react';

/**
 * Component for displaying the order summary (subtotal, shipping, total)
 */
const OrderSummary = ({ subtotal, shipping, total }) => {
    return (
        <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                    <span className="text-gray-600">Subtotal</span>
                    <span>${parseFloat(subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-600">Shipping</span>
                    <span>${parseFloat(shipping).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center font-bold text-lg">
                    <span>Total</span>
                    <span>${parseFloat(total).toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
};

export default OrderSummary; 