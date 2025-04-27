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
} from '../controllers/projects.controller.js';
import { protectedRoutes, allowTo } from '../controllers/auth.controller.js';
import createUploader from '../middlewares/cloudnairyMiddleware.js';
import { createProjectValidator } from '../utils/validators/projectValidator.js';

const upload = createUploader('TeamProjectsImages');
const projectsRouter = express.Router({ mergeParams: true });

// Public routes
projectsRouter.get('/', createFilterObject, getAllProjects);
projectsRouter.get('/:projectId', getSpecificProject);

// Protected routes (require authentication)
projectsRouter.use(protectedRoutes);

// Team leader routes
projectsRouter.post(
  '/',
  allowTo('teamLeader'),
  upload.array('images'),
  createProjectValidator,
  createProject
);
projectsRouter.get('/my-team', getMyTeamProjects);
projectsRouter.get('/team/:teamId', getTeamProjects);
projectsRouter
  .route('/:projectId')
  .patch(allowTo('teamLeader'), updateSpecificProject)
  .delete(allowTo('teamLeader'), deleteSpecificProject);

export default projectsRouter;
