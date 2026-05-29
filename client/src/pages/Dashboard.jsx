import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import Navbar from '../components/Navbar.jsx'; 
import TaskModal from '../components/TaskModal.jsx';
import BidModal from '../components/BidModal.jsx'; 

export default function Dashboard() {
    const { token, user } = useContext(AuthContext);
    const [jobs, setJobs] = useState([]);
    const [wallet, setWallet] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false); 
    const [isBidModalOpen, setIsBidModalOpen] = useState(false); 
    const [selectedJob, setSelectedJob] = useState(null); 

    useEffect(() => {
        // 1. Fetch Open Jobs Feed from server
        const fetchJobs = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/jobs/open-feed', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) setJobs(data.jobs);
            } catch (err) {
                console.error("Jobs feed pipeline offline");
            }
        };

        // 2. Fetch Wallet Balance securely
        const fetchWallet = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/payments/wallet', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) setWallet(data.wallet.walletBalance);
            } catch (err) {
                console.error("Wallet ledger offline");
            }
        };

        if (token) {
            Promise.all([fetchJobs(), fetchWallet()]).then(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [token]);

    // Task posting backend sync channel
    const handleTaskPosted = async (taskData) => {
        try {
            const res = await fetch('http://localhost:5000/api/jobs/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(taskData)
            });
            const data = await res.json();
            if (data.success) {
                alert('Task broadcasted successfully onto campus matrix feed!');
                window.location.reload();
            }
        } catch (err) {
            console.error("Failed to sync task onto backend stream");
        }
    };

    // Single source of truth for bid submission
    const handleBidSubmit = async (bidPayload) => {
        try {
            const res = await fetch('http://localhost:5000/api/bids/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(bidPayload)
            });
            const data = await res.json();
            if (data.success) {
                alert('Proposal successfully registered and dispatched to student!');
                window.location.reload();
            } else {
                alert(data.message || 'Bid submission rejected.');
            }
        } catch (err) {
            console.error("Bidding transaction pipeline offline");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f0f12] flex items-center justify-center text-emerald-400 font-mono tracking-widest text-xs">
                INITIALIZING TERMINAL DATA PIPELINE...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f0f12] text-gray-200 font-sans">
            <Navbar walletBalance={wallet} />

            <main className="max-w-7xl mx-auto px-6 py-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Active Assignments Feed</h1>
                        <p className="text-gray-400 text-xs mt-1">Real-time peer-to-peer task ecosystem inside Sukkur IBA</p>
                    </div>
                    
                    {/* Show "+ Post New Job" only if user is logged in as a student */}
                    {user?.role === 'student' && (
                        <button 
                            onClick={() => setIsModalOpen(true)} 
                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-sm transition-colors shadow-lg shadow-emerald-900/20 cursor-pointer"
                        >
                            + Post New Task
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {jobs.length === 0 ? (
                        <div className="col-span-full bg-[#16161a] border border-dashed border-[#24242b] rounded-xl p-12 text-center text-gray-500 font-mono text-sm">
                            --- NO ACTIVE TASKS ON CAMPUS FEED RIGHT NOW ---
                        </div>
                    ) : (
                        jobs.map((job) => {
                            // Extracting exact IDs cleanly to prevent mismatch errors
                            const ownerId = job.clientId?._id || job.clientId;
                            const currentUserId = user?._id || user?.id;
                            const isOwner = String(ownerId) === String(currentUserId);

                            return (
                                <div key={job._id} className="bg-[#16161a] border border-[#24242b] hover:border-emerald-500/40 rounded-xl p-6 transition-all shadow-xl flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-4">
                                            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-950/60 border border-emerald-800 text-emerald-400 uppercase">
                                                {job.category}
                                            </span>
                                            <span className="text-emerald-400 font-mono font-bold">
                                                Rs. {job.budget}
                                            </span>
                                        </div>
                                        <h3 className="text-base font-bold text-white mb-2">{job.title}</h3>
                                        <p className="text-gray-400 text-xs line-clamp-3 mb-6">{job.description}</p>
                                    </div>
                                    
                                    <div className="border-t border-[#24242b] pt-4 mt-auto flex justify-between items-center">
                                        <div className="text-[11px]">
                                            <span className="text-gray-500 block">Posted by</span>
                                            <span className="text-gray-300 font-medium">{job.clientId?.name || job.client?.name || "IBA Student"}</span>
                                        </div>

                                        {/* 🔥 STRICT UI FILTER: Freelancer dekh sakta hai agar task kisi aur ka ho */}
                                        {user?.role === 'freelancer' && !isOwner && (
                                            <button 
                                                onClick={() => {
                                                    setSelectedJob(job);
                                                    setIsBidModalOpen(true);
                                                }}
                                                className="px-3 py-1.5 bg-[#1f1f26] hover:bg-emerald-600 border border-[#2e2e38] text-xs font-medium text-white rounded-md transition-all cursor-pointer"
                                            >
                                                Bid Task 🚀
                                            </button>
                                        )}

                                        {/* 🔥 OWNER BADGE: Agar task user ka apna hi hai */}
                                        {isOwner && (
                                            <span className="text-[10px] font-mono font-bold uppercase px-2 py-1 bg-[#1f1f26] border border-[#2e2e38] text-amber-400 rounded">
                                                Your Posted Task 📌
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </main>

            <TaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onTaskPosted={handleTaskPosted} />

            <BidModal 
                isOpen={isBidModalOpen} 
                onClose={() => setIsBidModalOpen(false)} 
                selectedJob={selectedJob} 
                onBidSubmitted={handleBidSubmit} 
            />
        </div>
    );
}