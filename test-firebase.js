import dotenv from 'dotenv';
import admin from './firebase/firebase.js';

// تحميل إعدادات البيئة من .env
dotenv.config({ path: './config/config.env' });

// معرف جهاز للاختبار
const testToken =
  'fu9AI-C4RKmSliahEvje_m:APA91bFhDP9Pk26-_BTjTOx0uGm4tLS3qS80VYcIlTYu9lxkbnGspJEOfLlYzUGjo9osWE8P9aI40rn2z9f3oEbHPCLhuPr_gpJUSADFvOq20NJ1oqke-jk';
async function testFirebase() {
  try {
    console.log(`firebase statring`);
    console.log(`fcmToken: ${testToken}`);

    // إرسال إشعار اختبار
    const message = {
      notification: {
        title: 'test notification',
        body: 'hi mohamed',
      },
      token: testToken,
    };

    console.log('sending ...');
    const response = await admin.messaging().send(message);

    console.log('success!');
    console.log('response :', response);
  } catch (error) {
    console.error(`error`, error);
  }
}

testFirebase();
