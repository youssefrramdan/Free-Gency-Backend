import asyncHandler from 'express-async-handler';
import ApiError from '../utils/apiError.js';
import jobModel from '../models/job.model.js';
import User from '../models/user.model.js';

const createJob = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const user = await User.findById(userId).populate(
    'createdTeam',
    'logo category'
  );
  
  if (!user) {
    return next(new ApiError('User Not Found !!', 404));
  }

  const { title, description, requiredSkills } = req.body;

  const job = await jobModel.create({
    title,
    description,
    requiredSkills,
    imageCover: user.createdTeam.logo,
    createdByTeam: user.createdTeam._id,
    category: user.createdTeam.category,
  });

  res.status(201).json({
    status: 'success',
    data: job,
  });
});

/**
 * @desc    Get all jobs based on user interests or by category
 * @route   GET /api/v1/jobs?categoryId=<categoryId>
 * @access  Public
 */
const getAllJobs = asyncHandler(async (req, res) => {
  const query = {};
  const { categoryId } = req.query;

  // If categoryId is provided, filter by specific category
  if (categoryId) {
    query.category = categoryId;
  } else {
    // Otherwise, filter by user interests
    query.category = { $in: req.user.interests };
  }

  const jobs = await jobModel
    .find(query)
    .populate('createdByTeam', 'name')
    .populate('category', 'name')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: jobs.length,
    data: jobs,
  });
});

const getMyJobs = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new ApiError('User Not Found !!', 404));
  }

  const jobs = await jobModel
    .find({ createdByTeam: user.createdTeam._id })
    .populate('createdByTeam', 'name')
    .populate('category', 'name')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: jobs.length,
    data: jobs,
  });
});

/**
 * @desc    Get a specific job
 * @route   GET /api/v1/jobs/:id
 * @access  Public
 */
const getJobById = asyncHandler(async (req, res, next) => {
  const job = await jobModel
    .findById(req.params.id)
    .populate('createdByTeam', 'name')
    .populate('category', 'name');

  if (!job) {
    return next(new ApiError('Job not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: job,
  });
});

/**
 * @desc    Update a job
 * @route   PUT /api/v1/jobs/:id
 * @access  Private (Team Leader)
 */
const updateJob = asyncHandler(async (req, res, next) => {
  const job = await jobModel.findById(req.params.id);

  if (!job) {
    return next(new ApiError('Job not found', 404));
  }

  // Check if user is authorized to update the job
  if (job.createdByTeam.toString() !== req.user.createdTeam._id.toString()) {
    return next(new ApiError('Not authorized to update this job', 403));
  }

  const updatedJob = await jobModel.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: updatedJob,
  });
});

/**
 * @desc    Delete a job
 * @route   DELETE /api/v1/jobs/:id
 * @access  Private (Team Leader)
 */
const deleteJob = asyncHandler(async (req, res, next) => {
  const job = await jobModel.findById(req.params.id);

  if (!job) {
    return next(new ApiError('Job not found', 404));
  }

  // Check if user is authorized to delete the job
  if (job.createdByTeam.toString() !== req.user.createdTeam._id.toString()) {
    return next(new ApiError('Not authorized to delete this job', 403));
  }

  await jobModel.findByIdAndDelete(req.params.id);

  res.status(200).json({
    status: 'success',
    message: 'Job deleted successfully',
  });
});

export { createJob, getAllJobs, getJobById, getMyJobs, updateJob, deleteJob };
