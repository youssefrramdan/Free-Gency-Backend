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
import projectsRouter from './projects.routes.js';

// mergeParams: Allow us to access params on other routers
// ex: We need to access param --> (categoryId) from category router

const servicesRouter = express.Router({ mergeParams: true });
const upload = createUploader('servicesImages');
// Nested route - Projects as Subcategories
servicesRouter.use('/:serviceId/projects', projectsRouter);

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
