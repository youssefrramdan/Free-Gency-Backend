import express from 'express';
import {
  createTeam,
  getAllTeams,
  getSpecificTeam,
  getMyTeam,
  getMyTeams,
  deleteMyTeam,
  updateMyTeam,
  uploadTeamImage,
  deleteTeam,
  updateTeamMemberRole,
  removeTeamMember,
  getTeamMembers,
  getTeamStatistics,
  getTopRatedTeams,
} from '../controllers/team.controller.js';
import { protectedRoutes, allowTo } from '../controllers/auth.controller.js';
import {
  createTeamValidator,
  getSpecificTeamValidator,
  updateMyTeamValidator,
  deleteSpecificTeamValidator,
  updateMemberRoleValidator,
} from '../utils/validators/teamValidator.js';
import {
  getSpecificJoinRequest,
  CreaterequestToJoinTeam,
  acceptJoinRequest,
  rejectJoinRequest,
  deleteJoinRequest,
  getJoinRequests,
} from '../controllers/joinRequests.controller.js';
import validateJoinRequest from '../middlewares/validateJoinRequest.js';
import ProjectsRouter from './projects.routes.js';
import createUploader from '../middlewares/cloudnairyMiddleware.js';

const teamRouter = express.Router();
const upload = createUploader('logos');

teamRouter.route('/').get(getAllTeams);
teamRouter.route('/top-rated').get(getTopRatedTeams);
teamRouter.route('/').post(protectedRoutes, createTeamValidator, createTeam);

teamRouter.route('/join').post(protectedRoutes, CreaterequestToJoinTeam);

teamRouter.route('/requests').get(protectedRoutes, getJoinRequests);

teamRouter
  .route('/requests/:id')
  .get(protectedRoutes, validateJoinRequest, getSpecificJoinRequest)
  .delete(protectedRoutes, validateJoinRequest, deleteJoinRequest);
teamRouter
  .route('/requests/:id/accept')
  .patch(protectedRoutes, validateJoinRequest, acceptJoinRequest);

teamRouter
  .route('/requests/:id/reject')
  .patch(protectedRoutes, validateJoinRequest, rejectJoinRequest);

teamRouter.route('/my-teams').get(protectedRoutes, getMyTeams);
teamRouter.route('/my-team').get(protectedRoutes, getMyTeam);

teamRouter
  .route('/my-team')
  .patch(
    protectedRoutes,
    allowTo('teamLeader'),
    updateMyTeamValidator,
    updateMyTeam
  )
  .delete(protectedRoutes, allowTo('teamLeader'), deleteMyTeam);

teamRouter
  .route('/my-team/logo')
  .patch(
    protectedRoutes,
    allowTo('teamLeader'),
    upload.single('logo'),
    uploadTeamImage
  );

teamRouter.route('/my-team/members').get(protectedRoutes, getTeamMembers);

teamRouter
  .route('/my-team/members/:memberId/role')
  .patch(protectedRoutes, updateMemberRoleValidator, updateTeamMemberRole);

teamRouter
  .route('/my-team/members/:memberId')
  .delete(protectedRoutes, removeTeamMember);

teamRouter.route('/my-team/statistics').get(protectedRoutes, getTeamStatistics);

teamRouter
  .route('/:id')
  .get(getSpecificTeamValidator, getSpecificTeam)
  .delete(protectedRoutes, deleteSpecificTeamValidator, deleteTeam);

// Nested routes for projects
teamRouter.use('/:teamId/projects', ProjectsRouter);

export default teamRouter;
