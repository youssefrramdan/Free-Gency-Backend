import express from 'express';
import {
  createTask,
  getAllTasks,
  getSpecificTask,
  updateSpecificTask,
  deleteSpecificTask,
  addTaskFiles,
  deleteTaskFile,
  getTasksByTeamCategory,
  getAllTasksForClient,
  saveTask,
  unsaveTask,
  getSavedTasks,
  getMyTasksForTeamLeader,
  getMyTasksForTeamMember,
  markAsCompleted,
} from '../controllers/task.controller.js';
import {
  createTaskRequest,
  getTaskRequests,
  acceptTaskRequest,
  rejectTaskRequest,
  deleteTaskRequest,
  getSpecificTaskRequest,
} from '../controllers/taskRequests.controller.js';
import { protectedRoutes, allowTo } from '../controllers/auth.controller.js';
import createUploader from '../middlewares/cloudnairyMiddleware.js';
import {
  createTaskValidator,
  updateTaskValidator,
  getSpecificTaskValidator,
  deleteSpecificTaskValidator,
} from '../utils/validators/taskValidator.js';
import subtasksRouter from './subtasks.routes.js';

const taskRouter = express.Router();
const upload = createUploader('tasksRequirement');
const uploadRequestImage = createUploader('propasl');

// Protect all routes after this middleware
taskRouter.use(protectedRoutes);

// Mount subtasks router
taskRouter.use('/:taskId/subtasks', subtasksRouter);

// Routes for tasks
taskRouter
  .route('/')
  .get(getAllTasks)
  .post(
    upload.single('requirment'),
    allowTo('client', 'teamMember'),
    createTaskValidator,
    createTask
  );

taskRouter
  .route('/category')
  .get(allowTo('teamLeader'), getTasksByTeamCategory);
taskRouter
  .route('/me')
  .get(allowTo('client', 'teamMember'), getAllTasksForClient);
taskRouter
  .route('/my-tasks')
  .get(allowTo('teamLeader'), getMyTasksForTeamLeader);
taskRouter
  .route('/my-assigned-tasks')
  .get(allowTo('teamMember'), getMyTasksForTeamMember);

// Mark task as completed route (Team Leaders only)
taskRouter
  .route('/:id/mark-completed')
  .patch(allowTo('teamLeader'), markAsCompleted);

// Save/Unsave Routes
taskRouter.get('/saved', getSavedTasks);
taskRouter.post('/:id/save', saveTask);
taskRouter.delete('/:id/save', unsaveTask);

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

// Task Requests Routes
taskRouter
  .route('/:taskId/requests')
  .get(getTaskRequests)
  .post(
    uploadRequestImage.array('proposal'),
    allowTo('teamLeader'),
    createTaskRequest
  );

taskRouter.route('/requests/:requestId').get(getSpecificTaskRequest);

taskRouter.use(allowTo('client'));

taskRouter.route('/requests/:requestId/accept').patch(acceptTaskRequest);
taskRouter.route('/requests/:requestId/reject').patch(rejectTaskRequest);
taskRouter.route('/requests/:requestId').delete(deleteTaskRequest);

export default taskRouter;
