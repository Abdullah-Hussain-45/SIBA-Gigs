import mongoose from 'mongoose';

const depositSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    method: {
        type: String,
        enum: ['easypaisa', 'jazzcash', 'bank'],
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: [1, 'Amount must be positive']
    },
    transactionId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'approved' // Auto-approved for frictionless sandbox testing
    }
}, { timestamps: true });

export default mongoose.model('Deposit', depositSchema);