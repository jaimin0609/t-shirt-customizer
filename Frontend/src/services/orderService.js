import api from './apiClient';

/**
 * Fetch all orders for the current user
 * @returns {Promise<Array>} Array of order objects
 */
const getOrders = async () => {
  try {
    const response = await api.get('/orders');
    return response.data;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch orders');
  }
};

/**
 * Fetch a specific order by ID
 * @returns {Promise<Object>} Order object
 */
const getOrderById = async (orderId) => {
  try {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching order ${orderId}:`, error);
    throw new Error(error.response?.data?.message || 'Failed to fetch order details');
  }
};

/**
 * Cancel an order
 * @returns {Promise<Object>} Updated order object
 */
const cancelOrder = async (orderId) => {
  try {
    const response = await api.post(`/orders/${orderId}/cancel`);
    return response.data;
  } catch (error) {
    console.error(`Error cancelling order ${orderId}:`, error);
    throw new Error(error.response?.data?.message || 'Failed to cancel order');
  }
};

/**
 * Create a new order
 * @returns {Promise<Object>} Created order object
 */
const createOrder = async (orderData) => {
  try {
    const response = await api.post('/orders', orderData);
    return response.data;
  } catch (error) {
    console.error('Error creating order:', error);
    throw new Error(error.response?.data?.message || 'Failed to create order');
  }
};

// Get order by order number
const getOrderByNumber = async (orderNumber) => {
    try {
        const response = await api.get(`/orders/by-number/${orderNumber}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching order ${orderNumber}:`, error);
        throw new Error(error.response?.data?.message || 'Failed to fetch order');
    }
};

const orderService = {
    getOrders,
    getOrderById,
    cancelOrder,
    createOrder,
    getOrderByNumber,
    getUserOrders: getOrders // Alias for getOrders to match the usage in OrdersPage
};

export default orderService; 