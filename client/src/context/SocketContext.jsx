import React, { createContext, useEffect, useState, useContext } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext.jsx'; // [source: 1]

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { user } = useContext(AuthContext); // [source: 1]

    useEffect(() => {
        // 🔥 Setup dynamic socket cluster instance connection
        const newSocket = io('http://localhost:5000', {
            autoConnect: true,
            transports: ['websocket', 'polling'],
            withCredentials: false
        });

        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log(">>>> ⚡ [SOCKET CLIENT]: Handshake clear! Socket Connected ID:", newSocket.id);
        });

        newSocket.on('registration_success', () => {
            console.log(">>>> 🎉 [SOCKET CLIENT]: Identity verification cleared on backend cluster node.");
        });

        return () => {
            newSocket.close();
        };
    }, []);

    useEffect(() => {
        // Safe check for User ID extraction parameters
        const currentUserId = user?.id || user?._id || (user && user.id);

        if (socket && currentUserId) {
            console.log(">>>>  [SOCKET CLIENT]: Requesting registration for User ID:", currentUserId);
            socket.emit('register_user', currentUserId);
        }
    }, [socket, user]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};