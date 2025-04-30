import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import admin from '../firebase/firebase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class NotificationService {
  static async sendNotification(deviceToken, title, body) {
    const message = {
      notification: {
        title,
        body,
      },
      token: deviceToken,
    };
    const response = await admin.messaging().send(message);
    return response;
  }

  static async sendMultipleNotification(deviceTokens, title, body, imageUrl) {
    const messages = deviceTokens.map(token => ({
      notification: {
        title,
        body,
        imageUrl,
      },
      token: token,
    }));
    const response = await admin.messaging().sendEach(messages);
    return response;
  }

  static async sendTeamNotificationsByCategory(
    teams,
    category,
    title,
    body,
    imageUrl
  ) {
    // Filter teams by category and collect their device tokens
    const targetTokens = teams
      .filter(team => team.category.toString() === category.toString())
      .map(team => team.teamLeader)
      .filter(leader => leader && leader.fcmToken)
      .map(leader => leader.fcmToken);

    if (targetTokens.length === 0) {
      return {
        successCount: 0,
        failureCount: 0,
        message: 'No matching teams found',
      };
    }

    // Send notifications to all collected tokens
    const response = await this.sendMultipleNotification(
      targetTokens,
      title,
      body,
      imageUrl
    );
    return response;
  }
}

export default NotificationService;
