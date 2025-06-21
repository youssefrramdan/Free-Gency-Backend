import { check } from 'express-validator';
import asyncHandler from 'express-async-handler';
import validatorMiddleware from '../../middlewares/validatorMiddleware.js';
import Team from '../../models/team.model.js';
import Category from '../../models/category.model.js';

const createTeamValidator = [
  check('name')
    .notEmpty()
    .withMessage('Team name is required')
    .custom(
      asyncHandler(async (val, { req }) => {
        const team = await Team.findOne({ name: val });
        if (team) {
          throw new Error('this Team name is in use');
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
  validatorMiddleware,
];

const getSpecificTeamValidator = [
  check('id')
    .notEmpty()
    .withMessage('Team ID is required')
    .isMongoId()
    .withMessage('Invalid Team ID format'),
  validatorMiddleware,
];

const deleteSpecificTeamValidator = [
  check('id')
    .notEmpty()
    .withMessage('Team ID is required')
    .isMongoId()
    .withMessage('Invalid Team ID format'),
  validatorMiddleware,
];

const updateMyTeamValidator = [
  check('name')
    .optional()
    .isString()
    .withMessage('Team name must be a string')
    .isLength({ min: 2 })
    .withMessage('Team name must be at least 2 characters long'),
  // check('category')
  // .notEmpty()
  // .withMessage('category ID is required')
  // .isMongoId()
  // .withMessage('Invalid category ID format')
  // .custom(
  //   asyncHandler(async (val, { req }) => {
  //     const category = await Category.findById({ _id: val });
  //     if (!category) {
  //       throw new Error(`There isnt Category for this id ${category}`);
  //     }
  //     return true;
  //   })
  // ),
  check('aboutUs')
    .optional()
    .isString()
    .withMessage('About us must be a string'),
    // .isLength({ min: 100, max: 2000 })
    // .withMessage('About us must be between 100 and 2000 characters'),
  check('status')
    .optional()
    .isIn(['active', 'inactive', 'recruiting'])
    .withMessage('Invalid status value'),
  check('contactInfo')
    .optional()
    .isObject()
    .withMessage('Contact info must be an object'),
  check('contactInfo.email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format'),
  check('contactInfo.phone')
    .optional()
    .isMobilePhone(['ar-EG'])
    .withMessage('Invalid phone number format'),
  check('contactInfo.website')
    .optional()
    .isURL()
    .withMessage('Invalid website URL'),
  validatorMiddleware,
];

const addLastedProjectValidator = [
  check('title')
    .notEmpty()
    .withMessage('Project title is required')
    .isString()
    .withMessage('Project title must be a string'),
  check('budget').optional().isString().withMessage('Budget must be a string'),
  check('description')
    .optional()
    .isString()
    .withMessage('Description must be a string'),
  check('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array of strings'),
  check('projectUrl')
    .optional()
    .isURL()
    .withMessage('Project URL must be a valid URL'),
  check('technologies')
    .optional()
    .isArray()
    .withMessage('Technologies must be an array of strings'),
  check('completionDate')
    .optional()
    .isISO8601()
    .withMessage('Completion date must be a valid date'),
  validatorMiddleware,
];

const updateLastedProjectValidator = [
  check('projectId').isMongoId().withMessage('Invalid project id format'),
  check('title')
    .optional()
    .isString()
    .withMessage('Project title must be a string'),
  check('budget').optional().isString().withMessage('Budget must be a string'),
  check('description')
    .optional()
    .isString()
    .withMessage('Description must be a string'),
  check('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array of strings'),
  check('projectUrl')
    .optional()
    .isURL()
    .withMessage('Project URL must be a valid URL'),
  check('technologies')
    .optional()
    .isArray()
    .withMessage('Technologies must be an array of strings'),
  check('completionDate')
    .optional()
    .isISO8601()
    .withMessage('Completion date must be a valid date'),
  validatorMiddleware,
];

/**
 * @desc    Validate update member role
 */
const updateMemberRoleValidator = [
  check('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['teamLeader', 'teamMember', 'admin'])
    .withMessage('Invalid role. Must be teamLeader, teamMember, or admin'),
  validatorMiddleware,
];

export {
  createTeamValidator,
  getSpecificTeamValidator,
  updateMyTeamValidator,
  deleteSpecificTeamValidator,
  addLastedProjectValidator,
  updateLastedProjectValidator,
  updateMemberRoleValidator,
};
