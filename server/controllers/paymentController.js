// server/controllers/paymentController.js
import mongoose from 'mongoose';
import Escrow from '../models/Escrow.js';
import User from '../models/User.js';
import Job from '../models/Job.js';

// 1. DEPOSIT FUNDS INTO ESCROW (Client notifies system of payment)
export const depositEscrowFunds = async (req, res) => {
    try {
        const { jobId, freelancerId, amount, paymentVoucherUrl } = req.body;

        // Create an escrow document with status 'held'
        const newEscrow = await Escrow.create({
            job: jobId,
            client: req.user.id,
            freelancer: freelancerId,
            amount,
            status: 'held',
            paymentVoucherUrl // Standard flow mein yeh frontend se image secure link hoga
        });

        return res.status(201).json({
            success: true,
            message: 'Funds successfully locked in system escrow. Freelancer can proceed securely!',
            escrow: newEscrow
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

// 2. RELEASE FUNDS TO FREELANCER (ACID Transaction Loop)
export const releaseEscrowFunds = async (req, res) => {
    const { escrowId } = req.body;

    // Multi-Document ACID transaction ke liye session shuru karein
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Escrow document locate karein session context ke andar
        const escrow = await Escrow.findById(escrowId).session(session);
        
        if (!escrow || escrow.status !== 'held') {
            throw new Error('Transaction invalid or already processed.');
        }

        // Security check: Only the client who deposited can release funds
        if (escrow.client.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Unauthorized ledger execution.' });
        }

        const commissionAmount = escrow.amount * 0.20; // 20% SIBA-Gigs Maintenance Fee
        const freelancerPayout = escrow.amount - commissionAmount; // 80% net payout

        // Operation A: Change Escrow State
        escrow.status = 'released_to_freelancer';
        await escrow.save({ session });

        // Operation B: Update Freelancer Wallet Balance
        await User.findByIdAndUpdate(
            escrow.freelancer,
            { $inc: { walletBalance: freelancerPayout } },
            { session, runValidators: true }
        );

        // Operation C: Update Admin Account Wallet Balance (Your Profit Split)
        await User.findByIdAndUpdate(
            process.env.ADMIN_ID,
            { $inc: { walletBalance: commissionAmount } },
            { session }
        );

        // Operation D: Update the Job status to completed
        await Job.findByIdAndUpdate(
            escrow.job,
            { status: 'completed' },
            { session }
        );

        // Agar saare steps upar wale smoothly execute hue to save permanent (Commit)
        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({ 
            success: true, 
            message: 'Funds released smoothly. Commission split auto-transferred securely!' 
        });

    } catch (error) {
        // ATOMICITY GUARD: Agar koi ek step crash hua, rollback complete architecture!
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json({ success: false, message: 'Transaction rolled back safely.', error: error.message });
    }
};

// 3. GET USER WALLET LEDGER
export const getUserWallet = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('walletBalance name role');
        return res.status(200).json({ success: true, wallet: user });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};