import admin from '../firebase/firebase.js';
import UserNotification from '../models/UserNotification.model.js';
import User from '../models/user.model.js';

class NotificationService {
  static async sendNotification(
    deviceToken,
    title,
    body,
    imageUrl = null,
    type = 'info',
    actionUrl = null,
    data = ''
  ) {
    if (!deviceToken) return null;
    if (!data.userId) throw new Error('userId is required');

    // Save notification to database
    const notification = await UserNotification.create({
      userId: data.userId,
      title,
      body,
      imageUrl,
      type,
      actionUrl,
      data: typeof data === 'object' ? data.data : data,
      isRead: false,
      sentAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    });

    // Prepare Firebase message
    const message = {
      notification: { title, body },
      token: deviceToken,
    };

    if (imageUrl) message.notification.imageUrl = imageUrl;

    // Send push notification
    const response = await admin.messaging().send(message);
    return { ...response, notificationId: notification._id };
  }

  static async sendMultipleNotification(
    deviceTokens,
    title,
    body,
    imageUrl,
    type = 'info',
    actionUrl = null,
    data = ''
  ) {
    const notifications = await Promise.all(
      deviceTokens.map((token, index) => {
        if (!data.userIds || !data.userIds[index]) {
          console.warn(`No userId found for index ${index}`);
          return null;
        }
        return UserNotification.create({
          userId: data.userIds[index],
          title,
          body,
          imageUrl,
          type,
          actionUrl,
          data: typeof data === 'object' ? data.data : data,
          isRead: false,
          sentAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
      })
    );

    const validNotifications = notifications.filter(n => n !== null);

    const messages = deviceTokens.map(token => ({
      notification: { title, body, imageUrl },
      token,
    }));

    const response = await admin.messaging().sendEach(messages);
    return {
      ...response,
      notificationIds: validNotifications.map(n => n._id),
    };
  }

  static async sendTeamNotificationsByCategory(
    teams,
    category,
    title,
    body,
    imageUrl,
    type = 'info',
    actionUrl = null,
    data = ''
  ) {
    if (!Array.isArray(teams)) return null;

    // Get team leaders with FCM tokens and matching category
    const targetTokens = teams
      .filter(team => team.category.toString() === category.toString())
      .map(team => team.teamLeader)
      .filter(leader => leader && leader.fcmToken && leader.createdTeam)
      .map(leader => ({
        token: leader.fcmToken,
        userId: leader._id,
      }));

    if (targetTokens.length === 0) {
      return {
        successCount: 0,
        failureCount: 0,
        message: 'No matching teams found',
      };
    }

    // Send push notifications and create notifications in database
    const response = await this.sendMultipleNotification(
      targetTokens.map(t => t.token),
      title,
      body,
      imageUrl,
      type,
      actionUrl,
      {
        data: data,
        userIds: targetTokens.map(t => t.userId),
      }
    );

    return response;
  }
  
  static async sendNotificationToTeam  (
    token,
    title,
    message,
    image,
    userId,
    type = 'request',
    actionUrl = null,
    data = {}
  )  {
    if (!token) return;

    try {
      await NotificationService.sendNotification(
        token,
        title,
        message,
        image,
        type,
        actionUrl,
        {
          ...data,
          userId: userId.toString(),
        }
      );
    } catch (error) {
      console.error('Error sending notification:', error);
      // Don't fail the operation if notification fails
    }
  }

  static async sendJobNotifications(
    category,
    title,
    body,
    imageUrl,
    type = 'info',
    actionUrl = null,
    data = ''
  ) {
    // Get all users who have this category in their interests array
    const users = await User.find({
      interests: { $in: [category] }, // Match if category exists in interests array
      fcmToken: { $exists: true, $ne: null },
    }).select('fcmToken _id');

    if (users.length === 0) {
      return {
        successCount: 0,
        failureCount: 0,
        message: 'No matching users found',
      };
    }

    // Send notifications to all matching users
    const response = await this.sendMultipleNotification(
      users.map(user => user.fcmToken),
      title,
      body,
      imageUrl,
      type,
      actionUrl,
      {
        data: data,
        userIds: users.map(user => user._id),
      }
    );

    return response;
  }
}

export default NotificationService;
