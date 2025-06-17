import express from 'express';
import {
  createSubTask,
  getSubTasks,
  getSpecificSubTask,
  updateSubTask,
  deleteSubTask,
  addComment,
  updateStatus,
} from '../controllers/subtasks.controller.js';
import { allowTo, protectedRoutes } from '../controllers/auth.controller.js';

const router = express.Router({ mergeParams: true });

// Protect all routes
router.use(protectedRoutes);

// Routes for /api/v1/tasks/:taskId/subtasks
router.route('/').post(allowTo('teamLeader'), createSubTask).get(getSubTasks);
// Routes for /api/v1/subtasks/:id
router
  .route('/:id')
  .get(getSpecificSubTask)
  .put(updateSubTask)
  .delete(deleteSubTask);

// Additional routes
router.post('/:id/comments', addComment);
router.patch('/:id/status', updateStatus);

export default router;
