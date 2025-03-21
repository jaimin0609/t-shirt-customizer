import React from 'react';

/**
 * Component that displays the list of items in an order
 */
const OrderItemsList = ({ items, getImageUrl }) => {
    return (
        <div className="space-y-4">
            {items.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-gray-100 rounded">
                        {item.image && (
                            <img
                                src={getImageUrl(item.image)}
                                alt={item.name}
                                className="w-full h-full object-cover rounded"
                                onError={(e) => {
                                    e.target.onerror = null; // Prevent infinite loop
                                    e.target.src = '/assets/placeholder-product.jpg';
                                }}
                            />
                        )}
                    </div>
                    <div className="flex-1">
                        <h3 className="font-medium">{item.name}</h3>
                        {item.customization && (
                            <p className="text-sm text-gray-500">
                                Customization: {typeof item.customization === 'string'
                                    ? item.customization
                                    : JSON.stringify(item.customization)}
                            </p>
                        )}
                        <p className="text-sm text-gray-500">
                            Quantity: {item.quantity}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="font-medium">
                            ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default OrderItemsList; 