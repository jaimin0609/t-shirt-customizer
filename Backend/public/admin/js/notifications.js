/**
 * Admin Panel Notifications Module
 * Handles fetching and displaying notifications in the admin UI
 */

// Configuration that can be changed for debugging
const CONFIG = {
    // API endpoint for loading notifications
    notificationsEndpoint: '/api/notifications/unread',
    // Fallback to orders endpoint if notifications fail
    ordersFallbackEndpoint: '/api/orders/recent',
    // How often to refresh notifications (in milliseconds)
    refreshInterval: 60000, // 1 minute
    // Maximum number of retries for failed fetch requests
    maxRetries: 3,
    // Debug mode - logs additional information to console
    debug: true
};

// State to track notification loading status
let notificationState = {
    isLoading: false,
    lastLoaded: null,
    error: null,
    retryCount: 0,
    refreshTimer: null
};

/**
 * Log debug messages only if debug mode is enabled
 */
function debugLog(...args) {
    if (CONFIG.debug) {
        console.log('[Notifications]', ...args);
    }
}

/**
 * Initialize notifications system
 */
function initNotifications() {
    console.log('Initializing notifications module');
    
    // Get or create notification bell container
    ensureNotificationElements();
    
    // Load notifications from the server
    loadNotifications();
    
    // Set up polling for new notifications (every 60 seconds)
    setInterval(loadNotifications, 60000);
}

/**
 * Ensure all notification UI elements exist and are properly structured
 */
function ensureNotificationElements() {
    const rightSideContainer = document.querySelector('.d-flex.align-items-center.gap-3.ms-auto');
    
    // If container doesn't exist, try to create one
    if (!rightSideContainer) {
        console.log('Right side container not found, creating notification elements in navbar');
        createNotificationElements();
        return;
    }
    
    // Check if notification dropdown already exists
    let notificationDropdown = document.querySelector('.notification-dropdown-container');
    
    // If it doesn't exist, create and insert it
    if (!notificationDropdown) {
        console.log('Notification dropdown not found, adding it to the right side container');
        
        // Create notification element
        notificationDropdown = document.createElement('div');
        notificationDropdown.className = 'nav-item dropdown notification-dropdown-container me-3';
        
        notificationDropdown.innerHTML = `
            <button class="btn btn-link text-dark p-0 position-relative" data-bs-toggle="dropdown" id="notificationBell">
                <i class="bi bi-bell fs-5"></i>
                <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger notification-badge" style="display: none;">
                    0
                    <span class="visually-hidden" data-translate="unreadNotifications">unread notifications</span>
                </span>
            </button>
            <div class="dropdown-menu dropdown-menu-end notification-dropdown pt-0" style="width: 320px; max-height: 500px; overflow-y: auto;">
                <div class="notification-header p-3 border-bottom">
                    <h6 class="m-0 d-flex justify-content-between align-items-center">
                        <span data-translate="notifications">Notifications</span>
                        <button class="btn btn-sm btn-link text-decoration-none p-0" data-translate="markAllRead" data-notification-action="mark-all-read">Mark all read</button>
                    </h6>
                </div>
                <div class="notification-body" id="notificationDropdown">
                    <!-- Notifications will be loaded here -->
                </div>
                <div class="notification-footer p-2 border-top text-center">
                    <a href="/admin/notifications.html" class="text-decoration-none small">
                        <span data-translate="viewAll">View all notifications</span>
                    </a>
                </div>
            </div>
        `;
        
        // Insert before the profile dropdown if it exists, otherwise just append to the container
        const profileDropdown = rightSideContainer.querySelector('.dropdown');
        if (profileDropdown) {
            rightSideContainer.insertBefore(notificationDropdown, profileDropdown);
        } else {
            rightSideContainer.appendChild(notificationDropdown);
        }
    }
}

/**
 * Create notification elements if the regular container doesn't exist
 */
function createNotificationElements() {
    // Find the navbar content container
    const navbarContent = document.querySelector('.navbar .container-fluid');
    if (!navbarContent) {
        console.error('Cannot find navbar container to add notification elements');
        return;
    }
    
    // Look for an existing right side container or create one
    let rightSide = navbarContent.querySelector('.ms-auto');
    if (!rightSide) {
        // Create the right side container
        rightSide = document.createElement('div');
        rightSide.className = 'd-flex align-items-center gap-3 ms-auto';
        
        // Add the notification dropdown to it
        rightSide.innerHTML = `
            <div class="nav-item dropdown notification-dropdown-container">
                <button class="btn btn-link text-dark p-0 position-relative" data-bs-toggle="dropdown" id="notificationBell">
                    <i class="bi bi-bell fs-5"></i>
                    <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger notification-badge" style="display: none;">
                        0
                        <span class="visually-hidden" data-translate="unreadNotifications">unread notifications</span>
                    </span>
                </button>
                <div class="dropdown-menu dropdown-menu-end notification-dropdown pt-0" style="width: 320px; max-height: 500px; overflow-y: auto;">
                    <div class="notification-header p-3 border-bottom">
                        <h6 class="m-0 d-flex justify-content-between align-items-center">
                            <span data-translate="notifications">Notifications</span>
                            <button class="btn btn-sm btn-link text-decoration-none p-0" data-translate="markAllRead" data-notification-action="mark-all-read">Mark all read</button>
                        </h6>
                    </div>
                    <div class="notification-body" id="notificationDropdown">
                        <!-- Notifications will be loaded here -->
                    </div>
                    <div class="notification-footer p-2 border-top text-center">
                        <a href="/admin/notifications.html" class="text-decoration-none small">
                            <span data-translate="viewAll">View all notifications</span>
                        </a>
                    </div>
                </div>
            </div>
        `;
        
        // Find where to insert it - before search or at the end
        const searchBar = navbarContent.querySelector('form');
        if (searchBar) {
            navbarContent.insertBefore(rightSide, searchBar.nextSibling);
        } else {
            navbarContent.appendChild(rightSide);
        }
    } else {
        // If right side exists but doesn't have notifications, add them
        if (!rightSide.querySelector('.notification-dropdown-container')) {
            const notificationDropdown = document.createElement('div');
            notificationDropdown.className = 'nav-item dropdown notification-dropdown-container me-3';
            notificationDropdown.innerHTML = `
                <button class="btn btn-link text-dark p-0 position-relative" data-bs-toggle="dropdown" id="notificationBell">
                    <i class="bi bi-bell fs-5"></i>
                    <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger notification-badge" style="display: none;">
                        0
                        <span class="visually-hidden" data-translate="unreadNotifications">unread notifications</span>
                    </span>
                </button>
                <div class="dropdown-menu dropdown-menu-end notification-dropdown pt-0" style="width: 320px; max-height: 500px; overflow-y: auto;">
                    <div class="notification-header p-3 border-bottom">
                        <h6 class="m-0 d-flex justify-content-between align-items-center">
                            <span data-translate="notifications">Notifications</span>
                            <button class="btn btn-sm btn-link text-decoration-none p-0" data-translate="markAllRead" data-notification-action="mark-all-read">Mark all read</button>
                        </h6>
                    </div>
                    <div class="notification-body" id="notificationDropdown">
                        <!-- Notifications will be loaded here -->
                    </div>
                    <div class="notification-footer p-2 border-top text-center">
                        <a href="/admin/notifications.html" class="text-decoration-none small">
                            <span data-translate="viewAll">View all notifications</span>
                        </a>
                    </div>
                </div>
            `;
            
            // Add before profile dropdown if it exists
            const profileDropdown = rightSide.querySelector('.dropdown');
            if (profileDropdown) {
                rightSide.insertBefore(notificationDropdown, profileDropdown);
            } else {
                rightSide.appendChild(notificationDropdown);
            }
        }
    }
}

/**
 * Load notifications from the server and update UI
 */
function loadNotifications() {
    // Skip if already loading
    if (notificationState.isLoading) {
        debugLog('Already loading notifications, skipping');
        return;
    }
    
    notificationState.isLoading = true;
    debugLog('Loading notifications...');
    
    // Get authentication token
    const token = localStorage.getItem('token');
    if (!token) {
        debugLog('No token found, cannot load notifications');
        notificationState.isLoading = false;
        return;
    }
    
    // Find notification elements
    const notificationBadges = document.querySelectorAll('.badge[data-notification-badge], .notification-badge, .badge-notification, .position-absolute.badge');
    const notificationDropdowns = document.querySelectorAll('.dropdown-menu.notification-dropdown, .notifications-dropdown, [data-notification-container]');
    
    if (notificationBadges.length === 0 || notificationDropdowns.length === 0) {
        debugLog('Notification elements not found in DOM');
        notificationState.isLoading = false;
        return;
    }
    
    // Add loading indicator to all dropdowns
    notificationDropdowns.forEach(dropdown => {
        showLoadingState(dropdown);
    });
    
    // Make sure API_URL is properly prepended to the endpoint
    const baseUrl = window.API_URL || '/api';
    
    // Decide which endpoint to use based on retry count
    let endpoint;
    if (notificationState.retryCount > 0) {
        // Fallback to recent orders if notifications endpoint fails
        endpoint = `${baseUrl}${CONFIG.ordersFallbackEndpoint}`;
    } else {
        // Primary endpoint with fixed path
        endpoint = `${baseUrl}/notifications/unread`;
        
        // Use config path if it starts with slash (absolute path)
        if (CONFIG.notificationsEndpoint.startsWith('/')) {
            endpoint = `${baseUrl}${CONFIG.notificationsEndpoint}`;
        }
    }
    
    debugLog(`Fetching from endpoint: ${endpoint}`);
    
    // Fetch notifications
    fetch(endpoint, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
        }
    })
    .then(response => {
        if (!response.ok) {
            const error = new Error(`Failed to load notifications: ${response.status}`);
            error.status = response.status;
            throw error;
        }
        return response.json();
    })
    .then(data => {
        debugLog('Notifications data received:', data);
        
        // Reset retry count on success
        notificationState.retryCount = 0;
        notificationState.lastLoaded = new Date();
        notificationState.error = null;
        
        // Update all notification badges
        const count = Array.isArray(data) ? data.filter(item => !item.isRead).length : (data.count || 0);
        updateNotificationBadges(notificationBadges, count);
        
        // Update all dropdowns
        notificationDropdowns.forEach(dropdown => {
            updateNotificationDropdown(dropdown, data);
        });
    })
    .catch(error => {
        debugLog('Error loading notifications:', error);
        notificationState.error = error;
        
        // Handle specific error cases
        if (error.status === 401) {
            // Unauthorized - token might be expired
            debugLog('Unauthorized access, token might be expired');
            // Don't automatically redirect to login, just show error
            notificationDropdowns.forEach(dropdown => {
                showErrorState(dropdown, 'Authentication error. Please log in again.');
            });
            return;
        }
        
        // Increment retry count
        notificationState.retryCount++;
        
        // If we've already tried the fallback endpoint or max retries reached
        if (notificationState.retryCount >= CONFIG.maxRetries) {
            notificationDropdowns.forEach(dropdown => {
                showErrorState(dropdown, 'Could not load notifications. Please try again later.');
            });
        } else {
            // Try again with fallback endpoint or after a delay
            debugLog(`Retry attempt ${notificationState.retryCount} of ${CONFIG.maxRetries}`);
            setTimeout(() => {
                notificationState.isLoading = false;
                loadNotifications();
            }, 1000 * notificationState.retryCount); // Increasing delay with each retry
        }
    })
    .finally(() => {
        notificationState.isLoading = false;
        
        // Schedule next refresh if auto-refresh is enabled
        if (CONFIG.refreshInterval > 0 && notificationState.refreshTimer === null) {
            notificationState.refreshTimer = setTimeout(() => {
                notificationState.refreshTimer = null;
                loadNotifications();
            }, CONFIG.refreshInterval);
        }
    });
}

/**
 * Update all notification badges with the count
 */
function updateNotificationBadges(badges, count) {
    badges.forEach(badge => {
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.display = '';
            badge.classList.remove('d-none');
        } else {
            badge.style.display = 'none';
            badge.classList.add('d-none');
        }
    });
}

/**
 * Show loading state in notification dropdown
 */
function showLoadingState(dropdown) {
    // Store original content if not already stored
    if (!dropdown._originalContent) {
        dropdown._originalContent = dropdown.innerHTML;
    }
    
    // Clear existing content
    if (dropdown.querySelector('.notification-body')) {
        dropdown.querySelector('.notification-body').innerHTML = `
            <div class="dropdown-item loading-item py-3">
                <div class="d-flex align-items-center justify-content-center">
                    <div class="spinner-border spinner-border-sm text-primary me-2" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <span>Loading notifications...</span>
                </div>
            </div>
        `;
    } else {
        dropdown.innerHTML = `
            <div class="dropdown-item loading-item py-3">
                <div class="d-flex align-items-center justify-content-center">
                    <div class="spinner-border spinner-border-sm text-primary me-2" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <span>Loading notifications...</span>
                </div>
            </div>
        `;
    }
}

/**
 * Show error state in notification dropdown
 */
function showErrorState(dropdown, message = 'Failed to load notifications') {
    // Find notification body or use the dropdown itself
    const container = dropdown.querySelector('.notification-body') || dropdown;
    
    // Clear existing content
    container.innerHTML = '';

    // Add error message
    const errorItem = document.createElement('div');
    errorItem.className = 'dropdown-item error-item text-center py-3';
    errorItem.innerHTML = `
        <div class="text-danger mb-2">
            <i class="bi bi-exclamation-circle fs-4"></i>
        </div>
        <p class="mb-2">${message}</p>
        <button class="btn btn-sm btn-outline-primary retry-button">
            <i class="bi bi-arrow-clockwise me-1"></i> Retry
        </button>
    `;
    
    // Add retry button handler
    const retryButton = errorItem.querySelector('.retry-button');
    if (retryButton) {
        retryButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Reset retry count and try again
            notificationState.retryCount = 0;
            notificationState.isLoading = false;
            loadNotifications();
        });
    }
    
    container.appendChild(errorItem);
}

/**
 * Update notification dropdown with received data
 */
function updateNotificationDropdown(dropdown, data) {
    // Clear existing content
    dropdown.innerHTML = '';
    
    // Add header
    const header = document.createElement('h6');
    header.className = 'dropdown-header';
    header.textContent = 'Notifications';
    dropdown.appendChild(header);
    
    // Add divider
    const divider = document.createElement('div');
    divider.className = 'dropdown-divider';
    dropdown.appendChild(divider);
    
    // Handle empty state
    if (!data || (Array.isArray(data) && data.length === 0)) {
        const emptyItem = document.createElement('div');
        emptyItem.className = 'dropdown-item';
        emptyItem.innerHTML = `
            <div class="d-flex align-items-center py-2">
                <i class="bi bi-bell-slash text-muted me-2"></i>
                <span class="text-muted">No new notifications</span>
            </div>
        `;
        dropdown.appendChild(emptyItem);
        return;
    }
    
    // If data is an array of notifications
    if (Array.isArray(data)) {
        // Handle different types of data (notifications vs orders)
        data.forEach(item => {
            const isOrder = item.orderNumber || item.total;
            const isNotification = item.title && item.message;
            
            let notificationItem;
            
            if (isOrder) {
                notificationItem = createOrderNotificationItem(item);
            } else if (isNotification) {
                notificationItem = createStandardNotificationItem(item);
            } else {
                notificationItem = createUnknownNotificationItem(item);
            }
            
            if (notificationItem) {
                dropdown.appendChild(notificationItem);
            }
        });
    }
    
    // Add view all link
    const viewAllItem = document.createElement('div');
    viewAllItem.className = 'dropdown-item';
    viewAllItem.innerHTML = `
        <a href="/admin/notifications.html" class="btn btn-sm btn-light w-100">
            View all notifications
        </a>
    `;
    dropdown.appendChild(viewAllItem);
    
    // Attach click handlers to any action buttons
    const actionButtons = dropdown.querySelectorAll('[data-notification-action]');
    actionButtons.forEach(button => {
        button.addEventListener('click', handleNotificationAction);
    });
}

/**
 * Create a notification item for an order
 */
function createOrderNotificationItem(order) {
    if (!order || !order.id) return null;
    
    const item = document.createElement('a');
    item.className = 'dropdown-item notification-item';
    item.href = `/admin/orders.html?id=${order.id}`;
    
    const timeAgo = order.createdAt ? getTimeAgo(new Date(order.createdAt)) : 'recently';
    
    item.innerHTML = `
        <div class="d-flex align-items-center py-2">
            <div class="notification-icon bg-primary text-white rounded-circle p-2 me-3">
                <i class="bi bi-cart"></i>
            </div>
            <div class="flex-grow-1">
                <div class="notification-title">New order: #${order.orderNumber || order.id}</div>
                <div class="notification-time text-muted small">${timeAgo}</div>
            </div>
        </div>
    `;
    
    return item;
}

/**
 * Create a standard notification item
 */
function createStandardNotificationItem(notification) {
    if (!notification || !notification.id) return null;
    
    const item = document.createElement('a');
    item.className = 'dropdown-item notification-item';
    item.href = notification.link || '#';
    
    const timeAgo = notification.createdAt ? getTimeAgo(new Date(notification.createdAt)) : 'recently';
    const iconClass = notification.icon || 'bell';
    const bgColor = notification.color || 'primary';
    
    item.innerHTML = `
        <div class="d-flex align-items-center py-2">
            <div class="notification-icon bg-${bgColor} text-white rounded-circle p-2 me-3">
                <i class="bi bi-${iconClass}"></i>
            </div>
            <div class="flex-grow-1">
                <div class="notification-title">${notification.title || 'Notification'}</div>
                <div class="notification-message small">${notification.message || ''}</div>
                <div class="notification-time text-muted small">${timeAgo}</div>
            </div>
            ${notification.isRead ? '' : `
            <button class="btn btn-sm text-muted" data-notification-action="mark-read" data-notification-id="${notification.id}">
                <i class="bi bi-check2"></i>
            </button>
            `}
        </div>
    `;
    
    return item;
}

/**
 * Create a fallback notification item for unknown types
 */
function createUnknownNotificationItem(data) {
    const item = document.createElement('div');
    item.className = 'dropdown-item notification-item';
    
    const timeAgo = data.createdAt ? getTimeAgo(new Date(data.createdAt)) : 'recently';
    
    item.innerHTML = `
        <div class="d-flex align-items-center py-2">
            <div class="notification-icon bg-secondary text-white rounded-circle p-2 me-3">
                <i class="bi bi-envelope"></i>
            </div>
            <div class="flex-grow-1">
                <div class="notification-title">New notification</div>
                <div class="notification-time text-muted small">${timeAgo}</div>
            </div>
        </div>
    `;
    
    return item;
}

/**
 * Handle notification action button clicks
 */
function handleNotificationAction(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const button = e.currentTarget;
    const action = button.getAttribute('data-notification-action');
    const notificationId = button.getAttribute('data-notification-id');
    
    if (action === 'mark-read' && notificationId) {
        markNotificationAsRead(notificationId);
    }
}

/**
 * Mark a notification as read
 */
function markNotificationAsRead(notificationId) {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    const endpoint = window.API_URL ? 
        `${window.API_URL}/api/notifications/read` : 
        '/api/notifications/read';
    
    fetch(endpoint, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notificationIds: [notificationId] })
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to mark notification as read');
        return response.json();
    })
    .then(() => {
        loadNotifications(); // Refresh notifications
    })
    .catch(error => {
        console.error('Error marking notification as read:', error);
    });
}

/**
 * Format a date as a time ago string (e.g. "2 mins ago")
 */
function getTimeAgo(date) {
    if (!date || isNaN(date.getTime())) {
        return 'just now';
    }
    
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
    if (days < 30) {
        return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
    
    const months = Math.floor(days / 30);
    if (months < 12) {
        return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    }
    
    const years = Math.floor(months / 12);
    return `${years} ${years === 1 ? 'year' : 'years'} ago`;
}

// Initialize notifications on page load
document.addEventListener('DOMContentLoaded', initNotifications);

// Re-initialize when document becomes visible (in case user switched tabs)
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
        // Check if notifications were never loaded or need refresh
        if (!notificationState.lastLoaded) {
            setTimeout(initNotifications, 200);
        }
    }
});

// Also run on window load to catch any late DOM changes
window.addEventListener('load', function() {
    // Apply styling fixes
    setTimeout(fixNotificationBadgeStyle, 1000);
});

// Expose global functions
window.notificationsModule = {
    refresh: loadNotifications,
    init: initNotifications,
    fixBadges: fixNotificationBadgeStyle
}; 