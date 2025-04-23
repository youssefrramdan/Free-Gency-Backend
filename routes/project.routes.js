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
  updateProjectSecurity,
} from '../controllers/project.controller.js';
import { protectedRoutes } from '../controllers/auth.controller.js';
import createUploader from '../middlewares/cloudnairyMiddleware.js';

const clientTasksRouter = express.Router();
const upload = createUploader();

/**
 * @swagger
 * tags:
 *   - name: Client Tasks
 *     description: Client task management operations
 */

/**
 * @swagger
 * /client-tasks:
 *   get:
 *     tags: [Client Tasks]
 *     summary: Get all client tasks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of all client tasks
 *   post:
 *     tags: [Client Tasks]
 *     summary: Create a new client task
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - projectTitle
 *               - description
 *             properties:
 *               projectTitle:
 *                 type: string
 *               budget:
 *                 type: string
 *               category:
 *                 type: string
 *               service:
 *                 type: string
 *               requiredSkills:
 *                 type: array
 *                 items:
 *                   type: string
 *               deadline:
 *                 type: string
 *                 format: date
 *               description:
 *                 type: string
 *               requirment:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Client task created successfully
 */
clientTasksRouter
  .route('/')
  .get(protectedRoutes, createFilterObject, getAllProject)
  .post(protectedRoutes, upload.array('requirment'), createProject);

/**
 * @swagger
 * /client-tasks/{id}:
 *   get:
 *     tags: [Client Tasks]
 *     summary: Get specific client task
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
 *         description: Client task details
 *   put:
 *     tags: [Client Tasks]
 *     summary: Update client task details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               projectTitle:
 *                 type: string
 *               description:
 *                 type: string
 *               budget:
 *                 type: string
 *               requiredSkills:
 *                 type: array
 *                 items:
 *                   type: string
 *               deadline:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Client task updated successfully
 *   delete:
 *     tags: [Client Tasks]
 *     summary: Delete client task
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
 *         description: Client task deleted successfully
 */
clientTasksRouter
  .route('/:id')
  .get(protectedRoutes, getSpecificProject)
  .put(protectedRoutes, updateProjectDetails)
  .delete(protectedRoutes, deleteMyProject);

// ==========================================
// Task Files Routes
// ==========================================

/**
 * @swagger
 * /client-tasks/{id}/projects-files:
 *   post:
 *     tags: [Client Tasks]
 *     summary: Add client task files
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - projectFiles
 *             properties:
 *               projectFiles:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Files added successfully
 */
clientTasksRouter
  .route('/:id/projects-files')
  .post(protectedRoutes, upload.array('projectFiles'), addProjectFiles);

/**
 * @swagger
 * /client-tasks/{projectId}/projects-files/{fileId}:
 *   delete:
 *     tags: [Client Tasks]
 *     summary: Delete client task file
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File deleted successfully
 */
clientTasksRouter
  .route('/:projectId/projects-files/:fileId')
  .delete(protectedRoutes, deleteProjectFile);

// ==========================================
// Task Security Routes
// ==========================================

/**
 * @swagger
 * /client-tasks/{id}/security:
 *   put:
 *     tags: [Client Tasks]
 *     summary: Update client task security
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               visibility:
 *                 type: string
 *                 enum: [public, private]
 *     responses:
 *       200:
 *         description: Security settings updated successfully
 */
clientTasksRouter
  .route('/:id/security')
  .put(protectedRoutes, updateProjectSecurity);

export default clientTasksRouter;
