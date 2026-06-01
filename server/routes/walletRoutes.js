import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { 
    requestWalletTopUp, 
    approveDepositRecord,
    requestWithdrawal,
    approveWithdrawalPayout,
    getPendingDeposits,    // 🔥 NEW
    getPendingWithdrawals  // 🔥 NEW
} from '../controllers/walletController.js';
import { protectRoute } from '../middleware/authMiddleware.js';

const router = express.Router();

const dir = './uploads/vouchers';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/vouchers/');
    },
    filename: (req, file, cb) => {
        cb(null, `topup-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage });

// Student Top-up Endpoints
router.post('/topup', protectRoute, upload.single('paymentVoucher'), requestWalletTopUp);
router.post('/approve-topup', protectRoute, approveDepositRecord);
router.get('/pending-deposits', protectRoute, getPendingDeposits); // 🔥 NEW

// Freelancer Withdrawal Endpoints
router.post('/withdraw', protectRoute, requestWithdrawal);
router.post('/approve-payout', protectRoute, approveWithdrawalPayout);
router.get('/pending-withdrawals', protectRoute, getPendingWithdrawals); // 🔥 NEW

export default router;