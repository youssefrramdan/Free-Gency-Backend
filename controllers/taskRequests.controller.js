import asyncHandler from 'express-async-handler';
import Task from '../models/task.model.js';
import ApiError from '../utils/apiError.js';

// ==========================================
// Authorization helper
// ==========================================
const canManageTaskRequest = async (userId, taskId) => {
  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError('Task not found', 404);
  }
  const isClient = task.client.toString() === userId.toString();
  if (!isClient) {
    throw new ApiError(
      'You are not authorized to manage this task request',
      403
    );
  }
  return task;
};

// ==========================================
// Create Task Request
// ==========================================
const createTaskRequest = asyncHandler(async (req, res, next) => {
  const { taskId } = req.params;
  const { note, budget, similarProjectUrl, similarProjectImage } = req.body;
  const teamId = req.user.createdTeam; // Get team ID from authenticated user's team

  if (!note) return next(new ApiError('Note is required', 400));

  const task = await Task.findById(taskId);
  if (!task) return next(new ApiError('Task not found', 404));

  // Check if task is already assigned
  if (task.assignedTeam) {
    return next(
      new ApiError('This task is already assigned to another team', 400)
    );
  }

  // Check for existing request
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
        // Remove rejected request to allow new one
        task.teamRequests = task.teamRequests.filter(
          request => request.team.toString() !== teamId.toString()
        );
        break;
      default:
        break;
    }
  }

  // Handle proposal files
  const proposalFiles = [];
  if (req.files && req.files.length > 0) {
    req.files.forEach(file => {
      proposalFiles.push({
        fileName: file.originalname,
        fileUrl: file.path,
        uploadedAt: new Date(),
      });
    });
  }

  // Add new request
  task.teamRequests.push({
    team: teamId,
    note,
    proposal: proposalFiles,
    budget,
    similarProjectUrl,
    similarProjectImage,
    status: 'pending',
    appliedAt: new Date(),
  });

  await task.save();

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

  if (!task) return next(new ApiError('Task not found', 404));

  const taskWithRequests = await Task.findById(taskId).populate(
    'teamRequests.team',
    'name'
  );

  const grouped = { pending: [], accepted: [], rejected: [] };
  for (const request of taskWithRequests.teamRequests) {
    grouped[request.status]?.push(request);
  }

  res.status(200).json({
    status: 'success',
    data: {
      pending: { count: grouped.pending.length, requests: grouped.pending },
      accepted: { count: grouped.accepted.length, requests: grouped.accepted },
      rejected: { count: grouped.rejected.length, requests: grouped.rejected },
    },
  });
});

// ==========================================
// Accept Task Request
// ==========================================
const acceptTaskRequest = asyncHandler(async (req, res, next) => {
  const { taskId, requestId } = req.params;
  const task = await canManageTaskRequest(req.user._id, taskId);

  const request = task.teamRequests.id(requestId);
  if (!request) return next(new ApiError('Request not found', 404));

  // Update request status
  request.status = 'accepted';
  request.responseAt = new Date();
  request.responseBy = req.user._id;

  // Assign team to task
  task.assignedTeam = request.team;
  task.status = 'in-progress';

  // Reject all other pending requests
  task.teamRequests.forEach(reqItem => {
    if (reqItem.status === 'pending' && reqItem._id.toString() !== requestId) {
      reqItem.status = 'rejected';
      reqItem.responseAt = new Date();
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
  const { taskId, requestId } = req.params;
  const task = await canManageTaskRequest(req.user._id, taskId);

  const request = task.teamRequests.id(requestId);
  if (!request) return next(new ApiError('Request not found', 404));

  request.status = 'rejected';
  request.responseAt = new Date();
  request.responseBy = req.user._id;

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
  const { taskId, requestId } = req.params;
  const task = await Task.findById(taskId);

  if (!task) return next(new ApiError('Task not found', 404));

  const request = task.teamRequests.id(requestId);
  if (!request) return next(new ApiError('Request not found', 404));

  // Only allow deletion if request is pending
  if (request.status !== 'pending') {
    return next(new ApiError('Can only delete pending requests', 400));
  }

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
