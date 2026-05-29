// server/routes/paymentRoutes.js
import express from 'express';
import { depositEscrowFunds, releaseEscrowFunds, getUserWallet } from '../controllers/paymentController.js';
import { protectRoute } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/deposit', protectRoute, depositEscrowFunds);
router.post('/release', protectRoute, releaseEscrowFunds);
router.get('/wallet', protectRoute, getUserWallet);

export default router;