// client/src/components/BidModal.jsx
import React, { useState } from 'react';

export default function BidModal({ isOpen, onClose, selectedJob, onBidSubmitted }) {
    const [bidAmount, setBidAmount] = useState('');
    const [deliveryDays, setDeliveryDays] = useState('');
    const [proposalText, setProposalText] = useState('');

    if (!isOpen || !selectedJob) return null;

    const handleSubmit = (e) => {
        e.preventDefault();

        // Packaging the bidding payload
        const bidPayload = {
            jobId: selectedJob._id,
            bidAmount: Number(bidAmount),
            deliveryDays: Number(deliveryDays),
            proposalText
        };

        // Pass proposal data back to parent dashboard
        onBidSubmitted(bidPayload);

        // Reset states
        setBidAmount('');
        setDeliveryDays('');
        setProposalText('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop blur overlay */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>

            {/* Main Modal Card */}
            <div className="bg-[#16161a] border border-[#24242b] w-full max-w-lg rounded-xl p-6 relative z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                
                {/* Modal Header */}
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">Place Your Bid Proposal</h2>
                        <p className="text-gray-400 text-xs mt-0.5">Pitch your terms to the client for this assignment</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors cursor-pointer text-2xl font-semibold leading-none">&times;</button>
                </div>

                {/* Selected Job Info Brief */}
                <div className="bg-[#1f1f26] border border-[#2e2e38] rounded-lg p-3 mb-4">
                    <div className="flex justify-between items-center text-xs mb-1">
                        <span className="text-gray-500 font-mono">TASK TITLE</span>
                        <span className="text-emerald-400 font-bold font-mono">Client Budget: Rs. {selectedJob.budget}</span>
                    </div>
                    <h4 className="text-sm font-semibold text-white truncate">{selectedJob.title}</h4>
                </div>

                {/* Bid Form fields */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Your Bid (PKR)</label>
                            <input type="number" required min="50" className="w-full mt-1 px-4 py-2.5 bg-[#1f1f26] border border-[#2e2e38] rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors font-mono" placeholder="e.g., 500" value={bidAmount} onChange={e => setBidAmount(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Delivery Time (Days)</label>
                            <input type="number" required min="1" className="w-full mt-1 px-4 py-2.5 bg-[#1f1f26] border border-[#2e2e38] rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors font-mono" placeholder="e.g., 2" value={deliveryDays} onChange={e => setDeliveryDays(e.target.value)} />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Short Cover Pitch / Cover Letter</label>
                        <textarea required rows="3" className="w-full mt-1 px-4 py-2.5 bg-[#1f1f26] border border-[#2e2e38] rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors resize-none" placeholder="Briefly explain your expertise and how you plan to complete this assignment on time..." value={proposalText} onChange={e => setProposalText(e.target.value)}></textarea>
                    </div>

                    {/* Action Triggers */}
                    <div className="flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-[#1f1f26] hover:bg-[#24242b] text-gray-400 hover:text-white rounded-lg text-sm border border-[#2e2e38] transition-colors cursor-pointer">Cancel</button>
                        <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-sm shadow-lg shadow-emerald-900/20 transition-colors cursor-pointer">Submit Proposal 🚀</button>
                    </div>
                </form>
            </div>
        </div>
    );
}