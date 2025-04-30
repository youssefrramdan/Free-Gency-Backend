import express from 'express';
import asyncHandler from 'express-async-handler';
import { protectedRoutes } from '../controllers/auth.controller.js';
import { sendNotification } from '../firebase/notificationService.js';

const router = express.Router();

router.post(
  '/send-notification',
  protectedRoutes,
  asyncHandler(async (req, res, next) => {
    const fcmToken = req.user._id;
    const { notification } = req.body;
    await sendNotification(fcmToken, notification);
    res.status(200).json({ message: 'Notification sent successfully' });
  })
);

export default router;
