// server/routes/bidRoutes.js
import express from 'express';
import { createBid } from '../controllers/bidController.js';

// Note: Yahan aapko apna JWT auth middleware import karna hoga jo req.user inject karta hai.
// Agar aapki auth file ka naam kuch aur hai (jaise auth.js), toh use update kar lena.
import { protect } from '../middleware/authMiddleware.js'; 

const router = express.Router();

// POST route for creating a new bid (Protected Route)
router.post('/', protect, createBid);

export default router;