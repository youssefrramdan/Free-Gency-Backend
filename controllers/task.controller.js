import asyncHandler from 'express-async-handler';
import ApiError from '../utils/apiError.js';
import Task from '../models/task.model.js';
import Team from '../models/team.model.js';
import NotificationService from '../service/NotificationService.js';

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

  const requirment = [];
  if (req.files && req.files.length > 0) {
    req.files.forEach(file => {
      requirment.push({
        fileName: file.originalname,
        fileUrl: file.path,
      });
    });
    req.body.requirment = requirment;
  }

  // Create the task
  const task = await Task.create(req.body);

  // Get teams with matching category and their team leaders
  const teams = await Team.find({ category: task.category }).populate(
    'teamLeader',
    'fcmToken name createdTeam'
  );

  const taskWithClient = await Task.findById(task._id).populate(
    'client',
    'name profileImage'
  );

  // تجهيز الرسالة
  const title = `${task.title}`;
  const body = `${task.description}`;

  // Send notifications to teams with matching category
  await NotificationService.sendTeamNotificationsByCategory(
    teams,
    task.category,
    title,
    body,
    taskWithClient.client.profileImage,
    'task-posted',
    `/tasks/${task._id}`,
    {
      taskId: task._id,
      category: task.category,
      budget: task.budget,
      duration: task.duration,
    }
  );

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
    .populate({
      path: 'service',
      select: 'name',
      model: 'Service',
    });

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
  // Get tasks for the authenticated client
  const clientId = req.user._id;
  const tasks = await Task.find({ client: clientId }).select(
    '-category -service -client -requirment -teamRequests -taskFiles -taskHistory -updatedAt -__v'
  );
  // Count posted (all tasks), in-progress, and completed
  const [posted, inProgress, completed] = await Promise.all([
    Task.countDocuments({ client: clientId }),
    Task.countDocuments({ client: clientId, status: 'in-progress' }),
    Task.countDocuments({ client: clientId, status: 'completed' }),
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      postedProjects: posted,
      projectsInProgress: inProgress,
      completedProjects: completed,
      tasks,
    },
  });
});

/**
 * @desc    Get tasks based on team category
 * @route   GET /api/v1/tasks/by-team-category
 * @access  Private
 */
const getTasksByTeamCategory = asyncHandler(async (req, res, next) => {
  const team = await Team.findOne({ teamLeader: req.user._id });

  if (!team) {
    return next(new ApiError('Team not found', 404));
  }

  // Get tasks that match team's category
  const tasks = await Task.find({
    category: team.category,
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
    .populate({
      path: 'service',
      select: 'name',
      model: 'Service',
    })
    .populate('assignedTeam', 'name logo');

  if (!task) {
    return next(new ApiError('Task not found', 404));
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
    return next(new ApiError('Task not found', 404));
  }

  // Check if user is authorized (either admin or the client who created the task)
  if (
    req.user.role !== 'admin' &&
    task.client.toString() !== req.user._id.toString()
  ) {
    return next(new ApiError('Not authorized to update this task', 403));
  }

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
    return next(new ApiError('Task not found', 404));
  }

  // Check if user is authorized (either admin or the client who created the task)
  if (
    req.user.role !== 'admin' &&
    task.client.toString() !== req.user._id.toString()
  ) {
    return next(new ApiError('Not authorized to delete this task', 403));
  }

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
  getTasksByTeamCategory,
  getAllMyTasks,
  getSpecificTask,
  updateSpecificTask,
  deleteSpecificTask,
  addTaskFiles,
  deleteTaskFile,
};
