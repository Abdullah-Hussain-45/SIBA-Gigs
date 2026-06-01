import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
    const { token, user } = useContext(AuthContext);
    const [deposits, setDeposits] = useState([]);
    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    // 🟢 Fetch All Pending Deposits (Students)
    const fetchDeposits = useCallback(async () => {
        try {
            const res = await fetch('http://localhost:5000/api/wallet/pending-deposits', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) setDeposits(data.deposits || []);
        } catch (err) {
            console.error('Failed to fetch pending deposits');
        }
    }, [token]);

    // 🟢 Fetch All Pending Withdrawals (Freelancers)
    const fetchWithdrawals = useCallback(async () => {
        try {
            const res = await fetch('http://localhost:5000/api/wallet/pending-withdrawals', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            // ✨ FIXED: Removed duplicate setDeposits trigger to completely prevent white screen crash
            if (data.success) setWithdrawals(data.withdrawals || []);
        } catch (err) {
            console.error('Failed to fetch pending withdrawals');
        }
    }, [token]);

    useEffect(() => {
        const isAdminEmail = user?.email?.trim().toLowerCase() === 'admin@iba-suk.edu.pk';
        const isAdminRole = user?.role === 'admin';

        if (token && (isAdminRole || isAdminEmail)) {
            Promise.all([fetchDeposits(), fetchWithdrawals()]).then(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [token, user, fetchDeposits, fetchWithdrawals]);

    // 🟩 Approve Student Deposit
    const handleApproveDeposit = async (depositId) => {
        setActionLoading(depositId);
        try {
            const res = await fetch('http://localhost:5000/api/wallet/approve-topup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ depositId })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Funds injected into student wallet!');
                setDeposits((prev) => prev.filter((d) => d._id !== depositId));
            } else {
                toast.error(data.message || 'Approval failed.');
            }
        } catch (err) {
            toast.error('Server error during approval.');
        } finally {
            setActionLoading(null);
        }
    };

    // 🟨 Approve Freelancer Withdrawal (Mark as Paid)
    const handleApproveWithdrawal = async (withdrawalId) => {
        setActionLoading(withdrawalId);
        try {
            const res = await fetch('http://localhost:5000/api/wallet/approve-payout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ withdrawalId })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Payout marked as cleared in ledger!');
                setWithdrawals((prev) => prev.filter((w) => w._id !== withdrawalId));
            } else {
                toast.error(data.message || 'Payout failed.');
            }
        } catch (err) {
            toast.error('Server error during payout clearance.');
        } finally {
            setActionLoading(null);
        }
    };

    const hasAdminAccess = user?.role === 'admin' || user?.email?.trim().toLowerCase() === 'admin@iba-suk.edu.pk';

    if (!hasAdminAccess) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-center p-6">
                <h1 className="text-4xl font-bold text-red-500 font-mono mb-2">403 FORBIDDEN</h1>
                <p className="text-zinc-400 text-sm">Access Denied: Unauthorized Personnel.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="fixed inset-0 flex flex-col items-center justify-center bg-black space-y-2">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-zinc-500 font-mono tracking-widest uppercase">Loading Ledger...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-zinc-200 p-8 font-sans">
            <header className="max-w-7xl mx-auto mb-10 flex justify-between items-center border-b border-zinc-900 pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">SIBA Gigs Control Center 👑</h1>
                    <p className="text-zinc-500 text-xs mt-1">Platform operations management and financial clearance hub.</p>
                </div>
                <div className="bg-zinc-900 px-4 py-2 rounded-lg border border-zinc-800 text-right">
                    <span className="text-[10px] text-zinc-500 block font-mono uppercase">Logged as</span>
                    <span className="text-sm font-bold text-amber-400 font-mono">{user?.name || 'Main Admin'}</span>
                </div>
            </header>

            <main className="max-w-7xl mx-auto space-y-12">
                
                {/* 📋 SECTION 1: PENDING DEPOSITS (STUDENTS) */}
                <section className="bg-[#111114] border border-zinc-950 rounded-xl p-6 shadow-xl">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block animate-pulse"></span>
                        Pending Student Deposits (+ Add Funds Verification)
                    </h2>
                    
                    {deposits.length === 0 ? (
                        <p className="text-zinc-500 text-sm font-mono py-4 text-center border border-dashed border-zinc-800 rounded-lg">No pending deposit records found.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-zinc-800 text-zinc-400 font-mono uppercase tracking-wider">
                                        <th className="py-3 px-4">Student</th>
                                        <th className="py-3 px-4">Amount</th>
                                        <th className="py-3 px-4">Method</th>
                                        <th className="py-3 px-4">TxID</th>
                                        <th className="py-3 px-4">Proof</th>
                                        <th className="py-3 px-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-900">
                                    {deposits.map((dep) => (
                                        <tr key={dep._id} className="hover:bg-zinc-900/40 transition-colors">
                                            <td className="py-3 px-4 font-medium text-white">{dep.user?.name || 'Student'}</td>
                                            <td className="py-3 px-4 font-mono text-emerald-400 font-bold">Rs. {dep.amount}</td>
                                            <td className="py-3 px-4 uppercase font-mono text-zinc-400">{dep.paymentMethod}</td>
                                            <td className="py-3 px-4 font-mono text-zinc-400 tracking-wider">{dep.transactionId}</td>
                                            <td className="py-3 px-4">
                                                <a href={`http://localhost:5000${dep.paymentVoucherUrl}`} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline font-mono">View Slip 📄</a>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <button
                                                    onClick={() => handleApproveDeposit(dep._id)}
                                                    disabled={actionLoading === dep._id}
                                                    className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 text-white font-bold px-3 py-1.5 rounded-md transition-all active:scale-[0.97]"
                                                >
                                                    {actionLoading === dep._id ? 'Verifying...' : 'Approve'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                {/* 📋 SECTION 2: PENDING WITHDRAWALS (FREELANCERS) */}
                <section className="bg-[#111114] border border-zinc-950 rounded-xl p-6 shadow-xl">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block animate-pulse"></span>
                        Pending Freelancer Cash-Outs (Manual Payout Release)
                    </h2>
                    
                    {withdrawals.length === 0 ? (
                        <p className="text-zinc-500 text-sm font-mono py-4 text-center border border-dashed border-zinc-800 rounded-lg">No pending withdrawal requests found.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-zinc-800 text-zinc-400 font-mono uppercase tracking-wider">
                                        <th className="py-3 px-4">Freelancer</th>
                                        <th className="py-3 px-4">Amount</th>
                                        <th className="py-3 px-4">Method</th>
                                        <th className="py-3 px-4">Account Title</th>
                                        <th className="py-3 px-4">Account Number</th>
                                        <th className="py-3 px-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-900">
                                    {withdrawals.map((wit) => (
                                        <tr key={wit._id} className="hover:bg-zinc-900/40 transition-colors">
                                            <td className="py-3 px-4 font-medium text-white">{wit.freelancer?.name || 'Freelancer'}</td>
                                            <td className="py-3 px-4 font-mono text-amber-400 font-bold">Rs. {wit.amount}</td>
                                            <td className="py-3 px-4 uppercase font-mono text-zinc-400">{wit.paymentMethod}</td>
                                            <td className="py-3 px-4 font-semibold uppercase text-zinc-300">{wit.accountTitle}</td>
                                            <td className="py-3 px-4 font-mono text-zinc-400 tracking-wider">{wit.accountNumber}</td>
                                            <td className="py-3 px-4 text-right">
                                                <button
                                                    onClick={() => handleApproveWithdrawal(wit._id)}
                                                    disabled={actionLoading === wit._id}
                                                    className="bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 text-white font-bold px-3 py-1.5 rounded-md transition-all active:scale-[0.97]"
                                                >
                                                    {actionLoading === wit._id ? 'Clearing...' : 'Mark as Paid'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}