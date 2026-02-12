import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, FileText, Tag } from 'lucide-react';
import axios from 'axios';

const ExpenseFormModal = ({ isOpen, onClose, onSuccess }) => {
    const [branches, setBranches] = useState([]);
    const [formData, setFormData] = useState({
        branch_id: '',
        category: 'Utilities',
        amount: '',
        description: '',
        expense_date: new Date().toISOString().split('T')[0],
        channel_id: ''
    });
    const [channels, setChannels] = useState([]);


    const API_URL = 'http://localhost:5000/api';

    useEffect(() => {
        if (isOpen) {
            fetchBranches();
            fetchChannels();
        }
    }, [isOpen]);

    const fetchChannels = async () => {
        try {
            const response = await axios.get(`${API_URL}/banks/channels`);
            setChannels(response.data);
            if (response.data.length > 0) {
                setFormData(prev => ({ ...prev, channel_id: response.data[0].id }));
            }
        } catch (error) {
            console.error('Error fetching channels:', error);
        }
    };


    const fetchBranches = async () => {
        try {
            const response = await axios.get(`${API_URL}/branches`);
            setBranches(response.data);
            if (response.data.length > 0) {
                setFormData(prev => ({ ...prev, branch_id: response.data[0].id }));
            }
        } catch (error) {
            console.error('Error fetching branches:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/expenses`, formData);
            onSuccess();
            onClose();
            setFormData({
                branch_id: branches[0]?.id || '',
                category: 'Utilities',
                amount: '',
                description: '',
                expense_date: new Date().toISOString().split('T')[0],
                channel_id: channels[0]?.id || ''
            });

        } catch (error) {
            alert('Failed to record expense');
        }
    };

    const categories = ['Utilities', 'Rent', 'Salaries', 'Maintenance', 'Marketing', 'Logistics', 'Supplies', 'Others'];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b">
                    <div className="flex items-center gap-2">
                        <DollarSign className="text-red-500" />
                        <h2 className="text-xl font-black text-gray-900">Record Expense</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Branch</label>
                        <select
                            value={formData.branch_id}
                            onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition"
                            required
                        >
                            {branches.map(b => (
                                <option key={b.id} value={b.id}>{b.branch_name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Category</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                                required
                            >
                                {categories.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Expense Date</label>
                            <input
                                type="date"
                                value={formData.expense_date}
                                onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Amount (₦)</label>
                        <input
                            type="number"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-500 outline-none font-bold text-lg"
                            placeholder="0.00"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Description / Notes</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                            rows="3"
                            placeholder="Details about this expenditure..."
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Pay From (Bank Channel)</label>
                        <select
                            value={formData.channel_id}
                            onChange={(e) => setFormData({ ...formData, channel_id: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition"
                            required
                        >
                            <option value="">Select Channel</option>
                            {channels.map(c => (
                                <option key={c.id} value={c.id}>{c.channel_name} (₦{parseFloat(c.current_balance).toLocaleString()})</option>
                            ))}
                        </select>
                    </div>


                    <button
                        type="submit"
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-3 rounded-xl shadow-lg shadow-red-100 transition active:scale-95 mt-4"
                    >
                        CONFIRM & POST EXPENSE
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ExpenseFormModal;
