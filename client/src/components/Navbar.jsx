// client/src/components/Navbar.jsx
import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { useNavigate, useLocation } from 'react-router-dom';
import ibaLogo from '../assets/iba-logo.jpg';

export default function Navbar({ walletBalance }) {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation(); // Active page highlight karne ke liye

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    // Active button styling helper
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

                {/* LIVE WALLET LEDGER */}
                <div className="bg-[#1f1f26] border border-[#2e2e38] rounded-lg px-3 py-1.5 flex items-center space-x-2">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider hidden md:block">Balance</span>
                    <span className="text-emerald-400 font-bold font-mono text-xs sm:text-sm">Rs. {walletBalance || 0}</span>
                </div>

                {/* 🏠 DASHBOARD BUTTON */}
                <button
                    onClick={() => navigate('/dashboard')}
                    className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${isActive('/dashboard')
                            ? 'bg-emerald-600/20 border border-emerald-500 text-emerald-400'
                            : 'bg-[#1f1f26] border border-[#2e2e38] text-gray-300 hover:text-white'
                        }`}
                >
                    Feed 🏠
                </button>

                {/* 📜 HISTORY BUTTON */}
                <button
                    onClick={() => navigate('/history')}
                    className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${isActive('/history')
                            ? 'bg-emerald-600/20 border border-emerald-500 text-emerald-400'
                            : 'bg-[#1f1f26] border border-[#2e2e38] text-gray-300 hover:text-white'
                        }`}
                >
                    History 📜
                </button>

                {/* 👤 PROFILE SECTION BUTTON (Yeh missing tha!) */}
                <button
                    onClick={() => navigate('/profile')}
                    className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${isActive('/profile')
                            ? 'bg-emerald-600/20 border border-emerald-500 text-emerald-400'
                            : 'bg-[#1f1f26] border border-[#2e2e38] text-gray-300 hover:text-white'
                        }`}
                >
                    Profile 👤
                </button>

                {/* LOGOUT BUTTON */}
                <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider bg-red-950/40 border border-red-900/60 text-red-300 hover:bg-red-900/40 rounded-lg transition-colors cursor-pointer"
                >
                    Logout
                </button>
            </div>
        </nav>
    );
}