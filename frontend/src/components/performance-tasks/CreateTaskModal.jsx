import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
            // Set default dates
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
            const res = await axios.get(`${API_URL}/users`);
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
            await axios.post(`${API_URL}/retail-performance-tasks`, formData);
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

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Performance Task</h2>
                        <p className="text-sm text-gray-500">Set targets and assign staff members</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column: Task Details */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Task Configuration</h3>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Task Title</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="e.g., Weekend Sales Blitz"
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows="3"
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            ></textarea>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Task Type</label>
                                <select
                                    name="task_type"
                                    value={formData.task_type}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="sales_amount">Sales Amount (NGN)</option>
                                    <option value="sales_count">Sales Count (Total Sales)</option>
                                    <option value="tiles_quantity">Tiles Quantity (Cartons)</option>
                                    <option value="accessories_quantity">Accessories Quantity (Units)</option>
                                    <option value="general_product_quantity">General Product Quantity</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Value</label>
                                <input
                                    type="number"
                                    name="target_value"
                                    value={formData.target_value}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Time</label>
                                <input
                                    type="datetime-local"
                                    name="start_time"
                                    value={formData.start_time}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Time</label>
                                <input
                                    type="datetime-local"
                                    name="end_time"
                                    value={formData.end_time}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Column: User Assignment */}
                    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800">
                        <div className="p-4 border-b dark:border-gray-800">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Assign Staff</h3>
                                <button 
                                    type="button"
                                    onClick={selectAllStaff}
                                    className="text-xs font-bold text-blue-600 hover:text-blue-700"
                                >
                                    Select All Staff
                                </button>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex-grow overflow-y-auto p-2 space-y-1 max-h-[300px]">
                            {filteredUsers.map(user => (
                                <div 
                                    key={user.id}
                                    onClick={() => toggleUser(user.id)}
                                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                                        formData.user_ids.includes(user.id) 
                                        ? 'bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800' 
                                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent'
                                    }`}
                                >
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold">{user.full_name}</span>
                                        <span className="text-[10px] text-gray-400 italic">{user.role_name}</span>
                                    </div>
                                    <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                                        formData.user_ids.includes(user.id)
                                        ? 'bg-blue-600 border-blue-600 text-white'
                                        : 'border-gray-300 dark:border-gray-600'
                                    }`}>
                                        {formData.user_ids.includes(user.id) && <X size={14} className="rotate-45" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="p-4 border-t dark:border-gray-800 bg-gray-100 dark:bg-gray-800/80">
                            <span className="text-xs font-bold text-gray-500">
                                {formData.user_ids.length} User(s) selected
                            </span>
                        </div>
                    </div>
                </form>

                <div className="p-6 border-t dark:border-gray-700 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2 border border-gray-200 dark:border-gray-700 rounded-lg font-bold text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || formData.user_ids.length === 0}
                        className="px-8 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-bold shadow-lg shadow-blue-200 dark:shadow-none transition-transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {loading ? 'Creating...' : 'Create Task'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateTaskModal;
