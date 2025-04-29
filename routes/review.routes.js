import express from 'express';
import {
  createReview,
  getReviewsById,
  updateReview,
  deleteReview,
} from '../controllers/review.controller.js';
import { protectedRoutes } from '../controllers/auth.controller.js';

const router = express.Router();

// Apply protect middleware to all routes
router.use(protectedRoutes);

// Create a new review
router.post('/', createReview);

// Get reviews by ID (works for user, project, or team)
router.get('/:id', getReviewsById);

// Update a review
router.patch('/:id', updateReview);

// Delete a review
router.delete('/:id', deleteReview);

export default router;
