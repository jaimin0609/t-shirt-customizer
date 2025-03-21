// Direct import React as fallback
import React, { createContext, useContext, useReducer, useCallback } from 'react';
import PropTypes from 'prop-types';
import config from '../config/appConfig';

// Create notification context
const NotificationContext = createContext();

// Define notification types
export const NOTIFICATION_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
};

// Define action types
const ACTIONS = {
    ADD_NOTIFICATION: 'ADD_NOTIFICATION',
    REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
    CLEAR_ALL: 'CLEAR_ALL'
};

// Initial state
const initialState = {
    notifications: []
};

// Generate a unique ID for notifications
const generateId = () => `notification-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

// Reducer function
const notificationReducer = (state, action) => {
    switch (action.type) {
        case ACTIONS.ADD_NOTIFICATION:
            return {
                ...state,
                notifications: [
                    ...state.notifications,
                    {
                        ...action.payload,
                        id: action.payload.id || generateId()
                    }
                ]
            };

        case ACTIONS.REMOVE_NOTIFICATION:
            return {
                ...state,
                notifications: state.notifications.filter(
                    notification => notification.id !== action.payload
                )
            };

        case ACTIONS.CLEAR_ALL:
            return {
                ...state,
                notifications: []
            };

        default:
            return state;
    }
};

/**
 * NotificationProvider component that provides notification functionality
 * to its children components
 */
export function NotificationProvider({ children }) {
    const [state, dispatch] = useReducer(notificationReducer, initialState);

    /**
     * Add a new notification
     * 
     * @param {Object} notification - The notification to add
     * @param {string} notification.message - The message to display
     * @param {string} notification.type - The type of notification (success, error, warning, info)
     * @param {number} notification.duration - Duration in ms before auto-closing (0 for persistent)
     * @param {Function} notification.onClose - Callback function called when notification is closed
     * @param {boolean} notification.dismissible - Whether the notification can be manually closed
     * @param {string} notification.title - Optional title for the notification
     * @param {Object} notification.data - Optional additional data for the notification
     * @returns {string} The ID of the created notification
     */
    const addNotification = useCallback((notification) => {
        // Apply defaults from config
        const completeNotification = {
            type: NOTIFICATION_TYPES.INFO,
            duration: config.UI.TOAST_DURATION,
            dismissible: true,
            ...notification,
            timestamp: Date.now()
        };

        const id = completeNotification.id || generateId();
        completeNotification.id = id;

        dispatch({
            type: ACTIONS.ADD_NOTIFICATION,
            payload: completeNotification
        });

        // Auto-remove notification after duration (if not persistent)
        if (completeNotification.duration > 0) {
            setTimeout(() => {
                removeNotification(id);

                // Call onClose callback if provided
                if (completeNotification.onClose && typeof completeNotification.onClose === 'function') {
                    completeNotification.onClose();
                }
            }, completeNotification.duration);
        }

        return id;
    }, []);

    /**
     * Remove a notification by ID
     * 
     * @param {string} id - The ID of the notification to remove
     */
    const removeNotification = useCallback((id) => {
        dispatch({ type: ACTIONS.REMOVE_NOTIFICATION, payload: id });
    }, []);

    /**
     * Clear all notifications
     */
    const clearAllNotifications = useCallback(() => {
        dispatch({ type: ACTIONS.CLEAR_ALL });
    }, []);

    /**
     * Helper function to add a success notification
     * 
     * @param {string} message - The message to display
     * @param {Object} options - Additional options for the notification
     * @returns {string} The ID of the created notification
     */
    const showSuccess = useCallback((message, options = {}) => {
        return addNotification({
            ...options,
            message,
            type: NOTIFICATION_TYPES.SUCCESS
        });
    }, [addNotification]);

    /**
     * Helper function to add an error notification
     * 
     * @param {string} message - The message to display
     * @param {Object} options - Additional options for the notification
     * @returns {string} The ID of the created notification
     */
    const showError = useCallback((message, options = {}) => {
        return addNotification({
            ...options,
            message,
            type: NOTIFICATION_TYPES.ERROR
        });
    }, [addNotification]);

    /**
     * Helper function to add a warning notification
     * 
     * @param {string} message - The message to display
     * @param {Object} options - Additional options for the notification
     * @returns {string} The ID of the created notification
     */
    const showWarning = useCallback((message, options = {}) => {
        return addNotification({
            ...options,
            message,
            type: NOTIFICATION_TYPES.WARNING
        });
    }, [addNotification]);

    /**
     * Helper function to add an info notification
     * 
     * @param {string} message - The message to display
     * @param {Object} options - Additional options for the notification
     * @returns {string} The ID of the created notification
     */
    const showInfo = useCallback((message, options = {}) => {
        return addNotification({
            ...options,
            message,
            type: NOTIFICATION_TYPES.INFO
        });
    }, [addNotification]);

    // Value object to be provided to consumers
    const value = {
        notifications: state.notifications,
        addNotification,
        removeNotification,
        clearAllNotifications,
        showSuccess,
        showError,
        showWarning,
        showInfo
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}

NotificationProvider.propTypes = {
    children: PropTypes.node.isRequired
};

/**
 * Custom hook to use the notification context
 * 
 * @returns {Object} The notification context value
 */
export function useNotification() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
}

export default NotificationContext; 