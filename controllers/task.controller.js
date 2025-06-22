import asyncHandler from 'express-async-handler';
import ApiError from '../utils/apiError.js';
import Task from '../models/task.model.js';
import Team from '../models/team.model.js';
import NotificationService from '../service/NotificationService.js';
import User from '../models/user.model.js';

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

  if (req.file) {
    req.body.fileName = req.file.originalname;
    req.body.fileUrl = req.file.path;
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
  const type = 'taskPosted';
  // Send notifications to teams with matching category
  await NotificationService.sendTeamNotificationsByCategory(
    teams,
    task.category,
    type,
    title,
    body,
    taskWithClient.client.profileImage,
    `/tasks/${task._id}`,
    task._id.toString()
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
const getAllTasks = asyncHandler(async (req, res, next) => {
  const filterObject = {};

  if (req.query.filterBy === 'category') {
    const team = await Team.findOne({ teamLeader: req.user._id });
    if (!team) {
      return next(new ApiError('Team not found', 404));
    }
    filterObject.category = team.category;
  }
  const tasks = await Task.find(filterObject)
    .populate('client', 'name profileImage')
    .populate('category', 'name')
    .populate({
      path: 'service',
      select: 'name',
      model: 'Service',
    })
    .sort({ createdAt: -1 });

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
const getAllTasksForClient = asyncHandler(async (req, res) => {
  // Get tasks for the authenticated client
  const clientId = req.user._id;
  const tasks = await Task.find({ client: clientId })
    .populate('category', 'name')
    .populate('service', 'name')
    .populate('assignedMembers', 'profileImage')
    .populate('assignedTeam', 'name logo')
    .select(
      '-client -requirment -teamRequests -taskFiles -taskHistory -updatedAt -__v'
    )
    .sort('-createdAt');
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
 * @desc    Get all tasks for team leader
 * @route   GET /api/v1/tasks/my-tasks
 * @access  Private
 */
const getMyTasksForTeamLeader = asyncHandler(async (req, res, next) => {
  const team = await Team.findOne({ teamLeader: req.user._id });
  if (!team) {
    return next(new ApiError('Team not found', 404));
  }
  const tasks = await Task.find({ assignedTeam: team._id })
    .populate('category', 'name')
    .populate('service', 'name')
    .populate('assignedTeam', 'name logo')
    .populate('assignedMembers', 'profileImage')
    .select(
      '-client -requirment -teamRequests -taskFiles -taskHistory -updatedAt -__v'
    )
    .sort('-createdAt');
  res.status(200).json({
    status: 'success',
    results: tasks.length,
    data: tasks,
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

  // Get tasks that match team's category and are not assigned to any team
  const tasks = await Task.find({
    category: team.category,
    assignedTeam: { $exists: false },
  })
    .populate('client', 'name email')
    .populate('category', 'name')
    .populate('assignedTeam', 'name logo')
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
    .populate('client', 'name profileImage')
    .populate('category', 'name')
    .populate('assignedMembers', 'profileImage')
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

// ==========================================
// Save/Unsave Task Operations
// ==========================================

/**
 * @desc    Save task to user's saved tasks
 * @route   POST /api/v1/tasks/:id/save
 * @access  Private
 */
const saveTask = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  const task = await Task.findById(req.params.id);

  if (!task) {
    return next(new ApiError('Task not found', 404));
  }

  // Check if task is already saved
  if (user.savedTasks.includes(task._id)) {
    return next(new ApiError('Task is already saved', 400));
  }

  // Add task to saved tasks
  user.savedTasks.push(task._id);
  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'Task saved successfully',
  });
});

/**
 * @desc    Remove task from user's saved tasks
 * @route   DELETE /api/v1/tasks/:id/save
 * @access  Private
 */
const unsaveTask = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  const task = await Task.findById(req.params.id);

  if (!task) {
    return next(new ApiError('Task not found', 404));
  }

  // Check if task is saved
  if (!user.savedTasks.includes(task._id)) {
    return next(new ApiError('Task is not saved', 400));
  }

  // Remove task from saved tasks
  user.savedTasks = user.savedTasks.filter(
    savedTask => savedTask.toString() !== task._id.toString()
  );
  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'Task removed from saved tasks',
  });
});

/**
 * @desc    Get user's saved tasks
 * @route   GET /api/v1/tasks/saved
 * @access  Private
 */
const getSavedTasks = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).populate({
    path: 'savedTasks',
    populate: [
      { path: 'client', select: 'name profileImage' },
      { path: 'category', select: 'name' },
      { path: 'service', select: 'name' },
    ],
  });

  res.status(200).json({
    status: 'success',
    results: user.savedTasks.length,
    data: user.savedTasks,
  });
});

/**
 * @desc    Mark task as completed by team leader
 * @route   PATCH /api/v1/tasks/:id/mark-completed
 * @access  Private (Team Leader only)
 */
const markAsCompleted = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return next(new ApiError('Task not found', 404));
  }

  // Check if task is assigned to a team
  if (!task.assignedTeam) {
    return next(new ApiError('Task is not assigned to any team', 400));
  }

  // Find the team and check if current user is the team leader
  const team = await Team.findById(task.assignedTeam);
  if (!team) {
    return next(new ApiError('Assigned team not found', 404));
  }

  // Check if current user is the team leader
  if (team.teamLeader.toString() !== req.user._id.toString()) {
    return next(
      new ApiError('Only team leader can mark task as completed', 403)
    );
  }

  // Check if task is already completed
  if (task.status === 'completed') {
    return next(new ApiError('Task is already completed', 400));
  }

  // Update task status to completed
  task.status = 'completed';
  task.completedAt = Date.now();

  // Add completion entry to task history
  task.taskHistory.push({
    action: 'Task marked as completed',
    performedBy: req.user._id,
    performedAt: Date.now(),
  });

  await task.save();

  // Send notification to client
  await NotificationService.sendTaskCompletedNotification(
    task.client,
    task.title,
    team.name,
    team.logo,
    `/tasks/${task._id}`,
    {
      taskId: task._id.toString(),
      teamId: team._id.toString(),
    }
  );

  res.status(200).json({
    status: 'success',
    message: 'Task marked as completed successfully',
    data: task,
  });
});

/**
 * @desc    Get all tasks for team member
 * @route   GET /api/v1/tasks/my-assigned-tasks
 * @access  Private (Team Member)
 */
const getMyTasksForTeamMember = asyncHandler(async (req, res) => {
  // Get tasks where current user is in assignedMembers
  const tasks = await Task.find({
    assignedMembers: { $in: [req.user._id] },
  })
    .populate('category', 'name')
    .populate('service', 'name')
    .populate('assignedTeam', 'name logo')
    .populate('assignedMembers', 'profileImage')
    .select(
      '-client -requirment -teamRequests -taskFiles -taskHistory -updatedAt -__v'
    )
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: tasks.length,
    data: tasks,
  });
});

export {
  createTask,
  getAllTasks,
  getTasksByTeamCategory,
  getAllTasksForClient,
  getSpecificTask,
  updateSpecificTask,
  deleteSpecificTask,
  addTaskFiles,
  deleteTaskFile,
  saveTask,
  unsaveTask,
  getSavedTasks,
  getMyTasksForTeamLeader,
  getMyTasksForTeamMember,
  markAsCompleted,
};
