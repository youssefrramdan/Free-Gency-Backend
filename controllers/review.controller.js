import asyncHandler from 'express-async-handler';
import Review from '../models/review.model.js';
import User from '../models/user.model.js';
import Projects from '../models/projects.model.js';
import Team from '../models/team.model.js';
import ApiError from '../utils/apiError.js';

// Create a new review
export const createReview = asyncHandler(async (req, res, next) => {
  const { rating, review, ratedUser, ratedProject, ratedTeam } = req.body;
  const ratedBy = req.user._id;

  // Validate that only one type of review is provided
  const reviewTypes = [ratedUser, ratedProject, ratedTeam].filter(Boolean);
  if (reviewTypes.length !== 1) {
    return next(
      new ApiError(
        'Review must be for either a user, project, or team, but not multiple',
        400
      )
    );
  }

  // Create the review
  const newReview = await Review.create({
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
    user.ratings.push(newReview._id);
    await user.save();
    await user.updateAverageRating();
  } else if (ratedProject) {
    const project = await Projects.findById(ratedProject);
    if (!project) return next(new ApiError('Project not found', 404));
    project.ratings.push(newReview._id);
    await project.save();
    await project.updateAverageRating();
  } else if (ratedTeam) {
    const team = await Team.findById(ratedTeam);
    if (!team) return next(new ApiError('Team not found', 404));
    team.ratings.push(newReview._id);
    await team.save();
    await team.updateAverageRating();
  }

  res.status(201).json({
    status: 'success',
    data: newReview,
  });
});

// Get reviews for a specific user
export const getUserReviews = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;

  const reviews = await Review.find({ ratedUser: userId })
    .populate('ratedBy', 'name profileImage')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: reviews,
  });
});

// Get reviews for a specific project
export const getProjectReviews = asyncHandler(async (req, res, next) => {
  const { projectId } = req.params;

  const reviews = await Review.find({ ratedProject: projectId })
    .populate('ratedBy', 'name profileImage')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: reviews,
  });
});

// Get reviews for a specific team
export const getTeamReviews = asyncHandler(async (req, res, next) => {
  const { teamId } = req.params;

  const reviews = await Review.find({ ratedTeam: teamId })
    .populate('ratedBy', 'name profileImage')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: reviews,
  });
});

// Get reviews by ID (works for user, project, or team)
export const getReviewsById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Try to find reviews for each entity type
  const userReviews = await Review.find({ ratedUser: id })
    .populate('ratedBy', 'name profileImage')
    .sort('-createdAt');

  const projectReviews = await Review.find({ ratedProject: id })
    .populate('ratedBy', 'name profileImage')
    .sort('-createdAt');

  const teamReviews = await Review.find({ ratedTeam: id })
    .populate('ratedBy', 'name profileImage')
    .sort('-createdAt');

  // Combine all reviews
  const reviews = [...userReviews, ...projectReviews, ...teamReviews];

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: reviews,
  });
});

// Update a review
export const updateReview = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { rating, review } = req.body;

  const existingReview = await Review.findById(id);
  if (!existingReview) {
    return next(new ApiError('Review not found', 404));
  }

  // Check if the user is the one who created the review
  if (existingReview.ratedBy.toString() !== req.user._id.toString()) {
    return next(
      new ApiError('You are not authorized to update this review', 403)
    );
  }

  const updatedReview = await Review.findByIdAndUpdate(
    id,
    { rating, review },
    { new: true, runValidators: true }
  );

  // Update the average rating of the rated entity
  if (updatedReview.ratedUser) {
    const user = await User.findById(updatedReview.ratedUser);
    await user.updateAverageRating();
  } else if (updatedReview.ratedProject) {
    const project = await Projects.findById(updatedReview.ratedProject);
    await project.updateAverageRating();
  } else if (updatedReview.ratedTeam) {
    const team = await Team.findById(updatedReview.ratedTeam);
    await team.updateAverageRating();
  }

  res.status(200).json({
    status: 'success',
    data: updatedReview,
  });
});

// Delete a review
export const deleteReview = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const review = await Review.findById(id);
  if (!review) {
    return next(new ApiError('Review not found', 404));
  }

  // Check if the user is the one who created the review
  if (review.ratedBy.toString() !== req.user._id.toString()) {
    return next(
      new ApiError('You are not authorized to delete this review', 403)
    );
  }

  // Remove the review from the rated entity
  if (review.ratedUser) {
    const user = await User.findById(review.ratedUser);
    user.ratings = user.ratings.filter(r => r.toString() !== id);
    await user.save();
    await user.updateAverageRating();
  } else if (review.ratedProject) {
    const project = await Projects.findById(review.ratedProject);
    project.ratings = project.ratings.filter(r => r.toString() !== id);
    await project.save();
    await project.updateAverageRating();
  } else if (review.ratedTeam) {
    const team = await Team.findById(review.ratedTeam);
    team.ratings = team.ratings.filter(r => r.toString() !== id);
    await team.save();
    await team.updateAverageRating();
  }

  await Review.findByIdAndDelete(id);

  res.status(204).json({
    status: 'success',
  });
});
