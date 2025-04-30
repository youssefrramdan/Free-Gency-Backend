import asyncHandler from 'express-async-handler';
import Task from '../models/task.model.js';
import ApiError from '../utils/apiError.js';
import NotificationService from '../service/NotificationService.js';
import Team from '../models/team.model.js';

// ==========================================
// Authorization helper
// ==========================================
const canManageTaskRequest = async (userId, taskId) => {
  const task = await Task.findById(taskId);
  if (!task) throw new ApiError('Task not found', 404);
  if (task.client.toString() !== userId.toString()) {
    throw new ApiError(
      'You are not authorized to manage this task request',
      403
    );
  }
  return task;
};

// ==========================================
// Helper to build notification message
// ==========================================
const buildNotificationMessage = (task, teamLeader, notification) =>
  `📌 ${task.title}\n👥 ${teamLeader.name} has sent a request for your task\n💰 Proposed Budget: ${notification.budget} SAR\n📝 ${notification.note.substring(0, 100)}...`;

// ==========================================
// Send notification helper
// ==========================================
const sendNotificationToTeam = async (token, title, message, image) => {
  if (token) {
    await NotificationService.sendNotification(token, title, message, image);
  }
};

// ==========================================
// Create Task Request
// ==========================================
const createTaskRequest = asyncHandler(async (req, res, next) => {
  const { taskId } = req.params;
  const { note, budget, similarProjectUrl, similarProjectImage } = req.body;
  const teamId = req.user.createdTeam;

  if (!note) return next(new ApiError('Note is required', 400));

  const task = await Task.findById(taskId)
    .populate('client', 'fcmToken')
    .populate('teamRequests.team.teamLeader', 'fcmToken name profileImage');
  if (!task) return next(new ApiError('Task not found', 404));

  if (task.assignedTeam)
    return next(
      new ApiError('This task is already assigned to another team', 400)
    );

  const existingRequest = task.teamRequests.find(
    request => request.team.toString() === teamId.toString()
  );
  if (existingRequest) {
    switch (existingRequest.status) {
      case 'pending':
        return next(new ApiError('Pending request already exists', 400));
      case 'accepted':
        return next(new ApiError('Already accepted for this task', 400));
      case 'rejected':
        task.teamRequests = task.teamRequests.filter(
          request => request.team.toString() !== teamId.toString()
        );
        break;
      default:
        break;
    }
  }

  // Handle proposal files
  const proposalFiles = req.files
    ? req.files.map(file => ({
        fileName: file.originalname,
        fileUrl: file.path,
        uploadedAt: new Date(),
      }))
    : [];

  const newRequest = {
    team: teamId,
    note,
    proposal: proposalFiles,
    budget,
    similarProjectUrl,
    similarProjectImage,
    status: 'pending',
    appliedAt: new Date(),
  };

  task.teamRequests.push(newRequest);
  await task.save();

  const team = await Team.findById(teamId).populate(
    'teamLeader',
    'fcmToken name profileImage'
  );

  // Send notification to client
  if (task.client.fcmToken) {
    await sendNotificationToTeam(
      task.client.fcmToken,
      '🎯 New Task Request',
      buildNotificationMessage(task, team.teamLeader, {
        ...newRequest,
        budget,
        note,
      }),
      team.teamLeader.profileImage
    );
  }

  res.status(201).json({
    status: 'success',
    message: 'Task request sent successfully',
    data: {
      taskId: task._id,
      teamRequests: task.teamRequests[task.teamRequests.length - 1],
    },
  });
});

// ==========================================
// Get Task Requests
// ==========================================
const getTaskRequests = asyncHandler(async (req, res, next) => {
  const { taskId } = req.params;
  const task = await canManageTaskRequest(req.user._id, taskId);

  const taskWithRequests = await Task.findById(taskId).populate(
    'teamRequests.team',
    'name'
  );
  const grouped = { pending: [], accepted: [], rejected: [] };

  taskWithRequests.teamRequests.forEach(request =>
    grouped[request.status]?.push(request)
  );

  res.status(200).json({
    status: 'success',
    data: grouped,
  });
});

// ==========================================
// Accept Task Request
// ==========================================
const acceptTaskRequest = asyncHandler(async (req, res, next) => {
  const { requestId } = req.params;

  // Find task first without population for authorization check
  const task = await Task.findOne({ 'teamRequests._id': requestId });

  if (!task) {
    return next(new ApiError('Task request not found', 404));
  }

  // Check authorization
  if (task.client.toString() !== req.user._id.toString()) {
    return next(
      new ApiError('You are not authorized to manage this task request', 403)
    );
  }

  // Now populate needed data for notifications
  await task.populate('client', 'fcmToken profileImage');
  await task.populate('teamRequests.team', 'name logo');
  await task.populate(
    'teamRequests.team.teamLeader',
    'fcmToken name profileImage'
  );

  const request = task.teamRequests.id(requestId);
  if (!request) {
    return next(new ApiError('Request not found in task', 404));
  }

  request.status = 'accepted';
  request.responseAt = new Date();
  request.responseBy = req.user._id;

  // Notify the accepted team leader
  if (
    request.team &&
    request.team.teamLeader &&
    request.team.teamLeader.fcmToken
  ) {
    await sendNotificationToTeam(
      request.team.teamLeader.fcmToken,
      '🎯 Task Request Accepted',
      buildNotificationMessage(task, task.client, request),
      task.client.profileImage
    );
  }

  // Update task status
  task.assignedTeam = request.team;
  task.status = 'in-progress';

  // Reject other pending requests and notify
  task.teamRequests
    .filter(
      reqItem =>
        reqItem.status === 'pending' && reqItem._id.toString() !== requestId
    )
    .forEach(rejectedRequest => {
      rejectedRequest.status = 'rejected';
      rejectedRequest.responseAt = new Date();

      if (
        rejectedRequest.team &&
        rejectedRequest.team.teamLeader &&
        rejectedRequest.team.teamLeader.fcmToken
      ) {
        sendNotificationToTeam(
          rejectedRequest.team.teamLeader.fcmToken,
          '🎯 Task Request Rejected',
          buildNotificationMessage(task, task.client, rejectedRequest),
          task.client.profileImage
        );
      }
    });

  await task.save();

  res.status(200).json({
    status: 'success',
    message: 'Task request accepted successfully',
    data: request,
  });
});

// ==========================================
// Reject Task Request
// ==========================================
const rejectTaskRequest = asyncHandler(async (req, res, next) => {
  const { requestId } = req.params;

  // Find task first without population for authorization check
  const task = await Task.findOne({ 'teamRequests._id': requestId });

  if (!task) {
    return next(new ApiError('Request not found', 404));
  }

  // Check authorization
  if (task.client.toString() !== req.user._id.toString()) {
    return next(
      new ApiError('You are not authorized to manage this task request', 403)
    );
  }

  // Now populate data for notifications
  await task.populate('client', 'fcmToken profileImage');
  await task.populate(
    'teamRequests.team.teamLeader',
    'fcmToken name profileImage'
  );

  const request = task.teamRequests.id(requestId);
  if (!request) {
    return next(new ApiError('Request not found in task', 404));
  }

  request.status = 'rejected';
  request.responseAt = new Date();
  request.responseBy = req.user._id;

  // Notify the team leader of rejection
  if (
    request.team &&
    request.team.teamLeader &&
    request.team.teamLeader.fcmToken
  ) {
    await sendNotificationToTeam(
      request.team.teamLeader.fcmToken,
      '🎯 Task Request Rejected',
      buildNotificationMessage(task, task.client, request),
      task.client.profileImage
    );
  }

  await task.save();

  res.status(200).json({
    status: 'success',
    message: 'Task request rejected successfully',
    data: request,
  });
});

// ==========================================
// Delete Task Request
// ==========================================
const deleteTaskRequest = asyncHandler(async (req, res, next) => {
  const { requestId } = req.params;
  const task = await Task.findOne({ 'teamRequests._id': requestId });
  if (!task) return next(new ApiError('Request not found', 404));

  const request = task.teamRequests.id(requestId);
  if (!request || request.status !== 'pending')
    return next(new ApiError('Can only delete pending requests', 400));

  task.teamRequests.pull(requestId);
  await task.save();

  res.status(204).json({
    status: 'success',
    message: 'Task request deleted successfully',
  });
});

export {
  createTaskRequest,
  getTaskRequests,
  acceptTaskRequest,
  rejectTaskRequest,
  deleteTaskRequest,
};
