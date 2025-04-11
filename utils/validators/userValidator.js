import { check } from 'express-validator';
import asyncHandler from 'express-async-handler';
import validatorMiddleware from '../../middlewares/validatorMiddleware.js';
import User from '../../models/user.model.js';
import Category from '../../models/category.model.js';

/**
 * @description  Validate User Creation
 * @route        POST /api/v1/users
 * @access       Private/Admin
 */
const createUserValidator = [
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

  // Password validation (minimum length)
  check('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),

  // Validate required fields for user details
  check('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 3 })
    .withMessage('Name must be at least 3 characters'),

  // Validate role if provided
  check('role')
    .optional()
    .isIn(['client', 'teamMember', 'teamLeader'])
    .withMessage("Role must be either 'client', 'teamMember', or 'teamLeader'"),

  // Apply validator middleware to handle validation results
  validatorMiddleware,
];

/**
 * @description  Validate Get User By ID
 * @route        GET /api/v1/users/:id
 * @access       Private
 */
const getUserValidator = [
  check('id').isMongoId().withMessage('Invalid user ID format'),
  validatorMiddleware,
];

/**
 * @description  Validate Update User
 * @route        PUT /api/v1/users/:id
 * @access       Private
 */
const updateUserValidator = [
  check('id').isMongoId().withMessage('Invalid user ID format'),

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
        if (user && user._id.toString() !== req.params.id) {
          throw new Error('Email already in use');
        }
      })
    ),

  check('password')
    .optional()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),

  check('role')
    .optional()
    .isIn(['client', 'teamMember', 'teamLeader'])
    .withMessage("Role must be either 'client', 'teamMember', or 'teamLeader'"),

  check('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),

  validatorMiddleware,
];

/**
 * @description  Validate Delete User
 * @route        DELETE /api/v1/users/:id
 * @access       Private/Admin
 */
const deleteUserValidator = [
  check('id').isMongoId().withMessage('Invalid user ID format'),
  validatorMiddleware,
];

/**
 * @description  Validate Update Current User Profile
 * @route        PUT /api/v1/users/me
 * @access       Private
 */
const updateMeValidator = [
  // منع تحديث كلمة المرور من هذا المسار
  check('currentPassword')
    .not()
    .exists()
    .withMessage(
      'This route is not for password updates. Please use /changePassword instead'
    ),
  check('password')
    .not()
    .exists()
    .withMessage(
      'This route is not for password updates. Please use /changePassword instead'
    ),
  check('passwordConfirm')
    .not()
    .exists()
    .withMessage(
      'This route is not for password updates. Please use /changePassword instead'
    ),

  check('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format')
    .custom(
      asyncHandler(async (val, { req }) => {
        const existingUser = await User.findOne({ email: val });
        if (
          existingUser &&
          existingUser._id.toString() !== req.user._id.toString()
        ) {
          throw new Error('Email already exists. Please use a different one.');
        }
        return true;
      })
    ),

  check('name')
    .optional()
    .isLength({ min: 3 })
    .withMessage('Name must be at least 3 characters'),

  check('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),

  check('interests')
    .optional()
    .isArray()
    .withMessage('Interests must be an array')
    .custom(async val => {
      if (val && val.length > 0) {
        const categories = await Category.find({ _id: { $in: val } });
        if (categories.length !== val.length) {
          throw new Error('One or more interests are invalid');
        }
      }
      return true;
    }),

  validatorMiddleware,
];

const getMeValidator = [
  check('user').custom((val, { req }) => {
    if (!req.user || !req.user._id) {
      throw new Error('User authentication failed. Please log in...');
    }
    return true;
  }),
  validatorMiddleware,
];
const uploadUserImageValidator = [
  check('profileImage')
    .notEmpty()
    .withMessage('profileImage is required')
    .custom((val, { req }) => {
      if (!req.file) {
        throw new Error('please upload profileImage');
      }
      return true;
    }),
  validatorMiddleware,
];

/**
 * @description  Validate Change Current User Password
 * @route        PATCH /api/v1/users/changePassword
 * @access       Private
 */
const changeMyPasswordValidator = [
  check('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),

  check('password')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),

  check('passwordConfirm')
    .notEmpty()
    .withMessage('Password confirmation is required')
    .custom((val, { req }) => {
      if (val !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    }),

  validatorMiddleware,
];

/**
 * @description  Validate Change User Password by Admin
 * @route        PATCH /api/v1/users/changePassword/:id
 * @access       Private/Admin
 */
const changeUserPasswordValidator = [
  check('id').isMongoId().withMessage('Invalid user ID format'),

  check('password')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),

  check('passwordConfirm')
    .notEmpty()
    .withMessage('Password confirmation is required')
    .custom((val, { req }) => {
      if (val !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    }),

  validatorMiddleware,
];

export {
  createUserValidator,
  getUserValidator,
  updateUserValidator,
  deleteUserValidator,
  updateMeValidator,
  getMeValidator,
  uploadUserImageValidator,
  changeMyPasswordValidator,
  changeUserPasswordValidator,
};
