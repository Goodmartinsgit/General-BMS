import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../api/axios';

const TaskFormModal = ({ isOpen, onClose, onSubmit, task }) => {
    const [users, setUsers] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        assigned_to: '',
        priority: 'medium',
        category: '',
        due_date: '',
        due_time: '',
    });

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
        }
    }, [isOpen]);

    useEffect(() => {
        if (task) {
            setFormData({
                title: task.title || '',
                description: task.description || '',
                assigned_to: task.assigned_to || '',
                priority: task.priority || 'medium',
                category: task.category || '',
                due_date: task.due_date
                    ? new Date(task.due_date).toISOString().split('T')[0]
                    : '',
                due_time: task.due_time || '',
            });
        } else {
            setFormData({
                title: '',
                description: '',
                assigned_to: '',
                priority: 'medium',
                category: '',
                due_date: '',
                due_time: '',
            });
        }
    }, [task, isOpen]);

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
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = { ...formData };
        if (payload.assigned_to) {
            payload.assigned_to = Number(payload.assigned_to);
        } else {
            delete payload.assigned_to;
        }
        onSubmit(payload);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-10">
            <div className="bg-theme-secondary rounded-lg shadow-xl w-full max-w-3xl my-auto">
                <div className="flex justify-between items-center p-4 border-b border-theme">
                    <h2 className="text-xl font-semibold text-theme-primary">
                        {task ? 'Edit Task' : 'Create New Task'}
                    </h2>
                    <button onClick={onClose} className="text-theme-muted hover:text-theme-primary transition">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="col-span-1 md:col-span-2 pb-2 border-b border-theme">
                            <h3 className="text-sm font-semibold text-accent-gold uppercase">Task Details</h3>
                        </div>

                        {/* Title - Full width */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-theme-secondary mb-1">
                                Title *
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                placeholder="Enter task title"
                                required
                            />
                        </div>

                        {/* Description - Full width */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-theme-secondary mb-1">
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows="4"
                                className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none resize-none"
                                placeholder="Describe the task in detail..."
                            ></textarea>
                        </div>

                        {/* Assigned To */}
                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">
                                Assign To *
                            </label>
                            <select
                                name="assigned_to"
                                value={formData.assigned_to}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                required
                            >
                                <option value="">Select User</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>
                                        {u.first_name} {u.last_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Priority */}
                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">
                                Priority *
                            </label>
                            <select
                                name="priority"
                                value={formData.priority}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                required
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">
                                Category
                            </label>
                            <input
                                type="text"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                placeholder="e.g., Inventory, Sales, HR"
                            />
                        </div>

                        {/* Due Date */}
                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">
                                Due Date
                            </label>
                            <input
                                type="date"
                                name="due_date"
                                value={formData.due_date}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                            />
                        </div>

                        {/* Due Time */}
                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">
                                Due Time
                            </label>
                            <input
                                type="time"
                                name="due_time"
                                value={formData.due_time}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                            />
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
                            {task ? 'Update Task' : 'Create Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TaskFormModal;
