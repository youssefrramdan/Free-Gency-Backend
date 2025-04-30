import dotenv from 'dotenv';
import admin from './firebase/firebase.js';

// تحميل إعدادات البيئة من .env
dotenv.config({ path: './config/config.env' });

// معرف جهاز للاختبار
const testToken =
  'eWLNxDXsRwyEZmUuVDMzw4:APA91bG_Flvyx96cmRk_OmgBdtSkzVfF2bLzoDhw9cVpmUY7ojWaOSI9gEoNlhWCucSFwFSuurO0c1SeLhbIS-Z0V9UlLWA8VgP5drkSI8lPPzBpZshht3Y';

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
