import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import ApiError from '../utils/apiError.js';
import User from '../models/user.model.js';
import generateToken from '../utils/Token.js';
import sendEmail from '../utils/sendEmail.js';
import emailTemplate from '../utils/emailTemplate.js';
import Team from '../models/team.model.js';
import otpTemplate from '../utils/otpTemplete.js';

/**
 * @desc    Sign up
 * @route   POST /api/v1/auth/signup
 * @access  Public
 */
const signup = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return next(new ApiError('Email is already in use', 400));
  }

  const user = await User.create(req.body);
  const token = generateToken(user._id);

  sendEmail({
    email: user.email,
    subject: 'Verification Email',
    html: emailTemplate(token),
  });

  res.status(201).json({
    message: 'success',
    user: {
      id: user._id,
      email: user.email,
      role: 'client',
      name: user.name,
    },
    token,
  });
});

/**
 * @desc    Sign up and Create Team
 * @route   POST /api/v1/auth/signup-team
 * @access  Public
 */
const signupAndCreateTeam = asyncHandler(async (req, res, next) => {
  const { name, email, password, teamName, category, teamCode } = req.body;
  const user = await User.create({
    name,
    email,
    role: 'teamLeader',
    password,
  });
  const team = await Team.create({
    teamLeader: user._id,
    name: teamName,
    role: 'teamLeader',
    category,
    teamCode,
    members: [
      {
        user: user._id,
        role: 'teamLeader',
        job: 'Team Leader',
        joinedAt: new Date(),
      },
    ],
  });

  user.createdTeam = team._id;
  await user.save();

  const token = generateToken(user._id);

  sendEmail({
    email: req.body.email,
    subject: 'Verification Email',
    html: emailTemplate(token),
  });

  res.status(201).json({
    message: 'success',
    data: {
      user,
      team,
      token,
    },
  });
});

/**
 * @desc    Login
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email }).select(
    '+password'
  );

  if (!user) {
    return next(new ApiError('user isnt exist', 401));
  }

  if (!user.isVerified) {
    return next(
      new ApiError(
        `Your Email is not verified. Please verify your email We send email at ${req.body.email}`,
        403
      )
    );
  }

  const isPasswordCorrect = await user.comparePassword(req.body.password);
  if (!isPasswordCorrect) {
    return next(new ApiError('Incorrect email or password', 401));
  }

  // Save FCM token if provided
  if (req.body.fcmToken) {
    await user.saveFCMToken(req.body.fcmToken);
  }

  const token = generateToken(user._id);
  res.status(200).json({
    message: 'success',
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    token,
  });
});

/**
 * @desc    Confirm Email - تأكيد البريد الإلكتروني
 * @route   GET /api/v1/auth/verify/:token
 * @access  Public
 */
const confirmEmail = asyncHandler(async (req, res, next) => {
  jwt.verify(
    req.params.token,
    process.env.JWT_SECRET_KEY,
    async (err, decoded) => {
      if (err) return next(new ApiError('Email verification failed', 404));

      const user = await User.findByIdAndUpdate(
        decoded.userId,
        { isVerified: true },
        { new: true }
      );

      if (!user) {
        return next(new ApiError('User not found', 404));
      }

      res.status(200).json({ message: 'Email verified successfully' });
    }
  );
});

/**
 * @desc    Resend verification email
 * @route   POST /api/v1/auth/resend-email
 * @access  Public
 */
const resendEmail = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return next(new ApiError(`No User for this Email :${email}`));
  }

  const token = generateToken(user._id);

  sendEmail({
    email: user.email,
    subject: 'Verification Email',
    html: emailTemplate(token),
  });

  res.status(200).json({
    message: 'Email sent successfully',
  });
});

/**
 * @desc    Protect routes - middleware to check if user is logged in
 * @route   Middleware
 * @access  Private
 */
const protectedRoutes = asyncHandler(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(
      new ApiError(
        'You are not logged in. Please log in to access this route',
        401
      )
    );
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  const currentUser = await User.findById(decoded.userId);

  if (!currentUser) {
    return next(
      new ApiError('The user belonging to this token no longer exists', 401)
    );
  }
  if (currentUser.passwordChangedAt) {
    const passChangedTimestamp = parseInt(
      currentUser.passwordChangedAt.getTime() / 1000,
      10
    );
    if (passChangedTimestamp > decoded.iat) {
      return next(
        new ApiError('User recently changed password. Please login again.', 401)
      );
    }
  }
  req.user = currentUser;
  next();
});

/**
 * @desc    Forgot Password
 * @route   POST /api/v1/auth/forgot-password
 * @access  Public
 */
const forgetPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new ApiError('Email not found', 404));
  }

  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedCode = await bcrypt.hash(resetCode, 12);

  user.passwordResetCode = hashedCode;
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  user.passwordResetVerified = false;
  await user.save();

  sendEmail({
    email: req.body.email,
    subject: 'OTP Email',
    html: otpTemplate(resetCode),
  });
  res.status(200).json({ message: 'Reset code sent successfully' });
});

/**
 * @desc    Verify OTP Code
 * @route   POST /api/v1/auth/verify-reset-code
 * @access  Public
 */
const verifyResetCode = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ApiError('Reset code is invalid or has expired', 400));
  }

  const isCodeValid = await bcrypt.compare(
    req.body.resetCode,
    user.passwordResetCode
  );

  if (!isCodeValid) {
    return next(new ApiError('Invalid reset code', 400));
  }

  user.passwordResetVerified = true;
  await user.save();

  res.status(200).json({ message: 'success' });
});

/**
 * @desc    Reset Password
 * @route   POST /api/v1/auth/reset-password
 * @access  Public
 */
const resetPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ApiError('Email not found', 404));
  }

  if (!user.passwordResetVerified) {
    return next(new ApiError('Reset code has not been verified', 400));
  }

  user.password = req.body.newPassword;
  user.passwordResetCode = undefined;
  user.passwordResetExpires = undefined;
  user.passwordResetVerified = false;
  await user.save();

  const token = generateToken(user._id);
  const userData = {
    id: user._id,
    email: user.email,
    role: user.role,
    name: user.name,
  };

  res.status(200).json({ message: 'success', userData, token });
});

/**
 * @desc    Check if user has required role - middleware
 * @route   Middleware
 * @access  Private
 */
const allowTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };

/**
 * @desc    Logout
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new ApiError('User not found', 404));
  }

  // Remove FCM token
  await user.removeFCMToken();

  res.status(200).json({
    message: 'Logged out successfully',
  });
});

export {
  signup,
  signupAndCreateTeam,
  login,
  confirmEmail,
  resendEmail,
  protectedRoutes,
  allowTo,
  forgetPassword,
  verifyResetCode,
  resetPassword,
  logout,
};
