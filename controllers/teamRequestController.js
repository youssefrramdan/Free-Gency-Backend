import asyncHandler from 'express-async-handler';
import TeamRequest from '../models/teamRequestModel.js';
import AppError from '../utils/appError.js';

// @desc    Add a new team request
// @route   POST /api/v1/team-requests
// @access  Private
export const addTeamRequest = asyncHandler(async (req, res, next) => {
  const { teamId, teamCode } = req.body;
  const userId = req.user.id;

  // Check if user can apply
  const canApply = await TeamRequest.canUserApply(userId, teamId);
  if (!canApply) {
    return next(
      new AppError('You already have a pending request for this team', 400)
    );
  }

  // Create new request
  const request = await TeamRequest.create({
    user: userId,
    team: teamId,
    teamCode,
  });

  res.status(201).json({
    status: 'success',
    data: {
      request,
    },
  });
});

// @desc    Handle team request (accept/reject)
// @route   PATCH /api/v1/team-requests/:id
// @access  Private/TeamLeader
export const handleTeamRequest = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;
  const teamId = req.user.id;

  // Find request
  const request = await TeamRequest.findOne({
    _id: id,
    team: teamId,
  });

  if (!request) {
    return next(new AppError('Request not found', 404));
  }

  if (request.status !== 'pending') {
    return next(new AppError('This request has already been handled', 400));
  }

  // Update request status
  request.status = status;
  await request.save();

  res.status(200).json({
    status: 'success',
    data: {
      request,
    },
  });
});

// @desc    Get team requests
// @route   GET /api/v1/team-requests
// @access  Private/TeamLeader
export const getTeamRequests = asyncHandler(async (req, res, next) => {
  const teamId = req.user.id;
  const { status } = req.query;

  const query = { team: teamId };
  if (status) {
    query.status = status;
  }

  const requests = await TeamRequest.find(query)
    .populate('user', 'name email profileImage')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: requests.length,
    data: {
      requests,
    },
  });
});

// @desc    Get user's team requests
// @route   GET /api/v1/team-requests/my-requests
// @access  Private
export const getMyRequests = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { status } = req.query;

  const query = { user: userId };
  if (status) {
    query.status = status;
  }

  const requests = await TeamRequest.find(query)
    .populate('team', 'teamName logo')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: requests.length,
    data: {
      requests,
    },
  });
});
