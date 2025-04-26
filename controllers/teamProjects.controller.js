import asyncHandler from 'express-async-handler';
import ApiError from '../utils/apiError.js';
import TeamProjects from '../models/teamProjects.model.js';
import Team from '../models/team.model.js';

// ==========================================
// Authorization Helper
// ==========================================

/**
 * Checks if the current user is authorized to perform an action
 * @param {string} userId - The ID of the user to check authorization for
 * @param {string} ownerId - The ID of the resource owner
 * @param {string} action - The action being performed (for error message)
 * @returns {boolean} - Returns true if authorized, throws ApiError if not
 */
export const isAuthorized = (
  userId,
  ownerId,
  action = 'perform this action'
) => {
  if (userId.toString() !== ownerId.toString()) {
    throw new ApiError(`Not authorized to ${action}`, 403);
  }
  return true;
};

// Create a new team project
export const createTeamProject = asyncHandler(async (req, res, next) => {
  const { teamId } = req.params;

  // Check if team exists
  const team = await Team.findById(teamId);
  if (!team) {
    return next(new ApiError('Team not found', 404));
  }

  // Use isAuthorized to check if user is team leader
  isAuthorized(req.user._id, team.teamLeader, 'add team projects');

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
  const projects = await TeamProjects.find()
    .populate('team', 'name logo')
    .populate('category', 'name');

  res.status(200).json({
    status: 'success',
    results: projects.length,
    data: projects,
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

  const projects = await TeamProjects.find({
    team: teamId,
  }).populate('category', 'name');

  res.status(200).json({
    status: 'success',
    results: projects.length,
    data: projects,
  });
});

// Get a single team project
export const getTeamProject = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const project = await TeamProjects.findById(id)
    .populate('team', 'name logo')
    .populate('category', 'name');

  if (!project) {
    return next(new ApiError('Team project not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: project,
  });
});

// Update a team project
export const updateTeamProject = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const teamProject = await TeamProjects.findById(id);

  if (!teamProject) {
    return next(new ApiError('Team project not found', 404));
  }

  // Use isAuthorized to check if user is team leader
  isAuthorized(
    req.user._id,
    teamProject.team.teamLeader || teamProject.team,
    'update team projects'
  );

  const project = await TeamProjects.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: project,
  });
});

// Delete a team project
export const deleteTeamProject = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const teamProject = await TeamProjects.findById(id);

  if (!teamProject) {
    return next(new ApiError('Team project not found', 404));
  }

  // Use isAuthorized to check if user is team leader
  isAuthorized(
    req.user._id,
    teamProject.team.teamLeader || teamProject.team,
    'delete team projects'
  );

  // Remove team project from team
  const team = await Team.findById(teamProject.team);
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
