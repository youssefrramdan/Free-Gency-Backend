import asyncHandler from 'express-async-handler';
import admin from '../firebaseInit.js';
import ApiError from '../utils/apiError.js';

/**
 * @desc    Send notification to a single user
 * @param   {string} fcmToken - User's FCM token
 * @param   {Object} notification - Notification data
 * @param   {string} notification.title - Notification title
 * @param   {string} notification.body - Notification body
 * @param   {Object} [notification.data] - Additional data to send with notification
 * @returns {Promise<void>}
 */
const sendNotification = asyncHandler(async (fcmToken, notification) => {
  if (!fcmToken) {
    throw new ApiError('FCM token is required', 400);
  }
  const message = {
    notification: {
      title: notification.title,
      body: notification.body,
    },
    data: notification.data || {},
    token: fcmToken,
  };

  await admin.messaging().send(message);
});

/**
 * @desc    Send notification to multiple users
 * @param   {string[]} fcmTokens - Array of FCM tokens
 * @param   {Object} notification - Notification data
 * @param   {string} notification.title - Notification title
 * @param   {string} notification.body - Notification body
 * @param   {Object} [notification.data] - Additional data to send with notification
 * @returns {Promise<void>}
 */
const sendMulticastNotification = async (fcmTokens, notification) => {
  try {
    if (!fcmTokens || fcmTokens.length === 0) {
      throw new ApiError('FCM tokens are required', 400);
    }

    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data || {},
      tokens: fcmTokens,
    };

    await admin.messaging().sendMulticast(message);
  } catch (error) {
    throw new ApiError(
      `Failed to send multicast notification: ${error.message}`,
      error.statusCode || 500
    );
  }
};

export { sendNotification, sendMulticastNotification };
