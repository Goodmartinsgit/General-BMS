import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../api/axios';
import { useCurrency } from '../context/CurrencyContext';
import useFormDraft from '../hooks/useFormDraft';
import DraftRecoveryBanner from './common/DraftRecoveryBanner';

const defaultExpenseData = {
    branch_id: '',
    category_id: '',
    amount: '',
    description: '',
    expense_date: new Date().toISOString().split('T')[0],
    status: 'pending',
    receipt_url: ''
};

const ExpenseFormModal = ({ isOpen, onClose, onSubmit, expense }) => {
    const { symbol } = useCurrency();
    const [branches, setBranches] = useState([]);
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState(defaultExpenseData);

    const isEditMode = !!expense;
    const draftKey = isEditMode ? `expense_edit_${expense?.id}` : 'expense_create';
    const { draftData, hasDraft, applyDraft, dismissDraft, saveDraft, clearDraft } = useFormDraft(draftKey, {
        label: isEditMode ? `Edit Expense` : 'New Expense',
        entityType: 'expense',
        initialData: defaultExpenseData,
        isOpen,
    });

    useEffect(() => { saveDraft(formData); }, [formData, saveDraft]);

    const handleRestoreDraft = () => {
        if (draftData) {
            setFormData(prev => ({ ...prev, ...draftData }));
            applyDraft();
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchBranches();
            fetchCategories();
        }
    }, [isOpen]);

    useEffect(() => {
        if (expense) {
            setFormData({
                branch_id: expense.branch_id || '',
                category_id: expense.category_id || '',
                amount: expense.amount || '',
                description: expense.description || '',
                expense_date: expense.expense_date ? new Date(expense.expense_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                status: expense.status || 'pending',
                receipt_url: expense.receipt_url || ''
            });
        } else {
            setFormData({
                branch_id: branches[0]?.id || '',
                category_id: categories[0]?.id || '',
                amount: '',
                description: '',
                expense_date: new Date().toISOString().split('T')[0],
                status: 'pending',
                receipt_url: ''
            });
        }
    }, [expense, isOpen]);

    const fetchBranches = async () => {
        try {
            const response = await api.get('/branches');
            setBranches(response.data);
            if (response.data.length > 0 && !expense) {
                setFormData(prev => ({ ...prev, branch_id: response.data[0].id }));
            }
        } catch (error) {
            console.error('Error fetching branches:', error);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await api.get('/expense-categories');
            setCategories(response.data);
            if (response.data.length > 0 && !expense) {
                setFormData(prev => ({ ...prev, category_id: response.data[0].id }));
            }
        } catch (error) {
            console.error('Error fetching expense categories:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        clearDraft();
        onSubmit(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-10">
            <div className="bg-theme-secondary rounded-lg shadow-xl w-full max-w-2xl my-auto">
                <div className="flex justify-between items-center p-4 border-b border-theme">
                    <h2 className="text-xl font-semibold text-theme-primary">{expense ? 'Edit Expense' : 'Add New Expense'}</h2>
                    <button onClick={onClose} className="text-theme-muted hover:text-theme-primary transition">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <DraftRecoveryBanner
                        visible={hasDraft}
                        label={isEditMode ? 'Edit Expense' : 'New Expense'}
                        updatedAt={draftData?._savedAt}
                        onRestore={handleRestoreDraft}
                        onDiscard={dismissDraft}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="col-span-1 md:col-span-2 pb-2 border-b border-theme">
                            <h3 className="text-sm font-semibold text-accent-gold uppercase">Expense Details</h3>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Branch *</label>
                            <select
                                name="branch_id"
                                value={formData.branch_id}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                required
                            >
                                <option value="">Select Branch</option>
                                {branches.map(b => (
                                    <option key={b.id} value={b.id}>{b.branch_name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Category *</label>
                            <select
                                name="category_id"
                                value={formData.category_id}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                required
                            >
                                <option value="">Select Category</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.category_name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Amount ({symbol}) *</label>
                            <input
                                type="number"
                                name="amount"
                                value={formData.amount}
                                onChange={handleChange}
                                step="0.01"
                                className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                placeholder="0.00"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Expense Date *</label>
                            <input
                                type="date"
                                name="expense_date"
                                value={formData.expense_date}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Status</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                            >
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                                <option value="paid">Paid</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Receipt URL</label>
                            <input
                                type="text"
                                name="receipt_url"
                                value={formData.receipt_url}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                placeholder="https://..."
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows="3"
                                className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none resize-none"
                                placeholder="Details about this expense..."
                            ></textarea>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-theme font-semibold">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 text-theme-secondary bg-theme-primary hover:bg-theme-tertiary border border-theme rounded-lg transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-8 py-2 bg-accent-gold text-white rounded-lg hover:bg-accent-goldDark shadow-md transition"
                        >
                            {expense ? 'Update Expense' : 'Save Expense'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ExpenseFormModal;
