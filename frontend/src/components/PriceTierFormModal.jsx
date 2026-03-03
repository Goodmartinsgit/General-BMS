import React, { useState, useEffect } from 'react';
import { X, Layers } from 'lucide-react';

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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div className="bg-theme-secondary rounded-xl max-w-md w-full shadow-2xl border border-theme" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 border-b border-theme">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-accent-gold text-white flex items-center justify-center">
                            <Layers size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-theme-primary">{tier ? 'Edit Price Tier' : 'Add Price Tier'}</h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-theme-muted hover:text-theme-primary hover:bg-theme-tertiary rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-theme-primary mb-2">Tier Name</label>
                        <input
                            type="text"
                            name="tier_name"
                            value={formData.tier_name}
                            onChange={handleChange}
                            placeholder="e.g. Gold Customer, Wholesale Level 1"
                            className="w-full bg-theme-primary border border-theme rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all text-theme-primary placeholder-theme-muted text-sm"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-theme-primary mb-2">Discount Percentage (%)</label>
                        <input
                            type="number"
                            name="discount_percentage"
                            value={formData.discount_percentage}
                            onChange={handleChange}
                            step="0.01"
                            min="0"
                            max="100"
                            className="w-full bg-theme-primary border border-theme rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all text-theme-primary text-sm"
                            required
                        />
                        <p className="text-xs text-theme-muted mt-1.5">This discount will be applied to the base product price.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-theme-primary mb-2">Notes</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows="2"
                            placeholder="Optional description for this tier..."
                            className="w-full bg-theme-primary border border-theme rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all text-theme-primary placeholder-theme-muted text-sm resize-none"
                        ></textarea>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            role="switch"
                            aria-checked={formData.is_active}
                            onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                formData.is_active ? 'bg-accent-gold' : 'bg-theme-tertiary'
                            }`}
                        >
                            <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                                formData.is_active ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                        </button>
                        <label className="text-sm font-medium text-theme-primary">
                            {formData.is_active ? 'Active' : 'Inactive'}
                        </label>
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-theme">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 bg-theme-secondary border border-theme text-theme-secondary rounded-lg hover:bg-theme-tertiary transition font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2.5 bg-accent-gold text-white rounded-lg hover:bg-accent-goldDark transition font-semibold"
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
