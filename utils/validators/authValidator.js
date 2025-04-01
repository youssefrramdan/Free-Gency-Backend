/* eslint-disable import/no-extraneous-dependencies */
import { check } from 'express-validator';
import asyncHandler from 'express-async-handler';
import validatorMiddleware from '../../middlewares/validatorMiddleware.js';
import User from '../../models/user.model.js';
import Team from '../../models/team.model.js';
import Category from '../../models/category.model.js';

/**
 * @description  Validate User Registration
 * @route        POST /api/v1/auth/signup
 * @access       Public
 */
const signUpValidator = [
  // Validate email field (must be a valid email format and unique)
  check('email')
    .isEmail()
    .withMessage('Invalid email format')
    .custom(
      asyncHandler(async val => {
        const user = await User.findOne({ email: val });
        if (user) {
          throw new Error('Email already in use');
        }
      })
    ),

  // Password validation (minimum length & must match confirmPassword)
  check('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .custom((password, { req }) => {
      if (password !== req.body.confirmPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),

  // Ensure confirmPassword is provided
  check('confirmPassword')
    .notEmpty()
    .withMessage('Password confirmation is required'),

  // Validate required fields for user details
  check('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 3 })
    .withMessage('Name must be at least 3 characters'),

  // Apply validator middleware to handle validation results
  validatorMiddleware,
];

/**
 * @description  Validate User Login
 * @route        POST /api/v1/auth/login
 * @access       Public
 */
const loginValidator = [
  // Ensure email format is valid
  check('email').isEmail().withMessage('Invalid email format'),

  // Ensure password is provided
  check('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),

  // Apply validation middleware
  validatorMiddleware,
];

/**
 * @description  Validate Email Verification Resend
 * @route        POST /api/v1/auth/resend-verification
 * @access       Public
 */
const resendVerificationValidator = [
  // Ensure email is valid and exists in database
  check('email')
    .isEmail()
    .withMessage('Invalid email format')
    .custom(
      asyncHandler(async val => {
        const user = await User.findOne({ email: val });
        if (!user) {
          throw new Error(`No user found with email: ${val}`);
        }
        if (user.isVerified) {
          throw new Error('This email is already verified');
        }
        return true;
      })
    ),

  // Apply validation middleware
  validatorMiddleware,
];

/**
 * @description  Validate Password Reset Request
 * @route        POST /api/v1/auth/forgot-password
 * @access       Public
 */
const forgotPasswordValidator = [
  check('email')
    .isEmail()
    .withMessage('Invalid email format')
    .custom(
      asyncHandler(async val => {
        const user = await User.findOne({ email: val });
        if (!user) {
          throw new Error(`No user found with email: ${val}`);
        }
        return true;
      })
    ),

  validatorMiddleware,
];

/**
 * @description  Validate Profile Update
 * @route        PUT /api/v1/users/profile
 * @access       Private
 */
const updateProfileValidator = [
  check('name')
    .optional()
    .isLength({ min: 3 })
    .withMessage('Name must be at least 3 characters'),

  check('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format')
    .custom(
      asyncHandler(async (val, { req }) => {
        const user = await User.findOne({ email: val });
        if (user && user._id.toString() !== req.user._id.toString()) {
          throw new Error('Email already in use');
        }
      })
    ),

  check('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),

  check('skills').optional().isArray().withMessage('Skills must be an array'),

  check('interests')
    .optional()
    .isArray()
    .withMessage('Interests must be an array'),

  validatorMiddleware,
];

/**
 * @description  Validate User Signup with Team Creation
 * @route        POST /api/v1/auth/signup-team
 * @access       Public
 */
const signupTeamValidator = [
  // Include all validations from signUpValidator
  ...signUpValidator,

  // Team-specific validations
  check('teamName')
    .notEmpty()
    .withMessage('Team name is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Team name must be between 3 and 50 characters')
    .custom(
      asyncHandler(async (val, { req }) => {
        const team = await Team.findOne({ name: val });
        if (team) {
          throw new Error('teamName already in use');
        }
      })
    ),

  check('category')
    .notEmpty()
    .withMessage('category ID is required')
    .isMongoId()
    .withMessage('Invalid category ID format')
    .custom(
      asyncHandler(async (val, { req }) => {
        const category = await Category.findById({ _id: val });
        if (!category) {
          throw new Error(`There isnt Category for this id ${category}`);
        }
        return true;
      })
    ),

  check('teamCode')
    .notEmpty()
    .withMessage('Team code is required')
    .isLength({ min: 16, max: 16 })
    .withMessage('Team code must be exactly 16 characters')
    .custom(
      asyncHandler(async val => {
        const existingTeam = await Team.findOne({ teamCode: val });
        if (existingTeam) {
          throw new Error('Team code already in use');
        }
        return true;
      })
    ),

  validatorMiddleware,
];

/**
 * @description  Validate Reset Password
 * @route        POST /api/v1/auth/reset-password
 * @access       Public
 */
const resetPasswordValidator = [
  check('email').isEmail().withMessage('Invalid email format'),

  check('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),

  validatorMiddleware,
];

/**
 * @description  Validate Verify Reset Code
 * @route        POST /api/v1/auth/verify-reset-code
 * @access       Public
 */
const verifyResetCodeValidator = [
  check('resetCode')
    .notEmpty()
    .withMessage('Reset code is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('Reset code must be 6 digits'),

  validatorMiddleware,
];

export {
  signUpValidator,
  loginValidator,
  resendVerificationValidator,
  forgotPasswordValidator,
  updateProfileValidator,
  signupTeamValidator,
  resetPasswordValidator,
  verifyResetCodeValidator,
};
