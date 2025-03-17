// Direct import React as fallback
import React from 'react';
import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useAuth } from './AuthContext';

// Import services consistently
const notificationService = {
    // Placeholder implementations until real service is connected
    fetchUnreadNotifications: async (limit = 10) => {
        console.log('Fetching notifications with limit:', limit);
        // Mock implementation
        return { notifications: [], count: 0 };
    },
    getNotificationCount: async () => {
        // Mock implementation
        return 0;
    },
    markNotificationsAsRead: async (ids) => {
        console.log('Marking notifications as read:', ids);
        // Mock implementation
        return true;
    },
    markAllNotificationsAsRead: async () => {
        console.log('Marking all notifications as read');
        // Mock implementation
        return true;
    },
    formatNotifications: (notifications) => {
        // Mock implementation
        return notifications.map(n => ({
            ...n,
            formattedDate: new Date(n.createdAt).toLocaleString()
        }));
    }
};

// Create notification context with safer pattern
const NotificationContext = createContext({
    notifications: [],
    unreadCount: 0,
    loading: false,
    error: null,
    isOpen: false,
    fetchNotifications: () => { },
    refreshNotificationCount: () => { },
    markAsRead: () => { },
    markAllAsRead: () => { },
    toggleNotifications: () => { },
    closeNotifications: () => { }
});

// Export NotificationContext for direct use if needed
export { NotificationContext };

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
            const data = await notificationService.fetchUnreadNotifications(limit);
            setNotifications(notificationService.formatNotifications(data.notifications || []));
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
            const count = await notificationService.getNotificationCount();
            setUnreadCount(count);
        } catch (err) {
            console.error('Error fetching notification count:', err);
        }
    }, [isAuthenticated]);

    // Mark a single notification as read
    const markAsRead = useCallback(async (notificationId) => {
        try {
            await notificationService.markNotificationsAsRead([notificationId]);

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
            await notificationService.markAllNotificationsAsRead();

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

    return (
        <NotificationContext.Provider
            value={{
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
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

// Custom hook to use the notification context
export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
}; 