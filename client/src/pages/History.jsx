import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import Navbar from '../components/Navbar.jsx';
import toast from 'react-hot-toast';

export default function History() {
    const { token, user } = useContext(AuthContext);
    const [historyJobs, setHistoryJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Portal Interactivity Modals State
    const [selectedFreelancer, setSelectedFreelancer] = useState(null);
    const [activeSubmissionJob, setActiveSubmissionJob] = useState(null);
    const [submissionText, setSubmissionText] = useState('');
    const [activeRatingJob, setActiveRatingJob] = useState(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');

    const fetchHistoryPipeline = async () => {
        try {
            const endpoint = user?.role === 'student' 
                ? 'http://localhost:5000/api/jobs/my-projects' 
                : 'http://localhost:5000/api/jobs/freelancer-projects';

            const res = await fetch(endpoint, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            
            if (data.success) {
                setHistoryJobs(data.jobs);
            }
        } catch (err) {
            toast.error("Failed to map historical transactions matrix.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if (token && user) fetchHistoryPipeline(); }, [token, user]);

    const handleAcceptBid = async (jobId, bidId) => {
        try {
            const res = await fetch('http://localhost:5000/api/jobs/accept-bid', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ jobId, bidId })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message, { icon: '🔒' });
                fetchHistoryPipeline();
            } else {
                toast.error(data.message);
            }
        } catch (err) { toast.error("Escrow sequence locked by connection exception."); }
    };

    const handleWorkSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                jobId: activeSubmissionJob,
                submission: String(submissionText)
            };

            const res = await fetch('http://localhost:5000/api/jobs/submit-work', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(payload)
            });
            
            const data = await res.json();
            if (data.success) {
                toast.success("Deliverables dispatched across escrow stream.");
                setSubmissionText('');
                setActiveSubmissionJob(null);
                fetchHistoryPipeline();
            } else {
                toast.error(data.message || "Submission rejected by pipeline.");
            }
        } catch (err) { 
            toast.error("Submission failed due to server connection."); 
        }
    };

    const handlePayoutAndRate = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:5000/api/jobs/approve-payout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ jobId: activeRatingJob, rating: Number(rating), comment })
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Escrow funds released safely to target node.");
                setActiveRatingJob(null);
                setComment('');
                setRating(5);
                fetchHistoryPipeline();
            } else {
                toast.error(data.message);
            }
        } catch (err) { toast.error("Payout approval error."); }
    };

    const viewFreelancerProfile = async (id) => {
        try {
            const res = await fetch(`http://localhost:5000/api/users/freelancer/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) setSelectedFreelancer(data.freelancer);
        } catch (err) { toast.error("Profile view channel exception."); }
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
        <div className="min-h-screen bg-[#0f0f12] text-gray-200">
            <Navbar />
            <main className="max-w-6xl mx-auto px-6 py-10">
                <h1 className="text-2xl font-bold text-white mb-2">Manage Your Projects</h1>
                <p className="text-sm text-gray-400 mb-8 font-mono">Track your active orders, submissions, payments, and task status.</p>

                <div className="space-y-6">
                    {historyJobs.length === 0 ? (
                        <div className="bg-[#16161a] border border-[#24242b] rounded-xl p-12 text-center font-mono text-gray-500 text-sm">No active projects found.</div>
                    ) : (
                        historyJobs.map((job) => (
                            <div key={job._id} className="bg-[#16161a] border border-[#24242b] rounded-xl p-6 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-bold text-white">{job.title}</h3>
                                        <span className="text-[10px] font-mono uppercase bg-[#1f1f26] border border-[#2e2e38] px-2 py-0.5 rounded text-amber-400 mt-1 inline-block">Status: {job.status}</span>
                                    </div>
                                    <div className="text-right font-mono">
                                        <p className="text-emerald-400 font-bold">Budget: Rs. {job.budget}</p>
                                        {job.escrowBalance > 0 && <p className="text-xs text-amber-500">🔒 Escrow Hold: Rs. {job.escrowBalance}</p>}
                                    </div>
                                </div>

                                {/* STUDENT VIEW: INCOMING BIDS MATRIX */}
                                {user?.role === 'student' && job.status === 'open' && (
                                    <div className="bg-[#0f0f12] p-4 rounded-lg border border-[#24242b] space-y-2">
                                        <p className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">FREELANCER BIDS & PROPOSALS</p>
                                        {job.bids && job.bids.length > 0 ? (
                                            <div className="space-y-3 mt-2">
                                                {job.bids.map((bid) => (
                                                    <div key={bid._id} className="flex justify-between items-center p-2.5 bg-[#16161a] border border-[#24242b] rounded-md">
                                                        <span onClick={() => viewFreelancerProfile(bid.freelancerId?._id || bid.freelancerId)} className="text-xs text-gray-300 font-medium hover:text-emerald-400 cursor-pointer transition-colors underline">
                                                            View Freelancer Portfolio
                                                        </span>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xs font-mono font-bold text-emerald-400">Rs. {bid.bidAmount}</span>
                                                            <button onClick={() => handleAcceptBid(job._id, bid._id)} className="text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded transition-colors font-medium cursor-pointer">Accept Bid</button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-xs text-gray-500 italic">No bids received yet. Waiting for freelancer proposals...</div>
                                        )}
                                    </div>
                                )}

                                {/* FREELANCER VIEW: ASSIGNED CONTRACT SUBMISSION */}
                                {user?.role === 'freelancer' && job.status === 'assigned' && (
                                    <button onClick={() => setActiveSubmissionJob(job._id)} className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-semibold text-white rounded-lg transition-all cursor-pointer">Submit Deliverables Link</button>
                                )}

                                {/* STUDENT VIEW: CONTRACT VERIFICATION AND RELEASE TRIGGER */}
                                {user?.role === 'student' && job.status === 'submitted' && (
                                    <div className="bg-[#1d1d24] border border-amber-900/40 rounded-lg p-4 space-y-3 block w-full mt-2">
                                        <p className="text-sm font-semibold text-white tracking-tight">Submitted Deliverables</p>
                                        
                                        <div className="bg-[#0f0f12] p-3 rounded border border-[#24242b] shadow-inner flex flex-col space-y-1.5">
                                            <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 font-semibold">Click the link below to verify work:</span>
                                            
                                            {(() => {
                                                const finalLink = job.submission || job.submissionText;
                                                if (finalLink && finalLink.trim().length > 0) {
                                                    const formattedHref = finalLink.startsWith('http') ? finalLink : `https://${finalLink}`;
                                                    return (
                                                        <a 
                                                            href={formattedHref}
                                                            target="_blank" 
                                                            rel="noopener noreferrer" 
                                                            className="text-xs font-mono text-emerald-400 hover:text-emerald-300 underline break-all font-medium transition-all cursor-pointer inline-block flex items-center gap-1.5"
                                                        >
                                                            {finalLink} 🔗 <span className="text-[10px] text-gray-500 font-sans no-underline font-normal"></span>
                                                        </a>
                                                    );
                                                } else {
                                                    return (
                                                        <span className="text-xs font-mono text-amber-500 italic">
                                                            No link string extracted from data pipeline database stream.
                                                        </span>
                                                    );
                                                }
                                            })()}
                                        </div>
                                        
                                        <div className="flex pt-1">
                                            <button 
                                                onClick={() => setActiveRatingJob(job._id)} 
                                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition-all cursor-pointer shadow-md shadow-emerald-950/30"
                                            >
                                                Approve Delivery & Settle Funds
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </main>

            {/* FREELANCER MINI PORTFOLIO MODAL INTERACTION */}
            {selectedFreelancer && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#16161a] border border-[#24242b] p-6 rounded-xl w-full max-w-xs relative text-center">
                        <button onClick={() => setSelectedFreelancer(null)} className="absolute top-3 right-3 text-gray-500 hover:text-white cursor-pointer">✕</button>
                        <div className="w-12 h-12 rounded-full bg-emerald-950 border border-emerald-500 flex items-center justify-center text-emerald-400 font-bold mx-auto text-lg mb-3">{selectedFreelancer.name ? selectedFreelancer.name[0] : 'F'}</div>
                        <h4 className="text-white font-bold">{selectedFreelancer.name}</h4>
                        <p className="text-xs text-emerald-400 font-mono mt-0.5">Rating: ⭐ {selectedFreelancer.averageRating || "0.0"}</p>
                        <div className="border-t border-[#24242b] my-4 pt-3 text-left space-y-2 text-xs">
                            <p className="text-gray-400"><span className="text-gray-500 font-mono">Tasks Completed:</span> {selectedFreelancer.totalCompletedTasks}</p>
                            <p className="text-gray-400"><span className="text-gray-500 font-mono">Skills:</span> {selectedFreelancer.skills?.join(', ') }</p>
                        </div>
                    </div>
                </div>
            )}

            {/* WORK SUBMISSION COMPILER INJECTOR */}
            {activeSubmissionJob && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <form onSubmit={(e) => handleWorkSubmit(e)} className="bg-[#16161a] border border-[#24242b] p-6 rounded-xl w-full max-w-md space-y-4">
                        <h3 className="text-md font-bold text-white">Upload Task Submission</h3>
                        <textarea 
                            rows="4" 
                            name="submissionText"
                            value={submissionText} 
                            onChange={(e) => setSubmissionText(e.target.value)} 
                            placeholder="Provide GitHub repository url, Google Drive Link or Any other URL for Tasks" 
                            className="w-full bg-[#0f0f12] border border-[#24242b] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 resize-none" 
                            required
                        ></textarea>
                        <div className="flex justify-end gap-2 text-xs font-semibold">
                            <button type="button" onClick={() => { setActiveSubmissionJob(null); setSubmissionText(''); }} className="bg-[#1f1f26] px-3 py-2 rounded text-gray-400 border border-[#24242b] hover:text-white transition-colors cursor-pointer">Abort</button>
                            <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded text-white transition-colors cursor-pointer">Submit Final Work</button>
                        </div>
                    </form>
                </div>
            )}

            {/* TRANSACTION PAYOUT APPROVAL & RATING MODAL */}
            {activeRatingJob && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40" onClick={() => { setActiveRatingJob(null); setComment(''); setRating(5); }}></div>
                    
                    <div className="bg-[#16161a] border border-[#24242b] p-6 rounded-xl w-full max-w-md relative shadow-2xl z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-md font-bold text-white tracking-tight">Review & Complete Project</h3>
                                <p className="text-gray-400 text-[11px] mt-0.5">Release escrow funds and share your working experience</p>
                            </div>
                            <button 
                                type="button" 
                                onClick={() => {
                                    setActiveRatingJob(null);
                                    setComment('');
                                    setRating(5);
                                }} 
                                className="text-gray-500 hover:text-white transition-colors cursor-pointer text-2xl font-semibold leading-none p-1"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handlePayoutAndRate} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-semibold text-gray-400 block mb-1 uppercase tracking-wider">RATE THIS FREELANCER</label>
                                <select 
                                    value={rating} 
                                    onChange={(e) => setRating(e.target.value)} 
                                    className="w-full bg-[#0f0f12] border border-[#24242b] rounded-lg p-2.5 text-xs text-emerald-400 font-mono focus:outline-none focus:border-emerald-500 cursor-pointer"
                                >
                                    <option value="5">⭐⭐⭐⭐⭐ 5 Stars (Excellent)</option>
                                    <option value="4">⭐⭐⭐⭐ 4 Stars (Good)</option>
                                    <option value="3">⭐⭐⭐ 3 Stars (Average)</option>
                                    <option value="2">⭐⭐ 2 Stars (Below Average)</option>
                                    <option value="1">⭐ 1 Star (Very Poor)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-semibold text-gray-400 block mb-1 uppercase tracking-wider">Give Your Feedback</label>
                                <textarea 
                                    rows="3" 
                                    value={comment} 
                                    onChange={(e) => setComment(e.target.value)} 
                                    placeholder="Provide comments on workspace delivery criteria..." 
                                    className="w-full bg-[#0f0f12] border border-[#24242b] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 resize-none" 
                                    required
                                ></textarea>
                            </div>
                            <div className="pt-1">
                                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 py-2.5 rounded-lg text-white font-medium text-xs shadow-lg shadow-emerald-950/20 transition-colors cursor-pointer">
                                    Approve Delivery & Release Funds
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}