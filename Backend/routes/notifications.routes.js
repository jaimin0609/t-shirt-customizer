import express from 'express';
import { auth, isAdmin } from '../middleware/auth.js';
import { Notification } from '../models/index.js';
import { handleError, asyncHandler } from '../utils/errorHandler.js';

const router = express.Router();

// Get unread notifications for the current user
router.get('/unread', auth, asyncHandler(async (req, res) => {
    try {
        const notifications = await Notification.findAll({
            where: {
                userId: req.user.id,
                isRead: false
            },
            order: [['createdAt', 'DESC']],
            limit: 10
        });
        
        res.json(notifications);
    } catch (error) {
        console.error('Error fetching unread notifications:', error);
        res.status(500).json({ message: 'Failed to fetch notifications', error: error.message });
    }
}));

// Get notification count for the current user
router.get('/count', auth, asyncHandler(async (req, res) => {
    try {
        const count = await Notification.count({
            where: {
                userId: req.user.id,
                isRead: false
            }
        });
        
        res.json({ count });
    } catch (error) {
        console.error('Error fetching notification count:', error);
        res.status(500).json({ message: 'Failed to fetch notification count', error: error.message });
    }
}));

// Mark notifications as read
router.put('/read', auth, asyncHandler(async (req, res) => {
    try {
        const { notificationIds } = req.body;
        
        if (!notificationIds || !Array.isArray(notificationIds)) {
            return res.status(400).json({ message: 'Notification IDs are required' });
        }
        
        await Notification.update(
            { isRead: true },
            { 
                where: {
                    id: notificationIds,
                    userId: req.user.id
                }
            }
        );
        
        res.json({ message: 'Notifications marked as read' });
    } catch (error) {
        console.error('Error marking notifications as read:', error);
        res.status(500).json({ message: 'Failed to update notifications', error: error.message });
    }
}));

// Mark all notifications as read for current user
router.put('/read/all', auth, asyncHandler(async (req, res) => {
    try {
        await Notification.update(
            { isRead: true },
            { 
                where: {
                    userId: req.user.id,
                    isRead: false
                }
            }
        );
        
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ message: 'Failed to update notifications', error: error.message });
    }
}));

// Create a test notification (DEV only)
router.post('/test', auth, asyncHandler(async (req, res) => {
    try {
        const { title, message } = req.body;
        
        if (!title || !message) {
            return res.status(400).json({ message: 'Title and message are required' });
        }
        
        const notification = await Notification.create({
            userId: req.user.id,
            title,
            message,
            type: 'test',
            isRead: false
        });
        
        res.status(201).json(notification);
    } catch (error) {
        console.error('Error creating test notification:', error);
        res.status(500).json({ message: 'Failed to create notification', error: error.message });
    }
}));

// Get all notifications for admin dashboard
router.get('/admin/all', [auth, isAdmin], asyncHandler(async (req, res) => {
    try {
        const notifications = await Notification.findAll({
            order: [['createdAt', 'DESC']],
            limit: 50
        });
        
        res.json(notifications);
    } catch (error) {
        console.error('Error fetching admin notifications:', error);
        res.status(500).json({ message: 'Failed to fetch notifications', error: error.message });
    }
}));

export default router; 