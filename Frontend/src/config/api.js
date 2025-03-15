/**
 * API configuration
 * This file contains the API URL for the backend server.
 */

// Determine the API base URL based on the current environment
const determineApiUrl = () => {
    // Check if running in development or production
    if (process.env.NODE_ENV === 'production') {
        // For Vercel deployments, API might be at a different host or at the same origin
        // First check if we have an explicit production API URL from environment
        if (import.meta.env.VITE_API_URL) {
            console.log('Using environment-provided API URL:', import.meta.env.VITE_API_URL);
            return import.meta.env.VITE_API_URL;
        }
        
        // Default to same-origin API endpoint for production
        console.log('Using default production API URL at /api');
        return '/api';
    }
    
    // In development, use the correct port 5002 where the backend is running
    console.log('Using development API URL at http://localhost:5002/api');
    return 'http://localhost:5002/api';
};

// API base URL - determined dynamically
export const API_URL = determineApiUrl();

// Fallback URL in case the main one is not available
export const FALLBACK_API_URL = '/api';

// Export other API-related constants if needed
export const API_TIMEOUT = 30000; // 30 seconds

console.log('Using API URL:', API_URL); // Log the API URL being used 