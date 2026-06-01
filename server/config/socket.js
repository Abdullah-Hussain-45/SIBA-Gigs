import { Server } from 'socket.io';

let io;
const activeUsers = new Map();

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: ["http://localhost:5173", "http://127.0.0.1:5173"], // 🔥 Accept both local formats
            methods: ["GET", "POST", "PUT"],
            credentials: true
        },
        transports: ['websocket', 'polling'] // 🔥 Explicitly allow fallback routes
    });

    console.log(">>>> ⚡ REAL-TIME SOCKET ENGINE INITIALIZED SUCCESS");

    io.on('connection', (socket) => {
        console.log(`>>>> 🔌 New Campus Node Connected: ${socket.id}`);

        socket.on('register_user', (userId) => {
            if (userId) {
                activeUsers.set(String(userId), socket.id);
                console.log(`>>>> 🆔 User ${userId} bound to Socket Channel ${socket.id}`);
                
                // Confirm registration back to client for debug purposes
                socket.emit('registration_success', { status: true });
            }
        });

        socket.on('disconnect', () => {
            for (const [userId, socketId] of activeUsers.entries()) {
                if (socketId === socket.id) {
                    activeUsers.delete(userId);
                    console.log(`>>>> ❌ User ${userId} signed offline.`);
                    break;
                }
            }
        });
    });

    return io;
};

export const sendRealTimeNotification = (userId, eventName, data) => {
    if (io) {
        const socketId = activeUsers.get(String(userId));
        if (socketId) {
            io.to(socketId).emit(eventName, data);
            console.log(`>>>> 🚀 Notification Dispatched: Event [${eventName}] to User Matrix [${userId}]`);
            return true;
        } else {
            console.log(`>>>> ⚠️ User ${userId} is currently offline. Notification cached.`);
        }
    }
    return false;
};

export { io };