import express from 'express';
import createUploader from '../middlewares/cloudnairyMiddleware.js';
import {
  createFilterObject,
  createService,
  deleteSpecificService,
  getAllServices,
  getSpecificService,
  setCategoryIdToBody,
  updateSpecificService,
} from '../controllers/services.controller.js';
import {
  createServiceValidator,
  deleteServiceValidator,
  getSpecificServiceValidator,
  updateServiceValidator,
} from '../utils/validators/serviceValidator.js';

// mergeParams: Allow us to access params on other routers
// ex: We need to access param --> (categoryId) from category router

const servicesRouter = express.Router({ mergeParams: true });
const upload = createUploader('servicesImages');

/**
 * @swagger
 * tags:
 *   - name: Services
 *     description: Service management operations
 *   - name: Categories/Services
 *     description: Operations for services within categories
 */

/**
 * @swagger
 * /services:
 *   get:
 *     tags: [Services]
 *     summary: Get all services
 *     responses:
 *       200:
 *         description: List of all services
 *   post:
 *     tags: [Services]
 *     summary: Create a new service
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - image
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *               category:
 *                 type: string
 *     responses:
 *       201:
 *         description: Service created successfully
 */

/**
 * @swagger
 * /services/{id}:
 *   get:
 *     tags: [Services]
 *     summary: Get service by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Service details
 *   put:
 *     tags: [Services]
 *     summary: Update service
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
 *             properties:
 *               name:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Service updated successfully
 *   delete:
 *     tags: [Services]
 *     summary: Delete service
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Service deleted successfully
 */

/**
 * @swagger
 * /categories/{categoryId}/services:
 *   post:
 *     tags: [Categories/Services]
 *     summary: Add service to specific category
 *     parameters:
 *       - in: path
 *         name: categoryId
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
 *               - name
 *               - image
 *             properties:
 *               name:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Service added to category successfully
 *   get:
 *     tags: [Categories/Services]
 *     summary: Get list of services for specific category
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of services in category
 */

servicesRouter
  .route('/')
  .get(createFilterObject, getAllServices)
  .post(
    upload.single('image'),
    setCategoryIdToBody,
    createServiceValidator,
    createService
  );

servicesRouter
  .route('/:id')
  .get(getSpecificServiceValidator, getSpecificService)
  .put(upload.single('image'), updateServiceValidator, updateSpecificService)
  .delete(deleteServiceValidator, deleteSpecificService);

export default servicesRouter;
