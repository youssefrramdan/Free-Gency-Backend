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
const buildNotificationMessage = (task, sender, notification) => {
  // For new request notifications (team sends to client)
  if (notification.budget && notification.note) {
    return `📌 ${task.title}\n👥 ${sender.name || 'Team'} has sent a request for your task\n💰 Proposed Budget: ${notification.budget} SAR\n📝 ${notification.note.substring(0, 100)}...`;
  }

  // For accept/reject notifications (client sends to team)
  if (notification.status === 'accepted') {
    return `📌 ${task.title}\n✅ Your request has been accepted by ${sender.name || 'Client'}\n🚀 You can now start working on this task!`;
  }

  if (notification.status === 'rejected') {
    return `📌 ${task.title}\n❌ Your request has been rejected by ${sender.name || 'Client'}\n🔍 Try applying to other open tasks.`;
  }

  // Default message if none of the above conditions match
  return `📌 ${task.title}\n👋 There's an update on your task request`;
};

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

  // Get the request before full population to access the team ID
  const request = task.teamRequests.id(requestId);
  if (!request) {
    return next(new ApiError('Request not found in task', 404));
  }

  // Find and populate the team separately to ensure proper data
  const team = await Team.findById(request.team).populate(
    'teamLeader',
    'fcmToken name profileImage'
  );

  request.status = 'accepted';
  request.responseAt = new Date();
  request.responseBy = req.user._id;

  // Notify the accepted team leader
  if (team && team.teamLeader && team.teamLeader.fcmToken) {
    await sendNotificationToTeam(
      team.teamLeader.fcmToken,
      '🎯 Task Request Accepted',
      buildNotificationMessage(task, task.client, request),
      task.client.profileImage
    );
  }

  // Update task status
  task.assignedTeam = request.team;
  task.status = 'in-progress';

  // Find all pending requests and update their status
  const pendingRequests = task.teamRequests.filter(
    reqItem =>
      reqItem.status === 'pending' && reqItem._id.toString() !== requestId
  );

  // Update status in the task
  pendingRequests.forEach(rejectedRequest => {
    rejectedRequest.status = 'rejected';
    rejectedRequest.responseAt = new Date();
  });

  // Save task first
  await task.save();

  // Now send notifications using Promise.all to avoid await in loop
  const rejectionNotifications = pendingRequests.map(async rejectedRequest => {
    try {
      const rejectedTeam = await Team.findById(rejectedRequest.team).populate(
        'teamLeader',
        'fcmToken name profileImage'
      );

      if (
        rejectedTeam &&
        rejectedTeam.teamLeader &&
        rejectedTeam.teamLeader.fcmToken
      ) {
        return sendNotificationToTeam(
          rejectedTeam.teamLeader.fcmToken,
          '🎯 Task Request Rejected',
          buildNotificationMessage(task, task.client, rejectedRequest),
          task.client.profileImage
        );
      }
      return null;
    } catch (err) {
      return null;
    }
  });

  // Wait for all notifications to be sent
  await Promise.all(rejectionNotifications);

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

  const request = task.teamRequests.id(requestId);
  if (!request) {
    return next(new ApiError('Request not found in task', 404));
  }

  request.status = 'rejected';
  request.responseAt = new Date();
  request.responseBy = req.user._id;

  // Find and populate the team separately
  const team = await Team.findById(request.team).populate(
    'teamLeader',
    'fcmToken name profileImage'
  );

  // Notify the team leader of rejection
  if (team && team.teamLeader && team.teamLeader.fcmToken) {
    await sendNotificationToTeam(
      team.teamLeader.fcmToken,
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
