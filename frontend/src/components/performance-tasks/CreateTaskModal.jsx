import React, { useState, useEffect } from 'react';
import { X, Search, Target, Check } from 'lucide-react';
import api from '../../api/axios';

const CreateTaskModal = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        task_type: 'sales_amount',
        target_value: '',
        target_min: '',
        target_max: '',
        start_time: '',
        end_time: '',
        user_ids: []
    });

    const [users, setUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);

            setFormData(prev => ({
                ...prev,
                start_time: now.toISOString().slice(0, 16),
                end_time: tomorrow.toISOString().slice(0, 16)
            }));
        }
    }, [isOpen]);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const toggleUser = (userId) => {
        setFormData(prev => {
            const userIds = [...prev.user_ids];
            const index = userIds.indexOf(userId);
            if (index > -1) {
                userIds.splice(index, 1);
            } else {
                userIds.push(userId);
            }
            return { ...prev, user_ids: userIds };
        });
    };

    const selectAllStaff = () => {
        const staffIds = users.filter(u => u.role_name === 'Staff' || u.role_name === 'staff').map(u => u.id);
        setFormData(prev => ({ ...prev, user_ids: staffIds }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/retail-performance-tasks', formData);
            onSuccess();
            onClose();
        } catch (error) {
            alert(error.response?.data?.message || 'Error creating task');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const filteredUsers = users.filter(u =>
        u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const inputClass = "w-full bg-theme-primary border border-theme rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all text-theme-primary placeholder-theme-muted text-sm";

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-theme-secondary rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-theme" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-theme">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-accent-gold text-white flex items-center justify-center">
                            <Target size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-theme-primary">Create Performance Task</h2>
                            <p className="text-xs text-theme-muted mt-0.5">Set targets and assign staff members</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-theme-muted hover:text-theme-primary hover:bg-theme-tertiary rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="grow overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column: Task Details */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-semibold text-theme-muted uppercase tracking-wider">Task Configuration</h3>

                        <div>
                            <label className="block text-sm font-medium text-theme-primary mb-2">Task Title</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="e.g., Weekend Sales Blitz"
                                className={inputClass}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-theme-primary mb-2">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows="3"
                                placeholder="Describe the task objectives..."
                                className={`${inputClass} resize-none`}
                            ></textarea>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-theme-primary mb-2">Task Type</label>
                                <select
                                    name="task_type"
                                    value={formData.task_type}
                                    onChange={handleChange}
                                    className={inputClass}
                                >
                                    <option value="sales_amount">Sales Amount (NGN)</option>
                                    <option value="sales_count">Sales Count</option>
                                    <option value="tiles_quantity">Tiles Quantity (Cartons)</option>
                                    <option value="accessories_quantity">Accessories (Units)</option>
                                    <option value="general_product_quantity">General Product Qty</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-theme-primary mb-2">Target Value</label>
                                <input
                                    type="number"
                                    name="target_value"
                                    value={formData.target_value}
                                    onChange={handleChange}
                                    placeholder="0"
                                    className={inputClass}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-theme-primary mb-2">Start Time</label>
                                <input
                                    type="datetime-local"
                                    name="start_time"
                                    value={formData.start_time}
                                    onChange={handleChange}
                                    className={inputClass}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-theme-primary mb-2">End Time</label>
                                <input
                                    type="datetime-local"
                                    name="end_time"
                                    value={formData.end_time}
                                    onChange={handleChange}
                                    className={inputClass}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Column: User Assignment */}
                    <div className="flex flex-col h-full bg-theme-primary rounded-lg border border-theme overflow-hidden">
                        <div className="p-4 border-b border-theme">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-xs font-semibold text-theme-muted uppercase tracking-wider">Assign Staff</h3>
                                <button
                                    type="button"
                                    onClick={selectAllStaff}
                                    className="text-xs font-semibold text-accent-gold hover:text-accent-goldDark transition-colors"
                                >
                                    Select All Staff
                                </button>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted w-4 h-4 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-theme-secondary border border-theme rounded-lg text-sm focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all text-theme-primary placeholder-theme-muted"
                                />
                            </div>
                        </div>

                        <div className="grow overflow-y-auto p-2 space-y-1 max-h-[300px]">
                            {filteredUsers.map(user => {
                                const isSelected = formData.user_ids.includes(user.id);
                                return (
                                    <div
                                        key={user.id}
                                        onClick={() => toggleUser(user.id)}
                                        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                                            isSelected
                                                ? 'bg-accent-gold/10 border border-accent-gold/20'
                                                : 'hover:bg-theme-secondary border border-transparent'
                                        }`}
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-theme-primary">{user.full_name}</span>
                                            <span className="text-xs text-theme-muted">{user.role_name}</span>
                                        </div>
                                        <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                                            isSelected
                                                ? 'bg-accent-gold border-accent-gold text-white'
                                                : 'border-theme'
                                        }`}>
                                            {isSelected && <Check size={14} />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="p-4 border-t border-theme bg-theme-secondary">
                            <span className="text-xs font-semibold text-theme-muted">
                                {formData.user_ids.length} user(s) selected
                            </span>
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="p-6 border-t border-theme flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 bg-theme-secondary border border-theme text-theme-secondary rounded-lg hover:bg-theme-tertiary transition font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || formData.user_ids.length === 0}
                        className="px-6 py-2.5 bg-accent-gold hover:bg-accent-goldDark disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition"
                    >
                        {loading ? 'Creating...' : 'Create Task'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateTaskModal;
