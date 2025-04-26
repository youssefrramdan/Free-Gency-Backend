import express from 'express';
import {
  createProject,
  getAllTeamProjects,
  updateProject,
  deleteTeamProject,
  getSpecificProject,
  createFilterObject,
} from '../controllers/teamProjects.controller.js';
import { protectedRoutes, allowTo } from '../controllers/auth.controller.js';

const router = express.Router({ mergeParams: true });

// protect all routes after this middleware
router.use(protectedRoutes);

// Routes for team projects
// Get all projects for a specific team and create new project
router
  .route('/')
  .get(createFilterObject, getAllTeamProjects)
  .post(allowTo('teamLeader'), createTeamProject);

// Get, update, or delete a specific project
router
  .route('/:projectId')
  .get(getSpecificProject)
  .patch(allowTo('teamLeader'), updateTeamProject)
  .delete(allowTo('teamLeader'), deleteTeamProject);

export default router;
