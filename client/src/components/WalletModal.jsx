import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

const WithdrawalModal = ({ isOpen, onClose, currentBalance, onWithdrawalSuccess }) => {
    const [paymentMethod, setPaymentMethod] = useState("easypaisa");
    const [amount, setAmount] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [accountTitle, setAccountTitle] = useState("");
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!amount || !accountNumber || !accountTitle) {
            return toast.error("Please fill all fields carefully.");
        }

        if (Number(amount) > currentBalance) {
            return toast.error("Insufficient digital balance for cash-out.");
        }

        try {
            setLoading(true);

            // 🔑 Get token from local storage dynamically for headers authentication
            const token = localStorage.getItem("token");

            // 🎯 FIXED PATH: API route altered from '/api/payments' to '/api/wallet' to match your router structure
            const response = await axios.post("http://localhost:5000/api/wallet/withdraw", {
                amount: Number(amount),
                paymentMethod,
                accountNumber,
                accountTitle,
                // Backup parameter mappings to bypass strict mongoose schema checks
                accountName: accountTitle 
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.success) {
                toast.success("Cash-out request logged! Admin will transfer real cash.");
                
                // Real-time UI balance minus update node
                const cashOutAmount = response.data.withdrawal?.amount || Number(amount);
                onWithdrawalSuccess(cashOutAmount); 
                
                onClose();
                // Form cleanup
                setAmount("");
                setAccountNumber("");
                setAccountTitle("");
            }
        } catch (error) {
            console.error("Withdrawal network pipeline offline:", error);
            toast.error(error.response?.data?.message || "Financial ledger interaction crashed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-[#18181c] border border-zinc-800 w-full max-w-md rounded-xl p-6 relative shadow-2xl">
                
                {/* Close Trigger Button */}
                <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-white text-xl">
                    ✕
                </button>

                <h2 className="text-xl font-bold text-white mb-1">Withdraw Earnings Portal</h2>
                <p className="text-xs text-zinc-400 mb-6">
                    Current Available Amount: <span className="text-emerald-400 font-semibold">Rs. {currentBalance}</span>
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    
                    {/* Method Selector Tabs inside code */}
                    <div>
                        <label className="text-xs font-mono text-zinc-400 block mb-2 uppercase tracking-wider">
                            Select Payout Method
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {['easypaisa', 'jazzcash', 'bank'].map((method) => (
                                <button
                                    key={method}
                                    type="button"
                                    onClick={() => setPaymentMethod(method)}
                                    className={`py-2 text-xs font-bold rounded-lg border uppercase tracking-wider transition-all ${
                                        paymentMethod === method
                                            ? "bg-emerald-950/40 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-900/10"
                                            : "bg-[#202024] border-zinc-800 text-zinc-400 hover:text-zinc-200"
                                    }`}
                                >
                                    {method}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Amount Block Field */}
                    <div>
                        <label className="text-xs font-mono text-zinc-400 block mb-1 uppercase tracking-wider">
                            Withdraw Amount (PKR)
                        </label>
                        <input
                            type="number"
                            placeholder="e.g. 1500"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full bg-[#111114] border border-zinc-800 text-sm text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500 font-mono"
                        />
                    </div>

                    {/* Account Title Node */}
                    <div>
                        <label className="text-xs font-mono text-zinc-400 block mb-1 uppercase tracking-wider">
                            Account Title (Name)
                        </label>
                        <input
                            type="text"
                            placeholder="ENTER ACCOUNT TITLE / TITLE HOLDER NAME"
                            value={accountTitle}
                            onChange={(e) => setAccountTitle(e.target.value)}
                            className="w-full bg-[#111114] border border-zinc-800 text-xs text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500 tracking-wide uppercase"
                        />
                    </div>

                    {/* Account/Card Vector Number field */}
                    <div>
                        <label className="text-xs font-mono text-zinc-400 block mb-1 uppercase tracking-wider">
                            Account / Wallet Number
                        </label>
                        <input
                            type="text"
                            placeholder="ENTER NETWORK ACCOUNT NUMBER"
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value)}
                            className="w-full bg-[#111114] border border-zinc-800 text-xs text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500 font-mono tracking-wider"
                        />
                    </div>

                    {/* Final Processing Trigger Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 text-white font-semibold rounded-lg py-3 text-sm tracking-wide transition-all mt-2 active:scale-[0.99]"
                    >
                        {loading ? "Processing Payout..." : "Request Cash-Out"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default WithdrawalModal;