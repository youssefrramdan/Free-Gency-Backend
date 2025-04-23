import asyncHandler from 'express-async-handler';
import PortfolioProject from '../models/portfolioProject.model.js';
import Team from '../models/team.model.js';

// Create a new portfolio project
export const createPortfolioProject = asyncHandler(async (req, res, next) => {
  const { teamId } = req.params;

  // Check if team exists
  const team = await Team.findById(teamId);
  if (!team) {
    return next(new AppError('Team not found', 404));
  }

  // Check if user is team leader
  if (team.teamLeader.toString() !== req.user._id.toString()) {
    return next(
      new AppError('Only team leader can add portfolio projects', 403)
    );
  }

  // Create portfolio project
  const portfolioProject = await PortfolioProject.create({
    ...req.body,
    team: teamId,
  });

  // Add portfolio project to team
  team.portfolioProjects.push(portfolioProject._id);
  await team.save();

  res.status(201).json({
    status: 'success',
    data: {
      portfolioProject,
    },
  });
});

// Get all portfolio projects
export const getAllPortfolioProjects = asyncHandler(async (req, res, next) => {
  const portfolioProjects = await PortfolioProject.find()
    .populate('team', 'name logo')
    .populate('category', 'name');

  res.status(200).json({
    status: 'success',
    results: portfolioProjects.length,
    data: {
      portfolioProjects,
    },
  });
});

// Get portfolio projects by team
export const getTeamPortfolioProjects = asyncHandler(async (req, res, next) => {
  const { teamId } = req.params;

  // Check if team exists
  const team = await Team.findById(teamId);
  if (!team) {
    return next(new AppError('Team not found', 404));
  }

  const portfolioProjects = await PortfolioProject.find({
    team: teamId,
  }).populate('category', 'name');

  res.status(200).json({
    status: 'success',
    results: portfolioProjects.length,
    data: {
      portfolioProjects,
    },
  });
});

// Get a single portfolio project
export const getPortfolioProject = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const portfolioProject = await PortfolioProject.findById(id)
    .populate('team', 'name logo')
    .populate('category', 'name');

  if (!portfolioProject) {
    return next(new AppError('Portfolio project not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      portfolioProject,
    },
  });
});

// Update a portfolio project
export const updatePortfolioProject = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const portfolioProject = await PortfolioProject.findById(id);

  if (!portfolioProject) {
    return next(new AppError('Portfolio project not found', 404));
  }

  // Check if user is team leader
  const team = await Team.findById(portfolioProject.team);
  if (team.teamLeader.toString() !== req.user._id.toString()) {
    return next(
      new AppError('Only team leader can update portfolio projects', 403)
    );
  }

  const updatedPortfolioProject = await PortfolioProject.findByIdAndUpdate(
    id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    status: 'success',
    data: {
      portfolioProject: updatedPortfolioProject,
    },
  });
});

// Delete a portfolio project
export const deletePortfolioProject = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const portfolioProject = await PortfolioProject.findById(id);

  if (!portfolioProject) {
    return next(new AppError('Portfolio project not found', 404));
  }

  // Check if user is team leader
  const team = await Team.findById(portfolioProject.team);
  if (team.teamLeader.toString() !== req.user._id.toString()) {
    return next(
      new AppError('Only team leader can delete portfolio projects', 403)
    );
  }

  // Remove portfolio project from team
  team.portfolioProjects = team.portfolioProjects.filter(
    projectId => projectId.toString() !== id
  );
  await team.save();

  // Delete portfolio project
  await PortfolioProject.findByIdAndDelete(id);

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
