import express from 'express';
import {
  createJob,
  getAllJobs,
  getMyJobs,
  getJobById,
  updateJob,
  deleteJob,
  getJobsByCategory,
} from '../controllers/job.controller.js';
import { protectedRoutes } from '../controllers/auth.controller.js';

const router = express.Router();

// Public routes
router.get('/', getAllJobs);
router.get('/:id', getJobById);
router.get('/categories/:categoryId/jobs', getJobsByCategory);

// Protected routes
router.use(protectedRoutes);

// Job CRUD operations 
router.post('/', createJob);
router.get('/me', getMyJobs);
router.put('/:id', updateJob);
router.delete('/:id', deleteJob);



export default router;
