import express from 'express';
import {
  createProject,
  getAllProjects,
  getTeamProjects,
  getMyTeamProjects,
  updateSpecificProject,
  deleteSpecificProject,
  getSpecificProject,
  createFilterObject,
  getProjectsByInterests,
} from '../controllers/projects.controller.js';
import { protectedRoutes, allowTo } from '../controllers/auth.controller.js';
import createUploader from '../middlewares/cloudnairyMiddleware.js';
import { createProjectValidator } from '../utils/validators/projectValidator.js';

const upload = createUploader('TeamProjectsImages');
const projectsRouter = express.Router({ mergeParams: true });

// Public routes
projectsRouter.get('/', createFilterObject, getAllProjects);

// Protected routes (require authentication)
projectsRouter.use(protectedRoutes);

// Specific routes first
projectsRouter.get('/by-interests', getProjectsByInterests);
projectsRouter.get('/my-team', getMyTeamProjects);
projectsRouter.get('/team/:teamId', getTeamProjects);

// Team leader routes
projectsRouter.post(
  '/',
  allowTo('teamLeader'),
  upload.array('images'),
  createProjectValidator,
  createProject
);

// Dynamic parameter routes last
projectsRouter.get('/:projectId', getSpecificProject);
projectsRouter
  .route('/:projectId')
  .patch(allowTo('teamLeader'), updateSpecificProject)
  .delete(allowTo('teamLeader'), deleteSpecificProject);

export default projectsRouter;
