import express from 'express';
import {
  createTeam,
  getAllTeams,
  getSpecificTeam,
  getMyTeam,
  deleteMyTeam,
  updateMyTeam,
  addLastedProject,
  updateLastedProject,
  deleteLastedProject,
  deleteTeam,
} from '../controllers/team.controller.js';
import { protectedRoutes, allowTo } from '../controllers/auth.controller.js';
import {
  createTeamValidator,
  getSpecificTeamValidator,
  updateMyTeamValidator,
  addLastedProjectValidator,
  updateLastedProjectValidator,
  deleteSpecificTeamValidator,
} from '../utils/validators/teamValidator.js';

const teamRouter = express.Router();

teamRouter.route('/').get(getAllTeams).post(
  protectedRoutes,
  // allowTo(['team_leader', 'admin']),
  createTeamValidator,
  createTeam
);

teamRouter
  .route('/my-team')
  .get(protectedRoutes, getMyTeam)
  .put(protectedRoutes, updateMyTeamValidator, updateMyTeam)
  .delete(protectedRoutes, deleteMyTeam);

// Lasted projects routes
teamRouter
  .route('/my-team/lasted-projects')
  .post(protectedRoutes, addLastedProjectValidator, addLastedProject);

teamRouter
  .route('/my-team/lasted-projects/:projectId')
  .put(protectedRoutes, updateLastedProjectValidator, updateLastedProject)
  .delete(protectedRoutes, deleteLastedProject);

teamRouter.route('/:id').get(getSpecificTeamValidator, getSpecificTeam).delete(
  protectedRoutes,
  deleteSpecificTeamValidator,
  // allowTo('admin'),
  deleteTeam
);
export default teamRouter;
