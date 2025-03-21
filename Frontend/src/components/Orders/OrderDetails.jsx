import React from 'react';

/**
 * Component for displaying order details (payment method, shipping address, tracking)
 */
const OrderDetails = ({ paymentMethod, paymentStatus, trackingNumber, trackingCarrier, shippingAddress }) => {
    // Format shipping address based on the type of data we receive
    const formatShippingAddress = () => {
        if (typeof shippingAddress === 'object') {
            return `${shippingAddress.street}, ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zipCode}, ${shippingAddress.country}`;
        }
        return typeof shippingAddress === 'string' ? shippingAddress : JSON.stringify(shippingAddress);
    };

    return (
        <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
                <p>Payment Method: {paymentMethod}</p>
                <p>Payment Status: {paymentStatus}</p>

                {trackingNumber && (
                    <p>Tracking: {trackingNumber} ({trackingCarrier || 'N/A'})</p>
                )}

                <p>Shipping Address: {formatShippingAddress()}</p>
            </div>
        </div>
    );
};

export default OrderDetails; 