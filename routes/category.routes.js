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
import teamProjectsRouter from './teamProjects.routes.js';

const categoryRouter = express.Router();

// Nested route - Services as Subcategories
categoryRouter.use('/:categoryId/services', servicesRouter);

// Nested route - Projects as Subcategories
categoryRouter.use('/:categoryId/projects', teamProjectsRouter);

categoryRouter
  .route('/')
  .get(getAllCategories)
  .post(createCategoryValidator, createCategory);

categoryRouter
  .route('/:id')
  .get(getSpecificCategoryValidator, getSpecificCategory)
  .put(updateCategoryValidator, updateCategory)
  .delete(deleteCategoryValidator, deletegetCategory);

export default categoryRouter;
