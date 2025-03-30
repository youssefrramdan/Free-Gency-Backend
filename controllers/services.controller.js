import asyncHandler from 'express-async-handler';
import Service from '../models/service.model.js';
import ApiError from '../utils/apiError.js';

const createService = asyncHandler(async (req, res, next) => {
  req.body.image = req.file;
  const service = await Service.create(req.body);
  res.status(201).json({
    message: 'success',
    data: service,
  });
});

const updateSpecificService = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  if (req.file) {
    req.body.image = req.file;
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

const deleteSpecificService = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const service = await Service.findByIdAndDelete(id);
  if (!service) {
    return next(new ApiError(`There isn't a Service for this ${id}`, 404));
  }
  res.status(200).json({
    message: 'success',
    data: service,
  });
});

const getAllServices = asyncHandler(async (req, res, next) => {
  const services = await Service.find();
  res.status(200).json({
    message: 'success',
    data: services,
  });
});

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
};
