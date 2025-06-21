import asyncHandler from 'express-async-handler';
import User from '../models/user.model.js';
import sendEmail from '../utils/sendEmail.js';
import emailTemplate from '../utils/emailTemplate.js';
import generateToken from '../utils/Token.js';
import ApiError from '../utils/apiError.js';

/**
 * @desc    Create new user
 * @route   POST /api/v1/users
 * @access  Private/Admin
 */
const createUser = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return next(new ApiError('Email is already in use', 400));
  }

  const user = await User.create(req.body);
  sendEmail({
    email: req.body.email,
    subject: 'Verification Email',
    html: emailTemplate(generateToken(email)),
  });

  res.status(201).json({
    message: 'success',
    user,
  });
});

/**
 * @desc    Get specific user by id
 * @route   GET /api/v1/users/:id
 * @access  Private
 */
const getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).populate({
    path: 'interests',
    select: 'name image status',
  });
  if (!user) {
    return next(new Error('User not found', 404));
  }
  res.status(200).json({
    message: 'success',
    user,
  });
});

/**
 * @desc    Get all users
 * @route   GET /api/v1/users
 * @access  Private/Admin
 */
const getAllUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find().populate({
    path: 'interests',
    select: 'name image status',
  });
  res.status(200).json({
    message: 'success',
    users,
  });
});

/**
 * @desc    Update specific user
 * @route   PUT /api/v1/users/:id
 * @access  Private
 */
const updateUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!user) {
    return next(new ApiError(`There is no user with ID ${id}`, 404));
  }

  res.status(200).json({ message: 'success', user: user });
});

/**
 * @desc    Delete specific user
 * @route   DELETE /api/v1/users/:id
 * @access  Private/Admin
 */
const deleteUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findByIdAndDelete(id);

  if (!user) {
    return next(new ApiError(`There isn't a user for this ${id}`, 404));
  }

  res.status(200).json({ message: 'success', user: user });
});

/**
 * @desc    Get current logged in user
 * @route   GET /api/v1/users/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id)
    .populate({
      path: 'interests',
      select: 'name image status',
    })
    .select('-password -passwordChangedAt');
  res.status(200).json({
    message: 'success',
    user,
  });
});

/**
 * @desc    Update current logged in user
 * @route   PUT /api/v1/users/me
 * @access  Private
 */
const updateMe = asyncHandler(async (req, res, next) => {
  // First find the user to verify current state
  const currentUser = await User.findById(req.user._id);
  if (!currentUser) {
    return next(new ApiError('User not found', 404));
  }
  const user = await User.findByIdAndUpdate(req.user._id, req.body, {
    new: true,
    runValidators: true,
  })
    .select('-password -__v -createdAt -updatedAt')
    .populate({
      path: 'interests',
      select: 'name image status',
    });

  res.status(200).json({
    message: 'success',
    user,
  });
});

const uploadUserImage = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new ApiError('please upload imageCover', 404));
  }
  req.body.profileImage = req.file.path;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { profileImage: req.body.profileImage },
    { new: true, runValidators: true }
  );
  res.status(200).json({
    message: 'success',
    user,
  });
});

/**
 * @desc    Change current user password
 * @route   PATCH /api/v1/users/changePassword
 * @access  Private
 */
const changeMyPassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, password } = req.body;

  // 1) Get user from database
  const user = await User.findById(req.user._id).select('+password');

  // 2) Check if current password is correct
  const isPasswordCorrect = await user.comparePassword(currentPassword);
  if (!isPasswordCorrect) {
    return next(new ApiError('Current password is incorrect', 401));
  }

  // 3) Update password
  user.password = password;
  user.passwordChangedAt = Date.now();
  await user.save();

  // 4) Generate token
  const token = generateToken(user._id);

  // 5) Return response
  res.status(200).json({
    message: 'Password changed successfully',
    token,
  });
});

/**
 * @desc    Change password for specific user (Admin only)
 * @route   PATCH /api/v1/users/changePassword/:id
 * @access  Private/Admin
 */
const changeUserPassword = asyncHandler(async (req, res, next) => {
  const { password } = req.body;
  const { id } = req.params;

  // 1) Get user from database
  const user = await User.findById(id);
  if (!user) {
    return next(new ApiError(`User with ID ${id} not found`, 404));
  }

  // 2) Update password
  user.password = password;
  user.passwordChangedAt = Date.now();
  await user.save();

  // 3) Return response
  res.status(200).json({
    message: 'Password changed successfully',
  });
});

export {
  createUser,
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  getMe,
  updateMe,
  uploadUserImage,
  changeMyPassword,
  changeUserPassword,
};
