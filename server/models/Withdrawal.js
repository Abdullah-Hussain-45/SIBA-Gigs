import mongoose from 'mongoose';

const withdrawalSchema = new mongoose.Schema({
    freelancer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: [1, "Amount must be greater than 0"]
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['easypaisa', 'jazzcash', 'bank']
    },
    accountNumber: {
        type: String,
        required: true
    },
    accountTitle: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    }
}, { timestamps: true });

export default mongoose.model('Withdrawal', withdrawalSchema);