import asyncHandler from 'express-async-handler';
import ApiError from '../utils/apiError.js';
import SubTask from '../models/subtasks.model.js';
import Task from '../models/task.model.js';
import NotificationService from '../service/NotificationService.js';
import User from '../models/user.model.js';

// ==========================================
// Helper Functions
// ==========================================

const formatSubtaskResponse = subtask => ({
  subtaskDetails: {
    id: subtask._id,
    title: subtask.title,
    description: subtask.description,
    status: subtask.status,
    deadline: subtask.deadline,
  },
  assignedTo: subtask.assignedTo
    ? {
        id: subtask.assignedTo._id,
        name: subtask.assignedTo.name,
        profileImage: subtask.assignedTo.profileImage,
      }
    : null,
  comments: subtask.comments
    ? subtask.comments.map(comment => ({
        id: comment._id,
        text: comment.text,
        createdAt: comment.createdAt,
        user: comment.user
          ? {
              id: comment.user._id,
              name: comment.user.name,
              profileImage: comment.user.profileImage,
            }
          : null,
      }))
    : [],
});

// ==========================================
// Authorization Helper
// ==========================================

const isAuthorized = async (userId, taskId, action = 'perform this action') => {
  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError('Task not found', 404);
  }

  // Check if user is team leader of the assigned team
  const user = await User.findById(userId);
  if (
    !user ||
    !user.createdTeam ||
    user.createdTeam.toString() !== task.assignedTeam.toString()
  ) {
    throw new ApiError(`Not authorized to ${action}`, 403);
  }
  return task;
};

// ==========================================
// SubTask CRUD Operations
// ==========================================

/**
 * @desc    Create a new subtask
 * @route   POST /api/v1/tasks/:taskId/subtasks
 * @access  Private (Team Leader)
 */
const createSubTask = asyncHandler(async (req, res, next) => {
  const { taskId } = req.params;

  // Check authorization
  await isAuthorized(req.user._id, taskId, 'create subtasks for this task');

  // Create the subtask
  const subtask = await SubTask.create({
    title: req.body.title,
    description: req.body.description,
    deadline: req.body.deadline,
    task: taskId,
    assignedTo: req.body.assignedTo,
  });

  // Add the subtask to the task's assignedMembers array if not already present
  await Task.findByIdAndUpdate(taskId, {
    $addToSet: { assignedMembers: subtask.assignedTo },
  });

  // Populate necessary fields
  await subtask.populate('assignedTo', 'name profileImage');

  // Get assigned user for notification
  const assignedUser = await User.findById(subtask.assignedTo).select(
    'fcmToken'
  );
  if (assignedUser?.fcmToken) {
    await NotificationService.sendNotificationToTeam(
      assignedUser.fcmToken,
      'New SubTask Assigned',
      `You have been assigned to new subtask: ${subtask.title}`,
      req.user.profileImage,
      assignedUser._id,
      'subtaskAssigned',
      `/subtasks/${subtask._id}`,
      {
        data: subtask._id.toString(),
      }
    );
  }

  res.status(201).json({
    status: 'success',
    data: formatSubtaskResponse(subtask),
  });
});

/**
 * @desc    Get all subtasks for a task (team leader) or assigned subtasks (team member)
 * @route   GET /api/v1/tasks/:taskId/subtasks
 * @access  Private (Team Leader & Team Members)
 */
const getSubTasks = asyncHandler(async (req, res, next) => {
  const { taskId } = req.params;

  const task = await Task.findById(taskId).populate({
    path: 'assignedTeam',
    populate: {
      path: 'teamLeader',
      select: '_id',
    },
  });

  if (!task) {
    return next(new ApiError('Task not found', 404));
  }

  // Check if user is team leader
  const isTeamLeader =
    task.assignedTeam.teamLeader._id.toString() === req.user._id.toString();

  // Build query based on user role
  const query = { task: taskId };
  if (!isTeamLeader) {
    // If team member, only show their assigned subtasks
    query.assignedTo = req.user._id;
  }

  const subtasks = await SubTask.find(query)
    .select('title description status deadline comments assignedTo')
    .populate('assignedTo', 'name profileImage')
    .populate('comments.user', 'name profileImage')
    .sort('deadline');

  const response = subtasks.map(formatSubtaskResponse);

  res.status(200).json({
    status: 'success',
    results: response.length,
    data: response,
  });
});

/**
 * @desc    Get specific subtask
 * @route   GET /api/v1/subtasks/:id
 * @access  Private (Team Leader & Team Members)
 */
const getSpecificSubTask = asyncHandler(async (req, res, next) => {
  const subtask = await SubTask.findById(req.params.id)
    .select('title description status deadline comments assignedTo')
    .populate('assignedTo', 'name profileImage')
    .populate('comments.user', 'name profileImage');

  if (!subtask) {
    return next(new ApiError('SubTask not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: formatSubtaskResponse(subtask),
  });
});

/**
 * @desc    Update subtask
 * @route   PUT /api/v1/subtasks/:id
 * @access  Private (Team Leader)
 */
const updateSubTask = asyncHandler(async (req, res, next) => {
  const subtask = await SubTask.findById(req.params.id);
  if (!subtask) {
    return next(new ApiError('SubTask not found', 404));
  }

  // Check authorization
  await isAuthorized(req.user._id, subtask.task, 'update this subtask');

  const updatedSubTask = await SubTask.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  )
    .select('title description status deadline comments assignedTo')
    .populate('assignedTo', 'name profileImage')
    .populate('comments.user', 'name profileImage');

  // If assignedTo was changed, send notification to new assignee
  if (
    req.body.assignedTo &&
    req.body.assignedTo !== subtask.assignedTo.toString()
  ) {
    const newAssignee = await User.findById(req.body.assignedTo);
    if (newAssignee?.fcmToken) {
      await NotificationService.sendNotificationToTeam(
        newAssignee.fcmToken,
        'SubTask Assignment',
        `You have been assigned to the subtask: ${updatedSubTask.title}`,
        req.user.profileImage,
        newAssignee._id,
        'subtaskAssigned',
        `/subtasks/${subtask._id}`,
        {
          data: subtask._id.toString(),
        }
      );
    }
  }

  res.status(200).json({
    status: 'success',
    data: formatSubtaskResponse(updatedSubTask),
  });
});

/**
 * @desc    Delete subtask
 * @route   DELETE /api/v1/subtasks/:id
 * @access  Private (Team Leader)
 */
const deleteSubTask = asyncHandler(async (req, res, next) => {
  const subtask = await SubTask.findById(req.params.id);
  if (!subtask) {
    return next(new ApiError('SubTask not found', 404));
  }

  // Check authorization
  await isAuthorized(req.user._id, subtask.task, 'delete this subtask');

  await SubTask.findByIdAndDelete(req.params.id);

  res.status(200).json({
    message: 'SubTask deleted successfully',
  });
});

/**
 * @desc    Add comment to subtask
 * @route   POST /api/v1/subtasks/:id/comments
 * @access  Private (Team Leader & Team Members)
 */
const addComment = asyncHandler(async (req, res, next) => {
  const { text } = req.body;
  if (!text) {
    return next(new ApiError('Comment text is required', 400));
  }

  const subtask = await SubTask.findById(req.params.id)
    .select('title description status deadline comments assignedTo')
    .populate({
      path: 'task',
      populate: {
        path: 'assignedTeam',
        populate: {
          path: 'teamLeader',
          select: 'fcmToken name profileImage',
        },
      },
    })
    .populate('assignedTo', 'name profileImage')
    .populate('comments.user', 'name profileImage');

  if (!subtask) {
    return next(new ApiError('SubTask not found', 404));
  }

  subtask.comments.push({
    user: req.user._id,
    text,
  });

  await subtask.save();
  await subtask.populate('comments.user', 'name profileImage');

  // Get the assigned team member
  const assignedMember = await User.findById(subtask.assignedTo);

  // Get the team leader
  const { teamLeader } = subtask.task.assignedTeam;




  // Handle notifications...
  if (req.user._id.toString() === teamLeader._id.toString()) {
    if (assignedMember?.fcmToken) {
      await NotificationService.sendNotificationToTeam(
        assignedMember.fcmToken,
        'New Comment on SubTask',
        `Team leader commented on subtask: ${subtask.title}`,
        req.user.profileImage,
        assignedMember._id,
        'subtaskComment',
        `/subtasks/${subtask._id}`,
        {
          data: subtask._id.toString(),
        }
      );
    }
  } else if (req.user._id.toString() === assignedMember._id.toString()) {
    if (teamLeader?.fcmToken) {
      await NotificationService.sendNotificationToTeam(
        teamLeader.fcmToken,
        'New Comment on SubTask',
        `${assignedMember.name} commented on subtask: ${subtask.title}`,
        req.user.profileImage,
        teamLeader._id,
        'subtaskComment',
        `/subtasks/${subtask._id}`,
        {
          data: subtask._id.toString(),
        }
      );
    }
  }

  res.status(200).json({
    status: 'success',
    data: formatSubtaskResponse(subtask),
  });
});

/**
 * @desc    Update subtask status
 * @route   PATCH /api/v1/subtasks/:id/status
 * @access  Private (Team Leader & Assigned Team Member)
 */
const updateStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  if (!status || !['in-progress', 'completed'].includes(status)) {
    return next(new ApiError('Invalid status value', 400));
  }

  const subtask = await SubTask.findById(req.params.id)
    .select('title description status deadline comments assignedTo')
    .populate('assignedTo', 'name profileImage')
    .populate('comments.user', 'name profileImage');

  if (!subtask) {
    return next(new ApiError('SubTask not found', 404));
  }

  // Only allow the assigned user or team leader to update status
  const user = await User.findById(req.user._id);
  if (
    subtask.assignedTo.toString() !== req.user._id.toString() &&
    (!user.createdTeam ||
      user.createdTeam.toString() !== subtask.task.assignedTeam)
  ) {
    return next(
      new ApiError('Not authorized to update this subtask status', 403)
    );
  }

  subtask.status = status;
  await subtask.save();

  // If completed, notify team leader
  if (status === 'completed') {
    const task = await Task.findById(subtask.task).populate({
      path: 'assignedTeam',
      populate: {
        path: 'teamLeader',
        select: 'fcmToken',
      },
    });

    if (task?.assignedTeam?.teamLeader?.fcmToken) {
      await NotificationService.sendNotificationToTeam(
        task.assignedTeam.teamLeader.fcmToken,
        'SubTask Completed',
        `SubTask "${subtask.title}" has been marked as completed`,
        req.user.profileImage,
        task.assignedTeam.teamLeader._id,
        'subtaskCompleted',
        `/subtasks/${subtask._id}`,
        {
          data: subtask._id.toString(),
        }
      );
    }
  }

  res.status(200).json({
    status: 'success',
    data: formatSubtaskResponse(subtask),
  });
});

export {
  createSubTask,
  getSubTasks,
  getSpecificSubTask,
  updateSubTask,
  deleteSubTask,
  addComment,
  updateStatus,
};
