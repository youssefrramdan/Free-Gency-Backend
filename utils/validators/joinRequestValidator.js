import { check } from 'express-validator';
import asyncHandler from 'express-async-handler';
import validatorMiddleware from '../../middlewares/validatorMiddleware.js';
import Team from '../../models/team.model.js';
import JoinRequest from '../../models/JoinRequest.model.js';
import User from '../../models/user.model.js';
import ApiError from '../apiError.js';

/**
 * @desc    Validate create join request
 */
const createJoinRequestValidator = [
  check('teamCode')
    .notEmpty()
    .withMessage('Team code is required')
    .custom(
      asyncHandler(async val => {
        const team = await Team.findOne({ teamCode: val });
        if (!team) {
          throw new Error(`Team not found for this code ${val}`);
        }
        return true;
      })
    ),
  check('job')
    .notEmpty()
    .withMessage('Job is required')
    .isString()
    .withMessage('Job must be a string'),
  validatorMiddleware,
];

/**
 * @desc    Validate join request ID
 */
const joinRequestIdValidator = [
  check('id')
    .notEmpty()
    .withMessage('Join request ID is required')
    .isMongoId()
    .withMessage('Invalid join request ID format')
    .custom(
      asyncHandler(async val => {
        const request = await JoinRequest.findById(val);
        if (!request) {
          throw new Error('Join request not found');
        }
        return true;
      })
    ),
  validatorMiddleware,
];

/**
 * @desc    Validate team leader permission
 */
const teamLeaderPermissionValidator = [
  check('id')
    .notEmpty()
    .withMessage('Join request ID is required')
    .isMongoId()
    .withMessage('Invalid join request ID format')
    .custom(
      asyncHandler(async (val, { req }) => {
        const request = await JoinRequest.findById(val);
        if (!request) {
          throw new Error('Join request not found');
        }
        if (!request.team.equals(req.user.createdTeam._id)) {
          throw new Error('You are not authorized to handle this request');
        }
        return true;
      })
    ),
  validatorMiddleware,
];

/**
 * @desc    Validate request status is pending
 */
const pendingRequestValidator = [
  check('id')
    .notEmpty()
    .withMessage('Join request ID is required')
    .isMongoId()
    .withMessage('Invalid join request ID format')
    .custom(
      asyncHandler(async val => {
        const request = await JoinRequest.findById(val);
        if (!request) {
          throw new Error('Join request not found');
        }
        if (request.status !== 'pending') {
          throw new Error('This request is not pending');
        }
        return true;
      })
    ),
  validatorMiddleware,
];

/**
 * @desc    Validate existing join request
 * @param   {string} userId - User ID
 * @param   {string} teamId - Team ID
 * @returns {Promise<JoinRequest|null>} Join request if exists
 * @throws  {ApiError} If request already exists or user is already in team
 */
export const validateExistingRequest = async (userId, teamId) => {
  const existingRequest = await JoinRequest.findOne({
    user: userId,
    team: teamId,
  });

  if (existingRequest) {
    if (existingRequest.status === 'pending') {
      throw new ApiError('Join request already sent', 400);
    }
    if (existingRequest.status === 'accepted') {
      throw new ApiError('You are already in this Team', 400);
    }
  }

  return existingRequest;
};

/**
 * @desc    Validate join request exists and user has permission
 * @param   {string} requestId - Join request ID
 * @param   {string} userId - User ID (team leader)
 * @returns {Promise<JoinRequest>} Join request if found and authorized
 * @throws  {ApiError} If request not found or user not authorized
 */
export const validateRequestAndPermission = async (requestId, userId) => {
  const request = await JoinRequest.findById(requestId);
  if (!request) {
    throw new ApiError('Join request not found', 404);
  }

  const team = await Team.findOne({ createdBy: userId });
  if (!team) {
    throw new ApiError('You do not have a team', 404);
  }

  if (!request.team.equals(team._id)) {
    throw new ApiError('You are not authorized to handle this request', 403);
  }

  return request;
};

/**
 * @desc    Validate request status is pending
 * @param   {JoinRequest} request - Join request object
 * @throws  {ApiError} If request is not pending
 */
export const validateRequestStatus = request => {
  if (request.status !== 'pending') {
    throw new ApiError('This request is not pending', 400);
  }
};

/**
 * @desc    Validate user exists
 * @param   {string} userId - User ID
 * @returns {Promise<User>} User object if found
 * @throws  {ApiError} If user not found
 */
export const validateUserExists = async userId => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError('User not found', 404);
  }
  return user;
};

/**
 * @desc    Validate team exists
 * @param   {string} teamId - Team ID
 * @returns {Promise<Team>} Team object if found
 * @throws  {ApiError} If team not found
 */
export const validateTeamExists = async teamId => {
  const team = await Team.findById(teamId);
  if (!team) {
    throw new ApiError('Team not found', 404);
  }
  return team;
};

export {
  createJoinRequestValidator,
  joinRequestIdValidator,
  teamLeaderPermissionValidator,
  pendingRequestValidator,
};
