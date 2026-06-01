import mongoose from 'mongoose';
import Escrow from '../models/Escrow.js';
import User from '../models/User.js';
import Job from '../models/Job.js';
import Review from '../models/Review.js'; // 🔥 New: To handle automated post-payout feedback loop

// 1. LOCAL PAYMENT WALLET TOP-UP SYSTEM (EasyPaisa / JazzCash / Bank Transfer Sandbox)
// Client or Freelancer inputs TxID and Amount to credit their SIBA.Gigs Wallet
export const depositEscrowFunds = async (req, res) => {
    try {
        const { method, amount, transactionId } = req.body;

        // Validation for local mock payment fields
        if (!method || !amount || !transactionId) {
            return res.status(400).json({ success: false, message: "All transaction verification parameters are required." });
        }

        const cleanTxID = transactionId.trim().toUpperCase();
        
        // Simulating auto-approval/instant database validation logic for local sandbox testing
        // Instead of writing to a static file, we directly append the balance credit dynamically
        await User.findByIdAndUpdate(req.user.id, {
            $inc: { walletBalance: Number(amount) }
        });

        return res.status(201).json({
            success: true,
            message: `Sandbox Verification Success. Rs. ${amount} successfully credited to your wallet via ${method.toUpperCase()}. (TxID: ${cleanTxID})`
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

// 2. RELEASE FUNDS TO FREELANCER WITH AUTOMATED COMMISSION & REVIEW CAPABILITIES (ACID Transaction)
export const releaseEscrowFunds = async (req, res) => {
    const { escrowId, rating, comment } = req.body; // 🔥 Added rating tokens from UI forms

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
            await session.abortTransaction();
            session.endSession();
            return res.status(401).json({ success: false, message: 'Unauthorized ledger execution.' });
        }

        const commissionAmount = escrow.amount * 0.20; // 20% SIBA-Gigs Maintenance Fee
        const freelancerPayout = escrow.amount - commissionAmount; // 80% net payout

        // Operation A: Change Escrow State
        escrow.status = 'released_to_freelancer';
        await escrow.save({ session });

        // Operation B: Update Freelancer Wallet Balance and track task milestones
        await User.findByIdAndUpdate(
            escrow.freelancer,
            { $inc: { walletBalance: freelancerPayout, totalCompletedTasks: 1 } },
            { session, runValidators: true }
        );

        // Operation C: Update Admin Account Wallet Balance (Your Profit Split)
        // Checks if ADMIN_ID environment token exists, otherwise fallbacks safely
        const targetAdmin = process.env.ADMIN_ID || req.user.id; 
        await User.findByIdAndUpdate(
            targetAdmin,
            { $inc: { walletBalance: commissionAmount } },
            { session }
        );

        // Operation D: Update the Job status to completed
        await Job.findByIdAndUpdate(
            escrow.job,
            { status: 'completed' },
            { session }
        );

        // 🔥 Operation E: Real-time Review and Star Rating Injection Inside the Transaction pipeline
        if (rating && comment) {
            await Review.create([{
                studentId: req.user.id,
                freelancerId: escrow.freelancer,
                jobId: escrow.job,
                rating: Number(rating),
                comment: comment.trim()
            }], { session });

            // Fetch all reviews for this specific freelancer to dynamically calculate rolling average score
            // Passing session context to maintain dynamic schema calculations integrity before commit
            const allFreelancerReviews = await Review.find({ freelancerId: escrow.freelancer }).session(session);
            
            const dynamicTotal = allFreelancerReviews.reduce((sum, item) => sum + item.rating, 0) + Number(rating);
            const dynamicAverage = dynamicTotal / (allFreelancerReviews.length + 1);

            await User.findByIdAndUpdate(
                escrow.freelancer,
                { averageRating: Number(dynamicAverage.toFixed(1)) },
                { session }
            );
        }

        // Agar saare steps upar wale smoothly execute hue to save permanent (Commit)
        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({ 
            success: true, 
            message: 'Funds released smoothly. Commission split and ratings data processed securely!' 
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