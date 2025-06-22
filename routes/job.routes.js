import express from 'express';
import {
  createJob,
  getAllJobs,
  getMyJobs,
  getJobById,
  updateJob,
  deleteJob,
} from '../controllers/job.controller.js';
import { allowTo, protectedRoutes } from '../controllers/auth.controller.js';

const router = express.Router();

// Public routes
router.get('/', protectedRoutes, getAllJobs);
router.get('/me', protectedRoutes, allowTo('teamLeader'), getMyJobs);
router.get('/:id', getJobById);

// Protected routes
router.use(protectedRoutes);

// Job CRUD operations
router.post('/', createJob);
router.put('/:id', updateJob);
router.delete('/:id', deleteJob);

export default router;
