// server/routes/jobRoutes.js
import express from 'express';
import { createJob, getAllOpenJobs, assignJob } from '../controllers/jobController.js';
import { protectRoute } from '../middleware/authMiddleware.js';

const router = express.Router();

// Hamein har route ko login token se protect karna hai
router.post('/create', protectRoute, createJob);
router.get('/open-feed', protectRoute, getAllOpenJobs);
router.post('/assign', protectRoute, assignJob);

export default router;