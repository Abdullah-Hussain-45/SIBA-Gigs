import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ibaCampus from '../assets/iba-campus.jpg'; 
import ibaLogo from '../assets/iba-logo.jpg';     

export default function Register() {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'student' });
    const [confirmPassword, setConfirmPassword] = useState(''); // Confirm password state
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // 1. Sukkur IBA Domain Validation Check
        if (!formData.email.endsWith('@iba-suk.edu.pk')) {
            setError('Invalid email domain. Please use your @iba-suk.edu.pk email address.');
            return;
        }

        // 2. IS Policy Check: Password length must be between 8 and 16 characters
        if (formData.password.length < 8 || formData.password.length > 16) {
            setError('Security Policy: Password must be between 8 and 16 characters long.');
            return;
        }

        // 3. Password Matching Validation
        if (formData.password !== confirmPassword) {
            setError('Validation Error: Passwords do not match.');
            return;
        }

        try {
            const res = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (data.success) {
                navigate('/login');
            } else {
                setError(data.message || 'Registration failed.');
            }
        } catch (err) {
            setError('Backend server disconnected.');
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
                    <p className="text-gray-400 text-xs mt-1">Campus Freelance Edge Gateway</p>
                </div>
                
                {error && <div className="p-3 mb-4 bg-red-900/30 border border-red-500 text-red-200 text-sm rounded-lg font-mono">{error}</div>}
                
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Full Name</label>
                        <input type="text" required className="w-full mt-1 px-4 py-3 bg-[#1f1f26] border border-[#2e2e38] rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors" placeholder="Enter your full name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">IBA Email</label>
                        <input type="email" required className="w-full mt-1 px-4 py-3 bg-[#1f1f26] border border-[#2e2e38] rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors" placeholder="username@iba-suk.edu.pk" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Password (8-16 characters)</label>
                        <input type="password" required className="w-full mt-1 px-4 py-3 bg-[#1f1f26] border border-[#2e2e38] rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors" placeholder="••••••••" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                    </div>
                    
                    {/* NEW CONFIRM PASSWORD FIELD */}
                    <div>
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Confirm Password</label>
                        <input type="password" required className="w-full mt-1 px-4 py-3 bg-[#1f1f26] border border-[#2e2e38] rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Campus Account Primary Purpose</label>
                        <select className="w-full mt-1 px-4 py-3 bg-[#1f1f26] border border-[#2e2e38] rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                            <option value="student">I want to hire (Post Assignments)</option>
                            <option value="freelancer">I want to earn (Solve Tasks)</option>
                        </select>
                    </div>
                    <button type="submit" className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-sm transition-colors shadow-lg shadow-emerald-900/20">Create Account</button>
                </form>
                
                <p className="mt-4 text-center text-xs text-gray-500">Already registered? <Link to="/login" className="text-emerald-400 hover:underline cursor-pointer z-20 relative">Secure login here</Link></p>
            </div>
        </div>
    );
}