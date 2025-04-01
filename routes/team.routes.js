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
  updateTeamMemberRole,
  removeTeamMember,
  getTeamMembers,
  getTeamStatistics,
} from '../controllers/team.controller.js';
import { protectedRoutes, allowTo } from '../controllers/auth.controller.js';
import {
  createTeamValidator,
  getSpecificTeamValidator,
  updateMyTeamValidator,
  addLastedProjectValidator,
  updateLastedProjectValidator,
  deleteSpecificTeamValidator,
  updateMemberRoleValidator,
} from '../utils/validators/teamValidator.js';
import {
  getAllMyTeamJoinRequests,
  getSpecificJoinRequest,
  CreaterequestToJoinTeam,
  acceptJoinRequest,
  rejectJoinRequest,
  deleteJoinRequest,
} from '../controllers/joinRequests.controller.js';

const teamRouter = express.Router();

// Public routes
teamRouter.route('/').get(getAllTeams);

// Protected routes
teamRouter
  .route('/')
  .post(
    protectedRoutes,
    allowTo('Team_leader'),
    createTeamValidator,
    createTeam
  );

// Team join requests routes
teamRouter.route('/join').post(protectedRoutes, CreaterequestToJoinTeam);

teamRouter.route('/requests').get(protectedRoutes, getAllMyTeamJoinRequests);

teamRouter
  .route('/requests/:id')
  .get(protectedRoutes, getSpecificJoinRequest)
  .delete(protectedRoutes, deleteJoinRequest);

teamRouter
  .route('/requests/:id/accept')
  .patch(protectedRoutes, allowTo('team_leader'), acceptJoinRequest);

teamRouter
  .route('/requests/:id/reject')
  .patch(protectedRoutes, allowTo('team_leader'), rejectJoinRequest);

// My team routes
teamRouter
  .route('/my-team')
  .get(protectedRoutes, getMyTeam)
  .put(protectedRoutes, updateMyTeamValidator, updateMyTeam)
  .delete(protectedRoutes, deleteMyTeam);

// Team members management routes
teamRouter.route('/my-team/members').get(protectedRoutes, getTeamMembers);

teamRouter
  .route('/my-team/members/:memberId/role')
  .patch(protectedRoutes, updateMemberRoleValidator, updateTeamMemberRole);

teamRouter
  .route('/my-team/members/:memberId')
  .delete(protectedRoutes, removeTeamMember);

// Team statistics route
teamRouter.route('/my-team/statistics').get(protectedRoutes, getTeamStatistics);

// Lasted projects routes
teamRouter
  .route('/my-team/lasted-projects')
  .post(protectedRoutes, addLastedProjectValidator, addLastedProject);

teamRouter
  .route('/my-team/lasted-projects/:projectId')
  .put(protectedRoutes, updateLastedProjectValidator, updateLastedProject)
  .delete(protectedRoutes, deleteLastedProject);

// Admin routes
teamRouter
  .route('/:id')
  .get(getSpecificTeamValidator, getSpecificTeam)
  .delete(protectedRoutes, deleteSpecificTeamValidator, deleteTeam);

export default teamRouter;
