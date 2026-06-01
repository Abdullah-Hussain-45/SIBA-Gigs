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

    // Agar modal state false hai toh screen block par kuch render nahi hoga
    if (!isOpen) return null;

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
            toast.success("Voucher submitted successfully for verification!");
            
            // Clean inputs state fields after successful upload stream completion
            setAmount('');
            setSender('');
            setTrxId('');
            setFile(null);
            
            onClose(); // Auto-close modal layout node
        } catch (err) {
            toast.error(err.response?.data?.message || "Upload operation rejected.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
            
            {/* Modal Container Content Block */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 text-white max-w-md w-full shadow-2xl p-6 relative overflow-hidden transition-all transform scale-100">
                
                {/* Header Row */}
                <div className="flex justify-between items-center border-b border-gray-800 pb-3 mb-4">
                    <h3 className="text-xl font-bold tracking-tight">Top Up SIBA-Wallet</h3>
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-white transition-colors text-lg font-bold p-1"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs text-gray-400 block mb-1 uppercase tracking-wider font-semibold">Select Payment Method</label>
                        <select 
                            value={method} 
                            onChange={(e) => setMethod(e.target.value)} 
                            className="w-full p-2.5 bg-gray-800 rounded-lg border border-gray-700 text-sm focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                        >
                            <option value="easypaisa">EasyPaisa Mobile Account</option>
                            <option value="jazzcash">JazzCash Mobile Wallet</option>
                            <option value="bank_transfer">Direct Bank Wire Transfer</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-xs text-gray-400 block mb-1 uppercase tracking-wider font-semibold">Amount (PKR)</label>
                        <input 
                            type="number" 
                            placeholder="e.g., 5000" 
                            value={amount}
                            onChange={e => setAmount(e.target.value)} 
                            required 
                            className="w-full p-2.5 bg-gray-800 rounded-lg border border-gray-700 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-gray-400 block mb-1 uppercase tracking-wider font-semibold">Sender Account Name</label>
                        <input 
                            type="text" 
                            placeholder="As per App / Account Title" 
                            value={sender}
                            onChange={e => setSender(e.target.value)} 
                            required 
                            className="w-full p-2.5 bg-gray-800 rounded-lg border border-gray-700 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-gray-400 block mb-1 uppercase tracking-wider font-semibold">Transaction ID (TRX)</label>
                        <input 
                            type="text" 
                            placeholder="Enter Reference TRX Number" 
                            value={trxId}
                            onChange={e => setTrxId(e.target.value)} 
                            required 
                            className="w-full p-2.5 bg-gray-800 rounded-lg border border-gray-700 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                    </div>
                    
                    <div>
                        <label className="text-xs text-gray-400 block mb-1 uppercase tracking-wider font-semibold">Upload Receipt Screenshot</label>
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
                        className="w-full bg-emerald-600 p-2.5 rounded-lg font-bold text-sm tracking-wide hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase mt-2 shadow-lg shadow-emerald-900/20"
                    >
                        {loading ? "Processing Upload..." : "Submit Verification Proof"}
                    </button>
                </form>
            </div>
        </div>
    );
}