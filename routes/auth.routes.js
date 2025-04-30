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
  logout,
  protectedRoutes,
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

authRouter.route('/signup').post(signUpValidator, signup);

authRouter.route('/signup-team').post(signupTeamValidator, signupAndCreateTeam);

authRouter.route('/login').post(loginValidator, login);

authRouter.route('/verify/:token').get(confirmEmail);

authRouter
  .route('/resend-email')
  .post(resendVerificationValidator, resendEmail);

authRouter
  .route('/forgot-password')
  .post(forgotPasswordValidator, forgetPassword);

authRouter
  .route('/verify-reset-code')
  .post(verifyResetCodeValidator, verifyResetCode);

authRouter.route('/reset-password').post(resetPasswordValidator, resetPassword);

authRouter.route('/logout').post(protectedRoutes, logout);

export default authRouter;
