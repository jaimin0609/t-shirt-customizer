// utils.js - Common utility functions for the admin dashboard

/**
 * Show a toast notification
 * @param {string} type - The type of toast (success, error, warning, info)
 * @param {string} message - The message to display
 */
function showToast(type, message) {
    const toast = document.getElementById('toast');
    const toastTitle = document.getElementById('toastTitle');
    const toastMessage = document.getElementById('toastMessage');
    
    // If toast elements don't exist, create them
    if (!toast || !toastTitle || !toastMessage) {
        createToastContainer();
        return showToast(type, message); // Try again after creating container
    }
    
    // Set toast title based on type
    let title = 'Notification';
    let bgClass = 'bg-primary';
    
    switch (type) {
        case 'success':
            title = 'Success';
            bgClass = 'bg-success';
            break;
        case 'error':
            title = 'Error';
            bgClass = 'bg-danger';
            break;
        case 'warning':
            title = 'Warning';
            bgClass = 'bg-warning';
            break;
        case 'info':
            title = 'Information';
            bgClass = 'bg-info';
            break;
    }
    
    // Remove any existing background classes
    toast.classList.remove('bg-success', 'bg-danger', 'bg-warning', 'bg-info', 'bg-primary');
    
    // Set toast content
    toastTitle.textContent = title;
    toastMessage.textContent = message;
    
    // Create Bootstrap toast instance and show it
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}

/**
 * Create toast container if it doesn't exist
 */
function createToastContainer() {
    // Check if container already exists
    if (document.querySelector('.toast-container')) {
        return;
    }
    
    // Create toast container
    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    
    // Create toast element
    const toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    // Create toast header
    const toastHeader = document.createElement('div');
    toastHeader.className = 'toast-header';
    
    const toastTitle = document.createElement('strong');
    toastTitle.id = 'toastTitle';
    toastTitle.className = 'me-auto';
    toastTitle.textContent = 'Notification';
    
    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'btn-close';
    closeButton.setAttribute('data-bs-dismiss', 'toast');
    closeButton.setAttribute('aria-label', 'Close');
    
    // Create toast body
    const toastBody = document.createElement('div');
    toastBody.id = 'toastMessage';
    toastBody.className = 'toast-body';
    toastBody.textContent = 'Message goes here';
    
    // Assemble toast
    toastHeader.appendChild(toastTitle);
    toastHeader.appendChild(closeButton);
    toast.appendChild(toastHeader);
    toast.appendChild(toastBody);
    
    // Add to page
    toastContainer.appendChild(toast);
    document.body.appendChild(toastContainer);
}

/**
 * Format a date string
 * @param {string} dateString - The date string to format
 * @param {string} format - The format to use (default: 'short')
 * @returns {string} - The formatted date string
 */
function formatDate(dateString, format = 'short') {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
        return 'Invalid date';
    }
    
    switch (format) {
        case 'short':
            return date.toLocaleDateString();
        case 'long':
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        case 'time':
            return date.toLocaleTimeString();
        case 'relative':
            return getRelativeTimeString(date);
        default:
            return date.toLocaleDateString();
    }
}

/**
 * Get a relative time string (e.g., "2 hours ago")
 * @param {Date} date - The date to compare
 * @returns {string} - The relative time string
 */
function getRelativeTimeString(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);
    
    if (diffSec < 60) {
        return diffSec + ' second' + (diffSec !== 1 ? 's' : '') + ' ago';
    } else if (diffMin < 60) {
        return diffMin + ' minute' + (diffMin !== 1 ? 's' : '') + ' ago';
    } else if (diffHour < 24) {
        return diffHour + ' hour' + (diffHour !== 1 ? 's' : '') + ' ago';
    } else if (diffDay < 30) {
        return diffDay + ' day' + (diffDay !== 1 ? 's' : '') + ' ago';
    } else {
        return date.toLocaleDateString();
    }
}

/**
 * Format a currency value
 * @param {number} value - The value to format
 * @param {string} currency - The currency code (default: 'USD')
 * @returns {string} - The formatted currency string
 */
function formatCurrency(value, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(value);
}

/**
 * Truncate a string to a specified length
 * @param {string} str - The string to truncate
 * @param {number} maxLength - The maximum length
 * @returns {string} - The truncated string
 */
function truncateString(str, maxLength = 50) {
    if (!str) return '';
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '...';
}

// Load page content
function loadPage(pageName) {
    const contentArea = document.querySelector('.content');
    if (!contentArea) return false;
    
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    const activeLink = document.querySelector(`.nav-link[data-page="${pageName}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    // Update page title and breadcrumb
    const pageTitle = document.querySelector('.page-title');
    const breadcrumbActive = document.querySelector('.breadcrumb-item.active');
    
    if (pageTitle && breadcrumbActive) {
        const pageTitles = {
            'dashboard': 'Dashboard',
            'products': 'Products',
            'orders': 'Orders',
            'customers': 'Customers',
            'team': 'Team Management',
            'support': 'Support Tickets',
            'analytics': 'Analytics Overview'
        };
        
        pageTitle.textContent = pageTitles[pageName] || 'Dashboard';
        breadcrumbActive.textContent = pageTitles[pageName] || 'Dashboard';
    }
    
    // TODO: Load actual page content via AJAX or show/hide sections
    
    return false; // Prevent default link behavior
}

// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (!token && !window.location.pathname.includes('login.html')) {
        window.location.href = '/admin/login.html';
    }
});

// Get authentication token from localStorage
function getAuthToken() {
    return localStorage.getItem('token');
}

// Check if user is authenticated and redirect if not
function checkAuth() {
    const token = getAuthToken();
    if (!token) {
        window.location.href = '/admin/login.html';
        return false;
    }
    return true;
}

// Show toast notification
function showToast(message, type = 'success') {
    // Check if we have a toast container
    let toastContainer = document.querySelector('.toast-container');
    
    // If not, create one
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : type} border-0`;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');
    
    // Create toast body
    const toastBody = document.createElement('div');
    toastBody.className = 'd-flex';
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'toast-body';
    messageDiv.textContent = message;
    
    const closeButton = document.createElement('button');
    closeButton.className = 'btn-close btn-close-white me-2 m-auto';
    closeButton.setAttribute('data-bs-dismiss', 'toast');
    closeButton.setAttribute('aria-label', 'Close');
    
    toastBody.appendChild(messageDiv);
    toastBody.appendChild(closeButton);
    toastEl.appendChild(toastBody);
    
    // Add toast to container
    toastContainer.appendChild(toastEl);
    
    // Initialize toast and show it
    const toast = new bootstrap.Toast(toastEl, { autohide: true, delay: 5000 });
    toast.show();
    
    // Remove toast after it's hidden
    toastEl.addEventListener('hidden.bs.toast', () => {
        toastEl.remove();
    });
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(amount);
}

// Set translations for elements with data-translate attributes
function setTranslations(language = 'en') {
    // This is a placeholder function - you would implement actual translations here
    // For now, we'll just return so the promotions page doesn't error
    return;
}

// Ensure all utility functions are available globally
window.showToast = showToast;
window.createToastContainer = createToastContainer;
window.formatDate = formatDate;
window.getRelativeTimeString = getRelativeTimeString;
window.formatCurrency = formatCurrency;
window.truncateString = truncateString;
window.loadPage = loadPage;
window.getAuthToken = getAuthToken;
window.checkAuth = checkAuth;
window.setTranslations = setTranslations;
window.showLoader = showLoader;
window.hideLoader = hideLoader;

// DO NOT use export directly - it will cause errors when loaded as a regular script
// Instead, only export when in a module context
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    // CommonJS environment (Node.js)
    module.exports = {
        showToast,
        createToastContainer,
        formatDate,
        getRelativeTimeString,
        formatCurrency,
        truncateString,
        loadPage,
        getAuthToken,
        checkAuth,
        setTranslations,
        showLoader,
        hideLoader
    };
} else if (typeof exports !== 'undefined') {
    // For some CommonJS environments
    exports.showToast = showToast;
    exports.createToastContainer = createToastContainer;
    exports.formatDate = formatDate;
    exports.getRelativeTimeString = getRelativeTimeString;
    exports.formatCurrency = formatCurrency;
    exports.truncateString = truncateString;
    exports.loadPage = loadPage;
    exports.getAuthToken = getAuthToken;
    exports.checkAuth = checkAuth;
    exports.setTranslations = setTranslations;
    exports.showLoader = showLoader;
    exports.hideLoader = hideLoader;
}

// Do not include ES module export syntax directly in the file
// The export statement causes errors when loaded as a regular script

/**
 * Show a loader overlay
 */
function showLoader() {
    // Check if loader already exists
    let loader = document.getElementById('global-loader');
    
    if (!loader) {
        // Create loader container
        loader = document.createElement('div');
        loader.id = 'global-loader';
        loader.className = 'loader-overlay';
        loader.innerHTML = `
            <div class="spinner-container">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2 text-primary">Loading...</p>
            </div>
        `;
        
        // Add styles if not already in stylesheet
        if (!document.getElementById('loader-styles')) {
            const style = document.createElement('style');
            style.id = 'loader-styles';
            style.textContent = `
                .loader-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(255, 255, 255, 0.8);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 9999;
                }
                .spinner-container {
                    text-align: center;
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(loader);
    } else {
        // Show existing loader
        loader.style.display = 'flex';
    }
}

/**
 * Hide the loader overlay
 */
function hideLoader() {
    const loader = document.getElementById('global-loader');
    if (loader) {
        loader.style.display = 'none';
    }
}

// Instead, use window object to make these functions available globally
window.utilsModule = {
    showToast,
    createToastContainer,
    formatDate,
    getRelativeTimeString,
    formatCurrency,
    truncateString,
    loadPage,
    getAuthToken,
    checkAuth,
    setTranslations,
    showLoader,
    hideLoader
}; 