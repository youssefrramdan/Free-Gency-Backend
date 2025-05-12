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
import projectsRouter from './projects.routes.js';

const categoryRouter = express.Router();
const upload = createUploader("category");

// Nested route - Services as Subcategories
categoryRouter.use('/:categoryId/services', servicesRouter);

// Nested route - Projects as Subcategories
categoryRouter.use('/:categoryId/projects', projectsRouter);

categoryRouter
  .route('/')
  .get(getAllCategories)
  .post(createCategoryValidator, upload.single('imageCover'), createCategory);

categoryRouter
  .route('/:id')
  .get(getSpecificCategoryValidator, getSpecificCategory)
  .put(updateCategoryValidator, upload.single('imageCover'), updateCategory)
  .delete(deleteCategoryValidator, deletegetCategory);

export default categoryRouter;
