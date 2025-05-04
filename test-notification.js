import dotenv from 'dotenv';
import mongoose from 'mongoose';
import NotificationService from './service/NotificationService.js';
import User from './models/user.model.js';

// Load environment variables
dotenv.config({ path: './config/config.env' });

// Connect to database
mongoose
  .connect(process.env.DB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  });

async function testNotification() {
  try {
    // Test 1: Try to find a user with an fcmToken
    console.log('Looking for users with FCM tokens...');
    const usersWithTokens = await User.find({
      fcmToken: { $exists: true, $ne: null },
    });

    if (usersWithTokens.length === 0) {
      console.error(
        'No users found with FCM tokens. Cannot test notification.'
      );
      process.exit(1);
    }

    console.log(`Found ${usersWithTokens.length} users with FCM tokens`);
    const testUser = usersWithTokens[0];

    console.log(`Testing with user: ${testUser.name}`);
    console.log(`Token: ${testUser.fcmToken}`);

    // Test 2: Send a single notification
    console.log('Sending test notification...');
    try {
      const result = await NotificationService.sendNotification(
        testUser.fcmToken,
        'Test Notification from freegency-5cd19',
        'This is a test notification from the freegency-5cd19 project. If you received this, the configuration is correct!',
        null,
        'info',
        null,
        { userId: testUser._id }
      );
      console.log('Notification result:', result);
      console.log('Test completed successfully!');
    } catch (error) {
      console.error('Error sending notification:', error);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error in test:', error);
    process.exit(1);
  }
}

testNotification();
