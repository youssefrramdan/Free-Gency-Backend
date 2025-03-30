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

const categoryRouter = express.Router();
const upload = createUploader('categoryImages');

// Nested route - Services as Subcategories
categoryRouter.use('/:categoryId/services', servicesRouter);

categoryRouter
  .route('/')
  .get(getAllCategories)
  .post(upload.single('image'), createCategoryValidator, createCategory);
categoryRouter
  .route('/:id')
  .get(getSpecificCategoryValidator, getSpecificCategory)
  .put(upload.single('image'), updateCategoryValidator, updateCategory)
  .delete(deleteCategoryValidator, deletegetCategory);
export default categoryRouter;
