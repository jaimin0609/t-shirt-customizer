import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { orderService } from '../../services/orderService';

const OrderStatus = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
};

const OrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useContext(AuthContext);

    // Get the image URL, handling both backend and frontend image paths
    const getImageUrl = (imagePath) => {
        if (!imagePath) return '/assets/placeholder-product.jpg';

        // If it's a backend image path (starts with /uploads)
        if (imagePath.startsWith('/uploads')) {
            return `http://localhost:5002${imagePath}`;
        }

        // Otherwise, use the path as is (for frontend static images)
        return imagePath;
    };

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await orderService.getUserOrders();
                setOrders(data);
            } catch (err) {
                console.error('Error fetching orders:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchOrders();
        }
    }, [user]);

    const handleCancelOrder = async (orderNumber) => {
        try {
            await orderService.cancelOrder(orderNumber);
            // Refresh orders after cancellation
            const updatedOrders = await orderService.getUserOrders();
            setOrders(updatedOrders);
        } catch (err) {
            console.error('Error cancelling order:', err);
            setError(err.message);
        }
    };

    if (!user) {
        return (
            <div className="container mx-auto px-4 py-8">
                <p className="text-center text-gray-600">Please log in to view your orders.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <p className="text-center text-gray-600">Loading orders...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <p className="text-center text-red-600">Error: {error}</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">Your Orders</h1>

            {orders.length === 0 ? (
                <p className="text-center text-gray-600">No orders found.</p>
            ) : (
                <div className="space-y-6">
                    {orders.map(order => (
                        <div key={order.id} className="border rounded-lg p-6 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-lg font-semibold">Order #{order.orderNumber}</h2>
                                    <p className="text-sm text-gray-500">
                                        Placed on {new Date(order.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className={`px-3 py-1 rounded-full text-sm ${OrderStatus[order.status]}`}>
                                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                    </span>

                                    {order.status === 'pending' && (
                                        <button
                                            onClick={() => handleCancelOrder(order.orderNumber)}
                                            className="text-sm text-red-600 hover:text-red-800"
                                        >
                                            Cancel Order
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex items-center gap-4">
                                        <div className="w-20 h-20 bg-gray-100 rounded">
                                            {item.image && (
                                                <img
                                                    src={getImageUrl(item.image)}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover rounded"
                                                />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-medium">{item.name}</h3>
                                            {item.customization && (
                                                <p className="text-sm text-gray-500">
                                                    Customization: {JSON.stringify(item.customization)}
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

                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="flex flex-col gap-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Subtotal</span>
                                        <span>${parseFloat(order.subtotal).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Shipping</span>
                                        <span>${parseFloat(order.shipping).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center font-bold text-lg">
                                        <span>Total</span>
                                        <span>${parseFloat(order.total).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="text-sm text-gray-600">
                                    <p>Payment Method: {order.paymentMethod}</p>
                                    <p>Payment Status: {order.paymentStatus}</p>
                                    {order.trackingNumber && (
                                        <p>Tracking: {order.trackingNumber} ({order.trackingCarrier || 'N/A'})</p>
                                    )}
                                    <p>Shipping Address: {typeof order.shippingAddress === 'object'
                                        ? `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}, ${order.shippingAddress.country}`
                                        : JSON.stringify(order.shippingAddress)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OrdersPage; 