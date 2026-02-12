import React, { useState, useEffect } from 'react';
import { X, Save, User, Phone, Mail, MapPin, CreditCard, Banknote, FileText } from 'lucide-react';

const ReferrerFormModal = ({ isOpen, onClose, onSubmit, referrer }) => {
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-6 border-b bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-lg text-white">
                            <User size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">{referrer ? 'Edit Referrer' : 'Register New Referrer'}</h3>
                            <p className="text-sm text-gray-500 font-mono">{formData.referrer_code}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition">
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Personal Info */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                                <User size={14} /> Personal Details
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name *</label>
                                    <input
                                        type="text"
                                        name="full_name"
                                        required
                                        className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                                        value={formData.full_name}
                                        onChange={handleChange}
                                        placeholder="Enter full name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone Number *</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        required
                                        className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="080..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="email@example.com"
                                    />
                                </div>
                            </div>

                            <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 mt-6">
                                <MapPin size={14} /> Location Information
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Address</label>
                                    <input
                                        type="text"
                                        name="address"
                                        className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                                        value={formData.address}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">City</label>
                                    <input
                                        type="text"
                                        name="city"
                                        className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                                        value={formData.city}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">State</label>
                                    <input
                                        type="text"
                                        name="state"
                                        className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                                        value={formData.state}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Commission & Bank Info */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                                <Banknote size={14} /> Commission Settings
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Commission Type</label>
                                    <select
                                        name="commission_type"
                                        className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                                        value={formData.commission_type}
                                        onChange={handleChange}
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount (₦)</option>
                                    </select>
                                </div>
                                {formData.commission_type === 'percentage' ? (
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Commission Rate (%)</label>
                                        <input
                                            type="number"
                                            name="commission_rate"
                                            step="0.01"
                                            className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                                            value={formData.commission_rate}
                                            onChange={handleChange}
                                        />
                                    </div>
                                ) : (
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fixed Amount (₦)</label>
                                        <input
                                            type="number"
                                            name="fixed_commission_amount"
                                            step="0.01"
                                            className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                                            value={formData.fixed_commission_amount}
                                            onChange={handleChange}
                                        />
                                    </div>
                                )}
                            </div>

                            <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 mt-6">
                                <CreditCard size={14} /> Settlement Details
                            </h4>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bank Name</label>
                                    <input
                                        type="text"
                                        name="bank_name"
                                        className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                                        value={formData.bank_name}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Account Number</label>
                                        <input
                                            type="text"
                                            name="account_number"
                                            className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                                            value={formData.account_number}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Account Name</label>
                                        <input
                                            type="text"
                                            name="account_name"
                                            className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                                            value={formData.account_name}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-span-full">
                            <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 mb-2">
                                <FileText size={14} /> Additional Notes
                            </h4>
                            <textarea
                                name="notes"
                                className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition h-24 resize-none"
                                value={formData.notes}
                                onChange={handleChange}
                                placeholder="Any additional information..."
                            ></textarea>
                        </div>
                    </div>
                </form>

                <div className="p-6 border-t bg-slate-50 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl border font-bold text-gray-600 hover:bg-white transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex items-center gap-2 bg-blue-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                    >
                        <Save size={20} /> {referrer ? 'Update Referrer' : 'Register Referrer'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReferrerFormModal;
