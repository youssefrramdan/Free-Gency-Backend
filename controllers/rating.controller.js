import asyncHandler from 'express-async-handler';
import Rating from '../models/rating.model.js';
import User from '../models/user.model.js';
import Projects from '../models/projects.model.js';
import Team from '../models/team.model.js';
import ApiError from '../utils/apiError.js';

// Create a new rating
export const createRating = asyncHandler(async (req, res, next) => {
  const { rating, review, ratedUser, ratedProject, ratedTeam } = req.body;
  const ratedBy = req.user._id;

  // Validate that only one type of rating is provided
  const ratingTypes = [ratedUser, ratedProject, ratedTeam].filter(Boolean);
  if (ratingTypes.length !== 1) {
    return next(
      new ApiError(
        'Rating must be for either a user, project, or team, but not multiple',
        400
      )
    );
  }

  // Create the rating
  const newRating = await Rating.create({
    rating,
    review,
    ratedBy,
    ratedUser,
    ratedProject,
    ratedTeam,
  });

  // Update the rated entity's average rating
  if (ratedUser) {
    const user = await User.findById(ratedUser);
    if (!user) return next(new ApiError('User not found', 404));
    user.ratings.push(newRating._id);
    await user.save();
    await user.updateAverageRating();
  } else if (ratedProject) {
    const project = await Projects.findById(ratedProject);
    if (!project) return next(new ApiError('Project not found', 404));
    project.ratings.push(newRating._id);
    await project.save();
    await project.updateAverageRating();
  } else if (ratedTeam) {
    const team = await Team.findById(ratedTeam);
    if (!team) return next(new ApiError('Team not found', 404));
    team.ratings.push(newRating._id);
    await team.save();
    await team.updateAverageRating();
  }

  res.status(201).json({
    status: 'success',
    data: newRating,
  });
});

// Get ratings for a specific user
export const getUserRatings = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;

  const ratings = await Rating.find({ ratedUser: userId })
    .populate('ratedBy', 'name profileImage')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: ratings.length,
    data: ratings,
  });
});

// Get ratings for a specific project
export const getProjectRatings = asyncHandler(async (req, res, next) => {
  const { projectId } = req.params;

  const ratings = await Rating.find({ ratedProject: projectId })
    .populate('ratedBy', 'name profileImage')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: ratings.length,
    data: ratings,
  });
});

// Get ratings for a specific team
export const getTeamRatings = asyncHandler(async (req, res, next) => {
  const { teamId } = req.params;

  const ratings = await Rating.find({ ratedTeam: teamId })
    .populate('ratedBy', 'name profileImage')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: ratings.length,
    data: ratings,
  });
});

// Update a rating
export const updateRating = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { rating, review } = req.body;

  const existingRating = await Rating.findById(id);
  if (!existingRating) {
    return next(new ApiError('Rating not found', 404));
  }

  // Check if the user is the one who created the rating
  if (existingRating.ratedBy.toString() !== req.user._id.toString()) {
    return next(
      new ApiError('You are not authorized to update this rating', 403)
    );
  }

  const updatedRating = await Rating.findByIdAndUpdate(
    id,
    { rating, review },
    { new: true, runValidators: true }
  );

  // Update the average rating of the rated entity
  if (updatedRating.ratedUser) {
    const user = await User.findById(updatedRating.ratedUser);
    await user.updateAverageRating();
  } else if (updatedRating.ratedProject) {
    const project = await Projects.findById(updatedRating.ratedProject);
    await project.updateAverageRating();
  } else if (updatedRating.ratedTeam) {
    const team = await Team.findById(updatedRating.ratedTeam);
    await team.updateAverageRating();
  }

  res.status(200).json({
    status: 'success',
    data: updatedRating,
  });
});

// Delete a rating
export const deleteRating = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const rating = await Rating.findById(id);
  if (!rating) {
    return next(new ApiError('Rating not found', 404));
  }

  // Check if the user is the one who created the rating
  if (rating.ratedBy.toString() !== req.user._id.toString()) {
    return next(
      new ApiError('You are not authorized to delete this rating', 403)
    );
  }

  // Remove the rating from the rated entity
  if (rating.ratedUser) {
    const user = await User.findById(rating.ratedUser);
    user.ratings = user.ratings.filter(r => r.toString() !== id);
    await user.save();
    await user.updateAverageRating();
  } else if (rating.ratedProject) {
    const project = await Projects.findById(rating.ratedProject);
    project.ratings = project.ratings.filter(r => r.toString() !== id);
    await project.save();
    await project.updateAverageRating();
  } else if (rating.ratedTeam) {
    const team = await Team.findById(rating.ratedTeam);
    team.ratings = team.ratings.filter(r => r.toString() !== id);
    await team.save();
    await team.updateAverageRating();
  }

  await Rating.findByIdAndDelete(id);

  res.status(204).json({
    status: 'success',
  });
});
