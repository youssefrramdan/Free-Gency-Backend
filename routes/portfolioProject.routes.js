import express from 'express';
import {
  createPortfolioProject,
  getAllPortfolioProjects,
  getTeamPortfolioProjects,
  getPortfolioProject,
  updatePortfolioProject,
  deletePortfolioProject,
} from '../controllers/portfolioProject.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Protect all routes after this middleware
router.use(protect);

// Routes for portfolio projects
router
  .route('/')
  .get(getAllPortfolioProjects)
  .post(restrictTo('teamLeader'), createPortfolioProject);

router
  .route('/:id')
  .get(getPortfolioProject)
  .patch(restrictTo('teamLeader'), updatePortfolioProject)
  .delete(restrictTo('teamLeader'), deletePortfolioProject);

// Get portfolio projects by team
router.get('/team/:teamId', getTeamPortfolioProjects);

export default router;
