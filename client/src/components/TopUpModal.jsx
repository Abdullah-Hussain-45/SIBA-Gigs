import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export default function TopUpModal({ isOpen, onClose }) {
    const [method, setMethod] = useState('easypaisa');
    const [amount, setAmount] = useState('');
    const [sender, setSender] = useState('');
    const [trxId, setTrxId] = useState('');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    // 📢 ADMIN PAYMENT ACCOUNTS DATA CONFIGURATION
    const adminAccounts = {
        easypaisa: {
            number: "0302-3046200", 
            title: "Abdullah Hussain Mallah"
        },
        jazzcash: {
            number: "0302-3046200", 
            title: "Abdullah Hussain Mallah"
        },
        nayapay: {
            number: "0302-3046200", 
            title: "Abdullah Hussain Mallah"
        },
        bank_transfer: {
            number: "1234-5678-9012-3456 (HBL)", 
            title: "SIBA Gigs Official Operations"
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        formData.append("amount", amount);
        formData.append("paymentMethod", method);
        formData.append("accountName", sender);
        formData.append("transactionId", trxId);
        formData.append("voucher", file);

        try {
            await axios.post('/api/wallet/topup', formData, {
                headers: { 
                    "Content-Type": "multipart/form-data",
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });
            toast.success("Deposit voucher submitted successfully for verification.");
            
            setAmount('');
            setSender('');
            setTrxId('');
            setFile(null);
            onClose(); 
        } catch (err) {
            toast.error(err.response?.data?.message || "Transaction upload operation rejected.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-gray-900 rounded-2xl border border-gray-800 text-white max-w-md w-full shadow-2xl p-6 relative overflow-hidden transition-all transform scale-100 max-h-[90vh] overflow-y-auto">
                
                {/* Header Row */}
                <div className="flex justify-between items-center border-b border-gray-800 pb-3 mb-4">
                    <h3 className="text-xl font-bold tracking-tight">Deposit Funds</h3>
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-white transition-colors text-lg font-bold p-1"
                    >
                        ✕
                    </button>
                </div>

                {/* 💳 HIGH-VISIBILITY STEP-BY-STEP INSTRUCTIONS */}
                <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-4 mb-4 text-xs">
                    <span className="text-emerald-400 font-bold block uppercase tracking-wider mb-2 font-mono text-[13px]">
                         Follow These Simple Steps To Top Up:
                    </span>
                    
                    <div className="space-y-3 font-sans">
                        <div>
                            <span className="text-emerald-400 font-bold font-mono text-[13px] mr-1">STEP 1:</span> 
                            {/* ✨ VISIBILITY FIXED: Changed text-gray-300 to text-gray-100 */}
                            <span className="text-gray-100 font-medium">Send your desired amount to our official wallet account:</span>
                            <div className="bg-black/50 border border-zinc-700 rounded-lg p-2.5 mt-1.5 space-y-1">
                                <p><span className="text-zinc-400 font-mono">Gateway:</span> <strong className="uppercase text-white font-mono">{method === 'bank_transfer' ? 'Bank Transfer' : method}</strong></p>
                                <p><span className="text-zinc-400 font-mono">Number:</span> <strong className="text-emerald-400 font-mono text-sm tracking-wider select-all">{adminAccounts[method].number}</strong></p>
                                <p><span className="text-zinc-400 font-mono">Title:</span> <strong className="text-white uppercase font-semibold">{adminAccounts[method].title}</strong></p>
                            </div>
                        </div>

                        <div>
                            <span className="text-emerald-400 font-bold font-mono text-[13px] mr-1">STEP 2:</span> 
                            
                            <span className="text-gray-100 font-medium">Take a screenshot of the successful transaction receipt from your mobile app.</span>
                        </div>

                        <div className="border-t border-zinc-800/80 pt-2">
                            <span className="text-emerald-400 font-bold font-mono text-[13px] mr-1">STEP 3:</span> 
                            {/* ✨ VISIBILITY FIXED: Changed text-zinc-400 to text-gray-100 */}
                            <span className="text-gray-100 font-medium">Enter your Transaction ID (TRX), upload the screenshot below, and submit.</span>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs text-gray-400 block mb-1 uppercase tracking-wider font-semibold">Select Payment Method</label>
                        <select 
                            value={method} 
                            onChange={(e) => setMethod(e.target.value)} 
                            className="w-full p-2.5 bg-gray-800 rounded-lg border border-gray-700 text-sm focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer text-white font-medium"
                        >
                            <option value="easypaisa">EasyPaisa</option>
                            <option value="jazzcash">JazzCash</option>
                            <option value="nayapay">NayaPay</option>
                            <option value="bank_transfer">Bank Transfer</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-xs text-gray-400 block mb-1 uppercase tracking-wider font-semibold">Transferred Amount (PKR)</label>
                        <input 
                            type="number" 
                            placeholder="e.g., 5000" 
                            value={amount}
                            onChange={e => setAmount(e.target.value)} 
                            required 
                            className="w-full p-2.5 bg-gray-800 rounded-lg border border-gray-700 text-sm focus:outline-none focus:border-emerald-500 transition-colors font-mono text-white"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-gray-400 block mb-1 uppercase tracking-wider font-semibold">Sender Account Title</label>
                        <input 
                            type="text" 
                            placeholder="Enter account holder name" 
                            value={sender}
                            onChange={e => setSender(e.target.value)} 
                            required 
                            className="w-full p-2.5 bg-gray-800 rounded-lg border border-gray-700 text-sm focus:outline-none focus:border-emerald-500 transition-colors text-white"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-gray-400 block mb-1 uppercase tracking-wider font-semibold">Transaction Reference ID (TRX)</label>
                        <input 
                            type="text" 
                            placeholder="Enter transaction reference ID" 
                            value={trxId}
                            onChange={e => setTrxId(e.target.value)} 
                            required 
                            className="w-full p-2.5 bg-gray-800 rounded-lg border border-gray-700 text-sm focus:outline-none focus:border-emerald-500 transition-colors font-mono text-white"
                        />
                    </div>
                    
                    <div>
                        <label className="text-xs text-gray-400 block mb-1 uppercase tracking-wider font-semibold">Upload Transaction Receipt</label>
                        <input 
                            type="file" 
                            accept="image/*" 
                            onChange={e => setFile(e.target.files[0])} 
                            required 
                            className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:uppercase file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 file:cursor-pointer transition-colors" 
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-emerald-600 p-2.5 rounded-lg font-bold text-sm tracking-wide hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase mt-2 shadow-lg shadow-emerald-900/20 text-white"
                    >
                        {loading ? "Processing Verification..." : "Submit Receipt"}
                    </button>
                </form>
            </div>
        </div>
    );
}