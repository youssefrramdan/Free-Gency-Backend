import express from 'express';
import {
  addTaskFiles,
  createClientTask,
  deleteTaskFile,
  getAllClientTasks,
  getClientTask,
  updateClientTask,
  deleteClientTask,
  createFilterObject,
} from '../controllers/clientTasks.controller.js';
import { protectedRoutes  , allowTo} from '../controllers/auth.controller.js';
import createUploader from '../middlewares/cloudnairyMiddleware.js';

const router = express.Router();
const upload = createUploader();

// Protect all routes after this middleware
router.use(protectedRoutes);

// Routes for client tasks
router
  .route('/')
  .get(createFilterObject, getAllClientTasks)
  .post(upload.array('requirment'), createClientTask);

router
  .route('/:id')
  .get(getClientTask)
  .put(updateClientTask)
  .delete(deleteClientTask);

// Task Files Routes
router.route('/:id/task-files').post(upload.array('taskFiles'), addTaskFiles);

router.route('/:taskId/task-files/:fileId').delete(deleteTaskFile);


export default router;
