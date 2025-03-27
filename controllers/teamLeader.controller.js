import asyncHandler from 'express-async-handler';
import TeamLeader from '../models/teamLeaderModel.js';
import ApiError from '../utils/apiError.js';

/**
 * @desc    Get all users
 * @route   GET /api/v1/users
 * @access  Private
 */

const getAllTeamLeaders = asyncHandler(async (req, res, next) => {
  const users = await TeamLeader.find();
  res.status(200).json({
    message: 'success',
    results: users.length,
    users,
  });
});

const createTeamLeader = asyncHandler(async (req, res, next) => {
  const user = await TeamLeader.create(req.body);
  // send Email Verifiaction later
  user.save();
  res.status(201).json({
    message: 'success',
    user,
  });
});

const updateTeamLeader = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const user = await TeamLeader.findByIdAndUpdate({ _id: id }, req.body, {
    new: true,
    runValidators: true,
  });
  if (!user) {
    return next(new ApiError(`There is no Team Leader for this ${id}`));
  }
  res.status(200).json({
    message: 'success',
    user,
  });
});

const deleteTeamLeader = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const user = await TeamLeader.findByIdAndDelete({ _id: id }, req.body);
  if (!user) {
    return next(new ApiError(`There is no Team Leader for this ${id}`));
  }
  res.status(200).json({
    message: 'success',
    user,
  });
});
export {
  getAllTeamLeaders,
  createTeamLeader,
  updateTeamLeader,
  deleteTeamLeader,
};
