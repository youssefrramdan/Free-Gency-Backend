export const otpTemplate = otpCode => `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Free-Gency OTP Verification</title>
      <style>
          body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
              margin: 0;
              padding: 0;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
          }
          .container {
              width: 100%;
              max-width: 500px;
              margin: 20px;
              background: #ffffff;
              padding: 40px;
              border-radius: 20px;
              box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
              text-align: center;
          }
          .logo {
              width: 80px;
              height: 80px;
              margin-bottom: 25px;
              background: #4a90e2;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 25px;
          }
          .logo-text {
              color: white;
              font-size: 24px;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 2px;
          }
          .header {
              font-size: 28px;
              font-weight: 700;
              color: #2c3e50;
              margin-bottom: 15px;
          }
          .message {
              font-size: 16px;
              color: #7f8c8d;
              line-height: 1.6;
              margin: 20px 0;
          }
          .otp-container {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 12px;
              margin: 25px 0;
          }
          .otp-code {
              font-size: 32px;
              font-weight: 700;
              color: #4a90e2;
              letter-spacing: 8px;
              font-family: 'Courier New', monospace;
              text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
          }
          .timer {
              font-size: 14px;
              color: #e74c3c;
              margin-top: 10px;
              font-weight: 500;
          }
          .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
          }
          .footer p {
              color: #7f8c8d;
              font-size: 14px;
              margin: 5px 0;
          }
          .footer a {
              color: #4a90e2;
              text-decoration: none;
              font-weight: 600;
          }
          .footer a:hover {
              text-decoration: underline;
          }
          .social-links {
              margin-top: 20px;
          }
          .social-links a {
              color: #4a90e2;
              text-decoration: none;
              margin: 0 10px;
              font-size: 14px;
          }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="logo">
              <span class="logo-text">FG</span>
          </div>
          <div class="header">Verify Your Account</div>
          <div class="message">
              Welcome to Free-Gency! Please use the verification code below to complete your registration.
          </div>
          <div class="otp-container">
              <div class="otp-code">${otpCode}</div>
              <div class="timer">This code will expire in 10 minutes</div>
          </div>
          <div class="footer">
              <p>If you didn't request this code, please ignore this email or contact support if you have concerns.</p>
              <p>Best regards,<br>The Free-Gency Team</p>
              <div class="social-links">
                  <a href="#">Support</a> •
                  <a href="#">Privacy Policy</a> •
                  <a href="#">Terms of Service</a>
              </div>
          </div>
      </div>
  </body>
  </html>
  `;
