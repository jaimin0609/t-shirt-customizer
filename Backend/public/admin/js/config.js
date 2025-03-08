// Configuration file for admin panel
// Single source of truth for the API URL

// Define API URL constant
const API_URL = '/api';

// Make it globally available for all scripts
window.API_URL = API_URL;

// This config.js file should be loaded BEFORE all other JavaScript files
// to ensure API_URL is available globally 