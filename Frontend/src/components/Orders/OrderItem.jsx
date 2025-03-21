import React from 'react';
import OrderStatus from './OrderStatus';
import OrderDetails from './OrderDetails';
import OrderItemsList from './OrderItemsList';
import OrderSummary from './OrderSummary';

/**
 * Component that displays a single order with all its details
 */
const OrderItem = ({ order, handleCancelOrder, getImageUrl }) => {
    return (
        <div className="border rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className="text-lg font-semibold">Order #{order.orderNumber}</h2>
                    <p className="text-sm text-gray-500">
                        Placed on {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                </div>
                <OrderStatus
                    status={order.status}
                    orderNumber={order.orderNumber}
                    handleCancelOrder={handleCancelOrder}
                />
            </div>

            <OrderItemsList
                items={order.items}
                getImageUrl={getImageUrl}
            />

            <OrderSummary
                subtotal={order.subtotal}
                shipping={order.shipping}
                total={order.total}
            />

            <OrderDetails
                paymentMethod={order.paymentMethod}
                paymentStatus={order.paymentStatus}
                trackingNumber={order.trackingNumber}
                trackingCarrier={order.trackingCarrier}
                shippingAddress={order.shippingAddress}
            />
        </div>
    );
};

export default OrderItem; 