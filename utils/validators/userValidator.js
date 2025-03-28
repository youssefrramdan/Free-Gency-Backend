import { check } from 'express-validator';
import asyncHandler from 'express-async-handler';
import validatorMiddleware from '../../middlewares/validatorMiddleware.js';
import User from '../../models/user.model.js';

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
    .isIn(['client', 'team_member', 'team_leader'])
    .withMessage(
      "Role must be either 'client', 'team_member', or 'team_leader'"
    ),

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
    .isIn(['client', 'team_member', 'team_leader'])
    .withMessage(
      "Role must be either 'client', 'team_member', or 'team_leader'"
    ),

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

export {
  createUserValidator,
  getUserValidator,
  updateUserValidator,
  deleteUserValidator,
};
