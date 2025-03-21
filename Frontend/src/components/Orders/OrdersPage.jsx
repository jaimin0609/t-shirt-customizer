import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { orderService } from '../../services/orderService';

// Import components
import OrderList from './OrderList';
import EmptyOrders from './EmptyOrders';
import LoadingIndicator from './LoadingIndicator';
import ErrorDisplay from './ErrorDisplay';

// Import utilities
import { getImageUrl } from './orderUtils';

/**
 * Main OrdersPage component that displays a user's order history
 */
const OrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            fetchOrders();
        } else {
            setLoading(false);
        }
    }, [user]);

    /**
     * Fetch orders from the API
     */
    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await orderService.getUserOrders();
            setOrders(data);
        } catch (err) {
            console.error('Error fetching orders:', err);
            setError(err.message || 'Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Handle cancelling an order
     * @param {string} orderNumber - Order number to cancel
     */
    const handleCancelOrder = async (orderNumber) => {
        try {
            await orderService.cancelOrder(orderNumber);
            // Refresh orders after cancellation
            fetchOrders();
        } catch (err) {
            console.error('Error cancelling order:', err);
            setError(err.message || 'Failed to cancel order');
        }
    };

    // Render loading state
    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <LoadingIndicator />
            </div>
        );
    }

    // Render error state
    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <ErrorDisplay error={error} onRetry={fetchOrders} />
            </div>
        );
    }

    // Render when user is not logged in or no orders are found
    if (!user || orders.length === 0) {
        return (
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold mb-6">Your Orders</h1>
                <EmptyOrders isLoggedIn={!!user} />
            </div>
        );
    }

    // Render orders list
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">Your Orders</h1>
            <OrderList
                orders={orders}
                handleCancelOrder={handleCancelOrder}
                getImageUrl={getImageUrl}
            />
        </div>
    );
};

export default OrdersPage; 