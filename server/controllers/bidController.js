
import Bid from '../models/Bid.js';
import Job from '../models/Job.js';

export const createBid = async (req, res) => {
    const { jobId, bidAmount, deliveryDays, proposalText } = req.body;
    
    try {
        // Find the job to verify the owner
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ success: false, message: "Target assignment node not found." });
        }

        // 🔥 RULE 1: Strict Role Validation
        if (req.user.role !== 'freelancer') {
            return res.status(403).json({ success: false, message: "Security Violation: Only certified freelancers can submit bids." });
        }

        // 🔥 RULE 2: Anti-Self Bidding Guardrail
        if (job.clientId.toString() === req.user.id.toString()) {
            return res.status(400).json({ success: false, message: "Operation Aborted: You cannot submit a proposal to your own posted assignment." });
        }

        // Check if freelancer already bid on this task
        const existingBid = await Bid.findOne({ jobId, freelancerId: req.user.id });
        if (existingBid) {
            return res.status(400).json({ success: false, message: "You have already submitted a proposal for this task." });
        }

        // Create and save the new bid
        const newBid = await Bid.create({
            jobId,
            freelancerId: req.user.id,
            bidAmount,
            deliveryDays,
            proposalText
        });

        res.status(201).json({ success: true, message: "Proposal successfully registered!", record: newBid });

    } catch (err) {
        console.error("Bid Creation Error:", err.message);
        res.status(500).json({ success: false, message: "Internal server validation failure." });
    }
};