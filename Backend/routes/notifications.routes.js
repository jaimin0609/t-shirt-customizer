import express from 'express';
import { auth, isAdmin } from '../middleware/auth.js';
import notificationService from '../services/notification.service.js';
import { handleError, asyncHandler } from '../utils/errorHandler.js';

const router = express.Router();

// Get unread notifications for the current user
router.get('/unread', auth, asyncHandler(async (req, res) => {
    try {
        const notifications = await notificationService.getUnreadNotifications(
            req.user.id, 
            req.user.role === 'admin',
            req.query.limit ? parseInt(req.query.limit) : 10
        );
        
        res.json(notifications);
    } catch (error) {
        console.error('Error fetching unread notifications:', error);
        res.status(500).json({ message: error.message });
    }
}));

// Get notification count for the current user
router.get('/count', auth, asyncHandler(async (req, res) => {
    try {
        const counts = await notificationService.getNotificationCount(
            req.user.id,
            req.user.role === 'admin'
        );
        
        res.json(counts);
    } catch (error) {
        console.error('Error fetching notification count:', error);
        res.status(500).json({ message: error.message });
    }
}));

// Get all notifications for admin dashboard
router.get('/admin/all', auth, isAdmin, asyncHandler(async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 50;
        const notifications = await notificationService.getRecentNotifications(limit);
        
        res.json(notifications);
    } catch (error) {
        console.error('Error fetching admin notifications:', error);
        res.status(500).json({ message: error.message });
    }
}));

// Mark notification(s) as read
router.put('/read', auth, asyncHandler(async (req, res) => {
    try {
        const { ids } = req.body;
        
        if (!ids) {
            return res.status(400).json({ message: 'Notification IDs required' });
        }
        
        const updatedCount = await notificationService.markAsRead(
            ids,
            req.user.id,
            req.user.role === 'admin'
        );
        
        res.json({ 
            success: true, 
            message: `Marked ${updatedCount} notification(s) as read` 
        });
    } catch (error) {
        console.error('Error marking notifications as read:', error);
        res.status(500).json({ message: error.message });
    }
}));

// Mark all notifications as read
router.put('/read/all', auth, asyncHandler(async (req, res) => {
    try {
        const updatedCount = await notificationService.markAllAsRead(
            req.user.id,
            req.user.role === 'admin'
        );
        
        res.json({ 
            success: true, 
            message: `Marked ${updatedCount} notification(s) as read` 
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ message: error.message });
    }
}));

// Create a test notification (for development only)
router.post('/test', auth, isAdmin, asyncHandler(async (req, res) => {
    try {
        const { type, title, message, userId, targetId, targetType, icon, color, link } = req.body;
        
        if (!title || !message) {
            return res.status(400).json({ message: 'Title and message are required' });
        }
        
        const notification = await notificationService.createNotification({
            type: type || 'system',
            title,
            message,
            userId: userId || null, // null = all admins
            targetId: targetId || null,
            targetType: targetType || null,
            icon: icon || 'bell',
            color: color || 'primary',
            link: link || null
        });
        
        res.json({ 
            success: true, 
            message: 'Test notification created',
            notification
        });
    } catch (error) {
        console.error('Error creating test notification:', error);
        res.status(500).json({ message: error.message });
    }
}));

export default router; 