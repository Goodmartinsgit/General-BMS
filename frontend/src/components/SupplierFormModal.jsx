import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import useFormDraft from '../hooks/useFormDraft';
import DraftRecoveryBanner from './common/DraftRecoveryBanner';

const defaultSupplierData = {
    supplier_name: '',
    contact_person: '',
    email: '',
    phone_number: '',
    whatsapp_number: '',
    address: '',
    payment_terms: '',
    notes: ''
};

const SupplierFormModal = ({ isOpen, onClose, onSubmit, supplier }) => {
    const [formData, setFormData] = useState(defaultSupplierData);

    const isEditMode = !!supplier;
    const draftKey = isEditMode ? `supplier_edit_${supplier?.id}` : 'supplier_create';
    const { draftData, hasDraft, applyDraft, dismissDraft, saveDraft, clearDraft } = useFormDraft(draftKey, {
        label: isEditMode ? `Edit: ${supplier?.supplier_name || 'Supplier'}` : 'New Supplier',
        entityType: 'supplier',
        initialData: defaultSupplierData,
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
        if (supplier) {
            setFormData({
                supplier_name: supplier.supplier_name || '',
                contact_person: supplier.contact_person || '',
                email: supplier.email || '',
                phone_number: supplier.phone_number || '',
                whatsapp_number: supplier.whatsapp_number || '',
                address: supplier.address || '',
                payment_terms: supplier.payment_terms || '',
                notes: supplier.notes || ''
            });
        } else {
            setFormData({
                supplier_name: '',
                contact_person: '',
                email: '',
                phone_number: '',
                whatsapp_number: '',
                address: '',
                payment_terms: '',
                notes: ''
            });
        }
    }, [supplier, isOpen]);

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
        clearDraft();
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-10">
            <div className="bg-theme-secondary rounded-lg shadow-xl w-full max-w-3xl my-auto">
                <div className="flex justify-between items-center p-4 border-b border-theme">
                    <h2 className="text-xl font-semibold text-theme-primary">{supplier ? 'Edit Supplier' : 'Add New Supplier'}</h2>
                    <button onClick={onClose} className="text-theme-muted hover:text-theme-primary transition">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6">
                    <DraftRecoveryBanner
                        visible={hasDraft}
                        label={isEditMode ? `Edit: ${supplier?.supplier_name}` : 'New Supplier'}
                        updatedAt={draftData?._savedAt}
                        onRestore={handleRestoreDraft}
                        onDiscard={dismissDraft}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="col-span-1 md:col-span-2 pb-2 border-b border-theme">
                            <h3 className="text-sm font-semibold text-accent-gold uppercase">Basic Information</h3>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Supplier Name</label>
                            <input
                                type="text"
                                name="supplier_name"
                                value={formData.supplier_name}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Contact Person</label>
                            <input
                                type="text"
                                name="contact_person"
                                value={formData.contact_person}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                            />
                        </div>

                        <div className="col-span-1 md:col-span-2 pb-2 border-b border-theme mt-4">
                            <h3 className="text-sm font-semibold text-accent-gold uppercase">Contact Details</h3>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Phone Number</label>
                            <input
                                type="text"
                                name="phone_number"
                                value={formData.phone_number}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">WhatsApp Number</label>
                            <input
                                type="text"
                                name="whatsapp_number"
                                value={formData.whatsapp_number}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Address</label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                            />
                        </div>

                        <div className="col-span-1 md:col-span-2 pb-2 border-b border-theme mt-4">
                            <h3 className="text-sm font-semibold text-accent-gold uppercase">Business Terms</h3>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Payment Terms</label>
                            <input
                                type="text"
                                name="payment_terms"
                                value={formData.payment_terms}
                                onChange={handleChange}
                                placeholder="e.g., Net 30, COD, 50% advance"
                                className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Notes</label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                rows="3"
                                className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
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
                            {supplier ? 'Update Supplier' : 'Save Supplier'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SupplierFormModal;
