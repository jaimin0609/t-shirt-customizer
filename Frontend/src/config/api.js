/**
 * API configuration
 * This file contains the API URL for the backend server.
 */

// Determine the API base URL based on the current environment
const determineApiUrl = () => {
    // Check if running in development or production
    if (process.env.NODE_ENV === 'production') {
        // In production, the API is likely at the same origin
        return '/api';
    }
    
    // In development, use the correct port 5002 where the backend is running
    return 'http://localhost:5002/api';
};

// API base URL - determined dynamically
export const API_URL = determineApiUrl();

// Fallback URL in case the main one is not available
export const FALLBACK_API_URL = '/api';

// Export other API-related constants if needed
export const API_TIMEOUT = 30000; // 30 seconds

console.log('Using API URL:', API_URL); // Log the API URL being used 