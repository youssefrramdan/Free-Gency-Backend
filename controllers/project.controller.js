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
    // Get projects based on client's interested categories
    const user = await User.findById(req.user._id).select('interests');
    if (user && user.interests && user.interests.length > 0) {
      filter = { ...filter, category: { $in: user.interests } };
    }
  } else if (role === 'teamLeader') {
    // Get the team where user is a team leader
    const team = await Team.findOne({ teamLeader: req.user._id }).select(
      'category'
    );

    if (team) {
      filter = { ...filter, category: team.category };
    }
  }

  const projects = await Project.find(filter)
    .select('projectTitle description budget requiredSkills client status')
    .populate('client', 'name profileImage')
    .populate('category', 'name')
    .lean();

  res.status(200).json({
    message: 'success',
    data: projects,
  });
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
    'budget',
    'visibility',
    'category',
    'service',
    'requiredSkills',
    'deadline',
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

// ==========================================
// Project Requests Management
// ==========================================

/**
 * @desc    Request to join project
 * @route   POST /api/v1/projects/:id/requests
 * @access  Private/Team Leader
 */
const requestToJoinProject = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return next(new ApiError('Project not found', 404));
  }

  // Check if team has already requested
  const existingRequest = project.teamRequests.find(
    request => request.team.toString() === req.user.createdTeam._id.toString()
  );

  if (existingRequest) {
    return next(
      new ApiError('Your team has already requested to join this project', 400)
    );
  }

  // Add new request
  project.teamRequests.push({
    team: req.user.createdTeam._id,
    status: 'pending',
    requestDate: Date.now(),
  });

  await project.save();

  res.status(201).json({
    message: 'Request sent successfully',
    data: project.teamRequests[project.teamRequests.length - 1],
  });
});

/**
 * @desc    Get all project requests
 * @route   GET /api/v1/projects/:id/requests
 * @access  Private/Client
 */
const getProjectRequests = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id)
    .populate('teamRequests.team', 'name category')

  if (!project) {
    return next(new ApiError('Project not found', 404));
  }

  // Use the helper function
  isAuthorized(
    req.user._id,
    project.client,
    'view requests for this project'
  );

  res.status(200).json({
    message: 'success',
    data: project.teamRequests,
  });
});

/**
 * @desc    Accept project request
 * @route   PUT /api/v1/projects/:id/requests/:requestId/accept
 * @access  Private/Client
 */
const acceptProjectRequest = asyncHandler(async (req, res, next) => {
  const { id, requestId } = req.params;
  const project = await Project.findById(id);

  if (!project) {
    return next(new ApiError('Project not found', 404));
  }

  // Use the helper function
  isAuthorized(
    req.user._id,
    project.client,
    'accept requests for this project'
  );

  const request = project.teamRequests.id(requestId);
  if (!request) {
    return next(new ApiError('Request not found', 404));
  }

  if (request.status !== 'pending') {
    return next(new ApiError('Request is not pending', 400));
  }

  // Update request status
  request.status = 'accepted';
  request.responseDate = Date.now();

  // Assign team to project
  project.assignedTeam = request.team;
  project.status = 'in-progress';

  // Reject all other pending requests
  project.teamRequests.forEach(req => {
    if (req._id.toString() !== requestId && req.status === 'pending') {
      req.status = 'rejected';
      req.responseDate = Date.now();
    }
  });

  await project.save();

  res.status(200).json({
    message: 'Request accepted successfully',
    data: request,
  });
});

/**
 * @desc    Reject project request
 * @route   PUT /api/v1/projects/:id/requests/:requestId/reject
 * @access  Private/Client
 */
const rejectProjectRequest = asyncHandler(async (req, res, next) => {
  const { id, requestId } = req.params;
  const project = await Project.findById(id);

  if (!project) {
    return next(new ApiError('Project not found', 404));
  }

  // Use the helper function
  isAuthorized(
    req.user._id,
    project.client,
    'reject requests for this project'
  );

  const request = project.teamRequests.id(requestId);
  if (!request) {
    return next(new ApiError('Request not found', 404));
  }

  if (request.status !== 'pending') {
    return next(new ApiError('Request is not pending', 400));
  }

  // Update request status
  request.status = 'rejected';
  request.responseDate = Date.now();

  await project.save();

  res.status(200).json({
    message: 'Request rejected successfully',
    data: request,
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
  requestToJoinProject,
  getProjectRequests,
  acceptProjectRequest,
  rejectProjectRequest,
};
