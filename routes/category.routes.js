import express from 'express';
import createUploader from '../middlewares/cloudnairyMiddleware.js';
import {
  createCategoryValidator,
  deleteCategoryValidator,
  getSpecificCategoryValidator,
  updateCategoryValidator,
} from '../utils/validators/categoryValidator.js';
import {
  createCategory,
  deletegetCategory,
  getAllCategories,
  getSpecificCategory,
  updateCategory,
} from '../controllers/categoty.controller.js';
import servicesRouter from './services.routes.js';
// import projectRouter from './project.routes.js';

const categoryRouter = express.Router();
const upload = createUploader('categoryImages');

// Nested route - Services as Subcategories
categoryRouter.use('/:categoryId/services', servicesRouter);

// Nested route - Projects as Subcategories
// categoryRouter.use('/:categoryId/projects', projectRouter);

/**
 * @swagger
 * tags:
 *   - name: Categories
 *     description: Category management operations
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     tags: [Categories]
 *     summary: Get all categories
 *     responses:
 *       200:
 *         description: List of all categories
 *   post:
 *     tags: [Categories]
 *     summary: Create a new category
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
 *         description: Category created successfully
 */
categoryRouter
  .route('/')
  .get(getAllCategories)
  .post(createCategoryValidator, createCategory);

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     tags: [Categories]
 *     summary: Get category by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category details
 *   put:
 *     tags: [Categories]
 *     summary: Update category
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
 *         description: Category updated successfully
 *   delete:
 *     tags: [Categories]
 *     summary: Delete category
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category deleted successfully
 */
categoryRouter
  .route('/:id')
  .get(getSpecificCategoryValidator, getSpecificCategory)
  .put(updateCategoryValidator, updateCategory)
  .delete(deleteCategoryValidator, deletegetCategory);

export default categoryRouter;
