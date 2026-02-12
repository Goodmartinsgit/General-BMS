import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const InventoryUpdateModal = ({ isOpen, onClose, onSubmit, products, branches }) => {
    const [formData, setFormData] = useState({
        product_id: '',
        branch_id: '',
        quantity_change: '',
        movement_type: 'receipt', // Default to receipt
        notes: ''
    });

    useEffect(() => {
        if (isOpen) {
            setFormData({
                product_id: products[0]?.id || '',
                branch_id: branches[0]?.id || '',
                quantity_change: '',
                movement_type: 'receipt',
                notes: ''
            });
        }
    }, [isOpen, products, branches]);

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
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-theme-secondary rounded-2xl shadow-theme-lg w-full max-w-md border border-theme">
                <div className="flex justify-between items-center p-6 border-b border-theme">
                    <h2 className="text-xl font-bold text-theme-primary">Update Stock Level</h2>
                    <button onClick={onClose} className="text-theme-muted hover:text-theme-error transition-colors">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-theme-secondary mb-1">Product</label>
                        <select
                            name="product_id"
                            value={formData.product_id}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 border border-theme bg-theme-primary text-theme-primary rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                        >
                            <option value="" className="bg-theme-secondary">Select Product</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id} className="bg-theme-secondary">{p.product_name} ({p.product_code})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-theme-secondary mb-1">Branch</label>
                        <select
                            name="branch_id"
                            value={formData.branch_id}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 border border-theme bg-theme-primary text-theme-primary rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                        >
                            <option value="" className="bg-theme-secondary">Select Branch</option>
                            {branches.map(b => (
                                <option key={b.id} value={b.id} className="bg-theme-secondary">{b.branch_name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-theme-secondary mb-1">Adjustment Type</label>
                        <select
                            name="movement_type"
                            value={formData.movement_type}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 border border-theme bg-theme-primary text-theme-primary rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                        >
                            <option value="receipt" className="bg-theme-secondary">Stock Receipt (Add)</option>
                            <option value="adjustment" className="bg-theme-secondary">Manual Adjustment</option>
                            <option value="return" className="bg-theme-secondary">Customer Return (Add)</option>
                            <option value="sale" className="bg-theme-secondary">Manual Sale (Deduct)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-theme-secondary mb-1">Quantity Change (use negative for deduction)</label>
                        <input
                            type="number"
                            name="quantity_change"
                            value={formData.quantity_change}
                            onChange={handleChange}
                            placeholder="e.g. 50 or -10"
                            className="w-full px-4 py-2.5 border border-theme bg-theme-primary text-theme-primary rounded-xl focus:ring-2 focus:ring-blue-500 outline-none placeholder-theme-muted"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-theme-secondary mb-1">Notes</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows="2"
                            placeholder="Reference number or reason..."
                            className="w-full px-4 py-2.5 border border-theme bg-theme-primary text-theme-primary rounded-xl focus:ring-2 focus:ring-blue-500 outline-none placeholder-theme-muted"
                        ></textarea>
                    </div>
                    <div className="flex justify-end gap-3 pt-6 border-t border-theme">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-theme-secondary hover:bg-theme-tertiary rounded-lg transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-lg shadow-blue-600/20"
                        >
                            Update Stock
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InventoryUpdateModal;
