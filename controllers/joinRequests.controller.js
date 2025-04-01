import asyncHandler from 'express-async-handler';
import Team from '../models/team.model.js';
import JoinRequest from '../models/JoinRequest.model.js';
import ApiError from '../utils/apiError.js';
import User from '../models/user.model.js';

/**
 * @desc    Create a new request to join a team
 * @route   POST /api/v1/teams/join
 * @access  Private
 * @body    { teamCode: string, job: string }
 * @returns { message: string, data: JoinRequest }
 */
const CreaterequestToJoinTeam = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { teamCode, job } = req.body;

  // 1) Validate required fields
  if (!teamCode) {
    return next(new ApiError('Team code is required', 400));
  }
  if (!job) {
    return next(new ApiError('Job role is required', 400));
  }

  // 2) Find team and check if exists
  const team = await Team.findOne({ teamCode });
  if (!team) {
    return next(new ApiError(`Team not found for this code ${teamCode}`, 404));
  }

  // 3) Check if user is already a member of the team
  const isAlreadyMember = team.members.some(member =>
    member.user.equals(userId)
  );
  if (isAlreadyMember) {
    return next(new ApiError('You are already a member of this team', 400));
  }

  // 4) Check for existing requests
  const existingRequest = await JoinRequest.findOne({
    user: userId,
    team: team._id,
  }).select('status');

  if (existingRequest) {
    switch (existingRequest.status) {
      case 'pending':
        return next(
          new ApiError('You already have a pending join request', 400)
        );
      case 'accepted':
        return next(new ApiError('You are already accepted in this team', 400));
      case 'rejected':
        // If request was rejected before, allow to create new request
        await JoinRequest.findByIdAndDelete(existingRequest._id);
        break;
      default:
        // Invalid status, delete the request and allow to create new one
        await JoinRequest.findByIdAndDelete(existingRequest._id);
        break;
    }
  }

  // 5) Create new join request
  const joinRequest = await JoinRequest.create({
    user: userId,
    team: team._id,
    job,
    status: 'pending',
    requestedAt: Date.now(),
  });

  // 6) Get populated request for response
  const populatedRequest = await JoinRequest.findById(joinRequest._id)
    .select('-__v -updatedAt')
    .populate('user', 'name email')
    .populate('team', 'name teamCode');

  res.status(201).json({
    status: 'success',
    message: 'Join request sent successfully',
    data: populatedRequest,
  });
});

/**
 * @desc    Get all join requests
 * @route   GET /api/v1/teams/requests
 * @access  Private
 * @returns {
 *   status: string,
 *   data: {
 *     pending: { count: number, requests: Array },
 *     rejected: { count: number, requests: Array },
 *     accepted: { count: number, requests: Array }
 *   }
 * }
 */
const getJoinRequests = asyncHandler(async (req, res, next) => {
  // Build query based on user role
  const query = {};

  if (req.user.createdTeam) {
    // If user is a team leader, get all requests for their team
    query.team = req.user.createdTeam._id;
  } else {
    // If user is a regular user, get only their requests
    query.user = req.user._id;
  }

  // Get all requests with populated data
  const requests = await JoinRequest.find(query)
    .select('-__v -createdAt -updatedAt')
    .populate('user', 'name email profileImage')
    .populate('team', 'name teamCode')
    .sort({ createdAt: -1 });

  // Group requests by status
  const groupedRequests = {
    pending: requests.filter(request => request.status === 'pending'),
    rejected: requests.filter(request => request.status === 'rejected'),
    accepted: requests.filter(request => request.status === 'accepted'),
  };

  res.status(200).json({
    status: 'success',
    data: {
      pending: {
        count: groupedRequests.pending.length,
        requests: groupedRequests.pending,
      },
      rejected: {
        count: groupedRequests.rejected.length,
        requests: groupedRequests.rejected,
      },
      accepted: {
        count: groupedRequests.accepted.length,
        requests: groupedRequests.accepted,
      },
    },
  });
});

/**
 * @desc    Get a specific join request by ID
 * @route   GET /api/v1/teams/requests/:id
 * @access  Private
 * @param   {string} id - Join request ID
 * @returns { message: string, data: JoinRequest }
 */
const getSpecificJoinRequest = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const request = await JoinRequest.findById(id).populate({
    path: 'user',
    select: 'name email profileImage',
  });
  if (!request) {
    return next(new ApiError(`There isnt any request for this ${id}`, 404));
  }
  res.status(200).json({
    message: 'success',
    data: request,
  });
});

/**
 * @desc    Accept a join request
 * @route   PATCH /api/v1/teams/requests/:id/accept
 * @access  Private/Team Leader
 * @param   {string} id - Join request ID
 * @returns {
 *   status: string,
 *   message: string,
 *   data: {
 *     request: Object,
 *     team: Object,
 *     user: Object
 *   }
 * }
 */
const acceptJoinRequest = asyncHandler(async (req, res, next) => {
  const request = req.joinRequest;

  // Early authorization check
  if (!request.team._id.equals(req.user.createdTeam._id)) {
    return next(
      new ApiError('You are not authorized to accept this request', 403)
    );
  }

  request.status = 'accepted';
  request.responseAt = Date.now();
  request.responseBy = req.user._id;
  await request.save();

  const team = await Team.findById(request.team._id);
  await team.addMember(request.user._id, request.job);

  const user = await User.findById(request.user._id);
  await user.addTeam(request.team._id);

  const populatedRequest = await JoinRequest.findById(request._id)
    .select('-__v -createdAt -updatedAt')
    .populate('responseBy', 'name role')
    .populate('user', 'name');

  res.status(200).json({
    message: 'success',
    data: {
      id: populatedRequest._id,
      name: populatedRequest.user.name,
      status: populatedRequest.status,
      job: populatedRequest.job,
      requestedAt: populatedRequest.requestedAt,
      responseAt: populatedRequest.responseAt,
      responseBy: populatedRequest.responseBy,
    },
  });
});

/**
 * @desc    Reject a join request
 * @route   PATCH /api/v1/teams/requests/:id/reject
 * @access  Private/Team Leader
 * @param   {string} id - Join request ID
 * @returns { message: string }
 */
const rejectJoinRequest = asyncHandler(async (req, res, next) => {
  const request = req.joinRequest;

  if (!request.team._id.equals(req.user.createdTeam._id)) {
    return next(
      new ApiError('You are not authorized to reject this request', 403)
    );
  }

  request.status = 'rejected';
  request.responseAt = Date.now();
  request.responseBy = req.user._id;
  await request.save();

  res.status(200).json({
    message: 'success',
  });
});

/**
 * @desc    Delete a join request
 * @route   DELETE /api/v1/teams/requests/:id
 * @access  Private/Team Leader
 * @param   {string} id - Join request ID
 * @returns { message: string }
 */
const deleteJoinRequest = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // 1) Get the request
  const request = await JoinRequest.findById(id).populate({
    path: 'user',
    select: 'name email profileImage',
  });
  if (!request) {
    return next(new ApiError('Join request not found', 404));
  }

  // 2) Check if user is team leader
  if (!request.team.equals(req.user.createdTeam._id)) {
    return next(
      new ApiError('You are not authorized to delete this request', 403)
    );
  }

  // 3) Delete the request
  await JoinRequest.findByIdAndDelete(id);

  res.status(204).json({
    message: 'success',
  });
});

export {
  CreaterequestToJoinTeam,
  getJoinRequests,
  getSpecificJoinRequest,
  acceptJoinRequest,
  rejectJoinRequest,
  deleteJoinRequest,
};
