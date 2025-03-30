import { check } from 'express-validator';
import asyncHandler from 'express-async-handler';
import validatorMiddleware from '../../middlewares/validatorMiddleware.js';
import Service from '../../models/service.model.js';
import Category from '../../models/category.model.js';

const createServiceValidator = [
  check('name')
    .notEmpty()
    .withMessage('Service name is required')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Service name must be between 2 and 50 characters')
    .custom(
      asyncHandler(async val => {
        const user = await Service.findOne({ name: val });
        if (user) {
          throw new Error('name already in use');
        }
        return true;
      })
    ),

  check('image').custom((val, { req }) => {
    if (!req.file) {
      throw new Error('Service image is required');
    }
    return true;
  }),

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
  check('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Invalid status value. Must be either active or inactive'),

  validatorMiddleware,
];

const updateServiceValidator = [
  check('id')
    .notEmpty()
    .withMessage('Service ID is required')
    .isMongoId()
    .withMessage('Invalid Service ID format'),

  check('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Service name must be between 2 and 50 characters'),

  check('image')
    .optional()
    .custom((val, { req }) => {
      if (!req.file) {
        throw new Error('Please upload a valid image file');
      }
      return true;
    }),

  check('category')
    .optional()
    .isMongoId()
    .withMessage('Invalid category ID format')
    .custom(
      asyncHandler(async (val, { req }) => {
        const category = await Category.findById({ _id: val });
        if (!category) {
          throw new Error(`There isnt Category for this id `);
        }
        return true;
      })
    ),

  check('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Invalid status value. Must be either active or inactive'),

  validatorMiddleware,
];

const getSpecificServiceValidator = [
  check('id')
    .notEmpty()
    .withMessage('Service ID is required')
    .isMongoId()
    .withMessage('Invalid Service ID format'),
  validatorMiddleware,
];

const deleteServiceValidator = [
  check('id')
    .notEmpty()
    .withMessage('Service ID is required')
    .isMongoId()
    .withMessage('Invalid Service ID format'),
  validatorMiddleware,
];

export {
  createServiceValidator,
  updateServiceValidator,
  deleteServiceValidator,
  getSpecificServiceValidator,
};
