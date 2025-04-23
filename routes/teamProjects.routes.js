import express from 'express';
import {
  createTeamProject,
  getAllTeamProjects,
  getTeamProjects,
  getTeamProject,
  updateTeamProject,
  deleteTeamProject,
} from '../controllers/teamProjects.controller.js';
import { protectedRoutes, allowTo } from '../controllers/auth.controller.js';

const router = express.Router();

// protect all routes after this middleware
router.use(protectedRoutes);

// Routes for team projects
router.route('/').get(getAllTeamProjects);

// Create a team project for a specific team
router.post('/team/:teamId', allowTo('teamLeader'), createTeamProject);

// Get all team projects for a specific team
router.get('/team/:teamId', getTeamProjects);

router
  .route('/:id')
  .get(getTeamProject)
  .patch(allowTo('teamLeader'), updateTeamProject)
  .delete(allowTo('teamLeader'), deleteTeamProject);

export default router;
