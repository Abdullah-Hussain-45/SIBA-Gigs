// server/controllers/authController.js
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

// SMTP LIVE TRANSPORT FOR GMAIL APP PASSWORDS
const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587, 
    secure: false, 
    auth: {
        user: "abdullahmallah468@gmail.com", 
        pass: "dduw stsx acax nqgu"  
    },
    tls: {
        rejectUnauthorized: false 
    }
});

// 1. SIGNUP CONTROLLER
export const registerUser = async (req, res) => {
    try {
        const { name, email, password, role, skills } = req.body;

        const ibaEmailRegex = /^[\w-\.]+@iba-suk\.edu\.pk$/;
        if (!ibaEmailRegex.test(email)) {
            return res.status(400).json({ success: false, message: 'Strict Access: Only Sukkur IBA emails allowed.' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already registered under this email.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 👑 HIDDEN ADMIN OVERWRITE GATE
        let finalRole = role || 'student';
        if (email.trim().toLowerCase() === 'admin@iba-suk.edu.pk') {
            finalRole = 'admin';
        }

        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            role: finalRole, 
            skills: skills || []
        });

        return res.status(201).json({
            success: true,
            message: 'User registered securely on SIBA-Gigs!',
            userId: newUser._id
        });

    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

// 2. LOGIN CONTROLLER
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid academic credentials.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid academic credentials.' });
        }

        // 👑 FIXED: FORCE LOGIN POWER OVERWRITE FOR ADMIN TESTING
        // Agar login karne wala exact email yeh hai, toh database ka role override karke dynamic 'admin' set hoga!
        let activeRole = user.role;
        if (email.trim().toLowerCase() === 'admin@iba-suk.edu.pk') {
            activeRole = 'admin';
        }

        const token = jwt.sign(
            { id: user._id, role: activeRole }, // ✨ Token secure logic override
            process.env.JWT_SECRET,
            { expiresIn: '3d' }
        );

        return res.status(200).json({
            success: true,
            message: `Welcome back, ${user.name}`,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: activeRole, // ✨ Frontend context local state updates directly to admin
                walletBalance: user.walletBalance,
                bio: user.bio,
                skills: user.skills || [] 
            }
        });

    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

// 3. FORGOT PASSWORD - Real Time Gmail OTP Trigger
export const forgotPassword = async (req, res) => {
    const { email } = req.body;
    console.log(">>>>>>>> LIVE TEST: Request Received for:", email);

    try {
        const user = await User.findOne({ email: email.trim() });
        if (!user) {
            return res.status(404).json({ success: false, message: "Account with this IBA email does not exist." });
        }

        const cleanToken = Math.floor(100000 + Math.random() * 900000).toString();
        
        user.resetPasswordToken = cleanToken; 
        user.resetPasswordExpires = Date.now() + 3600000; 
        await user.save();

        console.log(`>>>>>>>> LIVE TEST: Token [${cleanToken}] committed to MongoDB Atlas for ${user.name}`);

        const mailOptions = {
            from: `"SIBA.Gigs Protection" <your-email@gmail.com>`,
            to: email.trim(),
            subject: 'SIBA.Gigs - Account Security Verification OTP',
            html: `<h3>Your Security Key is: ${cleanToken}</h3>`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("❌ NODEMAILER ERROR:", error.message);
                return res.status(500).json({ success: false, message: "SMTP connection failed." });
            }
            return res.json({ success: true, message: "Verification token generated successfully." });
        });

    } catch (err) {
        res.status(500).json({ success: false, message: "Server error during recovery routing." });
    }
};

// 4. VERIFY OTP CONTROLLER - (Frontend Step 2 Sync Handler)
export const verifyOtp = async (req, res) => {
    const { email, otp } = req.body;
    console.log(`>>>>>>>> LIVE TEST: Incoming verification request for: ${email} with OTP: ${otp}`);
    
    try {
        const user = await User.findOne({ email: email.trim() });

        if (!user) {
            console.log("❌ LIVE TEST: Email not found during verification stage.");
            return res.status(400).json({ success: false, message: "User account node missing." });
        }

        console.log(`>>>>>>>> DB STATUS REPORT: Saved Token: [${user.resetPasswordToken}], Current Expiry Diff: ${user.resetPasswordExpires - Date.now()}ms`);

        const isTokenMatch = String(user.resetPasswordToken).trim() === String(otp).trim();
        const isTokenValid = user.resetPasswordExpires > Date.now();

        if (!isTokenMatch || !isTokenValid) {
            console.log(`❌ LIVE TEST: Matching Failed. Match Stat: ${isTokenMatch}, Validity Stat: ${isTokenValid}`);
            return res.status(400).json({ success: false, message: "Invalid or expired OTP token." });
        }

        console.log("✅ LIVE TEST: Token verified! Security checkpoint cleared.");
        return res.json({ success: true, message: "OTP token verified successfully." });

    } catch (err) {
        console.error("❌ VERIFY OTP EXCEPTION:", err.message);
        return res.status(500).json({ success: false, message: "Server authentication error." });
    }
};

// 5. RESET PASSWORD - Updates password parameters inside Atlas Database
export const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;
    try {
        const user = await User.findOne({ 
            email, 
            resetPasswordToken: otp,
            resetPasswordExpires: { $gt: Date.now() } 
        });

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid or expired verification token." });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: "Security Policy: Password must be at least 6 characters." });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ success: true, message: "Password updated successfully. Secure login active." });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error during password override." });
    }
};

// 6 . UPDATE PROFILE MATRIX - Skills and Bio Sync Handler
export const updateProfileMatrix = async (req, res) => {
    const { skills, bio } = req.body;
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        if (bio !== undefined) user.bio = bio;
        
        if (skills !== undefined) {
            user.skills = skills;
        }

        await user.save();
        console.log(`>>>> DATABASE SYNC SUCCESS: New skills stored for ${user.name}:`, user.skills);

        res.json({
            success: true,
            message: "Profile metrics fully synchronized.",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                bio: user.bio,
                skills: user.skills 
            }
        });

    } catch (err) {
        res.status(500).json({ success: false, message: "Matrix synchronization failed" });
    }
};