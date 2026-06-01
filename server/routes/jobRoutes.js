// server/routes/jobRoutes.js
import express from 'express';
import { 
    createJob, 
    getAllOpenJobs, 
    getStudentProjects,
    getFreelancerProjects,
    assignJob, 
    deleteJob,
    acceptBid,
    submitWork,            
    approveAndReleasePayout
} from '../controllers/jobController.js';
import { protectRoute } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected behind JWT auth middleware
router.post('/create', protectRoute, createJob);
router.get('/open-feed', protectRoute, getAllOpenJobs);
router.post('/assign', protectRoute, assignJob);
router.delete('/delete/:id', protectRoute, deleteJob);
router.post('/accept-bid', protectRoute, acceptBid);
router.post('/submit-work', protectRoute, submitWork);
router.post('/approve-payout', protectRoute, approveAndReleasePayout);
router.get('/my-projects', protectRoute, getStudentProjects);
router.get('/freelancer-projects', protectRoute, getFreelancerProjects);

export default router;