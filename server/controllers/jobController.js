// server/controllers/jobController.js
import Job from '../models/Job.js';

// 1. POST A NEW JOB/ASSIGNMENT (Client Only)
export const createJob = async (req, res) => {
    try {
        const { title, description, category, budget } = req.body;

        // Security Validation: Requester must be a student/client
        if (req.user.role !== 'student') {
            return res.status(403).json({ success: false, message: 'Access Denied: Only students can post assignment gigs.' });
        }

        // Create new entry in MongoDB
        const newJob = await Job.create({
            client: req.user.id, // Comes from our protectRoute middleware payload
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
        return res.status(500).json({ success: false, error: error.message });
    }
};

// 2. GET ALL OPEN JOBS (For Freelancers Board)
export const getAllOpenJobs = async (req, res) => {
    try {
        // Sirf wahi jobs nikalna jinka status 'open' hai
        // .populate() se client ka naam aur email automatically join query ho kar aa jayega
        const openJobs = await Job.find({ status: 'open' })
            .populate('client', 'name email')
            .sort({ createdAt: -1 }); // Fresh entries top par aayengi

        return res.status(200).json({
            success: true,
            count: openJobs.length,
            jobs: openJobs
        });

    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

// 3. ASSIGN JOB TO A FREELANCER (Locking the deal)
export const assignJob = async (req, res) => {
    try {
        const { jobId, freelancerId } = req.body;

        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found.' });
        }

        // Verify that only the owner of the job can assign it
        if (job.client.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Unauthorized execution.' });
        }

        // Update Job Status
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