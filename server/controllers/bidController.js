import Bid from '../models/Bid.js';
import Job from '../models/Job.js';
import Notification from '../models/Notification.js'; 
import { sendRealTimeNotification } from '../config/socket.js';

export const createBid = async (req, res) => {
    try {
        const { jobId, bidAmount, deliveryDays, proposalText } = req.body;

        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ success: false, message: "Target assignment node not found." });
        }

        if (req.user.role !== 'freelancer') {
            return res.status(403).json({ success: false, message: "Security Violation: Only certified freelancers can submit bids." });
        }

        const rawJob = job.toObject();
        const jobOwnerId = job.clientId || job.userId || job.postedBy || job.studentId || rawJob.user || rawJob.client;

        // 1. UNIQUE BID CHECK
        const allBidsForThisJob = await Bid.find({ jobId: jobId });
        const alreadyBid = allBidsForThisJob.some(
            (bid) => String(bid.freelancerId) === String(req.user.id)
        );

        if (alreadyBid) {
            return res.status(400).json({ 
                success: false, 
                message: "You have already submitted a proposal for this assignment."
            });
        }

        // 2. CREATE NEW BID ENTRY
        const newBid = await Bid.create({
            jobId,
            freelancerId: req.user.id,
            bidAmount,
            deliveryDays,
            proposalText
        });

        // 3. NOTIFICATION DISPATCH PIPELINE (For Online/Offline Students)
        const notificationMessage = `A new bid of Rs. ${bidAmount} has been generated on your assignment!`;
        if (jobOwnerId) {
            // STEP A: ALWAYS SAVE TO DATABASE (For Offline System Cache)
            await Notification.create({
                recipientId: jobOwnerId,
                message: notificationMessage,
                jobId: job._id
            });

            // STEP B: SEND LIVE SOCKET PUSH (If Student is Online right now)
            sendRealTimeNotification(jobOwnerId.toString(), 'new_bid_received', {
                message: notificationMessage,
                jobId: job._id
            });
        }

        // 4. CLEAN SINGLE RETURN STATEMENT
        return res.status(201).json({
            success: true,
            message: "Proposal successfully registered and dispatched!",
            bid: newBid
        });

    } catch (error) {
        console.error("Bid Creation Failure:", error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
};