import asyncHandler from 'express-async-handler';
import ApiError from '../utils/apiError.js';
import Task from '../models/task.model.js';

// ==========================================
// Authorization Helper
// ==========================================

/**
 * Checks if the current user is authorized to perform an action
 * @param {string} userId - The ID of the user to check authorization for
 * @param {string} ownerId - The ID of the resource owner
 * @param {string} action - The action being performed (for error message)
 * @returns {boolean} - Returns true if authorized, throws ApiError if not
 */
export const isAuthorized = (
  userId,
  ownerId,
  action = 'perform this action'
) => {
  if (userId.toString() !== ownerId.toString()) {
    throw new ApiError(`Not authorized to ${action}`, 403);
  }
  return true;
};

// ==========================================
// Task CRUD Operations
// ==========================================

/**
 * @desc    Create a new task
 * @route   POST /api/v1/tasks
 * @access  Private
 */
const createTask = asyncHandler(async (req, res) => {
  // Add the client ID to the project
  req.body.client = req.user._id;
  // Check if there are uploaded files
  if (req.files && req.files.length > 0) {
    // Store file references in the task
    req.body.requirement = req.files.map(file => ({
      fileName: file.originalname,
      fileUrl: file.path,
    }));
  }
  // Create the project
  const task = await Task.create(req.body);

  res.status(201).json({
    status: 'success',
    data: task,
  });
});

/**
 * @desc    Get all Task
 * @route   GET /api/v1/tasks
 * @access  Private (Admin)
 */
const getAllTasks = asyncHandler(async (req, res) => {
  // Get all tasks
  const tasks = await Task.find()
    .populate('client', 'name email')
    .populate('category', 'name')
    .populate('service', 'name');

  res.status(200).json({
    status: 'success',
    results: tasks.length,
    data: tasks,
  });
});
/**
 * @desc    Get all Task
 * @route   GET /api/v1/tasks
 * @access  Private (client)
 */
const getAllMyTasks = asyncHandler(async (req, res) => {
  // Get all tasks
  const tasks = await Task.find({ client: req.user._id })
    .populate('client', 'name email')
    .populate('category', 'name')
    .populate('service', 'name');

  res.status(200).json({
    status: 'success',
    results: tasks.length,
    data: tasks,
  });
});

/**
 * @desc    Get tasks based on user interests
 * @route   GET /api/v1/tasks/by-interest
 * @access  Private
 */
const getTasksByInterest = asyncHandler(async (req, res) => {
  const { interests } = req.user;

  // Get tasks that match user's interests
  const tasks = await Task.find({
    category: { $in: interests },
  })
    .populate('client', 'name email')
    .populate('category', 'name')
    .populate('service', 'name');

  res.status(200).json({
    status: 'success',
    results: tasks.length,
    data: tasks,
  });
});

/**
 * @desc    Get a specific client task
 * @route   GET /api/v1/tasks/:id
 * @access  Private
 */
const getSpecificTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id)
    .populate('client', 'name email')
    .populate('category', 'name')
    .populate('service', 'name')
    .populate('assignedTeam', 'name logo');

  if (!task) {
    next(new ApiError('Task not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: task,
  });
});

/**
 * @desc    Update client task details
 * @route   PUT /api/v1/tasks/:id
 * @access  Private
 */
const updateSpecificTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    next(new ApiError('Task not found', 404));
  }

  // Check if user is the client who created the task
  isAuthorized(req.user._id, task.client, 'update this task');

  // Update task
  const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: updatedTask,
  });
});

/**
 * @desc    Delete client task
 * @route   DELETE /api/v1/tasks/:id
 * @access  Private
 */
const deleteSpecificTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    next(new ApiError('Task not found', 404));
  }

  // Check if user is the client who created the task
  isAuthorized(req.user._id, task.client, 'delete this task');

  // Delete task
  await Task.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: 'success',
  });
});

// ==========================================
// Task Files Operations
// ==========================================

/**
 * @desc    Add files to task
 * @route   POST /api/v1/tasks/:id/task-files
 * @access  Private
 */
const addTaskFiles = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.taskId);

  if (!task) {
    next(new ApiError('Task not found', 404));
  }

  // Check if user is the client who created the task
  isAuthorized(req.user._id, task.client, 'add files to this task');

  // Add files to task
  if (req.files && req.files.length > 0) {
    const files = req.files.map(file => ({
      fileName: file.originalname,
      fileUrl: file.path,
      uploadedAt: Date.now(),
    }));

    task.taskFiles.push(...files);
    await task.save();
  }

  res.status(200).json({
    status: 'success',
    data: task,
  });
});

/**
 * @desc    Delete file from client task
 * @route   DELETE /api/v1/tasks/:taskId/task-files/:fileId
 * @access  Private
 */
const deleteTaskFile = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.taskId);

  if (!task) {
    throw new ApiError('Task not found', 404);
  }

  // Check if user is the client who created the task
  isAuthorized(req.user._id, task.client, 'delete files from this task');

  // Find and remove the file
  const fileIndex = task.projectFiles.findIndex(
    file => file._id.toString() === req.params.fileId
  );

  if (fileIndex === -1) {
    throw new ApiError('File not found', 404);
  }

  task.taskFiles.splice(fileIndex, 1);
  await task.save();

  res.status(200).json({
    status: 'success',
    data: task,
  });
});

export {
  createTask,
  getAllTasks,
  getTasksByInterest,
  getAllMyTasks,
  getSpecificTask,
  updateSpecificTask,
  deleteSpecificTask,
  addTaskFiles,
  deleteTaskFile,
};
