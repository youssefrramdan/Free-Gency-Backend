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
const createProject = asyncHandler(async (req, res, next) => {
  // Check if team exists
  const team = await Team.findById(req.user.createdTeam);
  if (!team) {
    return next(new ApiError('Team not found', 404));
  }

  // Use isAuthorized to check if user is team leader
  isAuthorized(req.user._id, team.teamLeader, 'add team projects');

  // Create team project
  const teamProject = await TeamProjects.create({
    ...req.body,
    team: req.user.createdTeam,
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
const getAllMyProjects = asyncHandler(async (req, res, next) => {
  const projects = await TeamProjects.find({ team: req.user._id })
    .populate('team', 'name logo')
    .populate('category', 'name');

  res.status(200).json({
    status: 'success',
    results: projects.length,
    data: projects,
  });
});

// Middleware to create filter object for team-based or category-based filtering
const createFilterObject = (req, res, next) => {
  const filterObject = {};

  // If teamId is present, filter by team
  if (req.params.teamId) {
    filterObject.team = req.params.teamId;
  }

  // If categoryId is present, filter by category
  if (req.params.categoryId) {
    filterObject.category = req.params.categoryId;
  }

  req.filterObject = filterObject;
  next();
};

/**
 * @desc    Get all projects for a specific team
 * @route   GET /api/v1/teams/:teamId/projects
 * @access  Public
 */
const getAllTeamProjects = asyncHandler(async (req, res, next) => {
  const projects = await TeamProjects.find(req.filterObject)
    .populate({
      path: 'team',
      select: 'name category',
    })
    .select('-__v -createdAt -updatedAt');

  res.status(200).json({
    message: 'success',
    data: projects,
  });
});

/**
 * @desc    Get specific project for a team
 * @route   GET /api/v1/teams/:teamId/projects/:projectId
 * @access  Public
 */
const getSpecificProject = asyncHandler(async (req, res, next) => {
  const { projectId } = req.params;
  const project = await TeamProjects.findOne({
    _id: projectId,
    team: req.params.teamId,
  }).populate({
    path: 'team',
    select: 'name category',
  });

  if (!project) {
    return next(
      new ApiError(
        `No project found with ID ${projectId} for team ${req.params.teamId}`,
        404
      )
    );
  }

  res.status(200).json({
    message: 'success',
    data: project,
  });
});

// Update a project
const updateProject = asyncHandler(async (req, res, next) => {
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
const deleteSpecificProject = asyncHandler(async (req, res, next) => {
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

export {
  createProject,
  getAllTeamProjects,
  updateProject,
  deleteSpecificProject,
  getSpecificProject,
  getAllMyProjects,
  createFilterObject,
};
