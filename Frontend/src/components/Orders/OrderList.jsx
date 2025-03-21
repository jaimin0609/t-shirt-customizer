import React from 'react';
import OrderItem from './OrderItem';

/**
 * Component that displays a list of orders
 */
const OrderList = ({ orders, handleCancelOrder, getImageUrl }) => {
    if (orders.length === 0) {
        return <p className="text-center text-gray-600">No orders found.</p>;
    }

    return (
        <div className="space-y-6">
            {orders.map(order => (
                <OrderItem
                    key={order.id}
                    order={order}
                    handleCancelOrder={handleCancelOrder}
                    getImageUrl={getImageUrl}
                />
            ))}
        </div>
    );
};

export default OrderList; 