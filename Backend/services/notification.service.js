import Notification from '../models/Notification.js';
import { User, Order } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * Service for managing system notifications
 */
class NotificationService {
    /**
     * Create a new notification
     * @param {Object} data Notification data
     * @returns {Promise<Object>} Created notification
     */
    async createNotification(data) {
        try {
            const notification = await Notification.create(data);
            console.log(`Notification created: ${notification.id} - ${notification.title}`);
            return notification;
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    }

    /**
     * Create a notification for a new order
     * @param {Object} order Order object
     * @returns {Promise<Object>} Created notification
     */
    async notifyNewOrder(order) {
        try {
            // Get customer name from order
            let customerName = "Unknown Customer";
            if (order.userId) {
                const user = await User.findByPk(order.userId);
                if (user) {
                    customerName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
                }
            }
            
            // Create admin notification (for all admins)
            const adminNotification = await this.createNotification({
                type: 'order',
                title: 'New Order Received',
                message: `Order #${order.orderNumber} received from ${customerName} for $${order.total}`,
                userId: null, // null = all admins
                targetId: order.id,
                targetType: 'order',
                icon: 'cart',
                color: 'success',
                link: `/admin/orders.html?id=${order.id}`
            });
            
            // Create user notification
            if (order.userId) {
                await this.createNotification({
                    type: 'order',
                    title: 'Order Confirmed',
                    message: `Your order #${order.orderNumber} has been received and is being processed.`,
                    userId: order.userId,
                    targetId: order.id,
                    targetType: 'order',
                    icon: 'check-circle',
                    color: 'primary',
                    link: `/orders/${order.orderNumber}`
                });
            }
            
            return adminNotification;
        } catch (error) {
            console.error('Error creating order notification:', error);
            throw error;
        }
    }

    /**
     * Create a notification for an order status update
     * @param {Object} order Updated order object
     * @returns {Promise<Object>} Created notification
     */
    async notifyOrderStatusUpdate(order) {
        try {
            // Create user notification
            if (order.userId) {
                let statusMessage = '';
                let statusIcon = 'info-circle';
                let statusColor = 'primary';
                
                switch (order.status) {
                    case 'processing':
                        statusMessage = 'Your order is now being processed.';
                        statusIcon = 'gear';
                        break;
                    case 'shipped':
                        statusMessage = 'Your order has been shipped!';
                        statusIcon = 'truck';
                        statusColor = 'success';
                        break;
                    case 'delivered':
                        statusMessage = 'Your order has been delivered. Thanks for shopping with us!';
                        statusIcon = 'check-circle-fill';
                        statusColor = 'success';
                        break;
                    case 'cancelled':
                        statusMessage = 'Your order has been cancelled.';
                        statusIcon = 'x-circle';
                        statusColor = 'danger';
                        break;
                    default:
                        statusMessage = `Your order status has been updated to: ${order.status}`;
                }
                
                return await this.createNotification({
                    type: 'order',
                    title: 'Order Status Updated',
                    message: statusMessage,
                    userId: order.userId,
                    targetId: order.id,
                    targetType: 'order',
                    icon: statusIcon,
                    color: statusColor,
                    link: `/orders/${order.orderNumber}`
                });
            }
        } catch (error) {
            console.error('Error creating order status notification:', error);
            throw error;
        }
    }

    /**
     * Get unread notifications for a user
     * @param {number} userId User ID
     * @param {boolean} isAdmin Whether user is admin
     * @param {number} limit Max notifications to return
     * @returns {Promise<Array>} Unread notifications
     */
    async getUnreadNotifications(userId, isAdmin = false, limit = 10) {
        try {
            const whereClause = {
                isRead: false
            };
            
            if (isAdmin) {
                // Admins see their own notifications + global admin notifications
                whereClause[Op.or] = [
                    { userId: userId },
                    { userId: null } // global admin notifications
                ];
            } else {
                // Regular users only see their own notifications
                whereClause.userId = userId;
            }
            
            const notifications = await Notification.findAll({
                where: whereClause,
                order: [['createdAt', 'DESC']],
                limit: limit
            });
            
            return notifications;
        } catch (error) {
            console.error('Error fetching unread notifications:', error);
            throw error;
        }
    }

    /**
     * Get recent notifications for all users (admin only)
     * @param {number} limit Max notifications to return
     * @returns {Promise<Array>} Recent notifications
     */
    async getRecentNotifications(limit = 20) {
        try {
            const notifications = await Notification.findAll({
                where: {
                    userId: null // global admin notifications only
                },
                order: [['createdAt', 'DESC']],
                limit: limit
            });
            
            return notifications;
        } catch (error) {
            console.error('Error fetching recent notifications:', error);
            throw error;
        }
    }

    /**
     * Mark notifications as read
     * @param {Array|number} notificationIds Notification ID(s)
     * @param {number} userId User ID
     * @param {boolean} isAdmin Whether user is admin
     * @returns {Promise<number>} Number of updated notifications
     */
    async markAsRead(notificationIds, userId, isAdmin = false) {
        try {
            // Convert single ID to array
            if (!Array.isArray(notificationIds)) {
                notificationIds = [notificationIds];
            }
            
            const whereClause = {
                id: {
                    [Op.in]: notificationIds
                }
            };
            
            // Regular users can only mark their own notifications as read
            if (!isAdmin) {
                whereClause.userId = userId;
            }
            
            const [updatedCount] = await Notification.update(
                { isRead: true },
                { where: whereClause }
            );
            
            return updatedCount;
        } catch (error) {
            console.error('Error marking notifications as read:', error);
            throw error;
        }
    }

    /**
     * Mark all notifications as read for a user
     * @param {number} userId User ID
     * @param {boolean} isAdmin Whether user is admin
     * @returns {Promise<number>} Number of updated notifications
     */
    async markAllAsRead(userId, isAdmin = false) {
        try {
            const whereClause = {
                isRead: false
            };
            
            if (isAdmin) {
                whereClause[Op.or] = [
                    { userId: userId },
                    { userId: null } // global admin notifications
                ];
            } else {
                whereClause.userId = userId;
            }
            
            const [updatedCount] = await Notification.update(
                { isRead: true },
                { where: whereClause }
            );
            
            return updatedCount;
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            throw error;
        }
    }
    
    /**
     * Get notification count for a user
     * @param {number} userId User ID
     * @param {boolean} isAdmin Whether user is admin
     * @returns {Promise<Object>} Notification counts
     */
    async getNotificationCount(userId, isAdmin = false) {
        try {
            const whereClause = {};
            
            if (isAdmin) {
                whereClause[Op.or] = [
                    { userId: userId },
                    { userId: null } // global admin notifications
                ];
            } else {
                whereClause.userId = userId;
            }
            
            const unreadCount = await Notification.count({
                where: {
                    ...whereClause,
                    isRead: false
                }
            });
            
            const totalCount = await Notification.count({
                where: whereClause
            });
            
            return {
                unread: unreadCount,
                total: totalCount
            };
        } catch (error) {
            console.error('Error getting notification count:', error);
            throw error;
        }
    }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService; 