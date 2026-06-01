
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import bidRoutes from './routes/bidRoutes.js';
import http from 'http';
import { initSocket } from './config/socket.js';
import userRoutes from './routes/userRoutes.js';
import walletRoutes from './routes/walletRoutes.js';
import path from 'path';

// 1. Load Environment Variables (.env variables system mein active karein)
dotenv.config();

// 2. Connect to MongoDB Atlas (Cloud Database Connection)
connectDB();
// 3. Initialize Express App and HTTP Server
const app = express();
const server = http.createServer(app);
const io = initSocket(server);
// 4. Initialize Socket.IO for Real-Time Communication

// 5. Global Middlewares
app.use(cors()); // Client (React) aur Server (Node) ke darmiyan secure requests allow karne k liye
app.use(express.json()); // Backend ko incoming JSON parsing capability dene k liye

// 6. API Routes Mapping
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/payments',paymentRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/users', userRoutes);
app.set('io', io);
app.use('/api/wallet', walletRoutes);
app.use('/uploads', express.static('uploads'));
// 7.Base Route for Health Check (Testing verification route)
app.get('/', (req, res) => {
    res.send('SIBA-Gigs Server is Running and Secured! 🚀');
});

// 8. Global Error Handler Middleware (Server crash safe pipeline)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Internal Server Error detected.' });
});

// 9. Start listening on Configured Port
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server executing successfully in production tier on port: ${PORT}`);
});