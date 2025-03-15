/**
 * API configuration
 * This file contains the API URL for the backend server.
 */

// Determine the API base URL based on the current environment
const determineApiUrl = () => {
    // Check if running in development or production
    if (process.env.NODE_ENV === 'production' || import.meta.env.MODE === 'production') {
        // For Vercel deployments, use the Render backend URL
        // First check if we have an explicit production API URL from environment
        if (import.meta.env.VITE_API_URL) {
            console.log('Using environment-provided API URL:', import.meta.env.VITE_API_URL);
            return import.meta.env.VITE_API_URL;
        }
        
        // Default to the Render backend URL for production
        console.log('Using default production API URL at Render');
        return 'https://t-shirt-customizer-backend.onrender.com/api';
    }
    
    // In development, use the correct port 5002 where the backend is running
    console.log('Using development API URL at http://localhost:5002/api');
    return 'http://localhost:5002/api';
};

// API base URL - determined dynamically
export const API_URL = determineApiUrl();

// Fallback URL in case the main one is not available
export const FALLBACK_API_URL = 'https://t-shirt-customizer-backend.onrender.com/api';

// Export other API-related constants if needed
export const API_TIMEOUT = 30000; // 30 seconds

// API fetch configuration with explicit CORS headers
export const API_CONFIG = {
    credentials: 'include', // Send cookies with requests
    mode: 'cors', // Enable CORS
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
};

// A function to test API connectivity and fallback if needed
export const getWorkingApiUrl = async () => {
    const urls = [API_URL, FALLBACK_API_URL];
    let workingUrl = null;
    
    for (const url of urls) {
        try {
            console.log(`Testing API connectivity to: ${url}`);
            // Try to fetch the health endpoint with a short timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            
            const response = await fetch(`${url}/health`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
                mode: 'cors',
                credentials: 'include',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                console.log(`API connection successful to: ${url}`);
                workingUrl = url;
                break;
            }
        } catch (error) {
            console.warn(`API connection failed to: ${url}`, error.message);
        }
    }
    
    // If no working URL found, still return the primary URL
    return workingUrl || API_URL;
};

// Add specific headers for CORS requests
export const getCorsHeaders = (token = null) => {
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
};

console.log('Using API URL:', API_URL); // Log the API URL being used 