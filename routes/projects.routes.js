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
  setCategoryIdToBody,
} from '../controllers/projects.controller.js';
import { protectedRoutes, allowTo } from '../controllers/auth.controller.js';
import createUploader from '../middlewares/cloudnairyMiddleware.js';
import { createProjectValidator } from '../utils/validators/projectValidator.js';

const upload = createUploader('TeamProjectsImages');
const projectsRouter = express.Router({ mergeParams: true });

// Public routes
projectsRouter.get('/', createFilterObject, getAllProjects);

// Specific routes first
projectsRouter.get('/by-interests', protectedRoutes, getProjectsByInterests);
projectsRouter.get('/my-team', protectedRoutes, getMyTeamProjects);
projectsRouter.get('/team/:teamId', protectedRoutes, getTeamProjects);

// Team leader routes
projectsRouter.post(
  '/',
  protectedRoutes,
  setCategoryIdToBody   ,
  allowTo('teamLeader'),
  upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'imageCover', maxCount: 1 },
  ]),
  createProjectValidator,
  createProject
);

// Dynamic parameter routes last
projectsRouter.get('/:projectId', getSpecificProject);
projectsRouter
  .route('/:projectId')
  .patch(
    protectedRoutes,
    allowTo('teamLeader'),
    upload.fields([
      { name: 'images', maxCount: 10 },
      { name: 'imageCover', maxCount: 1 },
    ]),
    updateSpecificProject
  )
  .delete(protectedRoutes, allowTo('teamLeader'), deleteSpecificProject);

export default projectsRouter;
