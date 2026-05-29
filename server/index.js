
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import bidRoutes from './routes/bidRoutes.js';

// 1. Load Environment Variables (.env variables system mein active karein)
dotenv.config();

// 2. Connect to MongoDB Atlas (Cloud Database Connection)
connectDB();

const app = express();

// 3. Global Middlewares
app.use(cors()); // Client (React) aur Server (Node) ke darmiyan secure requests allow karne k liye
app.use(express.json()); // Backend ko incoming JSON parsing capability dene k liye

// 4. API Routes Mapping
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/payments',paymentRoutes);
app.use('/api/bids', bidRoutes);
// Base Route for Health Check (Testing verification route)
app.get('/', (req, res) => {
    res.send('SIBA-Gigs Server is Running and Secured! 🚀');
});

// 5. Global Error Handler Middleware (Server crash safe pipeline)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Internal Server Error detected.' });
});

// 6. Start listening on Configured Port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server executing successfully in production tier on port: ${PORT}`);
});