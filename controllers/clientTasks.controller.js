import asyncHandler from 'express-async-handler';
import ApiError from '../utils/apiError.js';
import ClientTasks from '../models/clientTasks.model.js';
import User from '../models/user.model.js';
import Team from '../models/team.model.js';

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
// Middleware
// ==========================================

/**
 * @desc    Create filter object for category-based filtering
 * @route   GET /api/v1/categories/:categoryId/client-tasks
 * @access  Private
 */
export const createFilterObject = (req, res, next) => {
  let filterObject = {};
  if (req.params.categoryId) {
    filterObject = { category: req.params.categoryId };
  }
  req.filterObject = filterObject;
  next();
};

// ==========================================
// Client Tasks CRUD Operations
// ==========================================

/**
 * @desc    Create a new client task
 * @route   POST /api/v1/client-tasks
 * @access  Private
 */
export const createClientTask = asyncHandler(async (req, res) => {
  // Add the client ID to the project
  req.body.client = req.user._id;

  // Create the project
  const task = await ClientTasks.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      task,
    },
  });
});

/**
 * @desc    Get all client tasks
 * @route   GET /api/v1/client-tasks
 * @access  Private
 */
export const getAllClientTasks = asyncHandler(async (req, res) => {
  // Get filter object from middleware
  const filterObject = req.filterObject || {};

  // Get all tasks
  const tasks = await ClientTasks.find(filterObject)
    .populate('client', 'name email')
    .populate('category', 'name')
    .populate('service', 'name');

  res.status(200).json({
    status: 'success',
    results: tasks.length,
    data: {
      tasks,
    },
  });
});

/**
 * @desc    Get a specific client task
 * @route   GET /api/v1/client-tasks/:id
 * @access  Private
 */
export const getClientTask = asyncHandler(async (req, res) => {
  const task = await ClientTasks.findById(req.params.id)
    .populate('client', 'name email')
    .populate('category', 'name')
    .populate('service', 'name')
    .populate('assignedTeam', 'name logo');

  if (!task) {
    throw new ApiError('Task not found', 404);
  }

  res.status(200).json({
    status: 'success',
    data: {
      task,
    },
  });
});

/**
 * @desc    Update client task details
 * @route   PUT /api/v1/client-tasks/:id
 * @access  Private
 */
export const updateClientTask = asyncHandler(async (req, res) => {
  const task = await ClientTasks.findById(req.params.id);

  if (!task) {
    throw new ApiError('Task not found', 404);
  }

  // Check if user is the client who created the task
  isAuthorized(req.user._id, task.client, 'update this task');

  // Update task
  const updatedTask = await ClientTasks.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    status: 'success',
    data: {
      task: updatedTask,
    },
  });
});

/**
 * @desc    Delete client task
 * @route   DELETE /api/v1/client-tasks/:id
 * @access  Private
 */
export const deleteClientTask = asyncHandler(async (req, res) => {
  const task = await ClientTasks.findById(req.params.id);

  if (!task) {
    throw new ApiError('Task not found', 404);
  }

  // Check if user is the client who created the task
  isAuthorized(req.user._id, task.client, 'delete this task');

  // Delete task
  await ClientTasks.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// ==========================================
// Task Files Operations
// ==========================================

/**
 * @desc    Add files to client task
 * @route   POST /api/v1/client-tasks/:id/task-files
 * @access  Private
 */
export const addTaskFiles = asyncHandler(async (req, res) => {
  const task = await ClientTasks.findById(req.params.id);

  if (!task) {
    throw new ApiError('Task not found', 404);
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

    task.projectFiles.push(...files);
    await task.save();
  }

  res.status(200).json({
    status: 'success',
    data: {
      task,
    },
  });
});

/**
 * @desc    Delete file from client task
 * @route   DELETE /api/v1/client-tasks/:taskId/task-files/:fileId
 * @access  Private
 */
export const deleteTaskFile = asyncHandler(async (req, res) => {
  const task = await ClientTasks.findById(req.params.taskId);

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

  task.projectFiles.splice(fileIndex, 1);
  await task.save();

  res.status(200).json({
    status: 'success',
    data: {
      task,
    },
  });
});

// ==========================================
// Task Security Operations
// ==========================================

/**
 * @desc    Update client task security settings
 * @route   PUT /api/v1/client-tasks/:id/security
 * @access  Private
 */
export const updateTaskSecurity = asyncHandler(async (req, res) => {
  const task = await ClientTasks.findById(req.params.id);

  if (!task) {
    throw new ApiError('Task not found', 404);
  }

  // Check if user is the client who created the task
  isAuthorized(
    req.user._id,
    task.client,
    'update security settings for this task'
  );

  // Update security settings
  task.visibility = req.body.visibility;
  await task.save();

  res.status(200).json({
    status: 'success',
    data: {
      task,
    },
  });
});
