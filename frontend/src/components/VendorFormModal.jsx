import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const VendorFormModal = ({ isOpen, onClose, onSubmit, vendor }) => {
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        type: 'supplier',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        tax_id: '',
        payment_terms: '',
        credit_limit: '',
        notes: ''
    });

    useEffect(() => {
        if (vendor) {
            setFormData({
                code: vendor.code || '',
                name: vendor.name || '',
                type: vendor.type || 'supplier',
                contact_person: vendor.contact_person || '',
                email: vendor.email || '',
                phone: vendor.phone || '',
                address: vendor.address || '',
                city: vendor.city || '',
                tax_id: vendor.tax_id || '',
                payment_terms: vendor.payment_terms || '',
                credit_limit: vendor.credit_limit || '',
                notes: vendor.notes || ''
            });
        } else {
            setFormData({
                code: '',
                name: '',
                type: 'supplier',
                contact_person: '',
                email: '',
                phone: '',
                address: '',
                city: '',
                tax_id: '',
                payment_terms: '',
                credit_limit: '',
                notes: ''
            });
        }
    }, [vendor, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            ...formData,
            credit_limit: formData.credit_limit ? parseFloat(formData.credit_limit) : null
        });
    };

    const inputClass = "w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-10">
            <div className="bg-theme-secondary rounded-lg shadow-xl w-full max-w-3xl my-auto">
                <div className="flex justify-between items-center p-4 border-b border-theme">
                    <h2 className="text-xl font-semibold text-theme-primary">{vendor ? 'Edit Vendor' : 'Add New Vendor'}</h2>
                    <button onClick={onClose} className="text-theme-muted hover:text-theme-primary transition">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {/* Basic Information */}
                        <div className="col-span-1 md:col-span-2 pb-2 border-b border-theme">
                            <h3 className="text-sm font-semibold text-accent-gold uppercase">Basic Information</h3>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Vendor Code</label>
                            <input
                                type="text"
                                name="code"
                                value={formData.code}
                                onChange={handleChange}
                                placeholder="e.g., VND-001"
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Vendor Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className={inputClass}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Type</label>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                className={inputClass}
                            >
                                <option value="supplier">Supplier</option>
                                <option value="service_provider">Service Provider</option>
                                <option value="contractor">Contractor</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Tax ID</label>
                            <input
                                type="text"
                                name="tax_id"
                                value={formData.tax_id}
                                onChange={handleChange}
                                placeholder="Tax identification number"
                                className={inputClass}
                            />
                        </div>

                        {/* Contact Details */}
                        <div className="col-span-1 md:col-span-2 pb-2 border-b border-theme mt-4">
                            <h3 className="text-sm font-semibold text-accent-gold uppercase">Contact Details</h3>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Contact Person</label>
                            <input
                                type="text"
                                name="contact_person"
                                value={formData.contact_person}
                                onChange={handleChange}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Phone Number</label>
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">City</label>
                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                className={inputClass}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Address</label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                className={inputClass}
                            />
                        </div>

                        {/* Business Terms */}
                        <div className="col-span-1 md:col-span-2 pb-2 border-b border-theme mt-4">
                            <h3 className="text-sm font-semibold text-accent-gold uppercase">Business Terms</h3>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Payment Terms</label>
                            <input
                                type="text"
                                name="payment_terms"
                                value={formData.payment_terms}
                                onChange={handleChange}
                                placeholder="e.g., Net 30, COD, 50% advance"
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Credit Limit</label>
                            <input
                                type="number"
                                name="credit_limit"
                                value={formData.credit_limit}
                                onChange={handleChange}
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                className={inputClass}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Notes</label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                rows="3"
                                className={inputClass}
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
                            {vendor ? 'Update Vendor' : 'Save Vendor'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VendorFormModal;
