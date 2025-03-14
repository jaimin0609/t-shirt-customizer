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
    debugLog('Initializing notifications system');
    
    // Find notification elements
    setupNotificationElements();
    
    // Load notifications immediately
    loadNotifications();
    
    // Setup refresh timer
    setupRefreshTimer();
    
    // Listen for visibility changes to refresh when page becomes visible
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Expose global refresh method
    window.refreshNotifications = loadNotifications;
    
    // Apply proper styling to notification badge
    fixNotificationBadgeStyle();
    
    debugLog('Notification system initialized');
}

/**
 * Fix notification badge style to ensure it looks professional
 */
function fixNotificationBadgeStyle() {
    // Target all notification badges
    const badges = document.querySelectorAll('.badge[data-notification-badge], .notification-badge, .badge-notification, .position-absolute.badge');
    
    badges.forEach(badge => {
        // Ensure badge has proper position
        badge.style.zIndex = "1001";
        badge.style.transform = "translate(-50%, -50%)";
        
        // Make sure size is appropriate
        badge.style.fontSize = "0.65rem";
        badge.style.padding = "0.25rem 0.4rem";
        
        // Ensure it doesn't overlap with other elements
        badge.style.top = "0";
        badge.style.right = "0";
        badge.style.margin = "0";
        
        // Add pill shape to ensure text fits
        badge.classList.add('rounded-pill');
        
        // Ensure text doesn't overflow
        badge.style.whiteSpace = "nowrap";
        badge.style.overflow = "hidden";
        badge.style.textOverflow = "ellipsis";
        badge.style.maxWidth = "30px";
    });
    
    // Fix container elements for notification dropdowns
    const navItems = document.querySelectorAll('.nav-item.dropdown');
    navItems.forEach(item => {
        item.style.position = "relative";
    });
}

/**
 * Find and setup notification elements in the DOM
 */
function setupNotificationElements() {
    // Find all notification badges
    const badges = document.querySelectorAll('.badge[data-notification-badge], .notification-badge, .badge-notification, .position-absolute.badge');
    debugLog(`Found ${badges.length} notification badge elements`);
    
    // Find all notification dropdown containers
    const dropdowns = document.querySelectorAll('.dropdown-menu.notification-dropdown, .notifications-dropdown, [data-notification-container]');
    debugLog(`Found ${dropdowns.length} notification dropdown elements`);
    
    // Set up click handlers for notification buttons if any
    const buttons = document.querySelectorAll('[data-action="refresh-notifications"], .refresh-notifications');
    buttons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            loadNotifications();
        });
    });
    debugLog(`Set up ${buttons.length} notification refresh buttons`);
}

/**
 * Set up a timer to periodically refresh notifications
 */
function setupRefreshTimer() {
    // Clear any existing timer
    if (notificationState.refreshTimer) {
        clearInterval(notificationState.refreshTimer);
    }
    
    // Set up new timer
    notificationState.refreshTimer = setInterval(() => {
        debugLog('Automatic notification refresh triggered');
        loadNotifications();
    }, CONFIG.refreshInterval);
    
    debugLog(`Refresh timer set for every ${CONFIG.refreshInterval / 1000} seconds`);
}

/**
 * Handle visibility change events to refresh notifications when tab becomes visible
 */
function handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
        const lastLoadedTime = notificationState.lastLoaded ? new Date() - notificationState.lastLoaded : null;
        
        if (!lastLoadedTime || lastLoadedTime > 60000) { // Only reload if it's been more than a minute
            debugLog('Page became visible, refreshing notifications');
            loadNotifications();
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
    
    // Decide which endpoint to use based on retry count
    const endpoint = notificationState.retryCount > 0 ? 
        CONFIG.ordersFallbackEndpoint : 
        CONFIG.notificationsEndpoint;
    
    const fullEndpoint = window.API_URL ? `${window.API_URL}${endpoint}` : endpoint;
    debugLog(`Fetching from endpoint: ${fullEndpoint}`);
    
    // Fetch notifications
    fetch(fullEndpoint, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Failed to load notifications: ${response.status}`);
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
        const count = Array.isArray(data) ? data.length : (data.count || 0);
        notificationBadges.forEach(badge => {
            badge.textContent = count || '';
            badge.classList.toggle('d-none', count === 0);
            // Ensure the badge fits the text
            if (count > 99) {
                badge.textContent = '99+';
            }
        });
        
        // Update all dropdowns
        notificationDropdowns.forEach(dropdown => {
            updateNotificationDropdown(dropdown, data);
        });
    })
    .catch(error => {
        debugLog('Error loading notifications:', error);
        notificationState.error = error;
        
        // Increment retry count
        notificationState.retryCount++;
        
        // If we've already tried the fallback endpoint or max retries, show error state
        if (notificationState.retryCount >= CONFIG.maxRetries) {
            notificationDropdowns.forEach(dropdown => {
                showErrorState(dropdown);
            });
            notificationState.retryCount = 0;
        } else {
            // Retry with fallback endpoint
            setTimeout(() => {
                notificationState.isLoading = false;
                loadNotifications();
            }, 1000); // Small delay before retry
        }
    })
    .finally(() => {
        notificationState.isLoading = false;
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
    
    dropdown.innerHTML = `
        <div class="dropdown-item loading-item">
            <div class="d-flex align-items-center">
                <div class="spinner-border spinner-border-sm text-primary me-2" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <span>Loading notifications...</span>
            </div>
        </div>
    `;
}

/**
 * Show error state in notification dropdown
 */
function showErrorState(dropdown) {
    // Clear existing content first
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

    // Add single error message
    const errorItem = document.createElement('div');
    errorItem.className = 'dropdown-item text-center py-3';
    errorItem.innerHTML = `
        <div class="d-flex flex-column align-items-center">
            <i class="bi bi-exclamation-circle text-danger fs-4 mb-2"></i>
            <p class="text-danger mb-2">Unable to load notifications</p>
            <button class="btn btn-sm btn-outline-primary refresh-notifications">
                <i class="bi bi-arrow-clockwise me-1"></i> Try Again
            </button>
        </div>
    `;
    dropdown.appendChild(errorItem);

    // Add retry handler
    const retryButton = dropdown.querySelector('.refresh-notifications');
    if (retryButton) {
        retryButton.addEventListener('click', (e) => {
            e.preventDefault();
            loadNotifications();
        });
    }
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

// Initialize notifications on DOM content loaded
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initNotifications, 500); // Small delay to ensure DOM is ready
});

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