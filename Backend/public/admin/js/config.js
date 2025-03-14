/**
 * Admin Panel Configuration
 * This file contains global configuration settings for the admin panel.
 */

// Configuration file for admin panel
// Single source of truth for the API URL

// Check if running locally, otherwise use the production URL
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Base API URL
window.API_URL = isLocalhost ? 'http://localhost:5002/api' : 'https://t-shirt-customizer-backend.onrender.com/api';

// Don't use these in production
window.SHOW_DEBUG = isLocalhost;

// Cloudinary configuration
// Note: These should match your Backend .env CLOUDINARY_CLOUD_NAME
// For production, make sure to set these values in your Render environment variables
window.CLOUDINARY_CLOUD_NAME = window.CLOUDINARY_CLOUD_NAME || 'dopvs93sl'; // Replace with your new cloud name
window.CLOUDINARY_URL_PREFIX = `https://res.cloudinary.com/${window.CLOUDINARY_CLOUD_NAME}`;

// Extra debugging for Cloudinary
console.log('======= Cloudinary Configuration =======');
console.log('Cloud Name:', window.CLOUDINARY_CLOUD_NAME);
console.log('URL Prefix:', window.CLOUDINARY_URL_PREFIX);

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

// API URL Configuration
window.API_URL = window.API_URL || '/api';

// Helper function to extract Cloudinary ID from various URL formats
window.getCloudinaryId = function(url) {
    console.log('Extracting Cloudinary ID from:', url);
    if (!url) return null;
    
    // Already a Cloudinary public ID with no path
    if (!url.includes('/')) {
        console.log('URL has no path, treating as direct public ID:', url);
        return url;
    }
    
    // Full Cloudinary URL
    if (url.includes('cloudinary.com')) {
        console.log('Detected Cloudinary URL, extracting ID');
        // Extract the relevant portion after upload/
        const uploadMatch = url.match(/\/upload\/(?:v\d+\/)?(.+)$/);
        if (uploadMatch && uploadMatch[1]) {
            console.log('Extracted Cloudinary ID:', uploadMatch[1]);
            return uploadMatch[1];
        }
    }
    
    // Local path format with product- prefix
    if (url.includes('/product-')) {
        const parts = url.split('/');
        const id = parts[parts.length - 1];
        console.log('Extracted product ID from path:', id);
        return id;
    }
    
    // If it's a path, return the last segment
    if (url.includes('/')) {
        const parts = url.split('/');
        const id = parts[parts.length - 1];
        console.log('Extracted ID from path segments:', id);
        return id;
    }
    
    return url;
};

// Helper function to create proper Cloudinary URLs
window.formatCloudinaryUrl = function(url, options = {}) {
    console.log('Formatting Cloudinary URL:', url);
    if (!url) return null;
    
    // If it's already a full Cloudinary URL, ensure it uses HTTPS
    if (url.includes('cloudinary.com')) {
        console.log('URL already contains cloudinary.com');
        if (url.startsWith('http://')) {
            console.log('Converting HTTP to HTTPS');
            return url.replace('http://', 'https://');
        }
        
        // If we have options, need to rebuild the URL with them
        if (Object.keys(options).length > 0) {
            console.log('Rebuilding Cloudinary URL with options:', options);
            const id = window.getCloudinaryId(url);
            if (id) {
                return buildCloudinaryUrl(id, options);
            }
        }
        
        return url;
    }
    
    // Extract ID and build URL
    const id = window.getCloudinaryId(url);
    if (id) {
        console.log('Building Cloudinary URL from ID:', id);
        return buildCloudinaryUrl(id, options);
    }
    
    console.log('Unable to format as Cloudinary URL, returning original:', url);
    return url;
};

// Internal function to build a Cloudinary URL with options
function buildCloudinaryUrl(id, options = {}) {
    let transformations = '';
    
    // Build transformation string from options
    if (Object.keys(options).length > 0) {
        const transforms = [];
        
        if (options.width) transforms.push(`w_${options.width}`);
        if (options.height) transforms.push(`h_${options.height}`);
        if (options.crop) transforms.push(`c_${options.crop}`);
        if (options.quality) transforms.push(`q_${options.quality}`);
        if (options.format) transforms.push(`f_${options.format}`);
        
        if (transforms.length > 0) {
            transformations = transforms.join(',') + '/';
        }
    }
    
    // Make sure the URL uses the correct format: https://res.cloudinary.com/cloud_name/image/upload/v1/id
    const url = `${window.CLOUDINARY_URL_PREFIX}/image/upload/v1/${transformations}${id}`;
    console.log('Built Cloudinary URL:', url);
    return url;
}

// Add a utility to test image URLs
window.testImageUrl = function(url) {
    if (!url) return { valid: false, reason: 'No URL provided' };
    
    const result = {
        originalUrl: url,
        isCloudinary: url.includes('cloudinary.com'),
        isAbsolute: url.startsWith('http'),
        isDataUrl: url.startsWith('data:'),
        hasImage: url.includes('image'),
        extractedId: window.getCloudinaryId(url),
        formattedUrl: window.formatCloudinaryUrl(url),
        valid: false
    };
    
    // Check if URL seems valid
    if (result.isCloudinary || result.isAbsolute || result.isDataUrl || url.startsWith('/')) {
        result.valid = true;
    } else {
        result.reason = 'URL format not recognized';
    }
    
    return result;
};

console.log('Config loaded with API_URL:', window.API_URL);
console.log('Cloudinary configured with cloud name:', window.CLOUDINARY_CLOUD_NAME); 