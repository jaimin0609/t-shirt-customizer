import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrderById } from '../services/orderService';
import LoadingIndicator from '../components/Orders/LoadingIndicator.styled';
import ErrorDisplay from '../components/Orders/ErrorDisplay.styled';
import OrderItemsList from '../components/Orders/OrderItemsList.styled';
import OrderSummary from '../components/Orders/OrderSummary.styled';
import OrderDetails from '../components/Orders/OrderDetails.styled';
import OrderStatus from '../components/Orders/OrderStatus.styled';
import { getImageUrl } from '../utils/imageUtils';
import { formatDate } from '../utils/dateUtils';

/**
 * Page component for displaying detailed information about a specific order
 */
const OrderDetailPage = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadOrderDetails();
    }, [orderId]);

    const loadOrderDetails = async () => {
        try {
            setLoading(true);
            setError(null);
            const orderData = await getOrderById(orderId);
            setOrder(orderData);
        } catch (err) {
            console.error('Error loading order details:', err);
            setError(err.message || 'Failed to load order details');
        } finally {
            setLoading(false);
        }
    };

    const handleGoBack = () => {
        navigate('/orders');
    };

    if (loading) {
        return <LoadingIndicator message="Loading order details..." />;
    }

    if (error) {
        return <ErrorDisplay error={error} onRetry={loadOrderDetails} />;
    }

    if (!order) {
        return <ErrorDisplay error="Order not found" />;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Order #{order.orderNumber}</h1>
                <button
                    onClick={handleGoBack}
                    className="text-blue-600 hover:text-blue-800"
                >
                    ← Back to Orders
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <p className="text-gray-600">
                        Placed on {formatDate(order.createdAt)}
                    </p>
                    <OrderStatus status={order.status} />
                </div>

                <OrderItemsList
                    items={order.items}
                    getImageUrl={getImageUrl}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <OrderDetails
                        shippingAddress={order.shippingAddress}
                        paymentMethod={order.paymentMethod}
                        paymentStatus={order.paymentStatus}
                        trackingNumber={order.trackingNumber}
                        trackingCarrier={order.trackingCarrier}
                    />

                    <OrderSummary
                        subtotal={order.subtotal}
                        shipping={order.shipping}
                        tax={order.tax}
                        total={order.total}
                    />
                </div>
            </div>
        </div>
    );
};

export default OrderDetailPage; 