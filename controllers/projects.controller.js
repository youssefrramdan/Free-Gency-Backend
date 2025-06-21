import asyncHandler from 'express-async-handler';
import ApiError from '../utils/apiError.js';
import Projects from '../models/projects.model.js';
import Team from '../models/team.model.js';

// ==========================================
// Authorization Helper
// ==========================================

const setCategoryIdToBody = (req, res, next) => {
  // Nested route (Create)
  if (!req.body.category) req.body.category = req.params.categoryId;
  next();
};

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
  // Check if team exists and user is authorized in one query
  const team = await Team.findOne({
    _id: req.user.createdTeam,
    teamLeader: req.user._id,
  });

  if (!team) {
    return next(new ApiError('Team not found or you are not authorized', 404));
  }

  // Handle image uploads more efficiently
  const images = req.files?.images?.map(file => file.path) || [];
  const imageCover =
    req.files?.imageCover?.[0]?.path || (images.length > 0 ? images[0] : null);

  // Create project with all required fields
  const project = await Projects.create({
    title: req.body.title,
    description: req.body.description,
    budget: req.body.budget,
    images,
    imageCover,
    projectUrl: req.body.projectUrl,
    technologies: req.body.technologies,
    completionDate: req.body.completionDate,
    team: team._id,
    category: team.category, // Use category from team
    service: req.body.service,
    visibility: req.body.visibility || 'public',
  });

  // Update team with new project in parallel with response
  team.Projects.push(project._id);

  // Handle team save properly to avoid unhandled rejection
  try {
    await team.save();
  } catch (err) {
    console.error('Error updating team:', err);
    // Don't fail the main operation, just log the error
    // The project was created successfully
  }

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
      select: 'name category logo',
      populate: {
        path: 'category',
        select: 'name',
      },
    })
    .select('-__v -createdAt -updatedAt')
    .lean();

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

  // Find the project and populate only necessary fields
  const project = await Projects.findById(projectId)
    .populate('team', 'name logo category')
    .populate('category', 'name')
    .populate('service', 'name')
    .populate({
      path: 'ratings',
      select: 'rating comment ratedBy',
      populate: {
        path: 'ratedBy',
        select: 'name profileImage',
      },
    })
    .lean();

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
    .populate('category', 'name')
    .select('-__v -createdAt -updatedAt')
    .lean();

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
    .populate('category', 'name')
    .populate('service', 'name')
    .select('-__v -createdAt -updatedAt')
    .lean();

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
  if (!req.user.interests?.length) {
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
    .populate('team', 'name logo')
    .select('title imageCover team')
    .sort('-createdAt')
    .lean();

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
  const { projectId } = req.params;

  // Find project and check authorization in one query
  const project = await Projects.findById(projectId)
    .populate('team', 'teamLeader')
    .lean();

  if (!project) {
    return next(new ApiError('Project not found', 404));
  }

  // Check authorization
  if (project.team.teamLeader.toString() !== req.user._id.toString()) {
    return next(new ApiError('Not authorized to update this project', 403));
  }

  // Handle image uploads efficiently
  if (req.files) {
    if (req.files.images) {
      req.body.images = [
        ...(project.images || []),
        ...req.files.images.map(file => file.path),
      ];
    }
    if (req.files.imageCover?.length) {
      req.body.imageCover = req.files.imageCover[0].path;
    }
  }

  const updatedProject = await Projects.findByIdAndUpdate(projectId, req.body, {
    new: true,
    runValidators: true,
  }).lean();

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

  // Find project and check authorization in one query
  const project = await Projects.findById(id)
    .populate('team', 'teamLeader')
    .lean();

  if (!project) {
    return next(new ApiError('Project not found', 404));
  }

  // Check authorization
  if (project.team.teamLeader.toString() !== req.user._id.toString()) {
    return next(new ApiError('Not authorized to delete this project', 403));
  }

  // Remove project from team and delete project in parallel
  await Promise.all([
    Team.findByIdAndUpdate(project.team._id, {
      $pull: { Projects: id },
    }),
    Projects.findByIdAndDelete(id),
  ]);

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
  setCategoryIdToBody,
  getProjectsByInterests,
};
