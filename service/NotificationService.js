import admin from '../firebase/firebase.js';
import UserNotification from '../models/UserNotification.model.js';
import Team from '../models/team.model.js';
import User from '../models/user.model.js';

class NotificationService {
  static async sendNotification(
    deviceToken,
    title,
    body,
    type,
    imageUrl = null,
    actionUrl = null,
    data = ''
  ) {
    if (!deviceToken) return null;
    if (!data.userId) throw new Error('userId is required');

    // Save notification to database
    await UserNotification.create({
      userId: data.userId,
      title,
      body,
      imageUrl,
      type,
      actionUrl,
      data: typeof data === 'object' ? data.data : data,
      isRead: false,
      sentAt: new Date(),
    });

    // Prepare Firebase message
    const message = {
      notification: { title, body },
      token: deviceToken,
    };

    if (imageUrl) message.notification.imageUrl = imageUrl;

    // Send push notification
    const response = await admin.messaging().send(message);
    return response;
  }

  static async sendMultipleNotification(
    deviceTokens,
    title,
    body,
    type,
    imageUrl,
    actionUrl = null,
    data = ''
  ) {
    await Promise.all(
      deviceTokens.map((token, index) =>
        UserNotification.create({
          userId: data.userIds[index],
          title,
          body,
          imageUrl,
          type,
          actionUrl,
          data: typeof data === 'object' ? data.data : data,
          isRead: false,
          sentAt: new Date(),
        })
      )
    );

    const messages = deviceTokens.map(token => ({
      notification: { title, body, imageUrl },
      token,
    }));

    const response = await admin.messaging().sendEach(messages);
    return response;
  }

  //   send notification to team leader for task posted
  static async sendTeamNotificationsByCategory(
    teams,
    category,
    type,
    title,
    body,
    imageUrl,
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
      type,
      imageUrl,
      actionUrl,
      {
        data: data,
        userIds: targetTokens.map(t => t.userId),
      }
    );

    return response;
  }

  //   send notification to team leader for task requests
  static async sendNotificationToTeam(
    token,
    title,
    body,
    imageUrl,
    userId,
    type,
    actionUrl = null,
    data = {}
  ) {
    if (!token) return;

    try {
      await NotificationService.sendNotification(
        token,
        title,
        body,
        type,
        imageUrl,
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

  //   send notification to user for join team
  static async sendJoinTeamNotifications(
    userId,
    title,
    body,
    imageUrl,
    type = 'joinTeam',
    actionUrl = null,
    data = ''
  ) {
    const user = await User.findById(userId).select('fcmToken _id');
    if (!user) {
      return {
        message: 'user not found',
      };
    }
    try {
      await this.sendNotification(
        user.fcmToken,
        title,
        body,
        type,
        imageUrl,
        actionUrl,
        {
          ...data,
          userId: userId.toString(),
        }
      );
    } catch (error) {
      console.error('Error sending join team notification:', error);
    }
  }

  //   send notification to user when join request is accepted
  static async sendJoinRequestAcceptedNotification(
    userId,
    teamName,
    teamLogo = null,
    actionUrl = null,
    data = {}
  ) {
    const user = await User.findById(userId).select('fcmToken _id');
    if (!user) {
      return {
        message: 'user not found',
      };
    }

    try {
      await this.sendNotification(
        user.fcmToken,
        'Join Request Accepted',
        `Your request to join ${teamName} has been accepted!`,
        'joinRequestAccepted',
        teamLogo,
        actionUrl,
        {
          ...data,
          userId: userId.toString(),
        }
      );
    } catch (error) {
      console.error('Error sending join request accepted notification:', error);
    }
  }

  //   send notification to client when task is completed by team
  static async sendTaskCompletedNotification(
    userId,
    taskTitle,
    teamName,
    teamLogo = null,
    actionUrl = null,
    data = {}
  ) {
    const user = await User.findById(userId).select('fcmToken _id');

    try {
      await this.sendNotification(
        user.fcmToken,
        'Task Completed',
        `Your task "${taskTitle}" has been completed by ${teamName}`,
        'taskCompleted',
        teamLogo,
        actionUrl,
        {
          ...data,
          userId: userId.toString(),
        }
      );
    } catch (error) {
      console.error('Error sending task completed notification:', error);
    }
  }
}

export default NotificationService;
