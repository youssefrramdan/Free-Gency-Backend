import dotenv from 'dotenv';
import admin from './firebase/firebase.js';

// تحميل إعدادات البيئة من .env
dotenv.config({ path: './config/config.env' });

// معرف جهاز للاختبار
const testToken =
  'cGSjs9QfRzeJFz1xVeUasI:APA91bE9JQRfDO95U9lfPPzhpJhbkhrIAKCPQ2zkAEVYlbyond8oBvkz6wRJvB6UyZEDpEf_VBpljtZT6vKeVc7HuPPA_TQ-ESAWYOJEHIkgbNtUUjX0u8A';

async function testFirebase() {
  try {
    console.log('بدء اختبار إشعارات Firebase...');
    console.log(`استخدام معرف جهاز: ${testToken}`);

    // إرسال إشعار اختبار
    const message = {
      notification: {
        title: 'اختبار الإشعارات',
        body: 'هذا اختبار للتأكد من أن إشعارات Firebase تعمل بشكل صحيح!',
      },
      token: testToken,
    };

    console.log('جاري إرسال الإشعار...');
    const response = await admin.messaging().send(message);

    console.log('تم إرسال الإشعار بنجاح!');
    console.log('نتيجة الإشعار:', response);
  } catch (error) {
    console.error('حدث خطأ أثناء إرسال الإشعار:', error);
  }
}

testFirebase();
