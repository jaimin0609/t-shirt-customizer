import React from 'react';

/**
 * Available status colors mapping
 */
export const STATUS_CLASSES = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
};

/**
 * Component that displays order status with appropriate styling
 * and cancel button if applicable
 */
const OrderStatus = ({ status, orderNumber, handleCancelOrder }) => {
    // Format status text for display (capitalize first letter)
    const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1);

    return (
        <div className="flex flex-col items-end gap-2">
            <span className={`px-3 py-1 rounded-full text-sm ${STATUS_CLASSES[status]}`}>
                {formattedStatus}
            </span>

            {status === 'pending' && (
                <button
                    onClick={() => handleCancelOrder(orderNumber)}
                    className="text-sm text-red-600 hover:text-red-800"
                >
                    Cancel Order
                </button>
            )}
        </div>
    );
};

export default OrderStatus; 