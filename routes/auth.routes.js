import express from 'express';
import {
  confirmEmail,
  login,
  signup,
  signupAndCreateTeam,
  resendEmail,
  forgetPassword,
  verifyResetCode,
  resetPassword,
} from '../controllers/auth.controller.js';
import {
  signUpValidator,
  loginValidator,
  resendVerificationValidator,
  signupTeamValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  verifyResetCodeValidator,
} from '../utils/validators/authValidator.js';

const authRouter = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: User authentication operations
 *   - name: Password Reset
 *     description: Password reset operations
 */

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     tags: [Authentication]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - confirmPassword
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       201:
 *         description: User successfully registered
 *       400:
 *         description: Invalid input data
 */
authRouter.route('/signup').post(signUpValidator, signup);

/**
 * @swagger
 * /auth/signup-team:
 *   post:
 *     tags: [Authentication]
 *     summary: Register a new user and create a team
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - confirmPassword
 *               - teamName
 *               - category
 *               - teamCode
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *               teamName:
 *                 type: string
 *               category:
 *                 type: string
 *               teamCode:
 *                 type: string
 *     responses:
 *       201:
 *         description: User and team successfully created
 *       400:
 *         description: Invalid input data
 */
authRouter.route('/signup-team').post(signupTeamValidator, signupAndCreateTeam);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Login user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       401:
 *         description: Invalid credentials
 */
authRouter.route('/login').post(loginValidator, login);

/**
 * @swagger
 * /auth/verify/{token}:
 *   get:
 *     summary: Verify email address
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 */
authRouter.route('/verify/:token').get(confirmEmail);

/**
 * @swagger
 * /auth/resend-email:
 *   post:
 *     tags: [Authentication]
 *     summary: Resend verification email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Verification email sent
 *       400:
 *         description: Invalid email or user not found
 */
authRouter
  .route('/resend-email')
  .post(resendVerificationValidator, resendEmail);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     tags: [Password Reset]
 *     summary: Request password reset
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Reset code sent to email
 *       404:
 *         description: User not found
 */
authRouter
  .route('/forgot-password')
  .post(forgotPasswordValidator, forgetPassword);

/**
 * @swagger
 * /auth/verify-reset-code:
 *   post:
 *     tags: [Password Reset]
 *     summary: Verify password reset code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - resetCode
 *             properties:
 *               resetCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reset code verified
 *       400:
 *         description: Invalid or expired reset code
 */
authRouter
  .route('/verify-reset-code')
  .post(verifyResetCodeValidator, verifyResetCode);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     tags: [Password Reset]
 *     summary: Reset password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               newPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid reset code or password
 */
authRouter.route('/reset-password').post(resetPasswordValidator, resetPassword);

export default authRouter;
