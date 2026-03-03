import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Landmark, Plus, TrendingDown, TrendingUp, Calendar, ChevronRight, DollarSign, Target } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import { useCurrency } from '../context/CurrencyContext';

const BudgetsPage = () => {
    const { formatCurrency, symbol } = useCurrency();
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
            const res = await api.get('/budgets');
            setBudgets(res.rows || res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const fetchBranches = async () => {
        try {
            const res = await api.get('/branches');
            setBranches(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateBudget = async (e) => {
        e.preventDefault();
        try {
            await api.post('/budgets', newBudget);
            setIsModalOpen(false);
            fetchBudgets();
            setNewBudget({
                branch_id: '',
                name: '',
                total_amount: '',
                month: new Date().getMonth() + 1,
                year: new Date().getFullYear(),
                line_items: []
            });
        } catch (err) {
            alert('Error creating budget: ' + (err.response?.data?.message || err.message));
        }
    };

    const calculateTotalBudget = () => {
        return budgets.reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);
    };

    const calculateTotalSpent = () => {
        return budgets.reduce((sum, b) => sum + parseFloat(b.spent_amount || 0), 0);
    };

    const activeBudgets = budgets.filter(b => {
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        return b.month === currentMonth && b.year === currentYear;
    }).length;

    const actions = (
        <button
            onClick={() => setIsModalOpen(true)}
            className="bg-accent-gold text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-accent-goldDark transition flex items-center gap-2"
        >
            <Plus className="w-4 h-4" /> New Budget
        </button>
    );

    return (
        <div className="space-y-6 max-w-[1700px] mx-auto pb-10">
            <PageHeader
                title="Budget Management"
                subtitle="Plan and track your financial budgets across branches"
                badge={`${budgets.length} Budgets`}
                icon={Landmark}
                actions={actions}
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-theme-secondary p-6 rounded-lg border border-theme shadow-theme-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <div className="text-sm text-theme-muted font-medium">Total Budget</div>
                        <div className="text-2xl font-semibold text-theme-primary">
                            {formatCurrency(calculateTotalBudget())}
                        </div>
                    </div>
                </div>
                <div className="bg-theme-secondary p-6 rounded-lg border border-theme shadow-theme-sm flex items-center gap-4">
                    <div className="p-3 bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 rounded-lg">
                        <TrendingDown size={24} />
                    </div>
                    <div>
                        <div className="text-sm text-theme-muted font-medium">Total Spent</div>
                        <div className="text-2xl font-semibold text-theme-primary">
                            {formatCurrency(calculateTotalSpent())}
                        </div>
                    </div>
                </div>
                <div className="bg-theme-secondary p-6 rounded-lg border border-theme shadow-theme-sm flex items-center gap-4">
                    <div className="p-3 bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400 rounded-lg">
                        <Target size={24} />
                    </div>
                    <div>
                        <div className="text-sm text-theme-muted font-medium">Active This Month</div>
                        <div className="text-2xl font-semibold text-theme-primary">{activeBudgets}</div>
                    </div>
                </div>
            </div>

            {/* Budgets Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array(3).fill(0).map((_, i) => (
                        <div key={i} className="bg-theme-secondary p-6 rounded-lg border border-theme shadow-theme-sm animate-pulse">
                            <div className="h-20 bg-theme-tertiary rounded mb-4"></div>
                            <div className="h-4 bg-theme-tertiary rounded mb-2"></div>
                            <div className="h-4 bg-theme-tertiary rounded w-2/3"></div>
                        </div>
                    ))}
                </div>
            ) : budgets.length === 0 ? (
                <div className="bg-theme-secondary p-12 rounded-lg border border-theme shadow-theme-sm text-center">
                    <Landmark className="w-16 h-16 text-theme-muted mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-theme-primary mb-2">No Budgets Yet</h3>
                    <p className="text-theme-muted mb-6">Get started by creating your first budget</p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-accent-gold text-white px-6 py-2 rounded-lg font-semibold hover:bg-accent-goldDark transition inline-flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Create Budget
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {budgets.map(budget => {
                        const spentPercentage = Math.min((budget.spent_amount || 0) / budget.total_amount * 100, 100);
                        const isOverBudget = spentPercentage > 100;
                        const isNearLimit = spentPercentage > 80 && !isOverBudget;

                        return (
                            <div key={budget.id} className="bg-theme-secondary p-6 rounded-lg border border-theme shadow-theme-sm hover:shadow-theme-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg text-theme-primary mb-1">{budget.name}</h3>
                                        <p className="text-sm text-theme-muted flex items-center gap-1">
                                            <Landmark size={14} />
                                            {budget.branch_name}
                                        </p>
                                    </div>
                                    <span className="bg-accent-gold/10 text-accent-gold px-2 py-1 rounded text-xs font-semibold border border-accent-gold/20 flex items-center gap-1">
                                        <Calendar size={12} />
                                        {new Date(budget.year, budget.month - 1).toLocaleString('default', { month: 'short' })} {budget.year}
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-theme-muted">Allocated</span>
                                            <span className="font-bold text-theme-primary">{formatCurrency(budget.total_amount)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm mb-3">
                                            <span className="text-theme-muted">Spent</span>
                                            <span className={`font-semibold ${isOverBudget ? 'text-red-600' : isNearLimit ? 'text-amber-600' : 'text-theme-secondary'}`}>
                                                {formatCurrency(budget.spent_amount || 0)}
                                            </span>
                                        </div>
                                        <div className="w-full bg-theme-tertiary h-2 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-500 ${
                                                    isOverBudget ? 'bg-red-500' :
                                                    isNearLimit ? 'bg-amber-500' :
                                                    'bg-accent-gold'
                                                }`}
                                                style={{ width: `${spentPercentage}%` }}
                                            ></div>
                                        </div>
                                        <div className="flex justify-between mt-1">
                                            <span className="text-[10px] text-theme-muted">0%</span>
                                            <span className="text-[10px] text-theme-muted">{spentPercentage.toFixed(1)}%</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-theme">
                                        <div className={`flex items-center gap-1 ${
                                            isOverBudget ? 'text-red-600' :
                                            isNearLimit ? 'text-amber-600' :
                                            'text-green-600'
                                        }`}>
                                            {isOverBudget ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
                                            <span className="text-xs font-medium">
                                                {isOverBudget ? 'Over Budget' : isNearLimit ? 'Near Limit' : 'On Track'}
                                            </span>
                                        </div>
                                        <button className="text-accent-gold hover:text-accent-goldDark text-sm font-medium flex items-center gap-1 transition-colors">
                                            View Details <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Budget Creation Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-theme-secondary rounded-xl max-w-md w-full p-6 shadow-2xl border border-theme" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-lg bg-accent-gold text-white flex items-center justify-center">
                                <Landmark size={20} />
                            </div>
                            <h2 className="text-xl font-bold text-theme-primary">Create New Budget</h2>
                        </div>
                        <form onSubmit={handleCreateBudget} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-theme-primary mb-2">Budget Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-theme-primary border border-theme rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all text-theme-primary placeholder-theme-muted"
                                    placeholder="e.g. Q1 Marketing - Lagos"
                                    value={newBudget.name}
                                    onChange={(e) => setNewBudget({...newBudget, name: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-theme-primary mb-2">Branch</label>
                                <select
                                    required
                                    className="w-full bg-theme-primary border border-theme rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all text-theme-primary"
                                    value={newBudget.branch_id}
                                    onChange={(e) => setNewBudget({...newBudget, branch_id: e.target.value})}
                                >
                                    <option value="">Select Branch</option>
                                    {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-theme-primary mb-2">Total Amount ({symbol})</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    className="w-full bg-theme-primary border border-theme rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all text-theme-primary placeholder-theme-muted"
                                    placeholder="0.00"
                                    value={newBudget.total_amount}
                                    onChange={(e) => setNewBudget({...newBudget, total_amount: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-theme-primary mb-2">Month</label>
                                    <select
                                        required
                                        className="w-full bg-theme-primary border border-theme rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all text-theme-primary"
                                        value={newBudget.month}
                                        onChange={(e) => setNewBudget({...newBudget, month: parseInt(e.target.value)})}
                                    >
                                        {Array.from({ length: 12 }, (_, i) => {
                                            const monthName = new Date(2024, i).toLocaleString('default', { month: 'long' });
                                            return <option key={i + 1} value={i + 1}>{monthName}</option>;
                                        })}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-theme-primary mb-2">Year</label>
                                    <select
                                        required
                                        className="w-full bg-theme-primary border border-theme rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all text-theme-primary"
                                        value={newBudget.year}
                                        onChange={(e) => setNewBudget({...newBudget, year: parseInt(e.target.value)})}
                                    >
                                        {Array.from({ length: 3 }, (_, i) => {
                                            const year = new Date().getFullYear() + i;
                                            return <option key={year} value={year}>{year}</option>;
                                        })}
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6 pt-4 border-t border-theme">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 bg-theme-secondary border border-theme text-theme-secondary rounded-lg hover:bg-theme-tertiary transition font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 bg-accent-gold text-white rounded-lg hover:bg-accent-goldDark transition font-semibold"
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
