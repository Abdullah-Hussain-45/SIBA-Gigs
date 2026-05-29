// client/src/pages/History.jsx
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import Navbar from '../components/Navbar.jsx';
import ibaLogo from '../assets/iba-campus.jpg';

export default function History() {
    const { token, user } = useContext(AuthContext);
    const [historyRecords, setHistoryRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistoryLog = async () => {
            try {
                // Role-based api endpoints
                const endpoint = user?.role === 'student' 
                    ? 'http://localhost:5000/api/jobs/my-posted-tasks' 
                    : 'http://localhost:5000/api/bids/my-active-proposals';

                const res = await fetch(endpoint, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) {
                    setHistoryRecords(data.records || []);
                }
            } catch (err) {
                console.error("Failed to fetch historical ledger stream");
            } finally {
                setLoading(false);
            }
        };

        if (token) fetchHistoryLog();
    }, [token, user]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f0f12] flex items-center justify-center text-emerald-400 font-mono tracking-widest text-xs">
                LOADING TERMINAL HISTORY TRACKER...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f0f12] text-gray-200 font-sans">
            <Navbar />

            <main className="max-w-7xl mx-auto px-6 py-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white tracking-tight">
                        {user?.role === 'student' ? 'Assignment Posting History' : 'Freelance Proposal Tracking'}
                    </h1>
                    <p className="text-gray-400 text-xs mt-1">Real-time lifestyle tracking sheet for your campus gig records</p>
                </div>

                {/* HISTORICAL TABLE CONTAINER */}
                <div className="bg-[#16161a] border border-[#24242b] rounded-xl overflow-hidden shadow-2xl">
                    {historyRecords.length === 0 ? (
                        <div className="p-12 text-center text-gray-500 font-mono text-sm">
                            --- NO COMPLETED OR ACTIVE RECOVERY HISTORIES ON LOG ---
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[#1f1f26] border-b border-[#24242b] text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        <th className="px-6 py-4">Task Parameters</th>
                                        <th className="px-6 py-4">Domain Category</th>
                                        <th className="px-6 py-4">Budget / Quote Amount</th>
                                        <th className="px-6 py-4">Workflow Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#24242b] text-sm">
                                    {historyRecords.map((item) => (
                                        <tr key={item._id} className="hover:bg-[#1f1f26]/40 transition-colors">
                                            <td className="px-6 py-4 font-medium text-white">
                                                {user?.role === 'student' ? item.title : item.jobId?.title || "Archived Assignment"}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-[#1f1f26] border border-[#2e2e38] text-gray-400">
                                                    {user?.role === 'student' ? item.category : item.jobId?.category || "General"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-emerald-400 font-semibold">
                                                Rs. {user?.role === 'student' ? item.budget : item.bidAmount}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 text-[10px] font-mono rounded uppercase font-bold ${
                                                    (item.status === 'completed' || item.status === 'accepted') ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800' :
                                                    item.status === 'pending' ? 'bg-amber-950/60 text-amber-400 border border-amber-800' :
                                                    'bg-red-950/60 text-red-400 border border-red-800'
                                                }`}>
                                                    {item.status || "pending"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}