import asyncHandler from 'express-async-handler';
import ApiError from '../utils/apiError.js';
import jobModel from '../models/job.model.js';
import User from '../models/user.model.js';
import NotificationService from '../service/NotificationService.js';

const createJob = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const user = await User.findById(userId).populate(
    'createdTeam',
    'logo categoty'
  );

  if (!user) {
    return next(new ApiError('User Not Found !!', 404));
  }

  const { title, description, requiredSkills, type, location } = req.body;

  const job = await jobModel.create({
    title,
    description,
    requiredSkills,
    type,
    location,
    createdBy: userId,
    category: user.createdTeam.categoty,
  });

  // Send notification to relevant users
  const notificationTitle = '🎯 New Job Available';
  const body = `📌 ${job.title} 👤 Posted by: ${user.name} 📍 Location: ${job.location} 💼 Type: ${job.type}`;

  await NotificationService.sendJobNotifications(
    job.category,
    notificationTitle,
    body,
    user.profileImage,
    'job-posted',
    `/jobs/${job._id}`,
    {
      jobId: job._id,
      category: job.category,
      type: job.type,
      location: job.location,
    }
  );

  res.status(201).json({
    status: 'success',
    data: job,
  });
});

/**
 * @desc    Get all jobs
 * @route   GET /api/v1/jobs
 * @access  Public
 */
const getAllJobs = asyncHandler(async (req, res) => {
  const jobs = await jobModel
    .find()
    .populate('createdBy', 'name profileImage')
    .populate('category', 'name')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: jobs.length,
    data: jobs,
  });
});

const getMyJobs = asyncHandler(async (req, res) => {
  const jobs = await jobModel
    .find({ createdBy: req.user._id })
    .populate('createdBy', 'name profileImage')
    .populate('category', 'name')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: jobs.length,
    data: jobs,
  });
});

/**
 * @desc    Get jobs by category
 * @route   GET /api/v1/jobs/category/:categoryId
 * @access  Public
 */
const getJobsByCategory = asyncHandler(async (req, res, next) => {
  const jobs = await jobModel
    .find({ category: req.params.categoryId })
    .populate('createdBy', 'name profileImage')
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
    .populate('createdBy', 'name profileImage')
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
  if (job.createdBy.toString() !== req.user._id.toString()) {
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
  if (job.createdBy.toString() !== req.user._id.toString()) {
    return next(new ApiError('Not authorized to delete this job', 403));
  }

  await jobModel.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

export {
  createJob,
  getAllJobs,
  getJobsByCategory,
  getJobById,
  getMyJobs,
  updateJob,
  deleteJob,
};
