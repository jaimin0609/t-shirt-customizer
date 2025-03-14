// Configuration file for admin panel
// Single source of truth for the API URL

// Check if running locally, otherwise use the production URL
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Base API URL
window.API_URL = isLocalhost ? 'http://localhost:5002/api' : 'https://t-shirt-customizer-backend.onrender.com/api';

// Don't use these in production
window.SHOW_DEBUG = isLocalhost;

// Cloudinary configuration
window.CLOUDINARY_CLOUD_NAME = 'dopvv93sl'; // Your Cloudinary cloud name

// Configure the API URL based on the current location
if (window.location.origin.includes('127.0.0.1') || window.location.origin.includes('localhost')) {
    // If we're using the Node.js backend on the same machine but different port
    window.API_URL = `${window.location.protocol}//${window.location.hostname}:5002/api`;
    console.log('Using local API URL:', window.API_URL);
} else if (window.location.origin.includes('render.com')) {
    // If we're on Render.com
    window.API_URL = `${window.location.origin}/api`;
    console.log('Using Render.com API URL:', window.API_URL);
} else {
    // In case we're in a different environment
    console.log('Using default API URL:', window.API_URL);
}

// Add more debugging
console.log('======= App Configuration =======');
console.log('API URL:', window.API_URL);
console.log('Cloudinary cloud name:', window.CLOUDINARY_CLOUD_NAME);
console.log('Current origin:', window.location.origin);
console.log('Current hostname:', window.location.hostname);
console.log('================================');

// This config.js file should be loaded BEFORE all other JavaScript files
// to ensure API_URL is available globally 