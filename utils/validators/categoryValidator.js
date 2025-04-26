import { check } from 'express-validator';
import asyncHandler from 'express-async-handler';
import validatorMiddleware from '../../middlewares/validatorMiddleware.js';
import Category from '../../models/category.model.js';

const createCategoryValidator = [
  check('name')
    .notEmpty()
    .withMessage('Category name is required')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category name must be between 2 and 50 characters')
    .custom(
      asyncHandler(async val => {
        const user = await Category.findOne({ name: val });
        if (user) {
          throw new Error('name already in use');
        }
      })
    ),
  check('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Invalid status value. Must be either active or inactive'),

  validatorMiddleware,
];

const updateCategoryValidator = [
  check('id')
    .notEmpty()
    .withMessage('Category ID is required')
    .isMongoId()
    .withMessage('Invalid category ID format'),

  check('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category name must be between 2 and 50 characters'),

  check('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Invalid status value. Must be either active or inactive'),

  validatorMiddleware,
];

const getSpecificCategoryValidator = [
  check('id')
    .notEmpty()
    .withMessage('Category ID is required')
    .isMongoId()
    .withMessage('Invalid category ID format'),
  validatorMiddleware,
];

const deleteCategoryValidator = [
  check('id')
    .notEmpty()
    .withMessage('Category ID is required')
    .isMongoId()
    .withMessage('Invalid category ID format'),
  validatorMiddleware,
];

export {
  createCategoryValidator,
  deleteCategoryValidator,
  getSpecificCategoryValidator,
  updateCategoryValidator,
};
