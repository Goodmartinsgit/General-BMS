import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const UserFormModal = ({ isOpen, onClose, onSubmit, user, roles }) => {
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        phone_number: '',
        role_id: '',
        is_active: true
    });

    useEffect(() => {
        if (user) {
            setFormData({
                full_name: user.full_name || '',
                email: user.email || '',
                password: '',
                phone_number: user.phone_number || '',
                role_id: user.role_id || (roles.find(r => r.role_name === user.role_name)?.id || ''),
                is_active: user.is_active ?? true
            });
        } else {
            setFormData({
                full_name: '',
                email: '',
                password: '',
                phone_number: '',
                role_id: roles[0]?.id || '',
                is_active: true
            });
        }
    }, [user, roles, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const inputClass = "w-full px-3 py-2.5 bg-theme-primary border border-theme rounded-lg text-sm text-theme-primary placeholder-theme-muted focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all";

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-theme-secondary rounded-xl shadow-theme-lg border border-theme w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-5 border-b border-theme">
                    <h2 className="text-lg font-semibold text-theme-primary">{user ? 'Edit User' : 'Add New User'}</h2>
                    <button onClick={onClose} className="text-theme-muted hover:text-theme-primary transition-colors p-1 rounded-lg hover:bg-theme-tertiary">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">Full Name</label>
                        <input
                            type="text"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleChange}
                            className={inputClass}
                            placeholder="Enter full name"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={`${inputClass} ${user ? 'opacity-60 cursor-not-allowed' : ''}`}
                            placeholder="Enter email address"
                            required
                            disabled={!!user}
                        />
                    </div>
                    {!user && (
                        <div>
                            <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">Password</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder="Enter password"
                                required={!user}
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">Phone Number</label>
                        <input
                            type="text"
                            name="phone_number"
                            value={formData.phone_number}
                            onChange={handleChange}
                            className={inputClass}
                            placeholder="Enter phone number"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">Role</label>
                        <select
                            name="role_id"
                            value={formData.role_id}
                            onChange={handleChange}
                            className={`${inputClass} appearance-none cursor-pointer`}
                            required
                        >
                            <option value="">Select Role</option>
                            {roles.map(role => (
                                <option key={role.id} value={role.id}>{role.role_name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <input
                            type="checkbox"
                            name="is_active"
                            id="is_active"
                            checked={formData.is_active}
                            onChange={handleChange}
                            className="w-4 h-4 rounded border-theme text-accent-gold focus:ring-accent-gold/20"
                        />
                        <label htmlFor="is_active" className="text-sm font-medium text-theme-secondary">Active Account</label>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-theme">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 text-sm font-medium text-theme-secondary bg-theme-tertiary hover:bg-theme-primary border border-theme rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2.5 text-sm font-semibold bg-accent-gold text-white rounded-lg hover:bg-accent-goldDark transition-colors"
                        >
                            {user ? 'Update User' : 'Create User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserFormModal;
