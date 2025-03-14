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

// Get auth headers for fetch requests
function getAuthHeaders() {
    const token = getAuthToken();
    if (!token) return {};
    return {
        'Authorization': `Bearer ${token}`
    };
}

// Helper function for fetch requests with auth
function getAuthFetchOptions(options = {}) {
    const token = getAuthToken();
    const defaultOptions = {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };
    
    // Merge with provided options
    if (options.headers) {
        options.headers = { ...defaultOptions.headers, ...options.headers };
        return options;
    }
    
    return { ...defaultOptions, ...options };
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
window.getAuthHeaders = getAuthHeaders;
window.getAuthFetchOptions = getAuthFetchOptions;

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
        hideLoader,
        getAuthHeaders,
        getAuthFetchOptions
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
    exports.getAuthHeaders = getAuthHeaders;
    exports.getAuthFetchOptions = getAuthFetchOptions;
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
    hideLoader,
    getAuthHeaders,
    getAuthFetchOptions
};

// Standard logout function
function logout() {
    console.log('Logging out user...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('emergencyLogin');
    localStorage.removeItem('isAdminSession');
    
    // Redirect to login page
    console.log('Redirecting to login page...');
    window.location.href = '/admin/login.html';
}

// Setup logout button event listeners
function setupLogoutButtons() {
    console.log('Setting up logout button listeners');
    const logoutButtons = document.querySelectorAll('[data-action="logout"]');
    logoutButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    });
    
    // Keep the global logout function for backward compatibility
    window.logout = logout;
    
    console.log(`Found and setup ${logoutButtons.length} logout buttons`);
}

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', function() {
    setupLogoutButtons();
});

/**
 * Fix accessibility issues with aria-hidden on modals
 * This ensures modals don't have aria-hidden="true" when they're visible
 * and contain focused elements.
 */
function setupModalAccessibility() {
    console.log('Setting up modal accessibility fixes');
    
    // Handle all modals on the page
    document.querySelectorAll('.modal').forEach(modal => {
        // Skip if already initialized
        if (modal.hasAttribute('data-a11y-fixed')) {
            return;
        }
        
        console.log(`Setting up accessibility fixes for modal: ${modal.id || 'unnamed'}`);
        modal.setAttribute('data-a11y-fixed', 'true');
        
        // Remove aria-hidden when modal begins to show
        modal.addEventListener('show.bs.modal', function() {
            this.removeAttribute('aria-hidden');
            console.log(`Modal ${this.id}: aria-hidden removed during show phase`);
        });
        
        // Ensure aria-hidden is removed after modal is fully shown
        modal.addEventListener('shown.bs.modal', function() {
            this.removeAttribute('aria-hidden');
            console.log(`Modal ${this.id}: aria-hidden removed after shown`);
            
            // Move focus to first form element or modal title
            const firstInput = this.querySelector('input, select, textarea, button:not([data-bs-dismiss="modal"])');
            if (firstInput) {
                firstInput.focus();
            } else {
                const modalTitle = this.querySelector('.modal-title');
                if (modalTitle) {
                    modalTitle.setAttribute('tabindex', '-1');
                    modalTitle.focus();
                }
            }
        });
        
        // Restore aria-hidden when modal is fully hidden
        modal.addEventListener('hidden.bs.modal', function() {
            this.setAttribute('aria-hidden', 'true');
            console.log(`Modal ${this.id}: aria-hidden restored after hidden`);
            
            // Find the element that opened the modal
            const modalTrigger = document.querySelector(`[data-bs-target="#${this.id}"], [href="#${this.id}"]`);
            if (modalTrigger) {
                modalTrigger.focus();
            }
        });
    });
}

// Set up accessibility fixes when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupModalAccessibility();
    
    // Also call it after dynamic content is loaded
    document.addEventListener('contentLoaded', setupModalAccessibility);
});

/**
 * Load and display real notifications in the navbar
 */
function loadNotifications() {
    console.log('Loading notifications...');
    
    // Get authentication token
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('No token found, cannot load notifications');
        return;
    }
    
    // Find notification elements - be more specific with selectors
    const notificationBadge = document.querySelector('.nav-item.dropdown .badge.rounded-pill.bg-danger');
    const notificationDropdown = document.querySelector('.dropdown-menu.notification-dropdown');
    
    if (!notificationBadge || !notificationDropdown) {
        console.error('Notification elements not found in DOM', {
            badgeFound: !!notificationBadge,
            dropdownFound: !!notificationDropdown
        });
        // Try alternative selectors
        console.log('Trying alternative selectors...');
        // Look for any badge in the notification area
        const altBadge = document.querySelector('.bi-bell + .badge, .position-absolute.badge.rounded-pill');
        const altDropdown = document.querySelector('.nav-item .dropdown-menu, div[class*="notification"]');
        
        console.log('Alternative selector results:', {
            altBadgeFound: !!altBadge,
            altDropdownFound: !!altDropdown
        });
        return;
    }
    
    // Debug - show the notification elements we found
    console.log('Found notification elements:', {
        badge: notificationBadge,
        dropdown: notificationDropdown
    });
    
    // Store original content for reference
    const originalBadgeText = notificationBadge.textContent.trim();
    const originalDropdownHTML = notificationDropdown.innerHTML;
    console.log('Original notification content:', {
        badgeText: originalBadgeText,
        dropdownContentLength: originalDropdownHTML.length
    });
    
    // Clear existing notifications except the header and divider
    const header = notificationDropdown.querySelector('.dropdown-header');
    const divider = notificationDropdown.querySelector('.dropdown-divider');
    
    if (header && divider) {
        // Keep only header and divider
        notificationDropdown.innerHTML = '';
        notificationDropdown.appendChild(header.cloneNode(true));
        notificationDropdown.appendChild(divider.cloneNode(true));
    } else {
        // If we can't find header and divider, save the full HTML and restore later if needed
        console.log('Could not find header/divider, clearing dropdown completely');
        notificationDropdown.innerHTML = '';
    }
    
    // Add a loading indicator
    const loadingItem = document.createElement('a');
    loadingItem.className = 'dropdown-item';
    loadingItem.href = '#';
    loadingItem.innerHTML = `
        <div class="d-flex align-items-center">
            <div class="notification-icon bg-primary text-white rounded-circle p-2">
                <i class="bi bi-arrow-clockwise"></i>
            </div>
            <div class="ms-3">
                <p class="mb-0">Loading notifications...</p>
            </div>
        </div>
    `;
    notificationDropdown.appendChild(loadingItem);
    
    console.log(`${window.API_URL || '/api'}/orders/recent endpoint will be called`);
    
    // Fetch recent orders as notifications
    fetch(`${window.API_URL || '/api'}/orders/recent`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        console.log('Notification API response:', response.status);
        if (!response.ok) {
            throw new Error(`Failed to load notifications: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Notifications data received:', data);
        
        // Clear the loading indicator
        notificationDropdown.innerHTML = '';
        
        // Restore header and divider
        if (header && divider) {
            notificationDropdown.appendChild(header.cloneNode(true));
            notificationDropdown.appendChild(divider.cloneNode(true));
        }
        
        // Update notification count
        const count = data.length;
        notificationBadge.textContent = count || '0';
        
        if (count === 0) {
            // Add a "no notifications" message
            const noNotifications = document.createElement('a');
            noNotifications.className = 'dropdown-item';
            noNotifications.href = '#';
            noNotifications.innerHTML = `
                <div class="d-flex align-items-center">
                    <div class="notification-icon bg-secondary text-white rounded-circle p-2">
                        <i class="bi bi-bell-slash"></i>
                    </div>
                    <div class="ms-3">
                        <p class="mb-0">No new notifications</p>
                    </div>
                </div>
            `;
            notificationDropdown.appendChild(noNotifications);
            return;
        }
        
        // Add notifications for recent orders
        data.forEach(order => {
            const timeAgo = getTimeAgo(new Date(order.createdAt));
            const notificationItem = document.createElement('a');
            notificationItem.className = 'dropdown-item';
            notificationItem.href = `/admin/orders.html?id=${order.id}`;
            
            notificationItem.innerHTML = `
                <div class="d-flex align-items-center">
                    <div class="notification-icon bg-primary text-white rounded-circle p-2">
                        <i class="bi bi-cart"></i>
                    </div>
                    <div class="ms-3">
                        <p class="mb-0">New order: #${order.orderNumber}</p>
                        <small class="text-muted">${timeAgo}</small>
                    </div>
                </div>
            `;
            
            notificationDropdown.appendChild(notificationItem);
        });
        
        // Add a "view all" link at the bottom
        const viewAll = document.createElement('a');
        viewAll.className = 'dropdown-item text-center';
        viewAll.href = '/admin/orders.html';
        viewAll.innerHTML = `<strong>View all orders</strong>`;
        notificationDropdown.appendChild(viewAll);
        
        console.log('Notifications updated successfully');
    })
    .catch(error => {
        console.error('Error loading notifications:', error);
        
        // If everything fails, restore original content
        if (originalDropdownHTML && originalDropdownHTML.length > 0) {
            console.log('Restoring original notification content due to error');
            notificationDropdown.innerHTML = originalDropdownHTML;
        } else {
            // Set a fallback notification
            notificationBadge.textContent = originalBadgeText || '0';
            
            // Clear the loading indicator
            notificationDropdown.innerHTML = '';
            
            // Restore header and divider if we have them
            if (header && divider) {
                notificationDropdown.appendChild(header.cloneNode(true));
                notificationDropdown.appendChild(divider.cloneNode(true));
            }
            
            const errorNotification = document.createElement('a');
            errorNotification.className = 'dropdown-item';
            errorNotification.href = '#';
            errorNotification.innerHTML = `
                <div class="d-flex align-items-center">
                    <div class="notification-icon bg-danger text-white rounded-circle p-2">
                        <i class="bi bi-exclamation-triangle"></i>
                    </div>
                    <div class="ms-3">
                        <p class="mb-0">Failed to load notifications</p>
                        <small class="text-muted">Please check console</small>
                    </div>
                </div>
            `;
            notificationDropdown.appendChild(errorNotification);
        }
    });
}

/**
 * Format a date as a time ago string (e.g. "2 mins ago")
 */
function getTimeAgo(date) {
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) {
        return 'just now';
    }
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
        return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }
    
    const days = Math.floor(hours / 24);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
}

// Call loadNotifications when the DOM is loaded, with a better timing strategy
document.addEventListener('DOMContentLoaded', function() {
    // First wait for the DOM to be fully loaded
    setTimeout(() => {
        console.log('Initial loadNotifications attempt...');
        loadNotifications();
        
        // Try again after 3 seconds to ensure everything is loaded
        setTimeout(() => {
            console.log('Second loadNotifications attempt...');
            loadNotifications();
        }, 3000);
    }, 1000);
});

// Add a global function to reload notifications manually
window.reloadNotifications = loadNotifications; 