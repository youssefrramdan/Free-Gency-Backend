import { check, param } from 'express-validator';
import validatorMiddleware from '../../middlewares/validatorMiddleware.js';
import Category from '../../models/category.model.js';
import Service from '../../models/service.model.js';

const createProjectValidator = [
  check('title').notEmpty().withMessage('Project title is required'),
  check('description')
    .notEmpty()
    .withMessage('Project description is required'),
  check('budget').notEmpty().withMessage('Project budget is required'),
  check('completionDate')
    .notEmpty()
    .withMessage('Project completion date is required')
    .isISO8601()
    .withMessage('Completion date must be a valid date'),
  check('technologies')
    .isArray({ min: 1 })
    .withMessage('Technologies must be an array with at least one item'),
  check('technologies.*')
    .isString()
    .withMessage('Each technology must be a string'),
  check('category')
    .notEmpty()
    .withMessage('Category is required')
    .isMongoId()
    .withMessage('Category must be a valid Mongo ID')
    .custom(async val => {
      const category = await Category.findById(val);
      if (!category) {
        throw new Error('Category does not exist');
      }
      return true;
    }),
  check('service')
    .notEmpty()
    .withMessage('Service is required')
    .isMongoId()
    .withMessage('Service must be a valid Mongo ID')
    .custom(async (val, { req }) => {
      const service = await Service.findById(val);
      if (!service) {
        throw new Error('Service does not exist');
      }
      // Check if service belongs to the given category
      if (service.category.toString() !== req.body.category) {
        throw new Error('Service does not belong to the specified category');
      }
      return true;
    }),
  validatorMiddleware,
];

const getProjectValidator = [
  param('projectId').isMongoId().withMessage('Invalid project ID format'),
  validatorMiddleware,
];

const updateProjectValidator = [
  param('projectId').isMongoId().withMessage('Invalid project ID format'),
  validatorMiddleware,
];

const deleteProjectValidator = [
  param('projectId').isMongoId().withMessage('Invalid project ID format'),
  validatorMiddleware,
];

const getTeamProjectsValidator = [
  param('teamId').isMongoId().withMessage('Invalid team ID format'),
  validatorMiddleware,
];

const getCategoryProjectsValidator = [
  param('categoryId').isMongoId().withMessage('Invalid category ID format'),
  validatorMiddleware,
];

const getServiceProjectsValidator = [
  param('serviceId').isMongoId().withMessage('Invalid service ID format'),
  validatorMiddleware,
];

export {
  createProjectValidator,
  getProjectValidator,
  updateProjectValidator,
  deleteProjectValidator,
  getTeamProjectsValidator,
  getCategoryProjectsValidator,
  getServiceProjectsValidator,
};
