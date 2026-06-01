import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        
        if (storedUser && storedUser !== "undefined" && storedToken) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (error) {
                console.error("Failed to parse user session metadata");
                localStorage.clear();
            }
        }
        setLoading(false);
    }, [token]);

    // Login function to save state session safely
    const login = (userData, userToken) => {
        localStorage.setItem('token', userToken);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // 🔥 ORDER COUNTS: Token setting triggers user assignment matrix reconstruction
        setToken(userToken);
        setUser(userData);
    };

    // Logout function to clear session securely
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading, setUser, setToken }}>
            {children}
        </AuthContext.Provider>
    );
};