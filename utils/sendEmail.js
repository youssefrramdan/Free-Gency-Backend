/* eslint-disable import/prefer-default-export */
import nodemailer from 'nodemailer';

/**
 * @desc    Send an email for either OTP verification or account verification
 * @param   {string} email - User email to send the message
 * @param   {string} type - Type of email ('otp' or 'verification')
 * @param   {string} [code] - OTP code if type is 'otp'
 */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async options => {
  const info = await transporter.sendMail({
    from: `"Free-Gency" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.html,
  });

  console.log('Message sent: %s', info.messageId);
};

export default sendEmail;
