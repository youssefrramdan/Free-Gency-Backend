import asyncHandler from 'express-async-handler';
import Category from '../models/category.model.js';
import ApiError from '../utils/apiError.js';

/**
 * @desc    Create new category
 * @route   POST /api/v1/categories
 * @access  Private/Admin
 */
const createCategory = asyncHandler(async (req, res, next) => {
  if (req.file) {
    req.body.imageCover = req.file.path;
  }
  const category = await Category.create(req.body);

  res.status(201).json({
    message: 'success',
    data: category,
  });
});

/**
 * @desc    Update specific category
 * @route   PUT /api/v1/categories/:id
 * @access  Private/Admin
 */
const updateCategory = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  if (req.file) {
    req.body.imageCover = req.file.path;
  }
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!category) {
    return next(new ApiError(`There isn't a category for this ${id}`, 404));
  }
  res.status(200).json({
    message: 'success',
    data: category,
  });
});

/**
 * @desc    Delete specific category
 * @route   DELETE /api/v1/categories/:id
 * @access  Private/Admin
 */
const deletegetCategory = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const category = await Category.findByIdAndDelete(id);

  if (!category) {
    return next(new ApiError(`There isn't a category for this ${id}`, 404));
  }
  res.status(200).json({
    message: 'success',
  });
});

/**
 * @desc    Get all categories
 * @route   GET /api/v1/categories
 * @access  Public
 */
const getAllCategories = asyncHandler(async (req, res, next) => {
  const categories = await Category.find()
    .populate({ path: 'servicesCount' })
    .populate({
      path: 'services',
      select: 'name image -category',
      match: { status: 'active' },
    })
    .select('-__v -createdAt -updatedAt');

  res.status(200).json({
    message: 'success',
    data: categories,
  });
});

/**
 * @desc    Get specific category
 * @route   GET /api/v1/categories/:id
 * @access  Public
 */
const getSpecificCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id)
    .populate({
      path: 'services',
      select: 'name image status',
      match: { status: 'active' },
    })
    .select('-__v -createdAt -updatedAt');

  res.status(200).json({
    message: 'success',
    data: category,
  });
});

export {
  getAllCategories,
  getSpecificCategory,
  createCategory,
  updateCategory,
  deletegetCategory,
};
