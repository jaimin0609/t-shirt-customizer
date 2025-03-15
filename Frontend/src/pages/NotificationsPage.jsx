import React, { useState, useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext';
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
//     faTimes,
//     faFilter,
//     faSearch
// } from '@fortawesome/free-solid-svg-icons';

// Temporary icon component to replace FontAwesome
const IconPlaceholder = ({ name, className }) => {
    return <span className={`icon-placeholder ${className}`}>{name}</span>;
};

const NotificationsPage = () => {
    const {
        notifications,
        loading,
        error,
        fetchNotifications,
        markAsRead,
        markAllAsRead
    } = useNotification();

    const [filteredNotifications, setFilteredNotifications] = useState([]);
    const [filter, setFilter] = useState('all'); // all, unread, read
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState('newest'); // newest, oldest

    // Apply filters, search, and sorting
    useEffect(() => {
        let result = [...notifications];

        // Apply read/unread filter
        if (filter === 'unread') {
            result = result.filter(notification => !notification.read);
        } else if (filter === 'read') {
            result = result.filter(notification => notification.read);
        }

        // Apply search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(notification =>
                notification.title.toLowerCase().includes(term) ||
                notification.message.toLowerCase().includes(term)
            );
        }

        // Apply sorting
        result.sort((a, b) => {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });

        setFilteredNotifications(result);
    }, [notifications, filter, searchTerm, sortOrder]);

    // Load more notifications
    const handleLoadMore = () => {
        fetchNotifications(notifications.length + 10);
    };

    // Handle notification click
    const handleNotificationClick = (notification) => {
        if (!notification.read) {
            markAsRead(notification.id);
        }
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
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                <button
                    onClick={markAllAsRead}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                    Mark all as read
                </button>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">All Notifications</option>
                                <option value="unread">Unread</option>
                                <option value="read">Read</option>
                            </select>
                        </div>

                        <div className="relative">
                            <select
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value)}
                                className="pl-4 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                            </select>
                        </div>
                    </div>

                    <div className="relative w-full md:w-64">
                        <input
                            type="text"
                            placeholder="Search notifications..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex justify-center items-center py-8">
                    <span className="text-gray-600">Loading notifications...</span>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
                    <div className="flex">
                        <div>
                            <p className="font-medium">Error loading notifications</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!loading && !error && filteredNotifications.length === 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
                    <p className="text-gray-600">
                        {searchTerm
                            ? "No notifications match your search criteria."
                            : filter === 'unread'
                                ? "You don't have any unread notifications."
                                : filter === 'read'
                                    ? "You don't have any read notifications."
                                    : "You don't have any notifications yet."}
                    </p>
                </div>
            )}

            {/* Notification List */}
            {!loading && !error && filteredNotifications.length > 0 && (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <ul className="divide-y divide-gray-200">
                        {filteredNotifications.map((notification) => (
                            <li
                                key={notification.id}
                                className={`p-4 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-blue-50' : ''}`}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                <div className="flex items-start">
                                    <div className="flex-shrink-0 pt-1">
                                        {getIcon(notification)}
                                    </div>
                                    <div className="ml-4 flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                                            <p className="text-sm text-gray-500">{notification.relativeTime}</p>
                                        </div>
                                        <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                                        {notification.link && (
                                            <a
                                                href={notification.link}
                                                className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-800"
                                            >
                                                View details
                                            </a>
                                        )}
                                    </div>
                                    {!notification.read && (
                                        <span className="ml-3 flex-shrink-0 inline-block h-2 w-2 rounded-full bg-blue-600"></span>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>

                    {/* Load More Button */}
                    {notifications.length > filteredNotifications.length && (
                        <div className="px-4 py-3 bg-gray-50 text-center">
                            <button
                                onClick={handleLoadMore}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                                Load more notifications
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationsPage; 