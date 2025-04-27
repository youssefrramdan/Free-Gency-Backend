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
  getAllMyTasks,
} from '../controllers/task.controller.js';
import { protectedRoutes, allowTo } from '../controllers/auth.controller.js';
import createUploader from '../middlewares/cloudnairyMiddleware.js';
import {
  createTaskValidator,
  updateTaskValidator,
  getSpecificTaskValidator,
  deleteSpecificTaskValidator,
} from '../utils/validators/taskValidator.js';

const taskRouter = express.Router();
const upload = createUploader();

// Protect all routes after this middleware
taskRouter.use(protectedRoutes);

// Routes for tasks
taskRouter
  .route('/')
  .get(getAllTasks)
  .post(upload.array('requirment'), createTaskValidator, createTask);

taskRouter.route('/interests').get(getTasksByInterest);
taskRouter.route('/me').get(getAllMyTasks);

taskRouter
  .route('/:id')
  .get(getSpecificTaskValidator, getSpecificTask)
  .put(updateTaskValidator, updateSpecificTask)
  .delete(deleteSpecificTaskValidator, deleteSpecificTask);

// Task Files Routes
taskRouter
  .route('/:taskId/task-files')
  .post(upload.array('taskFiles'), addTaskFiles);

taskRouter.route('/:taskId/task-files/:fileId').delete(deleteTaskFile);

export default taskRouter;
