/**
 * notificationService.js
 * Service for handling all notification-related API calls
 */
import axios from 'axios';
// Removing dependency on authService for build compatibility
// import { getAuthHeaders, isTokenExpired, refreshToken } from './authService';

const API_URL = import.meta.env.VITE_API_URL || 'https://t-shirt-customizer-backend.onrender.com/api';

// Helper functions moved locally from authService to avoid import errors
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    Authorization: token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json'
  };
};

const isTokenExpired = () => {
  const token = localStorage.getItem('token');
  if (!token) return true;
  
  try {
    // JWT tokens are in format: header.payload.signature
    const payload = token.split('.')[1];
    // Decode the base64 payload
    const decoded = JSON.parse(atob(payload));
    // Check if the expiration time (exp) is less than current time
    return decoded.exp * 1000 < Date.now();
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true; // Assume expired if there's an error
  }
};

const refreshToken = async () => {
  try {
    const response = await axios.post(`${API_URL}/auth/refresh-token`);
    if (response.data && response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
    // Clear session on refresh failure
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

/**
 * Fetch unread notifications for the current user
 * @param {number} limit - Maximum number of notifications to fetch
 * @returns {Promise<Array>} - Array of notification objects
 */
export const fetchUnreadNotifications = async (limit = 10) => {
  try {
    // Check if token is expired and refresh if needed
    if (isTokenExpired()) {
      await refreshToken();
    }

    const headers = getAuthHeaders();
    const response = await axios.get(`${API_URL}/notifications/unread?limit=${limit}`, { headers });
    return response.data;
  } catch (error) {
    console.error('Error fetching unread notifications:', error);
    throw error;
  }
};

/**
 * Get notification count for the current user
 * @returns {Promise<number>} - Number of unread notifications
 */
export const getNotificationCount = async () => {
  try {
    // Check if token is expired and refresh if needed
    if (isTokenExpired()) {
      await refreshToken();
    }

    const headers = getAuthHeaders();
    const response = await axios.get(`${API_URL}/notifications/count`, { headers });
    return response.data.count;
  } catch (error) {
    console.error('Error fetching notification count:', error);
    return 0; // Return 0 as fallback in case of error
  }
};

/**
 * Mark notifications as read
 * @param {Array} notificationIds - Array of notification IDs to mark as read
 * @returns {Promise<Object>} - Response data
 */
export const markNotificationsAsRead = async (notificationIds) => {
  try {
    // Check if token is expired and refresh if needed
    if (isTokenExpired()) {
      await refreshToken();
    }

    const headers = getAuthHeaders();
    const response = await axios.put(
      `${API_URL}/notifications/read`, 
      { notificationIds }, 
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read for the current user
 * @returns {Promise<Object>} - Response data
 */
export const markAllNotificationsAsRead = async () => {
  try {
    // Check if token is expired and refresh if needed
    if (isTokenExpired()) {
      await refreshToken();
    }

    const headers = getAuthHeaders();
    const response = await axios.put(`${API_URL}/notifications/read/all`, {}, { headers });
    return response.data;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

/**
 * Create a test notification (for development purposes only)
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @returns {Promise<Object>} - Created notification object
 */
export const createTestNotification = async (title, message) => {
  try {
    // Check if token is expired and refresh if needed
    if (isTokenExpired()) {
      await refreshToken();
    }

    const headers = getAuthHeaders();
    const response = await axios.post(
      `${API_URL}/notifications/test`, 
      { title, message }, 
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating test notification:', error);
    throw error;
  }
};

/**
 * Format notifications for display
 * @param {Array} notifications - Array of notification objects
 * @returns {Array} - Formatted notification objects with relative time and icons
 */
export const formatNotifications = (notifications) => {
  if (!notifications || !Array.isArray(notifications)) {
    return [];
  }

  return notifications.map(notification => {
    // Determine notification icon based on type
    let icon = 'bell';
    let iconClass = 'text-blue-500';
    
    if (notification.type === 'order') {
      icon = 'shopping-cart';
      iconClass = 'text-green-500';
    } else if (notification.type === 'user') {
      icon = 'user';
      iconClass = 'text-purple-500';
    } else if (notification.type === 'system') {
      icon = 'cog';
      iconClass = 'text-orange-500';
    } else if (notification.type === 'alert') {
      icon = 'exclamation-triangle';
      iconClass = 'text-red-500';
    }

    // Format relative time
    const date = new Date(notification.createdAt);
    const now = new Date();
    const diffInMs = now - date;
    const diffInMins = Math.floor(diffInMs / 1000 / 60);
    const diffInHours = Math.floor(diffInMins / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    let relativeTime;
    if (diffInMins < 1) {
      relativeTime = 'Just now';
    } else if (diffInMins < 60) {
      relativeTime = `${diffInMins} min${diffInMins > 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      relativeTime = `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInDays < 30) {
      relativeTime = `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else {
      relativeTime = date.toLocaleDateString();
    }

    return {
      ...notification,
      icon,
      iconClass,
      relativeTime
    };
  });
};

export default {
  fetchUnreadNotifications,
  getNotificationCount,
  markNotificationsAsRead,
  markAllNotificationsAsRead,
  createTestNotification,
  formatNotifications
}; 