import dotenv from 'dotenv';
import sendEmail from '../utils/sendEmail.js';
import { emailTemplate } from '../utils/emailTemplate.js';
import otpTemplate from '../utils/otpTemplete.js';

dotenv.config({ path: './config/config.env' });

const testEmail = async () => {
  try {
    // Test verification email
    await sendEmail({
      email: 'rmdanyoussef01@gmail.com', // سنرسل إلى نفس البريد للاختبار
      subject: 'Test Verification Email',
      html: emailTemplate('test-token-123'),
    });
    console.log('✅ Verification email sent successfully!');

    // Test OTP email
    await sendEmail({
      email: 'rmdanyoussef01@gmail.com', // سنرسل إلى نفس البريد للاختبار
      subject: 'Test OTP Email',
      html: otpTemplate('123456'),
    });
    console.log('✅ OTP email sent successfully!');
  } catch (error) {
    console.error('❌ Error sending email:', error);
  }
};

testEmail();
