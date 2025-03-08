/**
 * Authentication utilities
 * This file contains functions for handling authentication tokens.
 */

// Get the authentication token from localStorage
export const getAuthToken = () => {
    try {
        return localStorage.getItem('token');
    } catch (error) {
        console.error('Error getting auth token:', error);
        return null;
    }
};

// Save the authentication token to localStorage
export const setAuthToken = (token) => {
    try {
        localStorage.setItem('token', token);
        return true;
    } catch (error) {
        console.error('Error setting auth token:', error);
        return false;
    }
};

// Remove the authentication token from localStorage
export const removeAuthToken = () => {
    try {
        localStorage.removeItem('token');
        return true;
    } catch (error) {
        console.error('Error removing auth token:', error);
        return false;
    }
};

// Check if the user is authenticated
export const isAuthenticated = () => {
    return !!getAuthToken();
};

// Prepare headers with authentication token
export const getAuthHeaders = () => {
    const token = getAuthToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
    };
};

// Helper function to make authenticated API requests
export const fetchWithAuth = async (url, options = {}) => {
    try {
        // Merge authentication headers with provided options
        const authOptions = {
            ...options,
            headers: {
                ...getAuthHeaders(),
                ...(options.headers || {}),
            },
        };
        
        // Make the fetch request
        const response = await fetch(url, authOptions);
        
        // Handle 401 Unauthorized errors (token expired or invalid)
        if (response.status === 401) {
            console.warn('Authentication token expired or invalid');
            removeAuthToken();
            // Redirect to login page if needed
            // window.location.href = '/login';
        }
        
        return response;
    } catch (error) {
        console.error('Error in fetchWithAuth:', error);
        throw error;
    }
}; 