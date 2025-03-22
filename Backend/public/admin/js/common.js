/**
 * Common utilities for admin dashboard
 * This file provides shared functionality across all admin pages
 */

// Configuration
const CONFIG = {
    // API endpoint base URL (from config.js if available)
    apiUrl: window.API_URL || '/api',
    // Debug mode - logs additional information to console
    debug: true
};

/**
 * Log debug messages only if debug mode is enabled
 */
function debugLog(...args) {
    if (CONFIG.debug) {
        console.log('[Admin]', ...args);
    }
}

/**
 * Check if user is authenticated
 * @returns {boolean} Whether the user is authenticated
 */
function isAuthenticated() {
    const token = localStorage.getItem('token');
    return !!token;
}

/**
 * Redirect to login page if user is not authenticated
 */
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = '/admin/login.html';
        return false;
    }
    return true;
}

/**
 * Standardize page title
 * Updates document title with consistent format
 * @param {string} pageTitle - The specific page title
 */
function standardizePageTitle(pageTitle) {
    if (pageTitle) {
        document.title = `${pageTitle} - Admin Dashboard`;
    } else {
        // Try to determine from URL if not provided
        const path = window.location.pathname;
        const page = path.split('/').pop().replace('.html', '');
        
        // Map of page names to titles
        const pageTitles = {
            'index': 'Admin Dashboard',
            'products': 'Product Management',
            'orders': 'Order Management',
            'customers': 'Customer Management',
            'promotions': 'Promotion Management',
            'coupons': 'Coupon Management',
            'reports': 'Analytics Reports',
            'users': 'User Management',
            'settings': 'System Settings'
        };
        
        const title = pageTitles[page] || 'Admin Dashboard';
        document.title = page === 'index' ? title : `${title} - Admin Dashboard`;
    }
}

/**
 * Initialize common functionality across all admin pages
 */
function initCommon() {
    debugLog('Initializing common admin functionality');
    
    // Check authentication
    if (!requireAuth()) return;
    
    // Add event listeners for common elements
    document.addEventListener('click', function(e) {
        // Handle logout action
        if (e.target.closest('[data-action="logout"]')) {
            e.preventDefault();
            logout();
        }
    });
    
    // Initialize tooltips if Bootstrap is available
    if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
        const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        tooltips.forEach(tooltip => {
            new bootstrap.Tooltip(tooltip);
        });
    }
}

/**
 * Create toast notification
 * @param {string} type - The type of toast (success, error, warning, info)
 * @param {string} message - The message to display
 */
function showToast(type, message) {
    // Check if toastContainer exists, create if not
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'position-fixed bottom-0 end-0 p-3';
        toastContainer.style.zIndex = '1050';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toastId = 'toast-' + Date.now();
    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    // Create toast content
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Initialize and show toast if Bootstrap is available
    if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
        const toastInstance = new bootstrap.Toast(toast, {
            delay: 5000
        });
        toastInstance.show();
        
        // Remove from DOM after hidden
        toast.addEventListener('hidden.bs.toast', function() {
            toast.remove();
        });
    }
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    window.location.href = '/admin/login.html';
}

// Make functions available globally
window.showToast = showToast;
window.logout = logout;
window.requireAuth = requireAuth;
window.isAuthenticated = isAuthenticated;

// Initialize on page load
document.addEventListener('DOMContentLoaded', initCommon); 