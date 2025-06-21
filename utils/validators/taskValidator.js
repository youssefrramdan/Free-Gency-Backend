import { check } from 'express-validator';
import validatorMiddleware from '../../middlewares/validatorMiddleware.js';
import Category from '../../models/category.model.js';
import Service from '../../models/service.model.js';

const createTaskValidator = [
  check('title').notEmpty().withMessage('Title is required'),
  check('description')
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters long'),
  check('budget')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('Budget must be a positive number'),
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
  check('deadline')
    .optional()
    .isISO8601()
    .withMessage('Deadline must be a valid date')
    .custom(value => {
      if (new Date(value) <= new Date()) {
        throw new Error('Deadline must be in the future');
      }
      return true;
    }),
  validatorMiddleware,
];

const updateTaskValidator = [
  check('title').optional().notEmpty().withMessage('Title cannot be empty'),
  check('description')
    .optional()
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters long'),
  check('budget')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('Budget must be a positive number'),
  check('category')
    .optional()
    .isMongoId()
    .withMessage('Category must be a valid Mongo ID')
    .custom(async val => {
      const category = await Category.findById(val);
      if (!category) {
        throw new Error('Category does not exist');
      }
      return true;
    }),
  check('services')
    .optional()
    .isMongoId()
    .withMessage('Service must be a valid Mongo ID')
    .custom(async (val, { req }) => {
      const service = await Service.findById(val);
      if (!service) {
        throw new Error('Service does not exist');
      }
      if (service.category.toString() !== req.body.category) {
        throw new Error('Service does not belong to the specified category');
      }
      return true;
    }),
  check('requiredSkills')
    .optional()
    .isArray()
    .withMessage('Required skills must be an array')
    .custom(skills => skills.every(skill => typeof skill === 'string'))
    .withMessage('Each skill must be a string'),
  check('deadline')
    .optional()
    .isISO8601()
    .withMessage('Deadline must be a valid date')
    .custom(value => {
      if (new Date(value) <= new Date()) {
        throw new Error('Deadline must be in the future');
      }
      return true;
    }),
  validatorMiddleware,
];

const getSpecificTaskValidator = [
  check('id').isMongoId().withMessage('Invalid task ID'),
  validatorMiddleware,
];

const deleteSpecificTaskValidator = [
  check('id').isMongoId().withMessage('Invalid task ID'),
  validatorMiddleware,
];

export {
  createTaskValidator,
  updateTaskValidator,
  getSpecificTaskValidator,
  deleteSpecificTaskValidator,
};
