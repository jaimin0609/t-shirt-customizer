/**
 * API Configuration
 * Centralized configuration for API endpoints and settings
 */

// Get the base API URL from environment variables or use fallback for Vercel deployment
export const API_URL = import.meta.env.VITE_API_URL || 
                       'https://t-shirt-customizer-backend.onrender.com/api';

// Log the API URL being used
console.log('Using API URL:', API_URL); 

// Fallback URL in case the main one is not available
export const FALLBACK_API_URL = import.meta.env.VITE_FALLBACK_API_URL || 
                                'https://t-shirt-customizer-backend.onrender.com/api';

// Log configuration in development only
if (import.meta.env.DEV) {
  console.log('API Configuration:', { 
    primary: API_URL,
    fallback: FALLBACK_API_URL
  });
}

// API configuration options
export const API_CONFIG = {
  timeout: 20000,  // 20 seconds timeout for slow connections
  retry: 2,       // Number of retries before using fallback
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// CORS settings for fetch requests
export const getCorsHeaders = () => ({
  mode: 'cors',
  credentials: 'include',
  headers: {
    ...API_CONFIG.headers
  }
});

// A function to test API connectivity and fallback if needed
export const getWorkingApiUrl = async () => {
  // If no fallback is configured, just return the primary URL
  if (!FALLBACK_API_URL) {
    return API_URL;
  }
  
  const urls = [API_URL, FALLBACK_API_URL].filter(Boolean); // Filter out null values
  let workingUrl = null;
  
  for (const url of urls) {
    try {
      if (import.meta.env.DEV) {
        console.log(`Testing API connectivity to: ${url}`);
      }
      
      // Try to fetch the health endpoint with a short timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${url}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        mode: 'cors',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        if (import.meta.env.DEV) {
          console.log(`API connection successful to: ${url}`);
        }
        workingUrl = url;
        break;
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn(`API connection failed to: ${url}`, error.message);
      }
    }
  }
  
  // If no working URL found, fall back to primary URL
  if (!workingUrl) {
    console.warn('No working API URL found, falling back to primary URL');
    return API_URL;
  }
  
  return workingUrl;
}; 