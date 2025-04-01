import asyncHandler from 'express-async-handler';
import Team from '../models/team.model.js';
import JoinRequest from '../models/JoinRequest.model.js';
import ApiError from '../utils/apiError.js';
import User from '../models/user.model.js';

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
 * @desc    Get all join requests for a team
 * @route   GET /api/v1/join-requests/team
 * @access  Private/Team Leader
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

const getSpecificJoinRequest = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const request = await JoinRequest.findById(id);
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
 * @route   PATCH /api/v1/join-requests/:requestId/accept
 * @access  Private/Team Leader
 */
const acceptJoinRequest = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // 1) Get the request
  const request = await JoinRequest.findById(id);

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
  request.status = 'accepted';
  request.responseAt = Date.now();
  request.responseBy = req.user._id;
  await request.save();

  // 5) Update team members
  const team = await Team.findById(request.team);
  if (!team) {
    return next(new ApiError('Team not found', 404));
  }

  team.members.push({
    user: request.user,
    role: 'Team_member',
    job: request.job,
    joinedAt: Date.now(),
  });
  await team.save();

  // 6) Update user's teams
  const user = await User.findById(request.user);
  if (!user) {
    return next(new ApiError('User not found', 404));
  }

  user.teams.push(request.team);
  await user.save();

  // 7) Send response
  const populatedRequest = await JoinRequest.findById(request._id)
    .select('-__v -createdAt -updatedAt')
    .populate('responseBy', 'name role');

  res.status(200).json({
    status: 'success',
    message: 'Join request accepted successfully',
    data: {
      request: populatedRequest,
      team: {
        id: team._id,
        name: team.name,
      },
      user: {
        id: user._id,
        name: user.name,
      },
    },
  });
});

const rejectJoinRequest = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // 1) Get the request
  const request = await JoinRequest.findById(id);

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
 */
const deleteJoinRequest = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // 1) Get the request
  const request = await JoinRequest.findById(id);
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
    status: 'success',
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
