import express from 'express';
import { createBid } from '../controllers/bidController.js';
import  {protectRoute}  from '../middleware/authMiddleware.js';

const router = express.Router();


router.post('/create', protectRoute, createBid);
export default router;