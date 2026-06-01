// server/routes/authRoutes.js
import express from 'express';
import { registerUser, loginUser, forgotPassword, verifyOtp, resetPassword, updateProfileMatrix } from '../controllers/authController.js';
import { protectRoute } from '../middleware/authMiddleware.js';
import Notification from '../models/Notification.js';

// 🔥 STEP 1: Router ko hamesha pehle initialize karna zaroori hai!
const router = express.Router();

// --- NOTIFICATION ROUTES SYSTEM ---

// Endpoint to fetch unread notifications for logged-in user
router.get('/notifications', protectRoute, async (req, res) => {
    try {
        const list = await Notification.find({ recipientId: req.user.id })
                                       .sort({ createdAt: -1 }); // Nayi notifications pehle
        return res.status(200).json({ success: true, notifications: list });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Error fetching notifications" });
    }
});

// Endpoint to mark notifications as read
router.put('/notifications/read', protectRoute, async (req, res) => {
    try {
        await Notification.updateMany({ recipientId: req.user.id, isRead: false }, { isRead: true });
        return res.status(200).json({ success: true, message: "All cleared" });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Error updating status" });
    }
});

// --- STANDARD USER AUTH ENDPOINTS ---

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);
router.put('/update-profile', protectRoute, updateProfileMatrix);

export default router;