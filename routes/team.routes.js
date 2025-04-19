import express from 'express';
import {
  createTeam,
  getAllTeams,
  getSpecificTeam,
  getMyTeam,
  getMyTeams,
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
  getSpecificJoinRequest,
  CreaterequestToJoinTeam,
  acceptJoinRequest,
  rejectJoinRequest,
  deleteJoinRequest,
  getJoinRequests,
} from '../controllers/joinRequests.controller.js';
import validateJoinRequest from '../middlewares/validateJoinRequest.js';

const teamRouter = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Teams
 *     description: Team management operations
 */

/**
 * @swagger
 * /teams:
 *   get:
 *     tags: [Teams]
 *     summary: Get all teams
 *     responses:
 *       200:
 *         description: List of all teams
 *   post:
 *     tags: [Teams]
 *     summary: Create a new team
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *               - teamCode
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               teamCode:
 *                 type: string
 *     responses:
 *       201:
 *         description: Team created successfully
 */
teamRouter.route('/').get(getAllTeams);
teamRouter.route('/').post(protectedRoutes, createTeamValidator, createTeam);

/**
 * @swagger
 * /teams/join:
 *   post:
 *     tags: [Teams]
 *     summary: Create request to join team
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - teamCode
 *               - job
 *             properties:
 *               teamCode:
 *                 type: string
 *               job:
 *                 type: string
 *     responses:
 *       201:
 *         description: Join request created successfully
 */
teamRouter.route('/join').post(protectedRoutes, CreaterequestToJoinTeam);

/**
 * @swagger
 * /teams/requests:
 *   get:
 *     tags: [Teams]
 *     summary: Get all join requests
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of join requests
 */
teamRouter.route('/requests').get(protectedRoutes, getJoinRequests);

/**
 * @swagger
 * /teams/requests/{id}:
 *   get:
 *     tags: [Teams]
 *     summary: Get specific join request
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Join request details
 *   delete:
 *     tags: [Teams]
 *     summary: Delete join request
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Join request deleted successfully
 */
teamRouter
  .route('/requests/:id')
  .get(protectedRoutes, validateJoinRequest, getSpecificJoinRequest)
  .delete(protectedRoutes, validateJoinRequest, deleteJoinRequest);

/**
 * @swagger
 * /teams/requests/{id}/accept:
 *   patch:
 *     tags: [Teams]
 *     summary: Accept join request
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Join request accepted successfully
 */
teamRouter
  .route('/requests/:id/accept')
  .patch(protectedRoutes, validateJoinRequest, acceptJoinRequest);

/**
 * @swagger
 * /teams/requests/{id}/reject:
 *   patch:
 *     tags: [Teams]
 *     summary: Reject join request
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Join request rejected successfully
 */
teamRouter
  .route('/requests/:id/reject')
  .patch(protectedRoutes, validateJoinRequest, rejectJoinRequest);

/**
 * @swagger
 * /teams/my-teams:
 *   get:
 *     tags: [Teams]
 *     summary: Get all my teams
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of my teams
 */
teamRouter.route('/my-teams').get(protectedRoutes, getMyTeams);
teamRouter.route('/my-team').get(protectedRoutes, getMyTeam);

/**
 * @swagger
 * /teams/my-team:
 *   get:
 *     tags: [Teams]
 *     summary: Get my team
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: My team details
 *   put:
 *     tags: [Teams]
 *     summary: Update my team
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               aboutUs:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [recruiting, not_recruiting]
 *               contactInfo:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: string
 *                     format: email
 *                   phone:
 *                     type: string
 *     responses:
 *       200:
 *         description: Team updated successfully
 *   delete:
 *     tags: [Teams]
 *     summary: Delete my team
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Team deleted successfully
 */
teamRouter
  .route('/my-team')
  .put(protectedRoutes, updateMyTeamValidator, updateMyTeam)
  .delete(protectedRoutes, deleteMyTeam);

/**
 * @swagger
 * /teams/my-team/members:
 *   get:
 *     tags: [Teams]
 *     summary: Get team members
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of team members
 */
teamRouter.route('/my-team/members').get(protectedRoutes, getTeamMembers);

/**
 * @swagger
 * /teams/my-team/members/{memberId}/role:
 *   patch:
 *     tags: [Teams]
 *     summary: Update member role
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [team_member, team_leader]
 *     responses:
 *       200:
 *         description: Member role updated successfully
 */
teamRouter
  .route('/my-team/members/:memberId/role')
  .patch(protectedRoutes, updateMemberRoleValidator, updateTeamMemberRole);

/**
 * @swagger
 * /teams/my-team/members/{memberId}:
 *   delete:
 *     tags: [Teams]
 *     summary: Remove team member
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Member removed successfully
 */
teamRouter
  .route('/my-team/members/:memberId')
  .delete(protectedRoutes, removeTeamMember);

/**
 * @swagger
 * /teams/my-team/statistics:
 *   get:
 *     tags: [Teams]
 *     summary: Get team statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Team statistics
 */
teamRouter.route('/my-team/statistics').get(protectedRoutes, getTeamStatistics);

/**
 * @swagger
 * /teams/my-team/lasted-projects:
 *   post:
 *     tags: [Teams]
 *     summary: Add lasted project
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *               budget:
 *                 type: string
 *               description:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               projectUrl:
 *                 type: string
 *               technologies:
 *                 type: array
 *                 items:
 *                   type: string
 *               completionDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Project added successfully
 */
teamRouter
  .route('/my-team/lasted-projects')
  .post(protectedRoutes, addLastedProjectValidator, addLastedProject);

/**
 * @swagger
 * /teams/my-team/lasted-projects/{projectId}:
 *   put:
 *     tags: [Teams]
 *     summary: Update lasted project
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               budget:
 *                 type: string
 *               description:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               projectUrl:
 *                 type: string
 *               technologies:
 *                 type: array
 *                 items:
 *                   type: string
 *               completionDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Project updated successfully
 *   delete:
 *     tags: [Teams]
 *     summary: Delete lasted project
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project deleted successfully
 */
teamRouter
  .route('/my-team/lasted-projects/:projectId')
  .put(protectedRoutes, updateLastedProjectValidator, updateLastedProject)
  .delete(protectedRoutes, deleteLastedProject);

/**
 * @swagger
 * /teams/{id}:
 *   get:
 *     tags: [Teams]
 *     summary: Get team by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Team details
 *   delete:
 *     tags: [Teams]
 *     summary: Delete team (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Team deleted successfully
 */
teamRouter
  .route('/:id')
  .get(getSpecificTeamValidator, getSpecificTeam)
  .delete(protectedRoutes, deleteSpecificTeamValidator, deleteTeam);

export default teamRouter;
