import mongoose from 'mongoose';

const depositSchema = new mongoose.Schema({
    // ✨ FIXED: 'userId' ko badal kar 'user' kar diya taake controller aur population loop crash na ho
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // ✨ FIXED: 'method' ko 'paymentMethod' kiya taake req.body se direct matching ho sake
    paymentMethod: {
        type: String,
        enum: ['easypaisa', 'jazzcash', 'bank'],
        required: true,
        lowercase: true // Automatic string ko lowercase rakhega
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
    // 📸 Student ke liye voucher image link table reference
    paymentVoucherUrl: {
        type: String,
        required: true
    },
    // ✨ FIXED: Default status ko 'pending' kiya taake admin pehle raseed manually verify kare!
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending' 
    }
}, { timestamps: true });

export default mongoose.model('Deposit', depositSchema);