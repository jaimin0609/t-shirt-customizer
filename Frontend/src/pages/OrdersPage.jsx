import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getOrders, cancelOrder } from '../services/orderService';
import LoadingIndicator from '../components/Orders/LoadingIndicator.styled';
import ErrorDisplay from '../components/Orders/ErrorDisplay.styled';
import EmptyOrders from '../components/Orders/EmptyOrders.styled';
import OrderList from '../components/Orders/OrderList.styled';
import { getImageUrl } from '../utils/imageUtils';

/**
 * Main page component that displays the user's order history
 */
const OrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            loadOrders();
        } else {
            setLoading(false);
        }
    }, [user]);

    const loadOrders = async () => {
        try {
            setLoading(true);
            setError(null);
            const ordersData = await getOrders();
            setOrders(ordersData);
        } catch (err) {
            console.error('Error loading orders:', err);
            setError(err.message || 'Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelOrder = async (orderId) => {
        try {
            await cancelOrder(orderId);
            // Refresh the orders list after cancellation
            loadOrders();
        } catch (err) {
            console.error('Error cancelling order:', err);
            setError(err.message || 'Failed to cancel order');
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <LoadingIndicator />
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <ErrorDisplay error={error} onRetry={loadOrders} />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold mb-6">Your Orders</h1>
                <EmptyOrders isLoggedIn={false} />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">Your Orders</h1>
            {orders.length === 0 ? (
                <EmptyOrders isLoggedIn={true} />
            ) : (
                <OrderList
                    orders={orders}
                    handleCancelOrder={handleCancelOrder}
                    getImageUrl={getImageUrl}
                />
            )}
        </div>
    );
};

export default OrdersPage; 