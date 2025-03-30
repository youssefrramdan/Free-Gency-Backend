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

const categoryRouter = express.Router();
const upload = createUploader('categoryImages');

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
