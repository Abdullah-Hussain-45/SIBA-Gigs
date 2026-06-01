import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import Navbar from '../components/Navbar.jsx';

export default function Profile() {
    const { user, token, setUser } = useContext(AuthContext);
    const [isEditing, setIsEditing] = useState(false);
    
    // 🔥 SAFE RECONCILIATION: Arrays aur strings ko database structure ke mutabiq load karein
    const [name, setName] = useState(user?.name || '');
    const [skills, setSkills] = useState(Array.isArray(user?.skills) ? user.skills.join(', ') : '');
    const [bio, setBio] = useState(user?.bio || '');
    const [message, setMessage] = useState('');

    // Jab bhi context mein user load ho, input fields sync ho jayein
    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setSkills(Array.isArray(user.skills) ? user.skills.join(', ') : '');
            setBio(user.bio || '');
        }
    }, [user]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setMessage('');

        // 🔥 CRITICAL FIX: Comma separated string ko saaf-suthray Array mein convert karein
        const skillsArray = skills.split(',').map(s => s.trim()).filter(s => s !== "");

        try {
            // ⚠️ ROUTE CHECK: Apne routes folder mein check karlein ke link 'update-profile' hai ya 'update-profile-matrix'
            const res = await fetch('http://localhost:5000/api/auth/update-profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name, skills: skillsArray, bio }) // Clean array formats dispatched!
            });
            const data = await res.json();
            
            if (data.success) {
                // Global context aur localStorage ko structured state se sync karein
                const updatedUser = { 
                    ...user, 
                    name: data.user.name, 
                    skills: data.user.skills, 
                    bio: data.user.bio 
                };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setMessage('Profile updated successfully!');
                setIsEditing(false);
            } else {
                setMessage(data.message || 'Profile update failed.');
            }
        } catch (err) {
            console.error('Profile network sync offline', err);
            setMessage('Network error: Could not connect to authentication cluster.');
        }
    };

    return (
        <div className="min-h-screen bg-[#0f0f12] text-gray-200 font-sans">
            <Navbar />

            <main className="max-w-3xl mx-auto px-6 py-12">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white tracking-tight">Account Profile</h1>
                    <p className="text-gray-400 text-xs mt-1">Manage your personal details, bio, and technical skill sets.</p>
                </div>

                {message && (
                    <div className="p-3 mb-6 bg-emerald-900/30 border border-emerald-500 text-emerald-200 text-sm rounded-lg font-mono">
                        {message}
                    </div>
                )}

                <div className="bg-[#16161a] border border-[#24242b] rounded-xl p-8 shadow-2xl space-y-6">
                    <div className="flex items-center space-x-4 pb-6 border-b border-[#24242b]">
                        <div className="w-16 h-16 rounded-full bg-emerald-600/20 border border-emerald-500 flex items-center justify-center text-emerald-400 text-2xl font-bold font-mono">
                            {name ? name.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">{name || "Abdullah Hussain Mallah"}</h3>
                            <p className="text-xs text-gray-400 font-mono">{user?.email || 'username@iba-suk.edu.pk'}</p>
                            <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-emerald-950/60 border border-emerald-800 text-emerald-400">
                                {user?.role || 'Student'}
                            </span>
                        </div>
                    </div>

                    {!isEditing ? (
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Bio / Description</h4>
                                <p className="text-sm text-gray-300 mt-1 bg-[#1f1f26] p-3 rounded-lg border border-[#2e2e38] font-sans leading-relaxed">
                                    {bio || "Computer Science student at Sukkur IBA University."}
                                </p>
                            </div>

                            <div>
                                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Professional Core Skillsets</h4>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {user?.skills && user.skills.length > 0 ? (
                                        user.skills.map((skill, index) => (
                                            <span key={index} className="px-3 py-1 bg-[#1f1f26] border border-[#2e2e38] text-xs font-mono rounded-md text-gray-300">
                                                {skill}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-xs text-gray-500 italic">No skills registered in database node.</span>
                                    )}
                                </div>
                            </div>

                            <button 
                                onClick={() => setIsEditing(true)}
                                className="mt-4 px-4 py-2.5 bg-[#1f1f26] hover:bg-[#24242b] text-sm font-semibold text-emerald-400 border border-[#2e2e38] rounded-lg transition-colors cursor-pointer w-full sm:w-auto"
                            >
                                Update Profile
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Full Display Name</label>
                                <input type="text" required className="w-full mt-1 px-4 py-2.5 bg-[#1f1f26] border border-[#2e2e38] rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors" value={name} onChange={e => setName(e.target.value)} />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Bio / Identity Parameters</label>
                                <textarea rows="3" className="w-full mt-1 px-4 py-2.5 bg-[#1f1f26] border border-[#2e2e38] rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors resize-none" value={bio} onChange={e => setBio(e.target.value)} />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Skills (Comma Separated)</label>
                                <input type="text" className="w-full mt-1 px-4 py-2.5 bg-[#1f1f26] border border-[#2e2e38] rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors font-mono" value={skills} onChange={e => setSkills(e.target.value)} placeholder="React, Node.js, Python, Machine Learning" />
                            </div>

                            <div className="flex space-x-3 pt-2">
                                <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 bg-[#1f1f26] hover:bg-[#24242b] text-gray-400 rounded-lg text-sm border border-[#2e2e38] transition-colors cursor-pointer">Cancel</button>
                                <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-sm shadow-lg transition-colors cursor-pointer">Save Changes</button>
                            </div>
                        </form>
                    )}
                </div>
            </main>
        </div>
    );
}