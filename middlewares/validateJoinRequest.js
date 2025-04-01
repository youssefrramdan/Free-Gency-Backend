import asyncHandler from 'express-async-handler';
import Team from '../models/team.model.js';
import JoinRequest from '../models/JoinRequest.model.js';
import ApiError from '../utils/apiError.js';

/**
 * Middleware to validate join request before accept/reject operations
 * Checks if request exists, user exists, team exists, and request is pending
 */
const validateJoinRequest = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // 1) Get the request and populate necessary fields
  const request = await JoinRequest.findById(id)
    .populate('user', '_id name')
    .populate('team', '_id name');

  if (!request) {
    return next(new ApiError('Join request not found', 404));
  }

  // 2) Check if user still exists
  if (!request.user) {
    await JoinRequest.findByIdAndDelete(id);
    return next(new ApiError('User no longer exists', 400));
  }

  // 3) Check if team still exists
  if (!request.team) {
    await JoinRequest.findByIdAndDelete(id);
    return next(new ApiError('Team no longer exists', 400));
  }

  // 4) Check if request is pending
  if (request.status !== 'pending') {
    return next(new ApiError('This request is not pending', 400));
  }

  // 5) Check if user is already a team member
  const team = await Team.findById(request.team._id);
  const isAlreadyMember = team.members.some(member =>
    member.user.equals(request.user._id)
  );
  if (isAlreadyMember) {
    await JoinRequest.findByIdAndDelete(id);
    return next(new ApiError('User is already a member of this team', 400));
  }

  // If all validations pass, attach the request to req object for later use
  req.joinRequest = request;
  next();
});

export default validateJoinRequest;
