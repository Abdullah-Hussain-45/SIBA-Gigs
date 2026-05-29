import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import ibaCampus from '../assets/iba-campus.jpg'; 
import ibaLogo from '../assets/iba-logo.jpg';     

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const res = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            
            if (data.success) {
                login(data.user, data.token); 
                navigate('/dashboard'); 
            } else {
                setError(data.message || 'Invalid credentials.');
            }
        } catch (err) {
            setError('Backend architecture unreachable.');
        }
    };

    return (
        <div 
            className="min-h-screen flex items-center justify-center px-4 bg-cover bg-center relative"
            style={{ backgroundImage: `url(${ibaCampus})` }} 
        >
            <div className="absolute inset-0 bg-[#0f0f12]/90 backdrop-blur-sm"></div>

            <div className="max-w-md w-full bg-[#16161a]/95 border border-[#24242b] rounded-xl p-8 shadow-2xl relative z-10 my-8">
                
                <div className="flex flex-col items-center mb-6">
                    <img src={ibaLogo} alt="Sukkur IBA Logo" className="w-20 h-auto mb-3 object-contain" />
                    <h2 className="text-2xl font-bold text-white tracking-tight">SIBA<span className="text-emerald-500">.Gigs</span></h2>
                    <p className="text-gray-400 text-xs mt-1">Authorized Campus Gateway Session</p>
                </div>
                
                {error && <div className="p-3 mb-4 bg-red-900/30 border border-red-500 text-red-200 text-sm rounded-lg font-mono">{error}</div>}
                
                <form className="space-y-4" onSubmit={handleLogin}>
                    <div>
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Campus Email</label>
                        <input type="email" required className="w-full mt-1 px-4 py-3 bg-[#1f1f26] border border-[#2e2e38] rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors" placeholder="username@iba-suk.edu.pk" value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                    
                    <div>
                        {/* Label aur Forgot Password link ko ek hi line mein flex kiya hai */}
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Security Password</label>
                            <Link to="/forgot-password" className="text-xs text-red-400 hover:underline hover:text-red-300 transition-colors">
                                Forgot password?
                            </Link>
                        </div>
                        <input type="password" required className="w-full mt-1 px-4 py-3 bg-[#1f1f26] border border-[#2e2e38] rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
                    </div>

                    <button type="submit" className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-sm transition-colors shadow-lg shadow-emerald-900/20">Authorize Terminal</button>
                </form>
                
                <p className="mt-6 text-center text-xs text-gray-500">
                    New to the marketplace?{' '}
                    <Link to="/register" className="text-emerald-400 hover:underline cursor-pointer font-medium">
                        Register a new account
                    </Link>
                </p>
            </div>
        </div>
    );
}