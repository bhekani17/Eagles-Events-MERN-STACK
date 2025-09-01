import express from 'express';
import { createReview, getReviews } from '../controllers/reviewController.js';

const router = express.Router();

// Public endpoints
router.get('/', getReviews);
router.post('/', createReview);

export default router;
