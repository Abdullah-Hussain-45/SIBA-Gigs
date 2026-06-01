// server/models/Job.js
import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, enum: ['Programming', 'Report/BBA Business Plans', 'Graphic Design/PPT', 'Video Editing', 'Assignments'], required: true },
    budget: { type: Number, required: true },
    status: { type: String, enum: ['open', 'assigned', 'submitted', 'completed', 'cancelled'], default: 'open' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    escrowBalance: { type: Number, default: 0 },
    submission: { type: String, default: "" },
    submissionText: { type: String, default: "" }
}, { timestamps: true });

export default mongoose.model('Job', jobSchema);