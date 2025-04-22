import asyncHandler from 'express-async-handler';
import ApiError from '../utils/apiError.js';
import Project from '../models/project.model.js';
import User from '../models/user.model.js';
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
 * @desc    Create filter object for category-based filtering
 * @route   GET /api/v1/categories/:categoryId/projects
 * @access  Private
 */
const createFilterObject = (req, res, next) => {
  let filterObject = {};
  if (req.params.categoryId) {
    filterObject = { category: req.params.categoryId };
  }
  req.filterObject = filterObject;
  next();
};

// ==========================================
// Project CRUD Operations
// ==========================================

/**
 * @desc    Create new project
 * @route   POST /api/v1/projects
 * @access  Private/Client
 */
const createProject = asyncHandler(async (req, res, next) => {
  const {
    projectTitle,
    description,
    requiredSkills,
    service,
    category,
    budget,
    deadline,
  } = req.body;
  // Handle project files if they exist
  const requirment = [];

  if (req.files && req.files.length > 0) {
    const newFiles = req.files.map(file => ({
      fileName: file.originalname,
      fileUrl: file.path,
    }));
    requirment.push(...newFiles);
  }

  const project = new Project({
    projectTitle: projectTitle,
    description: description,
    requiredSkills: requiredSkills,
    category: category,
    service: service,
    budget: budget,
    deadline: deadline,
    client: req.user._id,
    requirment: requirment,
  });
  await project.save();

  res.status(201).json({
    message: 'success',
    data: project,
  });
});

/**
 * @desc    Get all projects (with role-based filtering)
 * @route   GET /api/v1/projects
 * @route   GET /api/v1/categories/:categoryId/projects
 * @access  Private
 */
const getAllProject = asyncHandler(async (req, res, next) => {
  const { role } = req.user;
  let filter = req.filterObject || {};

  if (role === 'client') {
    const user = await User.findById(req.user._id).select('interests');
    if (user?.interests?.length > 0) {
      filter = { ...filter, category: { $in: user.interests } };
    }
  } else if (role === 'teamLeader') {
    const team = await Team.findOne({
      $or: [
        { teamLeader: req.user._id },
        { members: { $elemMatch: { user: req.user._id, role: 'teamLeader' } } },
      ],
    }).select('category');

    if (team) {
      filter = { ...filter, category: team.category };
    }
  }

  const projects = await Project.find(filter)
    .select('projectTitle description budget requiredSkills client status')
    .populate('client', 'name profileImage')
    .populate('category', 'name')
    .lean();

  res.status(200).json({ message: 'success', data: projects });
});

/**
 * @desc    Get specific project
 * @route   GET /api/v1/projects/:id
 * @access  Private
 */
const getSpecificProject = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const project = await Project.findById(id);
  if (!project) {
    return next(new ApiError('Project not found', 404));
  }
  res.status(200).json({
    message: 'success',
    data: project,
  });
});

/**
 * @desc    Update project details
 * @route   PUT /api/v1/projects/:id
 * @access  Private/Client
 */

const updateProjectDetails = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    return next(new ApiError('Project not found', 404));
  }
  // Use the helper function
  isAuthorized(req.user._id, project.client, 'update this project');
  const allowedFields = [
    'projectTitle',
    'description',
    'requiredSkills',
    'status',
  ];

  // Update only allowed fields
  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key)) {
      project[key] = req.body[key];
    }
  });
  // Save the updated project
  await project.save();
  res.status(200).json({
    message: 'success',
    data: project,
  });
});

/**
 * @desc    Delete project
 * @route   DELETE /api/v1/projects/:id
 * @access  Private/Client
 */
const deleteMyProject = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    return next(new ApiError('Project not found', 404));
  }
  // Use the helper function
  isAuthorized(req.user._id, project.client, 'delete this project');

  await Project.findByIdAndDelete(req.params.id);
  res.status(200).json({
    message: 'success',
  });
});

// ==========================================
// Project Files Management
// ==========================================

/**
 * @desc    Add files to project
 * @route   POST /api/v1/projects/:id/projects-files
 * @access  Private/Client
 */
const addProjectFiles = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return next(new ApiError('Project not found', 404));
  }
  // Use the helper function
  isAuthorized(req.user._id, project.client, 'add files to this project');

  if (req.files && req.files.length > 0) {
    const newFiles = req.files.map(file => ({
      fileName: file.originalname,
      fileUrl: file.path,
      uploadedAt: Date.now(),
    }));

    await Project.findByIdAndUpdate(req.params.id, {
      $push: {
        projectFiles: { $each: newFiles },
      },
    });
  }

  res.status(200).json({
    message: 'success',
    data: project,
  });
});

/**
 * @desc    Delete project file
 * @route   DELETE /api/v1/projects/:id/projects-files/:fileId
 * @access  Private/Client
 */
const deleteProjectFile = asyncHandler(async (req, res, next) => {
  const { projectId, fileId } = req.params;

  const project = await Project.findById(projectId);

  if (!project) {
    return next(new ApiError('Project not found', 404));
  }
  // Use the helper function
  isAuthorized(req.user._id, project.client, 'delete files from this project');

  project.projectFiles = project.projectFiles.filter(
    file => file._id.toString() !== fileId
  );

  await project.save();

  res.status(200).json({
    message: 'success',
    data: project,
  });
});

// ==========================================
// Project Security Management
// ==========================================

/**
 * @desc    Update project security settings
 * @route   PUT /api/v1/projects/:id/security
 * @access  Private/Client
 */
const updateProjectSecurity = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    return next(new ApiError('Project not found', 404));
  }

  // Use the helper function
  isAuthorized(
    req.user._id,
    project.client,
    'update security settings for this project'
  );

  const allowedFields = ['visibility', 'requiredSkills', 'budget', 'deadline'];

  // Update only allowed fields
  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key)) {
      project[key] = req.body[key];
    }
  });

  await project.save();

  res.status(200).json({
    message: 'success',
    data: project,
  });
});

export {
  createProject,
  getAllProject,
  getSpecificProject,
  updateProjectDetails,
  deleteMyProject,
  addProjectFiles,
  deleteProjectFile,
  createFilterObject,
  // Security related exports
  updateProjectSecurity,
};

// team leader ---> add projects from application
