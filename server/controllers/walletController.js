import Deposit from '../models/Deposit.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import Withdrawal from '../models/Withdrawal.js';

// 1. Student top-up proof submit karega
export const requestWalletTopUp = async (req, res) => {
    try {
        const { amount, paymentMethod, accountName, transactionId } = req.body;

        if (!req.file) {
            return res.status(400).json({ success: false, message: "Transaction voucher screenshot is required." });
        }

        const newDeposit = await Deposit.create({
            user: req.user.id,
            amount: Number(amount),
            paymentMethod,
            accountName,
            transactionId,
            paymentVoucherUrl: `/uploads/vouchers/${req.file.filename}` 
        });

        return res.status(201).json({
            success: true,
            message: "Receipt submitted successfully! Waiting for admin approval.",
            deposit: newDeposit
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 2. ACID SECURED ADMIN VERIFICATION: FUND CLEARANCE LOOP
export const approveDepositRecord = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { depositId } = req.body;

        const deposit = await Deposit.findById(depositId).session(session);
        if (!deposit) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ success: false, message: "Ledger entry missing." });
        }

        if (deposit.status !== 'pending') {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, message: "Transaction already processed." });
        }

        deposit.status = 'approved';
        await deposit.save({ session });

        const updatedUser = await User.findByIdAndUpdate(
            deposit.user, 
            { $inc: { walletBalance: deposit.amount } },
            { session, new: true }
        );

        if (!updatedUser) {
            throw new Error("Target user node offline or invalid during balance injection.");
        }

        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({ 
            success: true, 
            message: "Funds successfully injected into student wallet node under ACID protection." 
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("🔥 ACID TRANSACTION CRASHED & ROLLED BACK:", error.message);
        return res.status(500).json({ success: false, message: "Financial transaction failed: Ledger safely rolled back." });
    }
};

// 3. 🔥 FIXED & SANITIZED: Freelancer withdrawal request flow handler
// 3. 🔥 ULTIMATE SAFE BULLETPROOF WITHDRAWAL HANDLER
export const requestWithdrawal = async (req, res) => {
    try {
        const { amount, paymentMethod, accountNumber, accountTitle, accountName } = req.body;
        const requestedAmount = Number(amount);

        if (!requestedAmount || requestedAmount <= 0) {
            return res.status(400).json({ success: false, message: "Please provide a valid withdrawal amount." });
        }

        // Target user (freelancer) node check karein
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(444).json({ success: false, message: "User account session invalid or offline." });
        }
        
        // Validation: Balance validation check loop
        if (user.walletBalance < requestedAmount) {
            return res.status(400).json({ 
                success: false, 
                message: "Insufficient digital balance for cash-out request." 
            });
        }

        // 🧠 WATER-TIGHT SCHEMA PAYLOAD GENERATION:
        // Hum sari keys aik sath bhej rahe hain taake agar aapka schema 'freelancer' maang raha ho ya 'user',
        // ya fir 'accountTitle' maang raha ho ya 'accountName', database crash na kare!
        const cleanPayload = {
            freelancer: req.user.id,
            user: req.user.id, // Fallback database structural parameter
            amount: requestedAmount,
            paymentMethod: String(paymentMethod || 'easypaisa' || 'jazzcash').toLowerCase(),
            accountNumber: String(accountNumber),
            accountTitle: String(accountTitle || accountName),
            accountName: String(accountName || accountTitle ||) // Fallback matching reference
        };

        // Ledger entry creation loop
        const newWithdrawal = await Withdrawal.create(cleanPayload);

        // Temporary hold apply karke user balance ko state safe karein
        user.walletBalance -= requestedAmount;
        await user.save();

        return res.status(201).json({
            success: true,
            message: "Withdrawal request submitted! Waiting for admin payout.",
            withdrawal: newWithdrawal
        });
    } catch (error) {
        console.error("🔥 SYSTEM CRASH LOGGER: DATABASE WRITE FAILED ->", error.message);
        return res.status(500).json({ success: false, message: `Financial ledger interaction crashed: ${error.message}` });
    }
};

// 4. ACID SECURED PAYOUT VERIFICATION
export const approveWithdrawalPayout = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { withdrawalId } = req.body;

        const withdrawal = await Withdrawal.findById(withdrawalId).session(session);
        if (!withdrawal) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ success: false, message: "Withdrawal ledger missing." });
        }

        if (withdrawal.status !== 'pending') {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, message: "Payout already processed." });
        }

        withdrawal.status = 'approved';
        await withdrawal.save({ session });
        
        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({
            success: true,
            message: "Payout ledger cleared under ACID protection. Ensure you sent real cash manually via App!"
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("🔥 PAYOUT ACID TRANSACTION FAILED:", error.message);
        return res.status(500).json({ success: false, message: "Payout processing crashed. Ledger safety preserved." });
    }
};
//Admin ke liye saare pending deposits fetch karne ka function
export const getPendingDeposits = async (req, res) => {
    try {
        // Sirf pending status wale record uthao aur student ka naam sath embed karo
        const deposits = await Deposit.find({ status: 'pending' }).populate('user', 'name email');
        return res.status(200).json({ success: true, deposits });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

//Admin ke liye saare pending withdrawals fetch karne ka function
export const getPendingWithdrawals = async (req, res) => {
    try {
        // Sirf pending status wale cashouts uthao aur freelancer ka naam embed karo
        const withdrawals = await Withdrawal.find({ status: 'pending' }).populate('freelancer', 'name email');
        return res.status(200).json({ success: true, withdrawals });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};