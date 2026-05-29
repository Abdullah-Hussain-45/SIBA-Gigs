// server/models/Bid.js
import mongoose from 'mongoose';

const bidSchema = new mongoose.Schema({
    jobId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Job', 
        required: true 
    },
    freelancerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    bidAmount: { 
        type: Number, 
        required: true 
    },
    deliveryDays: { 
        type: Number, 
        required: true 
    },
    proposalText: { 
        type: String, 
        required: true 
    },
    status: { 
        type: String, 
        enum: ['pending', 'accepted', 'rejected'], 
        default: 'pending' 
    }
}, { timestamps: true });

export default mongoose.model('Bid', bidSchema);