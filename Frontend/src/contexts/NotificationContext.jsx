// Get React from the global scope if available or import it
const React = window.React || React; // Try global first

// Use an IIFE to handle async imports if needed
(function initializeModule() {
    if (!window.React) {
        // Only attempt to import if not already available
        import('react').then(module => {
            window.React = module.default || module;
            // Force a refresh if needed
            if (typeof forceRefresh === 'function') forceRefresh();
        }).catch(err => console.error('Failed to import React:', err));
    }
})();

const { useContext, useState, useEffect, useCallback, createContext } = React || {
    useState: () => [null, () => { }],
    useEffect: () => { },
    useContext: () => ({}),
    useCallback: (cb) => cb,
    createContext: (val) => ({ Provider: ({ children }) => children, Consumer: ({ children }) => children })
};

import {
    fetchUnreadNotifications,
    getNotificationCount,
    markNotificationsAsRead,
    markAllNotificationsAsRead,
    formatNotifications
} from '../services/notificationService';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

// Create the notification context with a safer pattern
const NotificationContext = createContext({
    notifications: [],
    unreadCount: 0,
    loading: false,
    error: null,
    isOpen: false,
    fetchNotifications: () => Promise.resolve(),
    refreshNotificationCount: () => Promise.resolve(),
    markAsRead: () => Promise.resolve(),
    markAllAsRead: () => Promise.resolve(),
    toggleNotifications: () => { },
    closeNotifications: () => { }
});

// Custom hook to use the notification context
export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isOpen, setIsOpen] = useState(false);

    // Fetch notifications from the API
    const fetchNotifications = useCallback(async (limit = 10) => {
        if (!isAuthenticated) return;

        setLoading(true);
        setError(null);

        try {
            const data = await fetchUnreadNotifications(limit);
            setNotifications(formatNotifications(data.notifications || []));
            setUnreadCount(data.count || 0);
        } catch (err) {
            console.error('Error fetching notifications:', err);
            setError('Failed to fetch notifications');
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    // Fetch notification count only
    const refreshNotificationCount = useCallback(async () => {
        if (!isAuthenticated) return;

        try {
            const count = await getNotificationCount();
            setUnreadCount(count);
        } catch (err) {
            console.error('Error fetching notification count:', err);
        }
    }, [isAuthenticated]);

    // Mark a single notification as read
    const markAsRead = useCallback(async (notificationId) => {
        try {
            await markNotificationsAsRead([notificationId]);

            // Update local state
            setNotifications(prevNotifications =>
                prevNotifications.map(notification =>
                    notification.id === notificationId
                        ? { ...notification, read: true }
                        : notification
                )
            );

            // Refresh the count
            refreshNotificationCount();
        } catch (err) {
            console.error('Error marking notification as read:', err);
            setError('Failed to mark notification as read');
        }
    }, [refreshNotificationCount]);

    // Mark all notifications as read
    const markAllAsRead = useCallback(async () => {
        try {
            await markAllNotificationsAsRead();

            // Update local state
            setNotifications(prevNotifications =>
                prevNotifications.map(notification => ({ ...notification, read: true }))
            );

            // Reset the unread count
            setUnreadCount(0);
        } catch (err) {
            console.error('Error marking all notifications as read:', err);
            setError('Failed to mark all notifications as read');
        }
    }, []);

    // Toggle the notification dropdown
    const toggleNotifications = useCallback(() => {
        setIsOpen(prevState => !prevState);

        // If opening, fetch latest notifications
        if (!isOpen) {
            fetchNotifications();
        }
    }, [isOpen, fetchNotifications]);

    // Close the notification dropdown
    const closeNotifications = useCallback(() => {
        setIsOpen(false);
    }, []);

    // Initial load and periodic refresh
    useEffect(() => {
        if (isAuthenticated) {
            fetchNotifications();

            // Set up periodic refresh every 5 minutes
            const intervalId = setInterval(() => {
                refreshNotificationCount();
            }, 5 * 60 * 1000);

            return () => clearInterval(intervalId);
        }
    }, [isAuthenticated, fetchNotifications, refreshNotificationCount]);

    // Create a stable context value object
    const value = {
        notifications,
        unreadCount,
        loading,
        error,
        isOpen,
        fetchNotifications,
        refreshNotificationCount,
        markAsRead,
        markAllAsRead,
        toggleNotifications,
        closeNotifications
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

// Export the context
export { NotificationContext }; 