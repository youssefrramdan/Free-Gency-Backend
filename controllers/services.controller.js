import asyncHandler from 'express-async-handler';
import Service from '../models/service.model.js';
import ApiError from '../utils/apiError.js';

/**
 * @desc    Create new service
 * @route   POST /api/v1/services
 * @access  Private/Admin
 */
const setCategoryIdToBody = (req, res, next) => {
  if (!req.body.category) req.body.category = req.params.categoryId;
  next();
};

const createFilterObject = (req, res, next) => {
  let filterObject = {};
  if (req.params.categoryId) {
    filterObject = { category: req.params.categoryId };
  }
  req.filterObject = filterObject;
  next();
};
const createService = asyncHandler(async (req, res, next) => {
  req.body.image = req.file.path;
  const service = await Service.create(req.body);
  res.status(201).json({
    message: 'success',
    data: service,
  });
});

/**
 * @desc    Update specific service
 * @route   PUT /api/v1/services/:id
 * @access  Private/Admin
 */
const updateSpecificService = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  if (req.file) {
    req.body.image = req.file.path;
  }
  const service = await Service.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!service) {
    return next(new ApiError(`There isn't a Service for this ${id}`, 404));
  }
  res.status(200).json({
    message: 'success',
    data: service,
  });
});

/**
 * @desc    Delete specific service
 * @route   DELETE /api/v1/services/:id
 * @access  Private/Admin
 */
const deleteSpecificService = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const service = await Service.findByIdAndDelete(id);
  if (!service) {
    return next(new ApiError(`There isn't a Service for this ${id}`, 404));
  }
  res.status(200).json({
    message: 'success',
  });
});
// nested routes
// GET /api/v1/categories/:categoryId/services

/**
 * @desc    Get all services
 * @route   GET /api/v1/services
 * @access  Public
 */
const getAllServices = asyncHandler(async (req, res, next) => {
    
  const services = await Service.find(req.filterObject);

  res.status(200).json({
    message: 'success',
    data: services,
  });
});

/**
 * @desc    Get specific service
 * @route   GET /api/v1/services/:id
 * @access  Public
 */
const getSpecificService = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const service = await Service.findById(id);
  res.status(200).json({
    message: 'success',
    data: service,
  });
});

export {
  createService,
  updateSpecificService,
  deleteSpecificService,
  getAllServices,
  getSpecificService,
  setCategoryIdToBody,
  createFilterObject,
};
