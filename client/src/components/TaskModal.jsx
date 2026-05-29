// client/src/components/TaskModal.jsx
import React, { useState } from 'react';

export default function TaskModal({ isOpen, onClose, onTaskPosted }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [budget, setBudget] = useState('');
    const [category, setCategory] = useState('Programming');

    // Agar modal state close ho toh kuch render na karein
    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Data package building
        const taskData = { 
            title, 
            description, 
            budget: Number(budget), 
            category 
        };
        
        // Parent component (Dashboard) ko data pass karein
        onTaskPosted(taskData);
        
        // Local state form fields reset loop
        setTitle('');
        setDescription('');
        setBudget('');
        setCategory('Programming');
        onClose(); // Form handle hone ke baad popup automatically hide ho jaye
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop blur layer styling */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>

            {/* Main Modal Design Framework */}
            <div className="bg-[#16161a] border border-[#24242b] w-full max-w-lg rounded-xl p-6 relative z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                
                {/* Header Section */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">Post Academic Assignment</h2>
                        <p className="text-gray-400 text-xs mt-0.5">Fill out details to broadcast task on campus feed</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors cursor-pointer text-2xl font-semibold leading-none">&times;</button>
                </div>

                {/* Form Processing System */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Task / Assignment Title</label>
                        <input type="text" required className="w-full mt-1 px-4 py-2.5 bg-[#1f1f26] border border-[#2e2e38] rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors" placeholder="e.g., Build Real-Time Chat App in Java" value={title} onChange={e => setTitle(e.target.value)} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Budget (PKR)</label>
                            <input type="number" required min="100" className="w-full mt-1 px-4 py-2.5 bg-[#1f1f26] border border-[#2e2e38] rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors font-mono" placeholder="Minimum 100" value={budget} onChange={e => setBudget(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Task Category</label>
                            <select className="w-full mt-1 px-4 py-2.5 bg-[#1f1f26] border border-[#2e2e38] rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors" value={category} onChange={e => setCategory(e.target.value)}>
                                <option value="Programming">Programming / OOP</option>
                                <option value="Database">Database Management</option>
                                <option value="WebDev">Full Stack Web Dev</option>
                                <option value="UIUX">UI/UX Interface Design</option>
                                <option value="DataScience">Data Science & AI</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Task Requirements / Description</label>
                        <textarea required rows="4" className="w-full mt-1 px-4 py-2.5 bg-[#1f1f26] border border-[#2e2e38] rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors resize-none" placeholder="Describe the task parameters, specific features required, and deadline constraints clearly..." value={description} onChange={e => setDescription(e.target.value)}></textarea>
                    </div>

                    {/* Action Triggers Grid */}
                    <div className="flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-[#1f1f26] hover:bg-[#24242b] text-gray-400 hover:text-white rounded-lg text-sm border border-[#2e2e38] transition-colors cursor-pointer">Cancel</button>
                        <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-sm shadow-lg shadow-emerald-900/20 transition-colors cursor-pointer">Broadcast Task 🚀</button>
                    </div>
                </form>
            </div>
        </div>
    );
}