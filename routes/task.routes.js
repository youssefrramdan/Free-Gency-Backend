import express from 'express';
import {
  createTask,
  getAllTasks,
  getSpecificTask,
  updateSpecificTask,
  deleteSpecificTask,
  addTaskFiles,
  deleteTaskFile,
  getTasksByInterest,
} from '../controllers/task.controller.js';
import { protectedRoutes, allowTo } from '../controllers/auth.controller.js';
import createUploader from '../middlewares/cloudnairyMiddleware.js';

const taskRouter = express.Router();
const upload = createUploader();

// Protect all routes after this middleware
taskRouter.use(protectedRoutes);

// Routes for tasks
taskRouter
  .route('/')
  .get(getAllTasks)
  .post(upload.array('requirment'), createTask);

taskRouter.route('/interests').get(getTasksByInterest);

taskRouter
  .route('/:id')
  .get(getSpecificTask)
  .put(updateSpecificTask)
  .delete(deleteSpecificTask);

// Task Files Routes
taskRouter
  .route('/:taskId/task-files')
  .post(upload.array('taskFiles'), addTaskFiles);

taskRouter.route('/:taskId/task-files/:fileId').delete(deleteTaskFile);

export default taskRouter;
