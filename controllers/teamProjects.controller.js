import asyncHandler from 'express-async-handler';
import ApiError from '../utils/apiError.js';
import TeamProjects from '../models/portfolioProject.model.js';
import Team from '../models/team.model.js';

// Create a new team project
export const createTeamProject = asyncHandler(async (req, res, next) => {
  const { teamId } = req.params;

  // Check if team exists
  const team = await Team.findById(teamId);
  if (!team) {
    return next(new ApiError('Team not found', 404));
  }

  // Check if user is team leader
  if (team.teamLeader.toString() !== req.user._id.toString()) {
    return next(new ApiError('Only team leader can add team projects', 403));
  }

  // Create team project
  const teamProject = await TeamProjects.create({
    ...req.body,
    team: teamId,
  });

  // Add team project to team
  team.teamProjects.push(teamProject._id);
  await team.save();

  res.status(201).json({
    status: 'success',
    data: {
      teamProject,
    },
  });
});

// Get all team projects
export const getAllTeamProjects = asyncHandler(async (req, res, next) => {
  const teamProjects = await TeamProjects.find()
    .populate('team', 'name logo')
    .populate('category', 'name');

  res.status(200).json({
    status: 'success',
    results: teamProjects.length,
    data: {
      teamProjects,
    },
  });
});

// Get team projects by team
export const getTeamProjects = asyncHandler(async (req, res, next) => {
  const { teamId } = req.params;

  // Check if team exists
  const team = await Team.findById(teamId);
  if (!team) {
    return next(new ApiError('Team not found', 404));
  }

  const teamProjects = await TeamProjects.find({
    team: teamId,
  }).populate('category', 'name');

  res.status(200).json({
    status: 'success',
    results: teamProjects.length,
    data: {
      teamProjects,
    },
  });
});

// Get a single team project
export const getTeamProject = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const teamProject = await TeamProjects.findById(id)
    .populate('team', 'name logo')
    .populate('category', 'name');

  if (!teamProject) {
    return next(new ApiError('Team project not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      teamProject,
    },
  });
});

// Update a team project
export const updateTeamProject = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const teamProject = await TeamProjects.findById(id);

  if (!teamProject) {
    return next(new ApiError('Team project not found', 404));
  }

  // Check if user is team leader
  const team = await Team.findById(teamProject.team);
  if (team.teamLeader.toString() !== req.user._id.toString()) {
    return next(new ApiError('Only team leader can update team projects', 403));
  }

  const updatedTeamProject = await TeamProjects.findByIdAndUpdate(
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
      teamProject: updatedTeamProject,
    },
  });
});

// Delete a team project
export const deleteTeamProject = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const teamProject = await TeamProjects.findById(id);

  if (!teamProject) {
    return next(new ApiError('Team project not found', 404));
  }

  // Check if user is team leader
  const team = await Team.findById(teamProject.team);
  if (team.teamLeader.toString() !== req.user._id.toString()) {
    return next(new ApiError('Only team leader can delete team projects', 403));
  }

  // Remove team project from team
  team.teamProjects = team.teamProjects.filter(
    projectId => projectId.toString() !== id
  );
  await team.save();

  // Delete team project
  await TeamProjects.findByIdAndDelete(id);

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
