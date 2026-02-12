import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, Search, Plus, Filter, Calendar, Trash2, MapPin, Tag } from 'lucide-react';
import { format } from 'date-fns';
import ExpenseFormModal from '../components/ExpenseFormModal';

const ExpensesPage = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const API_URL = 'http://localhost:5000/api';

    useEffect(() => {
        fetchExpenses();
    }, []);

    const fetchExpenses = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/expenses`);
            setExpenses(response.data);
        } catch (error) {
            console.error('Error fetching expenses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this expense?')) return;
        try {
            await axios.delete(`${API_URL}/expenses/${id}`);
            fetchExpenses();
        } catch (error) {
            alert('Delete failed');
        }
    };

    const calculateTotal = () => {
        return expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    };

    const filteredExpenses = expenses.filter(e => 
        e.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Operational Expenses</h2>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition shadow-md"
                >
                    <Plus size={20} /> Record New Expense
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <div className="text-gray-400 text-xs font-bold uppercase mb-2">Total Outreach</div>
                    <div className="text-3xl font-black text-red-600">₦{calculateTotal().toLocaleString()}</div>
                </div>
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <div className="text-gray-400 text-xs font-bold uppercase mb-2">Expenses recorded</div>
                    <div className="text-3xl font-black text-gray-800">{expenses.length}</div>
                </div>
                <div className="bg-white p-6 rounded-xl border shadow-sm flex items-center justify-center">
                    <span className="text-gray-300 italic text-sm">Category breakdown coming soon</span>
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border flex gap-4 items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by category or description..."
                        className="pl-10 pr-4 py-2 bg-gray-50 border rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="p-2 text-gray-400 hover:text-blue-600 transition">
                    <Filter size={20} />
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-widest border-b">
                        <tr>
                            <th className="px-6 py-4">Expense Details</th>
                            <th className="px-6 py-4">Branch</th>
                            <th className="px-6 py-4">Category</th>
                            <th className="px-6 py-4">Amount</th>
                            <th className="px-6 py-4">Recorder</th>
                            <th className="px-6 py-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm italic">
                        {loading ? (
                            <tr><td colSpan="6" className="px-6 py-20 text-center text-gray-400">Loading financials...</td></tr>
                        ) : filteredExpenses.length === 0 ? (
                            <tr><td colSpan="6" className="px-6 py-20 text-center text-gray-400">No expenses recorded.</td></tr>
                        ) : (
                            filteredExpenses.map((exp) => (
                                <tr key={exp.id} className="hover:bg-slate-50 transition">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-800">{exp.description || 'No description'}</div>
                                        <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5 uppercase">
                                            <Calendar size={10} /> {format(new Date(exp.expense_date), 'dd MMM yyyy')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 text-gray-600">
                                            <MapPin size={12} className="text-gray-300" /> {exp.branch_name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">
                                            {exp.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-black text-red-600">
                                        ₦{parseFloat(exp.amount).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-gray-400 text-xs">{exp.recorder}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center">
                                            <button onClick={() => handleDelete(exp.id)} className="p-2 text-gray-300 hover:text-red-500 transition">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <ExpenseFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchExpenses}
            />
        </div>
    );
};

export default ExpensesPage;
