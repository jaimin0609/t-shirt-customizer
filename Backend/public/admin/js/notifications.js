/**
 * notifications.js - Dedicated module for handling admin notifications
 */

// Initialize immediately on script load
(function() {
    console.log('Notifications module initialized');
    
    // Load notifications on page load
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOM loaded - initializing notifications');
        initNotifications();
    });
    
    // Also try on window load
    window.addEventListener('load', function() {
        console.log('Window loaded - initializing notifications');
        setTimeout(initNotifications, 1000);
    });
})();

/**
 * Initialize notification system
 */
function initNotifications() {
    console.log('Initializing notification system');
    
    // Find notification elements
    const notificationButton = document.querySelector('.nav-item.dropdown .btn-link');
    const notificationBadge = document.querySelector('.position-absolute.badge.rounded-pill.bg-danger');
    const notificationDropdown = document.querySelector('.dropdown-menu.notification-dropdown');
    
    // Debug what we found
    console.log('Notification elements:', {
        button: notificationButton ? 'Found' : 'Missing',
        badge: notificationBadge ? 'Found' : 'Missing',
        dropdown: notificationDropdown ? 'Found' : 'Missing'
    });
    
    if (!notificationBadge || !notificationDropdown) {
        console.error('Cannot find notification elements');
        return;
    }
    
    // Load notifications
    fetchNotifications(notificationBadge, notificationDropdown);
    
    // Add manual refresh on notification button click
    if (notificationButton) {
        notificationButton.addEventListener('click', function() {
            console.log('Notification button clicked - refreshing notifications');
            fetchNotifications(notificationBadge, notificationDropdown);
        });
    }
}

/**
 * Fetch notifications from the API
 */
function fetchNotifications(badgeElement, dropdownElement) {
    // Get authentication token
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('No authentication token found');
        return;
    }
    
    // Save original content in case we need to restore it
    const originalBadgeText = badgeElement.textContent.trim();
    const originalDropdownContent = dropdownElement.innerHTML;
    
    // Save header and divider elements
    const header = dropdownElement.querySelector('.dropdown-header');
    const divider = dropdownElement.querySelector('.dropdown-divider');
    
    // Add loading indicator
    dropdownElement.innerHTML = '';
    if (header) dropdownElement.appendChild(header.cloneNode(true));
    if (divider) dropdownElement.appendChild(divider.cloneNode(true));
    
    const loadingItem = document.createElement('a');
    loadingItem.className = 'dropdown-item';
    loadingItem.href = '#';
    loadingItem.innerHTML = `
        <div class="d-flex align-items-center">
            <div class="spinner-border spinner-border-sm text-primary me-2" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <div>Loading notifications...</div>
        </div>
    `;
    dropdownElement.appendChild(loadingItem);
    
    // Fetch notifications (recent orders)
    console.log('Fetching notifications from API');
    fetch(`${window.API_URL || '/api'}/orders/recent`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        console.log('Notifications API response:', response.status);
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Received notifications data:', data);
        
        // Reset dropdown content
        dropdownElement.innerHTML = '';
        if (header) dropdownElement.appendChild(header.cloneNode(true));
        if (divider) dropdownElement.appendChild(divider.cloneNode(true));
        
        // Update badge count
        const count = Array.isArray(data) ? data.length : 0;
        badgeElement.textContent = count;
        
        if (!Array.isArray(data) || data.length === 0) {
            // Show empty state
            const emptyItem = document.createElement('a');
            emptyItem.className = 'dropdown-item';
            emptyItem.href = '#';
            emptyItem.innerHTML = `
                <div class="d-flex align-items-center">
                    <div class="notification-icon bg-secondary text-white rounded-circle p-2">
                        <i class="bi bi-bell-slash"></i>
                    </div>
                    <div class="ms-3">
                        <p class="mb-0">No new notifications</p>
                    </div>
                </div>
            `;
            dropdownElement.appendChild(emptyItem);
        } else {
            // Add notification items
            data.forEach(order => {
                const timeAgo = formatTimeAgo(new Date(order.createdAt));
                const item = document.createElement('a');
                item.className = 'dropdown-item';
                item.href = `/admin/orders.html?id=${order.id}`;
                
                item.innerHTML = `
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
                
                dropdownElement.appendChild(item);
            });
            
            // Add "View all" link
            const viewAllItem = document.createElement('a');
            viewAllItem.className = 'dropdown-item text-center';
            viewAllItem.href = '/admin/orders.html';
            viewAllItem.innerHTML = '<strong>View all orders</strong>';
            dropdownElement.appendChild(viewAllItem);
        }
        
        console.log('Notifications updated successfully');
    })
    .catch(error => {
        console.error('Error loading notifications:', error);
        
        // Restore original content
        dropdownElement.innerHTML = originalDropdownContent;
        badgeElement.textContent = originalBadgeText;
        
        // Optionally add an error item at the bottom
        const errorItem = document.createElement('a');
        errorItem.className = 'dropdown-item text-danger small';
        errorItem.href = '#';
        errorItem.innerHTML = 'Error loading notifications';
        dropdownElement.appendChild(errorItem);
    });
}

/**
 * Format a date as a time ago string
 */
function formatTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);
    
    if (diffSec < 60) {
        return 'just now';
    } else if (diffMin < 60) {
        return `${diffMin} min${diffMin !== 1 ? 's' : ''} ago`;
    } else if (diffHour < 24) {
        return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
    } else if (diffDay < 30) {
        return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
    } else {
        return date.toLocaleDateString();
    }
}

// Make functions globally available
window.initNotifications = initNotifications;
window.refreshNotifications = function() {
    const badge = document.querySelector('.position-absolute.badge.rounded-pill.bg-danger');
    const dropdown = document.querySelector('.dropdown-menu.notification-dropdown');
    if (badge && dropdown) {
        fetchNotifications(badge, dropdown);
    }
}; 