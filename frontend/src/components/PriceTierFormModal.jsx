import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const PriceTierFormModal = ({ isOpen, onClose, onSubmit, tier }) => {
    const [formData, setFormData] = useState({
        tier_name: '',
        discount_percentage: 0,
        notes: '',
        is_active: true
    });

    useEffect(() => {
        if (tier) {
            setFormData({
                tier_name: tier.tier_name || '',
                discount_percentage: tier.discount_percentage || 0,
                notes: tier.notes || '',
                is_active: tier.is_active ?? true
            });
        } else {
            setFormData({
                tier_name: '',
                discount_percentage: 0,
                notes: '',
                is_active: true
            });
        }
    }, [tier, isOpen]);

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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-semibold">{tier ? 'Edit Price Tier' : 'Add Price Tier'}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tier Name</label>
                        <input
                            type="text"
                            name="tier_name"
                            value={formData.tier_name}
                            onChange={handleChange}
                            placeholder="e.g. Gold Customer, Wholesale Level 1"
                            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Discount Percentage (%)</label>
                        <input
                            type="number"
                            name="discount_percentage"
                            value={formData.discount_percentage}
                            onChange={handleChange}
                            step="0.01"
                            min="0"
                            max="100"
                            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                        />
                        <p className="text-[10px] text-gray-500 mt-1">This discount will be applied to the base product price.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows="2"
                            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        ></textarea>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            name="is_active"
                            id="tier_active"
                            checked={formData.is_active}
                            onChange={handleChange}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="tier_active" className="text-sm font-medium text-gray-700">Active</label>
                    </div>
                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            {tier ? 'Update Tier' : 'Create Tier'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PriceTierFormModal;
