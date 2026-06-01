import express from 'express';
import User from '../models/User.js';
import { protectRoute } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/freelancer/:id', protectRoute, async (req, res) => {
    try {
        const freelancer = await User.findById(req.params.id)
            .select('name email skills totalCompletedTasks averageRating role');
        
        if (!freelancer || freelancer.role !== 'freelancer') {
            return res.status(404).json({ success: false, message: "Freelancer portfolio record is offline." });
        }
        return res.status(200).json({ success: true, freelancer });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

export default router;