import express from 'express';
import {
  createNotification,
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  deleteExpiredNotifications,
  getAllNotifications,
  clearAllNotifications,
} from '../controllers/notification.controller.js';
import { protectedRoutes } from '../controllers/auth.controller.js';

const router = express.Router();

router.use(protectedRoutes);

// Create a new notification
router.post('/', createNotification);

// Get user's notifications with filters
router.get('/', getMyNotifications);

// Get all notifications (admin only)
router.get('/all', getAllNotifications);

// Get unread notifications count
router.get('/unread-count', getUnreadCount);

// Mark a notification as read
router.patch('/:notificationId/read', markAsRead);

// Mark all notifications as read
router.patch('/read-all', markAllAsRead);

// Delete a notification
router.delete('/:notificationId', deleteNotification);

// Delete expired notifications
router.delete('/expired', deleteExpiredNotifications);

// Clear all notifications for a user
router.delete('/clear-all', clearAllNotifications);

export default router;
