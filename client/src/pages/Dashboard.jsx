import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import Navbar from '../components/Navbar.jsx';
import TaskModal from '../components/TaskModal.jsx';
import BidModal from '../components/BidModal.jsx';
import TopUpModal from '../components/TopUpModal.jsx';
import toast from 'react-hot-toast';
import WalletModal from '../components/WalletModal.jsx';

export default function Dashboard() {
    const { token, user, setUser } = useContext(AuthContext);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBidModalOpen, setIsBidModalOpen] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);
    const [deletingJobId, setDeletingJobId] = useState(null);
    const [isTopUpOpen, setIsTopUpOpen] = useState(false);
    const [isWithdrawalOpen, setIsWithdrawalOpen] = useState(false);
    const [walletBalance, setWalletBalance] = useState(user?.walletBalance || 0);

    // 🟢 Fetch dynamic feed data
    const fetchJobs = useCallback(async () => {
        try {
            const res = await fetch('http://localhost:5000/api/jobs/open-feed', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) setJobs(data.jobs);
        } catch (err) {
            console.error('Jobs feed pipeline offline');
        }
    }, [token]);

    // 🟢 Fetch Wallet Ledger with updated API path and AuthContext state binding
    const fetchWallet = useCallback(async () => {
        try {
            // 🎯 ROUTE FIXED: Updated endpoint path to clear ledger mismatches
            const res = await fetch('http://localhost:5000/api/wallet/pending-withdrawals', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            // Fallback to update balance instantly if user context object exists
            if (user) {
                const freshRes = await fetch('http://localhost:5000/api/wallet/pending-deposits', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const freshData = await freshRes.json();
                if (freshData.success && user) {
                    // Update layout state reference safely
                    setWalletBalance(user.walletBalance || 0);
                }
            }
        } catch (err) {
            console.error('Wallet ledger offline');
        }
    }, [token, user]);

    // Pipeline Orchestration with Safety Cleanup
    useEffect(() => {
        let isMounted = true;

        if (token) {
            Promise.all([fetchJobs(), fetchWallet()]).then(() => {
                if (isMounted) setLoading(false);
            });
        } else {
            setLoading(false);
        }

        return () => {
            isMounted = false;
        };
    }, [token, fetchJobs, fetchWallet]);

    // Real-time UI balance minus update node for freelancer side
    const handleWithdrawalSuccess = (withdrawnAmount) => {
        setWalletBalance((prev) => {
            const nextBalance = prev - withdrawnAmount;
            if (user) {
                const updatedUser = { ...user, walletBalance: nextBalance };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                if (setUser) setUser(updatedUser); // Dynamic update straight to the view-only navbar badge
            }
            return nextBalance;
        });
    };

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
                toast.success('Task posted onto campus feed successfully!', {
                    style: { background: '#111827', color: '#fff', border: '1px solid #10b981' }
                });
                setIsModalOpen(false);
                fetchJobs();
                fetchWallet(); 
            } else {
                toast.error(data.message || 'Failed to post task. Check category or fields.');
            }
        } catch (err) {
            console.error('Failed to sync task onto backend stream');
            toast.error('Server connection lost.');
        }
    };

    // DELETE TASK Confirmation & Pipeline
    const handleDeleteJob = async (jobId) => {
        toast((t) => (
            <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-white">Permanently delete this task?</span>
                <p className="text-xs text-gray-400">All associated bids will also be removed.</p>
                <div className="flex gap-2 mt-1">
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            await executeDelete(jobId);
                        }}
                        className="flex-1 px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white text-xs font-semibold rounded-md transition-colors"
                    >
                        Yes, Delete
                    </button>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="flex-1 px-3 py-1.5 bg-[#2a2a33] hover:bg-[#333] text-gray-300 text-xs font-medium rounded-md transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        ), {
            duration: 8000,
            style: { background: '#1a1a22', border: '1px solid #ef444440', color: '#fff', padding: '14px' }
        });
    };

    const executeDelete = async (jobId) => {
        setDeletingJobId(jobId);
        try {
            const res = await fetch(`http://localhost:5000/api/jobs/delete/${jobId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (data.success) {
                setJobs((prevJobs) => prevJobs.filter((job) => job._id !== jobId));
                toast.success('Task removed successfully.', {
                    icon: '🗑️',
                    style: { background: '#111827', color: '#fff', border: '1px solid #ef4444' }
                });
                fetchWallet(); 
            } else {
                toast.error(data.message || 'Deletion failed. Access denied.');
            }
        } catch (err) {
            console.error('Delete pipeline error:', err);
            toast.error('Server synchronization lost during deletion.');
        } finally {
            setDeletingJobId(null);
        }
    };

    const handleBidSubmit = async (bidPayload) => {
        try {
            const activeToken = token || localStorage.getItem('token');
            if (!activeToken) {
                toast.error('Session token missing. Please login again.');
                return;
            }

            const res = await fetch('http://localhost:5000/api/bids/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${activeToken}`
                },
                body: JSON.stringify(bidPayload)
            });

            const data = await res.json();

            if (data.success) {
                toast.success('Proposal successfully registered and dispatched!', {
                    style: { background: '#111827', color: '#fff', border: '1px solid #10b981' }
                });
                setIsBidModalOpen(false);
            } else {
                toast.error(data.message || 'Bid submission rejected.');
            }
        } catch (err) {
            console.error('Bidding transaction pipeline offline:', err);
            toast.error('Server synchronization lost.');
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center w-screen h-screen bg-black space-y-4">
                <div className="w-9 h-9 border-2 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin"></div>
                <p className="text-[11px] text-gray-500 font-mono tracking-widest uppercase animate-pulse">
                    Loading Records...
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f0f12] text-gray-200 font-sans">
            {/* 🔄 Key binding guarantees total navbar re-render synchronizations immediately */}
            <Navbar key={walletBalance} />

            <main className="max-w-7xl mx-auto px-6 py-8">
                <div className="flex justify-between items-center mb-8 bg-[#131317] p-6 rounded-xl border border-zinc-900 shadow-sm">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Available Gigs</h1>
                        <p className="text-gray-400 text-xs mt-1">Explore active tasks posted by students across Sukkur IBA.</p>
                    </div>

                    {user?.role === 'student' && (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsTopUpOpen(true)}
                                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-sm transition-all cursor-pointer shadow-lg shadow-emerald-900/10 active:scale-[0.98]"
                            >
                                + Add Funds
                            </button>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-sm transition-all cursor-pointer shadow-lg shadow-emerald-900/10 active:scale-[0.98]"
                            >
                                + Post New Task
                            </button>
                        </div>
                    )}

                    {user?.role === 'freelancer' && (
                        <div className="flex items-center gap-4 bg-[#18181c] px-4 py-2 rounded-lg border border-zinc-800">
                            <div className="text-right">
                                <span className="text-[10px] text-zinc-500 block font-mono uppercase tracking-wider">Available Balance</span>
                                <span className="text-sm font-bold text-emerald-400 font-mono">Rs. {walletBalance}</span>
                            </div>
                            <button
                                onClick={() => setIsWithdrawalOpen(true)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-md transition-all cursor-pointer active:scale-[0.97]"
                            >
                                Withdraw Funds
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {jobs.length === 0 ? (
                        <div className="col-span-full bg-[#121215]/80 backdrop-blur-md border border-[#24242b] rounded-xl p-12 text-center text-gray-500 font-mono text-sm tracking-wide">
                            No active projects logged right now.
                        </div>
                    ) : (
                        jobs.map((job) => {
                            const ownerId = job.client?._id || job.client;
                            const currentUserId = user?._id || user?.id;
                            const isOwner = String(ownerId) === String(currentUserId);
                            const isDeleting = deletingJobId === job._id;

                            return (
                                <div
                                    key={job._id}
                                    className={`bg-[#121215]/90 backdrop-blur-sm border rounded-xl p-6 transition-all shadow-xl flex flex-col justify-between ${
                                        isDeleting
                                            ? 'border-red-900/60 opacity-50 pointer-events-none'
                                            : isOwner
                                            ? 'border-amber-500/20 hover:border-amber-500/40'
                                            : 'border-[#24242b] hover:border-emerald-500/30'
                                    }`}
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-4">
                                            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-950/60 border border-emerald-800 text-emerald-400 uppercase tracking-wider">
                                                {job.category}
                                            </span>
                                            <span className="text-emerald-400 font-mono font-bold">
                                                Rs. {job.budget.toLocaleString()}
                                            </span>
                                        </div>
                                        <h3 className="text-base font-bold text-white mb-2">{job.title}</h3>
                                        <p className="text-gray-400 text-xs line-clamp-3 mb-6">{job.description}</p>
                                    </div>

                                    <div className="border-t border-[#24242b] pt-4 mt-auto flex justify-between items-center gap-2">
                                        <div className="text-[11px] min-w-0">
                                            <span className="text-gray-500 block">Posted by</span>
                                            <span className="text-gray-300 font-medium truncate block">
                                                {job.client?.name || 'IBA Student'}
                                            </span>
                                        </div>

                                        {user?.role === 'freelancer' && !isOwner && (
                                            <button
                                                onClick={() => {
                                                    setSelectedJob(job);
                                                    setIsBidModalOpen(true);
                                                }}
                                                className="px-3 py-1.5 bg-[#1f1f26] hover:bg-emerald-600 border border-[#2e2e38] text-xs font-medium text-white rounded-md transition-all cursor-pointer flex-shrink-0"
                                            >
                                                Bid Task
                                            </button>
                                        )}

                                        {isOwner && (
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <span className="text-[10px] font-mono font-bold uppercase px-2 py-1 bg-[#1f1f26] border border-[#2e2e38] text-amber-400 rounded">
                                                    Your Task 📌
                                                </span>

                                                <button
                                                    onClick={() => handleDeleteJob(job._id)}
                                                    disabled={isDeleting}
                                                    title="Delete this task"
                                                    className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-900 hover:border-red-700 text-red-400 hover:text-red-300 text-xs font-medium rounded-md transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                                                >
                                                    {isDeleting ? (
                                                        <>
                                                            <span className="w-3 h-3 border border-red-500 border-t-transparent rounded-full animate-spin inline-block" />
                                                            <span>Deleting...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <polyline points="3 6 5 6 21 6" />
                                                                <path d="M19 6l-1 14H6L5 6" />
                                                                <path d="M10 11v6M14 11v6" />
                                                                <path d="M9 6V4h6v2" />
                                                            </svg>
                                                            <span>Delete</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
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

            <TopUpModal isOpen={isTopUpOpen} onClose={() => setIsTopUpOpen(false)} onTopUpSuccess={fetchWallet} />

            <WalletModal 
                isOpen={isWithdrawalOpen} 
                onClose={() => setIsWithdrawalOpen(false)} 
                currentBalance={walletBalance} 
                onWithdrawalSuccess={handleWithdrawalSuccess} 
            />
        </div>
    );
}