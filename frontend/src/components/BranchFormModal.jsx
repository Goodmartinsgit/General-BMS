import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const BranchFormModal = ({ isOpen, onClose, onSubmit, branch, organizations, users }) => {
    const [formData, setFormData] = useState({
        organization_id: '',
        branch_code: '',
        branch_name: '',
        address: '',
        city: '',
        state: '',
        country: 'Nigeria',
        phone_number: '',
        email: '',
        manager_user_id: '',
        is_warehouse: false,
        is_active: true
    });

    useEffect(() => {
        if (branch) {
            setFormData({
                organization_id: branch.organization_id || '',
                branch_code: branch.branch_code || '',
                branch_name: branch.branch_name || '',
                address: branch.address || '',
                city: branch.city || '',
                state: branch.state || '',
                country: branch.country || 'Nigeria',
                phone_number: branch.phone_number || '',
                email: branch.email || '',
                manager_user_id: branch.manager_user_id || '',
                is_warehouse: branch.is_warehouse || false,
                is_active: branch.is_active ?? true
            });
        } else {
            setFormData({
                organization_id: organizations[0]?.id || '',
                branch_code: '',
                branch_name: '',
                address: '',
                city: '',
                state: '',
                country: 'Nigeria',
                phone_number: '',
                email: '',
                manager_user_id: '',
                is_warehouse: false,
                is_active: true
            });
        }
    }, [branch, organizations, isOpen]);

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

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto pt-10 pb-10">
            <div className="bg-theme-secondary rounded-2xl shadow-theme-lg w-full max-w-2xl my-auto border border-theme">
                <div className="flex justify-between items-center p-6 border-b border-theme">
                    <h2 className="text-xl font-bold text-theme-primary">{branch ? 'Edit Branch' : 'Add New Branch'}</h2>
                    <button onClick={onClose} className="text-theme-muted hover:text-theme-error transition-colors">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 gap-6">
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-theme-secondary mb-1">Organization</label>
                        <select
                            name="organization_id"
                            value={formData.organization_id}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 border border-theme bg-theme-primary text-theme-primary rounded-xl focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none"
                            required
                        >
                            <option value="" className="bg-theme-secondary">Select Organization</option>
                            {organizations.map(org => (
                                <option key={org.id} value={org.id} className="bg-theme-secondary">{org.organization_name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-theme-secondary mb-1">Branch Code (Unique)</label>
                        <input
                            type="text"
                            name="branch_code"
                            value={formData.branch_code}
                            onChange={handleChange}
                            placeholder="e.g. LAG-01"
                            className="w-full px-4 py-2.5 border border-theme bg-theme-primary text-theme-primary rounded-xl focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none placeholder-theme-muted"
                            required
                            disabled={!!branch}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-theme-secondary mb-1">Branch Name</label>
                        <input
                            type="text"
                            name="branch_name"
                            value={formData.branch_name}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 border border-theme bg-theme-primary text-theme-primary rounded-xl focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none"
                            required
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-theme-secondary mb-1">Address</label>
                        <textarea
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            rows="2"
                            className="w-full px-4 py-2.5 border border-theme bg-theme-primary text-theme-primary rounded-xl focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none"
                        ></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-theme-secondary mb-1">City</label>
                        <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 border border-theme bg-theme-primary text-theme-primary rounded-xl focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-theme-secondary mb-1">State</label>
                        <input
                            type="text"
                            name="state"
                            value={formData.state}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 border border-theme bg-theme-primary text-theme-primary rounded-xl focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-theme-secondary mb-1">Phone Number</label>
                        <input
                            type="text"
                            name="phone_number"
                            value={formData.phone_number}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 border border-theme bg-theme-primary text-theme-primary rounded-xl focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-theme-secondary mb-1">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 border border-theme bg-theme-primary text-theme-primary rounded-xl focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-theme-secondary mb-1">Manager</label>
                        <select
                            name="manager_user_id"
                            value={formData.manager_user_id}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 border border-theme bg-theme-primary text-theme-primary rounded-xl focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none"
                        >
                            <option value="" className="bg-theme-secondary">Select Manager</option>
                            {users.map(user => (
                                <option key={user.id} value={user.id} className="bg-theme-secondary">{user.full_name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col justify-center gap-3">
                        <label className="flex items-center gap-3 p-3 border border-theme rounded-xl cursor-pointer hover:bg-theme-tertiary transition-colors">
                            <input
                                type="checkbox"
                                name="is_warehouse"
                                id="is_warehouse"
                                checked={formData.is_warehouse}
                                onChange={handleChange}
                                className="w-5 h-5 text-accent-gold rounded focus:ring-accent-gold/20"
                            />
                            <span className="text-sm font-medium text-theme-primary">Central Warehouse</span>
                        </label>
                        <label className="flex items-center gap-3 p-3 border border-theme rounded-xl cursor-pointer hover:bg-theme-tertiary transition-colors">
                            <input
                                type="checkbox"
                                name="is_active"
                                id="is_active_branch"
                                checked={formData.is_active}
                                onChange={handleChange}
                                className="w-5 h-5 text-accent-gold rounded focus:ring-accent-gold/20"
                            />
                            <span className="text-sm font-medium text-theme-primary">Active</span>
                        </label>
                    </div>
                    <div className="col-span-2 flex justify-end gap-3 pt-6 border-t border-theme mt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-theme-secondary hover:bg-theme-tertiary rounded-lg transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-accent-gold text-white rounded-lg hover:bg-accent-goldDark font-bold shadow-lg shadow-accent-gold/20"
                        >
                            {branch ? 'Update Branch' : 'Create Branch'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BranchFormModal;
