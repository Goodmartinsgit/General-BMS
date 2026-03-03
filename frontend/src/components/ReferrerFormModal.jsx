import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

const ReferrerFormModal = ({ isOpen, onClose, onSubmit, referrer }) => {
    const { symbol } = useCurrency();
    const [formData, setFormData] = useState({
        referrer_code: `REF-${Math.floor(10000 + Math.random() * 90000)}`,
        full_name: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        state: '',
        commission_rate: 5,
        commission_type: 'percentage',
        fixed_commission_amount: 0,
        bank_name: '',
        account_number: '',
        account_name: '',
        notes: ''
    });

    useEffect(() => {
        if (referrer) {
            setFormData({
                ...referrer,
                commission_rate: parseFloat(referrer.commission_rate),
                fixed_commission_amount: parseFloat(referrer.fixed_commission_amount || 0)
            });
        } else {
            setFormData({
                referrer_code: `REF-${Math.floor(10000 + Math.random() * 90000)}`,
                full_name: '',
                phone: '',
                email: '',
                address: '',
                city: '',
                state: '',
                commission_rate: 5,
                commission_type: 'percentage',
                fixed_commission_amount: 0,
                bank_name: '',
                account_number: '',
                account_name: '',
                notes: ''
            });
        }
    }, [referrer, isOpen]);

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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-theme-secondary rounded-lg shadow-xl w-full max-w-4xl my-auto">
                <div className="flex items-center justify-between p-4 border-b border-theme">
                    <div>
                        <h2 className="text-xl font-semibold text-theme-primary">{referrer ? 'Edit Referrer' : 'Add New Referrer'}</h2>
                        <p className="text-sm text-theme-muted font-mono mt-0.5">{formData.referrer_code}</p>
                    </div>
                    <button onClick={onClose} className="text-theme-muted hover:text-theme-primary transition">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {/* Personal Info */}
                        <div className="col-span-1 md:col-span-2 pb-2 border-b border-theme">
                            <h3 className="text-sm font-semibold text-accent-gold uppercase">Personal Details</h3>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Full Name *</label>
                            <input
                                type="text"
                                name="full_name"
                                required
                                className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                value={formData.full_name}
                                onChange={handleChange}
                                placeholder="Enter full name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Phone Number *</label>
                            <input
                                type="tel"
                                name="phone"
                                required
                                className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="080..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="email@example.com"
                            />
                        </div>

                        {/* Location */}
                        <div className="col-span-1 md:col-span-2 pb-2 border-b border-theme mt-4">
                            <h3 className="text-sm font-semibold text-accent-gold uppercase">Location Information</h3>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Address</label>
                            <input
                                type="text"
                                name="address"
                                className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                value={formData.address}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">City</label>
                            <input
                                type="text"
                                name="city"
                                className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                value={formData.city}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">State</label>
                            <input
                                type="text"
                                name="state"
                                className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                value={formData.state}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Commission */}
                        <div className="col-span-1 md:col-span-2 pb-2 border-b border-theme mt-4">
                            <h3 className="text-sm font-semibold text-accent-gold uppercase">Commission Settings</h3>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Commission Type</label>
                            <select
                                name="commission_type"
                                className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                value={formData.commission_type}
                                onChange={handleChange}
                            >
                                <option value="percentage">Percentage (%)</option>
                                <option value="fixed">Fixed Amount ({symbol})</option>
                            </select>
                        </div>
                        {formData.commission_type === 'percentage' ? (
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-theme-secondary mb-1">Commission Rate (%)</label>
                                <input
                                    type="number"
                                    name="commission_rate"
                                    step="0.01"
                                    className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                    value={formData.commission_rate}
                                    onChange={handleChange}
                                />
                            </div>
                        ) : (
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-theme-secondary mb-1">Fixed Amount ({symbol})</label>
                                <input
                                    type="number"
                                    name="fixed_commission_amount"
                                    step="0.01"
                                    className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                    value={formData.fixed_commission_amount}
                                    onChange={handleChange}
                                />
                            </div>
                        )}

                        {/* Bank Details */}
                        <div className="col-span-1 md:col-span-2 pb-2 border-b border-theme mt-4">
                            <h3 className="text-sm font-semibold text-accent-gold uppercase">Bank Details</h3>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Bank Name</label>
                            <input
                                type="text"
                                name="bank_name"
                                className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                value={formData.bank_name}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Account Number</label>
                            <input
                                type="text"
                                name="account_number"
                                className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                value={formData.account_number}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Account Name</label>
                            <input
                                type="text"
                                name="account_name"
                                className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                value={formData.account_name}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Notes */}
                        <div className="col-span-1 md:col-span-2 pb-2 border-b border-theme mt-4">
                            <h3 className="text-sm font-semibold text-accent-gold uppercase">Additional Notes</h3>
                        </div>
                        <div className="md:col-span-2">
                            <textarea
                                name="notes"
                                className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none resize-none"
                                value={formData.notes}
                                onChange={handleChange}
                                placeholder="Any additional information..."
                                rows="3"
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
                            {referrer ? 'Update Referrer' : 'Save Referrer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReferrerFormModal;
