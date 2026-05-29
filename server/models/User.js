// server/models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { 
        type: String, 
        required: true, 
        unique: true,
        match: [/^[\w-\.]+@iba-suk\.edu\.pk$/, 'Please use a valid Sukkur IBA email address']
    },
    password: { type: String, required: true },
    role: { type: String, enum: ['student', 'freelancer', 'admin'], default: 'student' },
    skills: [{ type: String }],
    walletBalance: { type: Number, default: 0 },
    pendingBalance: { type: Number, default: 0 }, // Funds currently tied up in escrow

    //TWO EXACT PARAMETERS FOR SECURE OTP RESET CHANNELS
    resetPasswordToken: { 
        type: String, 
        default: undefined 
    },
    resetPasswordExpires: { 
        type: Date, 
        default: undefined 
    }
}, { timestamps: true });

export default mongoose.model('User', userSchema);