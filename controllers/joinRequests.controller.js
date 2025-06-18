import asyncHandler from 'express-async-handler';
import Team from '../models/team.model.js';
import JoinRequest from '../models/JoinRequest.model.js';
import ApiError from '../utils/apiError.js';
import User from '../models/user.model.js';
import NotificationService from '../service/NotificationService.js';
// ==========================================
// Authorization helper
// ==========================================
const canManageJoinRequest = async (userId, teamId) => {
  const team = await Team.findById(teamId);
  if (!team) {
    throw new ApiError('Team not found', 404);
  }
  const isOwner = team.teamLeader.toString() === userId.toString();
  const isLeaderInMembers = team.members.some(
    member =>
      member.user.toString() === userId.toString() &&
      member.role === 'teamLeader'
  );
  if (!isOwner && !isLeaderInMembers) {
    throw new ApiError('You are not authorized to manage this request', 403);
  }
  return team;
};

// ==========================================
// Create Join Request
// ==========================================
const CreaterequestToJoinTeam = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { teamCode, job } = req.body;

  if (!teamCode) return next(new ApiError('Team code is required', 400));
  if (!job) return next(new ApiError('Job role is required', 400));

  const team = await Team.findOne({ teamCode });
  if (!team)
    return next(new ApiError(`Team not found for code ${teamCode}`, 404));

  const isAlreadyMember = team.members.some(member =>
    member.user.equals(userId)
  );
  if (isAlreadyMember)
    return next(new ApiError('Already a member of this team', 400));

  const existingRequest = await JoinRequest.findOne({
    user: userId,
    team: team._id,
  }).select('status');
  if (existingRequest) {
    switch (existingRequest.status) {
      case 'pending':
        return next(new ApiError('Pending request already exists', 400));
      case 'accepted':
        return next(new ApiError('Already accepted in this team', 400));
      case 'rejected':
      default:
        await JoinRequest.findByIdAndDelete(existingRequest._id);
        break;
    }
  }

  const joinRequest = await JoinRequest.create({
    user: userId,
    team: team._id,
    job,
    status: 'pending',
    requestedAt: Date.now(),
  });

  const teamLeader = await User.findById(team.teamLeader).select('fcmToken');
  if (teamLeader) {
    await NotificationService.sendJoinTeamNotifications(
      team.teamLeader,
      'New Join Request',
      'New join request received',
      team.logo,
      'joinTeam',
      `/teams/${team._id}/requests`,
      {
        data: joinRequest._id,
      }
    );
  }

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

// ==========================================
// Get Join Requests
// ==========================================
const getJoinRequests = asyncHandler(async (req, res, next) => {
  const team = await Team.findOne({
    $or: [
      { teamLeader: req.user._id },
      { members: { $elemMatch: { user: req.user._id, role: 'teamLeader' } } },
    ],
  });

  const query = team ? { team: team._id } : { user: req.user._id };

  const requests = await JoinRequest.find(query)
    .select('-__v -createdAt -updatedAt')
    .populate('user', 'name email profileImage')
    .populate('team', 'name teamCode')
    .sort({ createdAt: -1 });

  const grouped = { pending: [], accepted: [], rejected: [] };
  requests.forEach(r => {
    grouped[r.status]?.push(r);
  });

  res.status(200).json({
    status: 'success',
    data: {
      pending: { count: grouped.pending.length, requests: grouped.pending },
      accepted: { count: grouped.accepted.length, requests: grouped.accepted },
      rejected: { count: grouped.rejected.length, requests: grouped.rejected },
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
  const request = await JoinRequest.findById(id).populate(
    'user',
    'name email profileImage'
  );
  if (!request)
    return next(new ApiError(`No request found with ID ${id}`, 404));

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
  const team = await canManageJoinRequest(req.user._id, request.team._id);

  request.status = 'accepted';
  request.responseAt = Date.now();
  request.responseBy = req.user._id;
  await request.save();

  await team.addMember(request.user._id, request.job);
  const user = await User.findById(request.user._id);
  await user.addTeam(team._id);

  // Send notification to user about join request acceptance
  await NotificationService.sendJoinRequestAcceptedNotification(
    request.user._id,
    team.name,
    team.logo,
    `/teams/${team._id}`,
    {
      teamId: team._id.toString(),
      requestId: request._id.toString(),
    }
  );
  

  const populatedRequest = await JoinRequest.findById(request._id)
    .select('-__v -createdAt -updatedAt')
    .populate('responseBy', 'name role')
    .populate('user', 'name');

  res.status(200).json({
    message: 'success',
    data: {
      _id: populatedRequest._id,
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
  await canManageJoinRequest(req.user._id, request.team._id);

  request.status = 'rejected';
  request.responseAt = Date.now();
  request.responseBy = req.user._id;
  await request.save();

  res.status(200).json({ message: 'success' });
});

const deleteJoinRequest = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const request = await JoinRequest.findById(id).populate(
    'user',
    'name email profileImage'
  );

  if (!request) return next(new ApiError('Join request not found', 404));
  await canManageJoinRequest(req.user._id, request.team);
  await JoinRequest.findByIdAndDelete(id);

  res.status(204).json({ message: 'success' });
});

export {
  CreaterequestToJoinTeam,
  getJoinRequests,
  getSpecificJoinRequest,
  acceptJoinRequest,
  rejectJoinRequest,
  deleteJoinRequest,
};
