import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { useNavigate, useLocation } from 'react-router-dom';
import ibaLogo from '../assets/iba-logo.jpg';
import { SocketContext } from '../context/SocketContext.jsx';
import toast from 'react-hot-toast';
import WalletModal from './WalletModal.jsx';

export default function Navbar() {
    const socket = useContext(SocketContext);
    const { user, token, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    // 🔔 Notification & Dynamic Wallet States
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isWalletOpen, setIsWalletOpen] = useState(false);
    const [balance, setBalance] = useState(0);

    // 1. Real-time Self-Dependent Balance Fetching Pipeline
    const fetchBalanceSelf = async () => {
        try {
            const activeToken = token || localStorage.getItem('token');
            if (!activeToken) return;

            const res = await fetch('http://localhost:5000/api/payments/wallet', {
                headers: { 'Authorization': `Bearer ${activeToken}` }
            });
            const data = await res.json();
            if (data.success) {
                setBalance(data.wallet?.walletBalance || 0);
            }
        } catch (err) {
            console.error("Wallet auto-sync thread offline:", err);
        }
    };

    useEffect(() => {
        if (user) {
            fetchBalanceSelf();
        }
    }, [user, location.pathname]);

    // 2. Fetch saved / offline notifications safely when user logs in
    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const activeToken = token || localStorage.getItem('token');
                if (!activeToken) return;

                const res = await fetch('http://localhost:5000/api/auth/notifications', {
                    headers: { 'Authorization': `Bearer ${activeToken}` }
                });
                
                if (!res.ok) return;

                const data = await res.json();
                if (data && data.success) {
                    setNotifications(data.notifications || []);
                }
            } catch (err) {
                console.error("Error loading offline notifications safely:", err);
            }
        };

        if (user) fetchNotifications();
    }, [user, token]);

    // 3. Real-Time Listener (For live incoming bids AND freelancer updates)
    useEffect(() => {
        if (!socket) return;

        // 🟢 A. Student listener: Jab koi freelancer bid lagaye
        socket.on('new_bid_received', (data) => {
            setNotifications(prev => [{ message: data.message, isRead: false, createdAt: new Date() }, ...prev]);
            
            toast.success(data.message, {
                icon: '⚡',
                duration: 5000,
                style: {
                    border: '1px solid #10b981',
                    padding: '16px',
                    color: '#fff',
                    background: '#111827',
                }
            });
            
            fetchBalanceSelf();
        });

        // 🔵 B. Freelancer listener: Jab koi student aapki bid accept kare
        socket.on('notification_received', (data) => {
            if (data.type === 'BID_ACCEPTED') {
                // Dropdown array list mein notification append karo
                setNotifications(prev => [{ message: data.message, isRead: false, createdAt: new Date() }, ...prev]);
                
                // Screen par live dynamic popup toast alert trigger karo
                toast.success(data.message, {
                    icon: '🎉',
                    duration: 6000,
                    style: {
                        border: '1px solid #10b981',
                        padding: '16px',
                        color: '#fff',
                        background: '#111827',
                    }
                });
                
                fetchBalanceSelf();
            }
        });

        return () => {
            socket.off('new_bid_received');
            socket.off('notification_received');
        };
    }, [socket]);

    const handleLogout = () => {
        if (logout) {
            logout();
        } else {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
        navigate('/login', { replace: true });
    };

    const handleMarkAsRead = async () => {
        setShowDropdown(!showDropdown);
        const unreadExists = notifications.some(n => !n.isRead);
        if (!unreadExists) return;

        try {
            const activeToken = token || localStorage.getItem('token');
            await fetch('http://localhost:5000/api/auth/notifications/read', {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${activeToken}` }
            });
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (err) {
            console.error(err);
        }
    };

    const handleNotificationClick = (notification) => {
        setShowDropdown(false); 
        navigate('/history'); 
    };

    const unreadCount = Array.isArray(notifications) ? notifications.filter(n => n && !n.isRead).length : 0;
    const isActive = (path) => location.pathname === path;

    return (
        <nav className="bg-[#16161a] border-b border-[#24242b] px-6 py-4 flex justify-between items-center sticky top-0 z-50">
            {/* BRAND LOGO */}
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
                <img src={ibaLogo} alt="Sukkur IBA Logo" className="w-9 h-9 object-contain" />
                <div className="flex flex-col">
                    <span className="text-xl font-bold tracking-tight text-white leading-none">SIBA<span className="text-emerald-500">.Gigs</span></span>
                    <span className="text-[10px] text-gray-400 tracking-wider font-mono mt-0.5">CAMPUS MARKETPLACE</span>
                </div>
            </div>

            {/* NAVIGATION LINKS & USER METRICS */}
            <div className="flex items-center space-x-3 sm:space-x-4">
                
                {/* 🔔 NOTIFICATION BELL WITH DROPDOWN */}
                {user && (
                    <div className="relative">
                        <button 
                            onClick={handleMarkAsRead}
                            className="bg-[#1f1f26] border border-[#2e2e38] text-gray-300 hover:text-white p-2 rounded-lg relative cursor-pointer"
                        >
                            🔔
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {showDropdown && (
                            <div className="absolute right-0 mt-2 w-80 bg-[#1f1f26] border border-[#2e2e38] rounded-xl shadow-2xl overflow-hidden z-50">
                                <div className="px-4 py-2 border-b border-[#2e2e38] flex justify-between items-center">
                                    <span className="text-xs font-bold text-white uppercase tracking-wider">Notifications</span>
                                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-mono">SIBA-Gigs</span>
                                </div>
                                <div className="max-h-64 overflow-y-auto divide-y divide-[#2e2e38]">
                                    {notifications.length === 0 ? (
                                        <div className="p-4 text-center text-xs text-gray-500 font-mono">No notifications registered yet.</div>
                                    ) : (
                                        notifications.map((n, i) => (
                                            <div 
                                                key={i} 
                                                onClick={() => handleNotificationClick(n)} 
                                                className={`p-3 text-xs transition-colors cursor-pointer hover:bg-[#24242e] ${!n.isRead ? 'bg-emerald-500/5 border-l-2 border-emerald-500 text-white font-medium' : 'text-gray-400'}`}
                                            >
                                                {n.message}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* DYNAMIC CLICKABLE WALLET DISPLAY ELEMENT */}
                <button 
                    onClick={() => setIsWalletOpen(true)}
                    className="bg-[#1f1f26] border border-[#2e2e38] hover:border-emerald-500/40 rounded-lg px-3 py-1.5 flex items-center space-x-2 transition-all cursor-pointer group"
                >
                    <span className="text-[10px] font-semibold text-gray-400 group-hover:text-gray-200 uppercase tracking-wider hidden md:block">Wallet</span>
                    <span className="text-emerald-400 font-bold font-mono text-xs sm:text-sm">Rs.{balance}</span>
                    <span className="text-[10px] text-gray-600 group-hover:text-emerald-400 ml-0.5">➕</span>
                </button>

                {/* 🏠 FEED BUTTON */}
                <button
                    onClick={() => navigate('/dashboard')}
                    className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${isActive('/dashboard') ? 'bg-emerald-600/20 border border-emerald-500 text-emerald-400' : 'bg-[#1f1f26] border border-[#2e2e38] text-gray-300 hover:text-white'}`}
                >
                    Dashboard
                </button>

                {/* 📜 HISTORY BUTTON */}
                <button
                    onClick={() => navigate('/history')}
                    className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${isActive('/history') ? 'bg-emerald-600/20 border border-emerald-500 text-emerald-400' : 'bg-[#1f1f26] border border-[#2e2e38] text-gray-300 hover:text-white'}`}
                >
                    My Projects
                </button>

                {/* 👤 PROFILE BUTTON */}
                <button
                    onClick={() => navigate('/profile')}
                    className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${isActive('/profile') ? 'bg-emerald-600/20 border border-emerald-500 text-emerald-400' : 'bg-[#1f1f26] border border-[#2e2e38] text-gray-300 hover:text-white'}`}
                >
                    Profile
                </button>

                {/* LOGOUT BUTTON */}
                <button 
                    onClick={handleLogout} 
                    className="px-3 py-1.5 text-xs font-semibold uppercase bg-red-950/40 border border-red-900/60 text-red-300 hover:bg-red-900/40 rounded-lg cursor-pointer transition-colors"
                >
                    Logout
                </button>
            </div>

            {/* MOUNTED WALLET MODAL VIEW FOR LOCAL DEPOSITS */}
            <WalletModal 
                isOpen={isWalletOpen} 
                onClose={() => setIsWalletOpen(false)} 
                currentBalance={balance}
                onRefreshBalance={fetchBalanceSelf}
            />
        </nav>
    );
}