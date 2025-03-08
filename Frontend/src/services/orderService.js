import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// Configure axios with credentials
axios.defaults.withCredentials = true;

export const orderService = {
    // Get user's orders
    getUserOrders: async () => {
        try {
            const response = await axios.get(`${API_URL}/orders`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to fetch user orders');
        }
    },

    // Get order by ID
    getOrderById: async (id) => {
        try {
            const response = await axios.get(`${API_URL}/orders/${id}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to fetch order');
        }
    },

    // Get order by order number
    getOrderByNumber: async (orderNumber) => {
        try {
            const response = await axios.get(`${API_URL}/orders/by-number/${orderNumber}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to fetch order');
        }
    },

    // Create new order
    createOrder: async (orderData) => {
        try {
            const response = await axios.post(`${API_URL}/orders`, orderData);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to create order');
        }
    },

    // Cancel order
    cancelOrder: async (orderNumber) => {
        try {
            const response = await axios.post(`${API_URL}/orders/${orderNumber}/cancel`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to cancel order');
        }
    }
}; 