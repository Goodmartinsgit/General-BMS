import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Landmark, Plus, Search, Filter, TrendingDown, TrendingUp, Calendar, ChevronRight } from 'lucide-react';

const BudgetsPage = () => {
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [branches, setBranches] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // New Budget Form State
    const [newBudget, setNewBudget] = useState({
        branch_id: '',
        name: '',
        total_amount: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        line_items: []
    });

    useEffect(() => {
        fetchBudgets();
        fetchBranches();
    }, []);

    const fetchBudgets = async () => {
        try {
            const res = await axios.get('/api/budgets');
            setBudgets(res.rows || res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const fetchBranches = async () => {
        try {
            const res = await axios.get('/api/branches');
            setBranches(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateBudget = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/budgets', newBudget);
            setIsModalOpen(false);
            fetchBudgets();
        } catch (err) {
            alert('Error creating budget: ' + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Landmark className="text-blue-600" />
                    Budget Management
                </h1>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
                >
                    <Plus size={20} /> New Budget
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10">Loading budgets...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {budgets.map(budget => (
                        <div key={budget.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800">{budget.name}</h3>
                                    <p className="text-sm text-slate-500">{budget.branch_name}</p>
                                </div>
                                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-semibold">
                                    {new Date(budget.year, budget.month - 1).toLocaleString('default', { month: 'short' })} {budget.year}
                                </span>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-slate-600">Total Allocation</span>
                                        <span className="font-bold text-slate-800">₦{parseFloat(budget.total_amount).toLocaleString()}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                        <div 
                                            className="bg-blue-500 h-full transition-all duration-500" 
                                            style={{ width: `${Math.min((budget.spent_amount || 0) / budget.total_amount * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between mt-1">
                                        <span className="text-[10px] text-slate-400">0%</span>
                                        <span className="text-[10px] text-slate-400">100%</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                    <div className="flex items-center gap-1 text-green-600">
                                        <TrendingUp size={16} />
                                        <span className="text-xs font-medium">Active</span>
                                    </div>
                                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1">
                                        View Details <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Simple Modal Placeholder */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
                        <h2 className="text-xl font-bold mb-4">Create New Budget</h2>
                        <form onSubmit={handleCreateBudget} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Budget Name</label>
                                <input 
                                    type="text" 
                                    required 
                                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g. Q1 Marketing - Lagos"
                                    onChange={(e) => setNewBudget({...newBudget, name: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Branch</label>
                                <select 
                                    required
                                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    onChange={(e) => setNewBudget({...newBudget, branch_id: e.target.value})}
                                >
                                    <option value="">Select Branch</option>
                                    {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Monthly Limit (₦)</label>
                                <input 
                                    type="number" 
                                    required 
                                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    onChange={(e) => setNewBudget({...newBudget, total_amount: e.target.value})}
                                />
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button 
                                    type="button" 
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-slate-50 transition"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                    Create Budget
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BudgetsPage;
