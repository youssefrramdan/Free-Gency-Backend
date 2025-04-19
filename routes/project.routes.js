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

const projectRouter = express.Router();
const upload = createUploader();

/**
 * @swagger
 * tags:
 *   - name: Projects
 *     description: Project management operations
 */

/**
 * @swagger
 * /projects:
 *   get:
 *     tags: [Projects]
 *     summary: Get all projects
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
 *         description: List of all projects
 *   post:
 *     tags: [Projects]
 *     summary: Create a new project
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
 *         description: Project created successfully
 */
projectRouter
  .route('/')
  .get(protectedRoutes, createFilterObject, getAllProject)
  .post(protectedRoutes, upload.array('requirment'), createProject);

/**
 * @swagger
 * /projects/{id}:
 *   get:
 *     tags: [Projects]
 *     summary: Get specific project
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
 *         description: Project details
 *   put:
 *     tags: [Projects]
 *     summary: Update project details
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
 *         description: Project updated successfully
 *   delete:
 *     tags: [Projects]
 *     summary: Delete project
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
 *         description: Project deleted successfully
 */
projectRouter
  .route('/:id')
  .get(protectedRoutes, getSpecificProject)
  .put(protectedRoutes, updateProjectDetails)
  .delete(protectedRoutes, deleteMyProject);

// ==========================================
// Project Files Routes
// ==========================================

/**
 * @swagger
 * /projects/{id}/projects-files:
 *   post:
 *     tags: [Projects]
 *     summary: Add project files
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
projectRouter
  .route('/:id/projects-files')
  .post(protectedRoutes, upload.array('projectFiles'), addProjectFiles);

/**
 * @swagger
 * /projects/{projectId}/projects-files/{fileId}:
 *   delete:
 *     tags: [Projects]
 *     summary: Delete project file
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
projectRouter
  .route('/:projectId/projects-files/:fileId')
  .delete(protectedRoutes, deleteProjectFile);

// ==========================================
// Project Security Routes
// ==========================================

/**
 * @swagger
 * /projects/{id}/security:
 *   put:
 *     tags: [Projects]
 *     summary: Update project security
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
 *                 enum: [private, public]
 *               requiredSkills:
 *                 type: array
 *                 items:
 *                   type: string
 *               budget:
 *                 type: string
 *               deadline:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Security settings updated successfully
 */
projectRouter
  .route('/:id/security')
  .put(protectedRoutes, updateProjectSecurity);

export default projectRouter;
