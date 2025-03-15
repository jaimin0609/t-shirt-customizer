import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
// Temporarily comment out FontAwesome imports to fix build
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import {
//     faBell,
//     faShoppingCart,
//     faUser,
//     faCog,
//     faExclamationTriangle,
//     faCheck,
//     faSpinner,
//     faTimes
// } from '@fortawesome/free-solid-svg-icons';

// Temporary icon component to replace FontAwesome
const IconPlaceholder = ({ name, className }) => {
    return <span className={`icon-placeholder ${className}`}>{name}</span>;
};

const NotificationDropdown = () => {
    const {
        notifications,
        unreadCount,
        loading,
        error,
        isOpen,
        toggleNotifications,
        closeNotifications,
        markAsRead,
        markAllAsRead
    } = useNotification();

    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                closeNotifications();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, closeNotifications]);

    // Handle notification click
    const handleNotificationClick = (notification) => {
        // Mark notification as read
        markAsRead(notification.id);

        // Navigate based on notification type and link
        if (notification.link) {
            navigate(notification.link);
        }

        // Close the dropdown
        closeNotifications();
    };

    // Render the appropriate icon based on notification type
    const getIcon = (notification) => {
        switch (notification.icon) {
            case 'shopping-cart':
                return <IconPlaceholder name="🛒" className={notification.iconClass} />;
            case 'user':
                return <IconPlaceholder name="👤" className={notification.iconClass} />;
            case 'cog':
                return <IconPlaceholder name="⚙️" className={notification.iconClass} />;
            case 'exclamation-triangle':
                return <IconPlaceholder name="⚠️" className={notification.iconClass} />;
            default:
                return <IconPlaceholder name="🔔" className={notification.iconClass} />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Notification Bell Icon with Badge */}
            <button
                className="relative p-2 text-gray-700 hover:text-primary-500 transition-colors"
                onClick={toggleNotifications}
                aria-label="Notifications"
            >
                <IconPlaceholder name="🔔" className="text-xl" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50 border border-gray-200">
                    {/* Header */}
                    <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-700">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs text-primary-600 hover:text-primary-800"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="p-4 text-center text-gray-500">
                            <IconPlaceholder name="⏳" className="mr-2" />
                            Loading notifications...
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="p-4 text-center text-red-500">
                            <IconPlaceholder name="❌" className="mr-2" />
                            {error}
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && !error && notifications.length === 0 && (
                        <div className="p-4 text-center text-gray-500">
                            No new notifications
                        </div>
                    )}

                    {/* Notification List */}
                    {!loading && !error && notifications.length > 0 && (
                        <div className="max-h-80 overflow-y-auto">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors flex ${!notification.read ? 'bg-blue-50' : ''
                                        }`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="mr-3 mt-1">
                                        {getIcon(notification)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between">
                                            <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                                            <span className="text-xs text-gray-500">{notification.relativeTime}</span>
                                        </div>
                                        <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                                        {!notification.read && (
                                            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full ml-1"></span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Footer */}
                    <div className="p-2 bg-gray-50 border-t border-gray-200 text-center">
                        <button
                            onClick={() => {
                                navigate('/notifications');
                                closeNotifications();
                            }}
                            className="text-xs text-primary-600 hover:text-primary-800"
                        >
                            View all notifications
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
