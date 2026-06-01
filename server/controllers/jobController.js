// server/controllers/jobController.js
import Job from '../models/Job.js';
import Bid from '../models/Bid.js'; 
import User from '../models/User.js';  
import Review from '../models/Review.js';
import Notification from '../models/Notification.js'; 
import mongoose from 'mongoose'; 

// 1. POST A NEW JOB/ASSIGNMENT (Client Only)
export const createJob = async (req, res) => {
    try {
        const { title, description, category, budget } = req.body;

        if (req.user.role !== 'student') {
            return res.status(403).json({ success: false, message: 'Access Denied: Only students can post assignment gigs.' });
        }

        const newJob = await Job.create({
            client: req.user.id, 
            title,
            description,
            category,
            budget
        });

        return res.status(201).json({
            success: true,
            message: 'Assignment job posted successfully on SIBA-Gigs!',
            job: newJob
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 2. GET ALL OPEN JOBS (For Freelancers Board)
export const getAllOpenJobs = async (req, res) => {
    try {
        const openJobs = await Job.find({ status: 'open' })
            .populate('client', 'name email')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: openJobs.length,
            jobs: openJobs
        });

    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

// 3. ASSIGN JOB TO A FREELANCER 
export const assignJob = async (req, res) => {
    try {
        const { jobId, freelancerId } = req.body;

        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found.' });
        }

        if (job.client.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Unauthorized execution.' });
        }

        job.status = 'assigned';
        job.assignedTo = freelancerId;
        await job.save();

        return res.status(200).json({
            success: true,
            message: 'Job successfully assigned to freelancer. System moving to escrow hold phase!',
            job
        });

    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

// 4. DELETE JOB + CASCADE DELETE ASSOCIATED BIDS
export const deleteJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({ success: false, message: 'Task not found.' });
        }

        if (job.client.toString() !== req.user.id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized: You can only delete your own tasks.'
            });
        }

        await Bid.deleteMany({ jobId: req.params.id });
        await Job.findByIdAndDelete(req.params.id);

        return res.status(200).json({
            success: true,
            message: 'Task and all associated bids permanently removed from the matrix.'
        });

    } catch (err) {
        console.error('Delete Error:', err);
        return res.status(500).json({ success: false, message: 'Server error during deletion.' });
    }
};

// 5. ACCEPT BID & ESCROW LOCK PIPELINE (🔒 UPGRADED WITH ACID TRANSACTIONS & MULTI-VOUCHER)
export const acceptBid = async (req, res) => {
    // 1. ACID Transaction Session Init
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { jobId, bidId } = req.body;

        // Validation Checks using the active transactional session
        const job = await Job.findById(jobId).session(session);
        if (!job) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ success: false, message: "Target assignment node not found." });
        }
        if (String(job.client) !== String(req.user.id)) {
            await session.abortTransaction();
            session.endSession();
            return res.status(403).json({ success: false, message: "Unauthorized execution block." });
        }

        const chosenBid = await Bid.findById(bidId).session(session);
        if (!chosenBid) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ success: false, message: "Selected bid proposal has expired." });
        }

        const student = await User.findById(req.user.id).session(session);
        if (student.walletBalance < chosenBid.bidAmount) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, message: "Insufficient credit balance. Please top-up your wallet." });
        }

        // =========================================================
        // 🔥 MUTATION BLOCK (ALL OR NOTHING EXECUTION)
        // =========================================================

        // OPERATION A: Deduct balance from student wallet node safely
        await User.findByIdAndUpdate(req.user.id, { $inc: { walletBalance: -chosenBid.bidAmount } }, { session });
        
        // OPERATION B: Update job parameters
        const updatedJob = await Job.findByIdAndUpdate(
            jobId,
            {
                $set: {
                    status: 'assigned',
                    assignedTo: new mongoose.Types.ObjectId(chosenBid.freelancerId),
                    escrowBalance: Number(chosenBid.bidAmount)
                }
            },
            { new: true, runValidators: true, session }
        );

        // OPERATION C: Update bid workflow statuses
        await Bid.findByIdAndUpdate(bidId, { status: 'accepted' }, { session });
        await Bid.updateMany({ jobId, _id: { $ne: bidId } }, { status: 'rejected' }, { session });

        // OPERATION D: Document Insertion Matching Your Real Escrow Schema
        // Checks if req.file came from Multer (EasyPaisa/JazzCash/Bank proof), otherwise uses automatic default wallet voucher
        const dynamicVoucherUrl = req.file 
            ? `/uploads/vouchers/${req.file.filename}` 
            : "https://siba-gigs.com/vouchers/wallet-transfer.png"; //

        if (mongoose.connection.db) {
            await mongoose.connection.db.collection('escrows').insertOne({
                job: new mongoose.Types.ObjectId(jobId),                  //
                client: new mongoose.Types.ObjectId(req.user.id),          //
                freelancer: new mongoose.Types.ObjectId(chosenBid.freelancerId), //
                amount: Number(chosenBid.bidAmount),                      //
                status: 'held',                                           //
                paymentVoucherUrl: dynamicVoucherUrl,                     //
                createdAt: new Date(),
                updatedAt: new Date()
            }, { session });
        }

        // 🔥 COMMIT TRANSACTION: Hapaar do database permanent entry
        await session.commitTransaction();
        session.endSession();

        // =========================================================
        // 🚀 LIVE NOTIFICATION PIPELINE (Runs Post-Commit Safely)
        // =========================================================
        try {
            const messageString = `${student.name} has accepted your bid for "${updatedJob.title}". Check your active projects.`;

            await Notification.create({
                recipientId: chosenBid.freelancerId,
                message: messageString,
                jobId: jobId
            });

            const io = req.app.get('io'); 
            if (io) {
                console.log(`📡 Emitting Live Socket push to Freelancer ID Room: ${chosenBid.freelancerId}`);
                io.to(String(chosenBid.freelancerId)).emit('notification_received', {
                    type: 'BID_ACCEPTED',
                    title: 'Proposal Accepted! 🎉',
                    message: messageString,
                    jobId: jobId
                });
            }
        } catch (notifErr) {
            console.error("Non-blocking notification pipeline bypass:", notifErr.message);
        }

        return res.status(200).json({ 
            success: true, 
            message: "Bid accepted under ACID sync. Funds safely locked inside platform escrow container.", 
            job: updatedJob 
        });
        
    } catch (error) {
        // 🔄 ROLLBACK CHANGES: Undo transactions on exception trigger
        await session.abortTransaction();
        session.endSession();
        console.error("🔥 ESCROW ACQUISITION TRANSACTION ROLLED BACK:", error.message);
        return res.status(500).json({ success: false, message: "Transaction failed: Credit ledger rolled back securely." });
    }
};

// 6. FREELANCER TASK SUBMISSION ROUTINE (Pure JavaScript Fix)
export const submitWork = async (req, res) => {
    try {
        const { jobId, submissionText, submission } = req.body;
        const actualLink = submissionText || submission;

        if (!actualLink || actualLink.trim() === "") {
            return res.status(400).json({ success: false, message: "Payload error: Submission link cannot be empty." });
        }

        const targetJob = await Job.findById(jobId);
        if (!targetJob) {
            return res.status(404).json({ success: false, message: "Job matrix document not found." });
        }

        targetJob.status = 'submitted';
        targetJob.submission = String(actualLink).trim();
        targetJob.submissionText = String(actualLink).trim();

        await targetJob.save();

        return res.status(200).json({
            success: true,
            message: "Deliverables successfully committed to database node.",
            job: targetJob
        });

    } catch (error) {
        console.error("🔥 CRITICAL BACKEND SUBMIT WORK ERROR:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 7. APPROVAL, ESCROW DISPATCH & RATING SYSTEM CACHE (🔒 UPGRADED WITH ACID TRANSACTIONS)
export const approveAndReleasePayout = async (req, res) => {
    // 1. Start Mongoose Session
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { jobId, rating, comment } = req.body;

        const job = await Job.findById(jobId).session(session);
        if (!job) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ success: false, message: "Target job node offline." });
        }
        if (String(job.client) !== String(req.user.id)) {
            await session.abortTransaction();
            session.endSession();
            return res.status(403).json({ success: false, message: "Action unauthorized." });
        }

        const payoutAmount = job.escrowBalance;
        const freelancerId = job.assignedTo;

        // OPERATION A: Credit the freelancer's wallet account node safely
        const updatedFreelancer = await User.findByIdAndUpdate(
            freelancerId, 
            { $inc: { walletBalance: payoutAmount, totalCompletedTasks: 1 } },
            { session, new: true }
        );

        if (!updatedFreelancer) {
            throw new Error("Freelancer structural target node offline.");
        }

        // OPERATION B: Clear job escrow balance track and complete state
        job.status = 'completed';
        job.escrowBalance = 0;
        await job.save({ session });

        // OPERATION C: Update Escrow Collection Status Enum Matching Escrow.js
        if (mongoose.connection.db) {
            await mongoose.connection.db.collection('escrows').updateOne(
                { 
                    job: new mongoose.Types.ObjectId(jobId), //
                    status: 'held'
                },
                {
                    $set: {
                        status: 'released_to_freelancer', //
                        updatedAt: new Date()
                    }
                },
                { session }
            );
            console.log("🎯 [ESCROW TRANSACTION]: Shifted to released_to_freelancer state block.");
        }

        // 🔥 COMMIT TRANSACTION
        await session.commitTransaction();
        session.endSession();

        // =========================================================
        // 🚀 POST-COMMIT PROCESSORS: Review and Rating mappings
        // =========================================================
        if (rating && comment) {
            try {
                await Review.create({
                    studentId: req.user.id,
                    freelancerId,
                    jobId,
                    rating: Number(rating),
                    comment
                });

                const allReviews = await Review.find({ freelancerId });
                const avgRating = allReviews.reduce((acc, curr) => acc + curr.rating, 0) / allReviews.length;

                await User.findByIdAndUpdate(freelancerId, { averageRating: avgRating.toFixed(1) });
            } catch (reviewErr) {
                console.error("Non-critical Review matrix execution fail:", reviewErr.message);
            }
        }

        return res.status(200).json({ success: true, message: "Assignment approved. Escrow vault unlocked and payout cleared safely." });
    } catch (error) {
        // 🔄 ROLLBACK PAYOUT
        await session.abortTransaction();
        session.endSession();
        console.error("🔥 ESCROW DISPATCH SYSTEM ROLLED BACK:", error.message);
        return res.status(500).json({ success: false, message: "Payout operation rejected: Ledgers secured." });
    }
};

// 8. GET STUDENT'S OWN POSTED PROJECTS + FORCE LOOKUP BIDS
export const getStudentProjects = async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ success: false, message: 'Access Denied: Only students can view this repository.' });
        }

        const myJobs = await Job.find({ client: req.user.id })
            .populate('assignedTo', 'name email')
            .sort({ createdAt: -1 });

        const jobsWithBids = await Promise.all(myJobs.map(async (job) => {
            const associatedBids = await Bid.find({
                $or: [
                    { jobId: job._id },
                    { jobId: String(job._id) }
                ]
            }).populate('freelancerId', 'name email averageRating totalCompletedTasks skills');

            const jobObj = job.toObject();
            jobObj.bids = associatedBids; 
            return jobObj;
        }));

        return res.status(200).json({
            success: true,
            count: jobsWithBids.length,
            jobs: jobsWithBids
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 9. GET FREELANCER'S ACTIVE CONTRACTS 
export const getFreelancerProjects = async (req, res) => {
    try {
        if (req.user.role !== 'freelancer') {
            return res.status(403).json({ success: false, message: 'Access Denied: Freelancers only.' });
        }

        const assignedJobs = await Job.find({
            $or: [
                { assignedTo: req.user.id },
                { assignedTo: String(req.user.id) }
            ]
        })
        .populate('client', 'name email')
        .sort({ updatedAt: -1 });

        return res.status(200).json({
            success: true,
            count: assignedJobs.length,
            jobs: assignedJobs
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};