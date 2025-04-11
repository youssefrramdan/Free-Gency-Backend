import express from 'express';
import {
  addProjectFiles,
  createProject,
  deleteProjectFile,
  getAllProject,
  getSpecificProject,
  updateProjectDetails,
  deleteMyProject,
  createFilterObject,
  // Security related controllers
  requestToJoinProject,
  acceptProjectRequest,
  rejectProjectRequest,
  getProjectRequests,
  updateProjectSecurity,
} from '../controllers/project.controller.js';
import { protectedRoutes } from '../controllers/auth.controller.js';
import createUploader from '../middlewares/cloudnairyMiddleware.js';

const projectRouter = express.Router();
const upload = createUploader();

// ==========================================
// Project CRUD Routes
// ==========================================

/**
 * @desc    Get all projects or create new project
 * @route   GET /api/v1/projects
 * @route   POST /api/v1/projects
 * @access  Private
 */
projectRouter
  .route('/')
  .get(protectedRoutes, createFilterObject, getAllProject)
  .post(protectedRoutes, upload.array('requirment'), createProject);

/**
 * @desc    Get, update, or delete specific project
 * @route   GET /api/v1/projects/:id
 * @route   PUT /api/v1/projects/:id
 * @route   DELETE /api/v1/projects/:id
 * @access  Private
 */
projectRouter
  .route('/:id')
  .get(protectedRoutes, getSpecificProject)
  .put(protectedRoutes, updateProjectDetails)
  .delete(protectedRoutes, deleteMyProject);

// ==========================================
// Project Files Routes
// ==========================================

/**
 * @desc    Add or delete project files
 * @route   POST /api/v1/projects/:id/projects-files
 * @route   DELETE /api/v1/projects/:id/projects-files/:fileId
 * @access  Private/Client
 */
projectRouter
  .route('/:id/projects-files')
  .post(protectedRoutes, upload.array('projectFiles'), addProjectFiles);

projectRouter
  .route('/:projectId/projects-files/:fileId')
  .delete(protectedRoutes, deleteProjectFile);

// ==========================================
// Project Security Routes
// ==========================================

/**
 * @desc    Update project security settings
 * @route   PUT /api/v1/projects/:id/security
 * @access  Private/Client
 */
projectRouter
  .route('/:id/security')
  .put(protectedRoutes, updateProjectSecurity);

// ==========================================
// Project Requests Routes
// ==========================================

/**
 * @desc    Request to join project
 * @route   POST /api/v1/projects/:id/requests
 * @access  Private/Team Leader
 */
projectRouter
  .route('/:id/requests')
  .post(protectedRoutes, requestToJoinProject)
  .get(protectedRoutes, getProjectRequests);

/**
 * @desc    Accept or reject project request
 * @route   PUT /api/v1/projects/:id/requests/:requestId/accept
 * @route   PUT /api/v1/projects/:id/requests/:requestId/reject
 * @access  Private/Client
 */
projectRouter
  .route('/:id/requests/:requestId/accept')
  .put(protectedRoutes, acceptProjectRequest);

projectRouter
  .route('/:id/requests/:requestId/reject')
  .put(protectedRoutes, rejectProjectRequest);

export default projectRouter;
