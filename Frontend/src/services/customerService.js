/**
 * Customer Service
 * This file contains functions for handling customer-related API calls.
 */

import { API_URL, FALLBACK_API_URL } from '../config/api.js';
import { fetchWithAuth } from '../utils/auth.js';

// Error handling helper
const handleApiError = (error, message = 'API Error') => {
    console.error(`${message}:`, error);
    throw new Error(message);
};

// Get all customers
export const getAllCustomers = async () => {
    try {
        const response = await fetchWithAuth(`${API_URL}/customers`);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({
                message: `Failed to fetch customers: ${response.status} ${response.statusText}`
            }));
            throw new Error(errorData.message || 'Failed to fetch customers');
        }
        
        return await response.json();
    } catch (error) {
        // Try fallback URL if main URL fails
        try {
            console.warn('Primary API URL failed, trying fallback');
            const fallbackResponse = await fetchWithAuth(`${FALLBACK_API_URL}/customers`);
            
            if (!fallbackResponse.ok) {
                throw new Error(`Fallback failed: ${fallbackResponse.status}`);
            }
            
            return await fallbackResponse.json();
        } catch (fallbackError) {
            handleApiError(error, 'Failed to fetch customers');
        }
    }
};

// Get customer by ID
export const getCustomerById = async (customerId) => {
    try {
        const response = await fetchWithAuth(`${API_URL}/customers/${customerId}`);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({
                message: `Failed to fetch customer: ${response.status} ${response.statusText}`
            }));
            throw new Error(errorData.message || 'Failed to fetch customer');
        }
        
        return await response.json();
    } catch (error) {
        handleApiError(error, `Failed to fetch customer with ID: ${customerId}`);
    }
};

// Get customer orders
export const getCustomerOrders = async (customerId) => {
    try {
        const response = await fetchWithAuth(`${API_URL}/customers/${customerId}/orders`);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({
                message: `Failed to fetch customer orders: ${response.status} ${response.statusText}`
            }));
            throw new Error(errorData.message || 'Failed to fetch customer orders');
        }
        
        return await response.json();
    } catch (error) {
        handleApiError(error, `Failed to fetch orders for customer ID: ${customerId}`);
    }
};

// Create new customer
export const createCustomer = async (customerData) => {
    try {
        const response = await fetchWithAuth(`${API_URL}/customers`, {
            method: 'POST',
            body: JSON.stringify(customerData),
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({
                message: `Failed to create customer: ${response.status} ${response.statusText}`
            }));
            throw new Error(errorData.message || 'Failed to create customer');
        }
        
        return await response.json();
    } catch (error) {
        handleApiError(error, 'Failed to create customer');
    }
};

// Update customer
export const updateCustomer = async (customerId, customerData) => {
    try {
        const response = await fetchWithAuth(`${API_URL}/customers/${customerId}`, {
            method: 'PUT',
            body: JSON.stringify(customerData),
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({
                message: `Failed to update customer: ${response.status} ${response.statusText}`
            }));
            throw new Error(errorData.message || 'Failed to update customer');
        }
        
        return await response.json();
    } catch (error) {
        handleApiError(error, `Failed to update customer with ID: ${customerId}`);
    }
}; 