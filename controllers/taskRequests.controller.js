/* eslint-disable default-case */
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
  if (notification.note) {
    return ` ${sender.name || 'Team'} has sent a request for your task `;
  }

  if (notification.status === 'accepted') {
    return `${task.title}Your request has been accepted by ${sender.name || 'Client'}You can now start working on this task!`;
  }

  if (notification.status === 'rejected') {
    return `${task.title} Your request has been rejected by ${sender.name || 'Client'} Try applying to other open tasks.`;
  }

  // Default case for any other status
  return `${task.title} There's an update on your task request`;
};

// ==========================================
// Send notification helper
// ==========================================
const sendNotificationToTeam = async (
  token,
  title,
  message,
  image,
  userId,
  type = 'request',
  actionUrl = null,
  data = {}
) => {
  if (!token) return;

  try {
    await NotificationService.sendNotification(
      token,
      title,
      message,
      image,
      type,
      actionUrl,
      {
        ...data,
        userId: userId.toString(),
      }
    );
  } catch (error) {
    console.error('Error sending notification:', error);
    // Don't fail the operation if notification fails
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
    }
  }

  const proposalFiles = [];
  if (req.files && req.files.length > 0) {
    req.files.forEach(file => {
      proposalFiles.push({
        fileName: file.originalname,
        fileUrl: file.path,
      });
    });
  }
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
  await sendNotificationToTeam(
    task.client.fcmToken,
    task.title,
    buildNotificationMessage(task, team.teamLeader, {
      ...newRequest,
      budget,
      note,
    }),
    team.logo,
    task.client._id,
    'taskRequest',
    `/tasks/${task._id}/requests`,
    {
      taskId: task._id,
      teamId: team._id,
      teamName: team.name,
      budget: budget,
      status: 'pending',
      data: task.teamRequests[task.teamRequests.length - 1]._id,
    }
  );

  res.status(201).json({
    status: 'success',
    message: 'Task request sent successfully',
    data: {
      taskId: task._id,
      requestId: task.teamRequests[task.teamRequests.length - 1]._id,
      myRequest: task.teamRequests[task.teamRequests.length - 1],
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

  res.status(200).json({ status: 'success', data: grouped });
});

// ==========================================
// Accept Task Request
// ==========================================
const acceptTaskRequest = asyncHandler(async (req, res, next) => {
  const { requestId } = req.params;
  const task = await Task.findOne({ 'teamRequests._id': requestId });

  if (!task) return next(new ApiError('Task request not found', 404));
  if (task.client.toString() !== req.user._id.toString()) {
    return next(
      new ApiError('You are not authorized to manage this task request', 403)
    );
  }

  await task.populate('client', 'fcmToken profileImage');
  const request = task.teamRequests.id(requestId);
  if (!request) return next(new ApiError('Request not found in task', 404));

  const team = await Team.findById(request.team).populate(
    'teamLeader',
    'fcmToken name profileImage'
  );

  // Update request status
  request.status = 'accepted';
  request.responseAt = new Date();
  request.responseBy = req.user._id;

  // Update task status
  task.assignedTeam = request.team;
  task.status = 'in-progress';

  // Handle pending requests
  const pendingRequests = task.teamRequests.filter(
    reqItem =>
      reqItem.status === 'pending' && reqItem._id.toString() !== requestId
  );

  pendingRequests.forEach(rejectedRequest => {
    rejectedRequest.status = 'rejected';
    rejectedRequest.responseAt = new Date();
  });

  await task.save();

  // Send notifications
  await Promise.all([
    // Send acceptance notification to the accepted team
    sendNotificationToTeam(
      team.teamLeader.fcmToken,
      'Task Request Accepted',
      buildNotificationMessage(task, task.client, request),
      task.client.profileImage,
      team.teamLeader._id,
      'taskAccepted',
      `/tasks/${task._id}`,
      {
        taskId: task._id,
        requestId: request._id,
        teamId: team._id,
        teamName: team.name,
        budget: request.budget,
        status: 'accepted',
        data: task.teamRequests[task.teamRequests.length - 1]._id,
      }
    ),
    // Send rejection notifications to other teams
    ...pendingRequests.map(async rejectedRequest => {
      const rejectedTeam = await Team.findById(rejectedRequest.team).populate(
        'teamLeader',
        'fcmToken name profileImage'
      );

      await sendNotificationToTeam(
        rejectedTeam.teamLeader.fcmToken,
        'Task Request Rejected',
        buildNotificationMessage(task, task.client, rejectedRequest),
        task.client.profileImage,
        rejectedTeam.teamLeader._id,
        'taskRejected',
        `/tasks/${task._id}`,
        {
          taskId: task._id,
          requestId: rejectedRequest._id,
          teamId: rejectedTeam._id,
          teamName: rejectedTeam.name,
          budget: rejectedRequest.budget,
          status: 'rejected',
          data: task.teamRequests[task.teamRequests.length - 1]._id,
        }
      );
    }),
  ]);

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
  const task = await Task.findOne({ 'teamRequests._id': requestId });

  if (!task) return next(new ApiError('Request not found', 404));
  if (task.client.toString() !== req.user._id.toString()) {
    return next(
      new ApiError('You are not authorized to manage this task request', 403)
    );
  }

  await task.populate('client', 'fcmToken profileImage');
  const request = task.teamRequests.id(requestId);
  if (!request) return next(new ApiError('Request not found in task', 404));

  const team = await Team.findById(request.team).populate(
    'teamLeader',
    'fcmToken name profileImage'
  );

  request.status = 'rejected';
  request.responseAt = new Date();
  request.responseBy = req.user._id;

  await task.save();

  await sendNotificationToTeam(
    team.teamLeader.fcmToken,
    'Task Request Rejected',
    buildNotificationMessage(task, task.client, request),
    task.client.profileImage,
    team.teamLeader._id,
    'taskRejected',
    `/tasks/${task._id}`,
    {
      taskId: task._id,
      requestId: request._id,
      teamId: team._id,
      teamName: team.name,
      budget: request.budget,
      status: 'rejected',
    }
  );

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
  if (!request || request.status !== 'pending') {
    return next(new ApiError('Can only delete pending requests', 400));
  }

  task.teamRequests.pull(requestId);
  await task.save();

  res.status(204).json({
    status: 'success',
    message: 'Task request deleted successfully',
  });
});

// ==========================================
// Get Specific Task Request
// ==========================================
const getSpecificTaskRequest = asyncHandler(async (req, res, next) => {
  const { requestId } = req.params;

  const task = await Task.findOne({ 'teamRequests._id': requestId }).populate(
    'teamRequests.team',
    'name logo'
  );
  if (!task) return next(new ApiError('Request not found', 404));

  const request = task.teamRequests.id(requestId);
  if (!request) return next(new ApiError('Request not found', 404));

  res.status(200).json({
    status: 'success',
    data: request,
  });
});

export {
  createTaskRequest,
  getTaskRequests,
  acceptTaskRequest,
  rejectTaskRequest,
  deleteTaskRequest,
  getSpecificTaskRequest,
};
