import asyncHandler from 'express-async-handler';
import Team from '../models/team.model.js';
import JoinRequest from '../models/JoinRequest.model.js';
import ApiError from '../utils/apiError.js';

/**
 * @desc    Create a new request to join a team
 * @route   POST /api/v1/teams/join
 * @access  Private
 * @body    { teamCode: string, job: string }
 * @returns { message: string, data: JoinRequest }
 */
const CreaterequestToJoinTeam = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { teamCode } = req.body;
  const team = await Team.findOne({ teamCode });
  if (!team) {
    return next(new ApiError(`Team not found for this code ${teamCode}`, 404));
  }

  const existingRequest = await JoinRequest.findOne({
    user: userId,
    team: team._id,
  });

  if (existingRequest) {
    if (existingRequest.status === 'pending') {
      return res.status(400).json({ message: 'Join request already sent' });
    }
    if (existingRequest.status === 'accepted') {
      return res.status(400).json({ message: 'You are already in this Team' });
    }
  }

  const joinRequest = await JoinRequest.create({
    user: userId,
    team: team._id,
    job: req.body.job,
    status: 'pending',
  });

  res.status(201).json({ message: 'Join request sent', data: joinRequest });
});

/**
 * @desc    Get all join requests for the team leader's team
 * @route   GET /api/v1/teams/requests
 * @access  Private/Team Leader
 * @returns {
 *   status: string,
 *   data: {
 *     pending: { count: number, requests: Array },
 *     rejected: { count: number, requests: Array },
 *     accepted: { count: number, requests: Array }
 *   }
 * }
 */
const getAllMyTeamJoinRequests = asyncHandler(async (req, res, next) => {
  // Check if user has a team
  if (!req.user.createdTeam) {
    return next(new ApiError('You do not have a team to view requests', 404));
  }

  // Get all requests with populated user data
  const requests = await JoinRequest.find({
    team: req.user.createdTeam._id,
  })
    .select('-team -__v -createdAt -updatedAt') // Exclude unwanted fields
    .populate('user', 'name email profileImage')
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
  const { id } = req.params;

  // Populate createdTeam before using it
  await req.user.populate({
    path: 'createdTeam',
    select: '_id',
  });

  // 1) Get the request with populated data
  const request = await JoinRequest.findById(id)
    .populate('team', 'name members')
    .populate('user', 'name teams');

  if (!request) {
    return next(new ApiError('Join request not found', 404));
  }

  // 2) Early authorization check
  if (!request.team._id.equals(req.user.createdTeam._id)) {
    return next(
      new ApiError('You are not authorized to accept this request', 403)
    );
  }

  // 3) Validate request status
  if (request.status !== 'pending') {
    return next(new ApiError('This request is not pending', 400));
  }

  // 4) Check if user is already a member
  if (
    request.team.members.some(member => member.user.equals(request.user._id))
  ) {
    return next(new ApiError('User already a member of the team', 400));
  }

  // 5) Update request status
  request.status = 'accepted';
  request.responseAt = Date.now();
  request.responseBy = req.user._id;
  await request.save();

  // 6) Add user to team and update user's teams
  await request.team.addMember(request.user._id, request.job);
  await request.user.addTeam(request.team._id);

  // 7) Get final populated data for response
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
  const { id } = req.params;

  await req.user.populate({
    path: 'createdTeam',
    select: '_id',
  });

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
      new ApiError('You are not authorized to accept this request', 403)
    );
  }

  // 3) Check if request is pending
  if (request.status !== 'pending') {
    return next(new ApiError('This request is not pending', 400));
  }
  // 4) Update request status
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
  getAllMyTeamJoinRequests,
  getSpecificJoinRequest,
  acceptJoinRequest,
  rejectJoinRequest,
  deleteJoinRequest,
};
