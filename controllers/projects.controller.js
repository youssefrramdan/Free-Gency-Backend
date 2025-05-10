import asyncHandler from 'express-async-handler';
import ApiError from '../utils/apiError.js';
import Projects from '../models/projects.model.js';
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
// ==========================================
// Middleware
// ==========================================

/**
 * @desc    Create filter object for team-based or category-based filtering
 * @middleware
 */
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

  // If serviceId is present, filter by service
  if (req.params.serviceId) {
    filterObject.service = req.params.serviceId;
  }

  req.filterObject = filterObject;
  next();
};

// ==========================================
// Project Creation
// ==========================================

/**
 * @desc    Create new project
 * @route   POST /api/v1/projects
 * @access  Private/Team Leader
 */
const createProject = asyncHandler(async (req, res, next) => {
  // Check if team exists
  const team = await Team.findById(req.user.createdTeam);
  if (!team) {
    return next(new ApiError('Team not found', 404));
  }

  // Use isAuthorized to check if user is team leader
  isAuthorized(req.user._id, team.teamLeader, 'add projects');

  // Handle image uploads
  const images = [];
  if (req.files && req.files.length > 0) {
    req.files.forEach(file => {
      images.push(file.path);
    });
  }

  // Create project with all required fields
  const project = await Projects.create({
    title: req.body.title,
    description: req.body.description,
    budget: req.body.budget,
    images: images,
    projectUrl: req.body.projectUrl,
    technologies: req.body.technologies,
    completionDate: req.body.completionDate,
    team: req.user.createdTeam,
    category: req.body.category,
    service: req.body.service,
    visibility: req.body.visibility || 'public',
  });

  // Add project to team
  team.Projects.push(project._id);
  await team.save();

  res.status(201).json({
    status: 'success',
    data: {
      project,
    },
  });
});

// ==========================================
// Project Retrieval
// ==========================================

/**
 * @desc    Get all projects
 * @route   GET /api/v1/projects
 * @access  Public
 */
const getAllProjects = asyncHandler(async (req, res, next) => {
  const projects = await Projects.find(req.filterObject)
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
 * @desc    Get specific project by ID
 * @route   GET /api/v1/projects/:projectId
 * @access  Public
 */
const getSpecificProject = asyncHandler(async (req, res, next) => {
  const { projectId } = req.params;

  // Find the project and populate team and category information
  const project = await Projects.findById(projectId)
    .populate('team', 'name logo category')
    .populate('category', 'name');

  // Check if project exists
  if (!project) {
    return next(new ApiError(`No project found with ID ${projectId}`, 404));
  }

  res.status(200).json({
    status: 'success',
    data: project,
  });
});

/**
 * @desc    Get all projects for a specific team
 * @route   GET /api/v1/projects/team/:teamId
 * @access  Public
 */
const getTeamProjects = asyncHandler(async (req, res, next) => {
  const { teamId } = req.params;

  const projects = await Projects.find({ team: teamId })
    .populate('team', 'name logo')
    .populate('category', 'name');

  res.status(200).json({
    status: 'success',
    results: projects.length,
    data: projects,
  });
});

/**
 * @desc    Get all projects for the authenticated user's team
 * @route   GET /api/v1/projects/my-team
 * @access  Private/Authenticated
 */
const getMyTeamProjects = asyncHandler(async (req, res, next) => {
  const projects = await Projects.find({ team: req.user.createdTeam })
    .populate('team', 'name logo')
    .populate('category', 'name');

  res.status(200).json({
    status: 'success',
    results: projects.length,
    data: projects,
  });
});

/**
 * @desc    Get projects based on user interests
 * @route   GET /api/v1/projects/by-interests
 * @access  Private/Authenticated
 */
const getProjectsByInterests = asyncHandler(async (req, res, next) => {
  if (!req.user.interests || req.user.interests.length === 0) {
    return res.status(200).json({
      status: 'success',
      results: 0,
      data: [],
      message: 'No interests found in your profile',
    });
  }

  const projects = await Projects.find({
    category: { $in: req.user.interests },
  })
    .populate('team', 'name logo ratingCount averageRating')
    .populate('category', 'name')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: projects.length,
    data: projects,
  });
});

// ==========================================
// Project Update & Delete
// ==========================================

/**
 * @desc    Update specific project
 * @route   PATCH /api/v1/projects/:projectId
 * @access  Private/Team Leader
 */
const updateSpecificProject = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const project = await Projects.findById(id);

  if (!project) {
    return next(new ApiError('Team project not found', 404));
  }

  // Use isAuthorized to check if user is team leader
  isAuthorized(
    req.user._id,
    project.team.teamLeader || project.team,
    'update projects'
  );

  const updatedProject = await Projects.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: updatedProject,
  });
});

/**
 * @desc    Delete specific project
 * @route   DELETE /api/v1/projects/:projectId
 * @access  Private/Team Leader
 */
const deleteSpecificProject = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const project = await Projects.findById(id);

  if (!project) {
    return next(new ApiError('Team project not found', 404));
  }

  // Use isAuthorized to check if user is team leader
  isAuthorized(
    req.user._id,
    project.team.teamLeader || project.team,
    'delete projects'
  );

  // Remove project from team
  const team = await Team.findById(project.team);
  team.Projects = team.Projects.filter(
    projectId => projectId.toString() !== id
  );
  await team.save();

  // Delete project
  await Projects.findByIdAndDelete(id);

  res.status(204).json({
    status: 'success',
  });
});

export {
  createProject,
  getAllProjects,
  getTeamProjects,
  getMyTeamProjects,
  updateSpecificProject,
  deleteSpecificProject,
  getSpecificProject,
  createFilterObject,
  getProjectsByInterests,
};
