import express from 'express';
import createUploader from '../middlewares/cloudnairyMiddleware.js';
import {
  createService,
  deleteSpecificService,
  getAllServices,
  getSpecificService,
  updateSpecificService,
} from '../controllers/services.controller.js';
import { createServiceValidator, deleteServiceValidator, getSpecificServiceValidator, updateServiceValidator } from '../utils/validators/serviceValidator.js';

const servicesRouter = express.Router();
const upload = createUploader('categoryImages');

servicesRouter
  .route('/')
  .get(getAllServices)
  .post(upload.single('image'), createServiceValidator, createService);
servicesRouter
  .route('/:id')
  .get(getSpecificServiceValidator, getSpecificService)
  .put(upload.single('image'), updateServiceValidator, updateSpecificService)
  .delete(deleteServiceValidator, deleteSpecificService);

export default servicesRouter;
