import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Search } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'react-toastify';

const QuotationForm = ({ isOpen, onClose, onSuccess }) => {
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [branches, setBranches] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [formData, setFormData] = useState({
        customer_id: '',
        branch_id: '',
        notes: '',
        valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });

    useEffect(() => {
        if (isOpen) {
            fetchInitialData();
        }
    }, [isOpen]);

    const fetchInitialData = async () => {
        try {
            const [prodRes, custRes, branchRes] = await Promise.all([
                api.get('/products'),
                api.get('/customers'),
                api.get('/branches')
            ]);

            setProducts(prodRes.data?.products || []);
            setCustomers(Array.isArray(custRes.data) ? custRes.data : []);
            setBranches(Array.isArray(branchRes.data) ? branchRes.data : []);

            if (Array.isArray(branchRes.data) && branchRes.data.length > 0) {
                setFormData(prev => ({ ...prev, branch_id: branchRes.data[0].id }));
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load form data');
            setProducts([]);
            setCustomers([]);
            setBranches([]);
        }
    };

    const addItem = (product) => {
        const existing = selectedItems.find(item => item.product_id === product.id);
        if (existing) {
            updateQuantity(product.id, existing.quantity + 1);
        } else {
            setSelectedItems([...selectedItems, {
                product_id: product.id,
                product_name: product.product_name,
                quantity: 1,
                unit_price: product.effective_price || product.retail_price,
                subtotal: product.effective_price || product.retail_price
            }]);
        }
    };

    const updateQuantity = (productId, qty) => {
        setSelectedItems(selectedItems.map(item => {
            if (item.product_id === productId) {
                const newQty = Math.max(1, qty);
                return { ...item, quantity: newQty, subtotal: newQty * item.unit_price };
            }
            return item;
        }));
    };

    const removeItem = (productId) => {
        setSelectedItems(selectedItems.filter(item => item.product_id !== productId));
    };

    const calculateTotal = () => selectedItems.reduce((sum, item) => sum + item.subtotal, 0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedItems.length === 0) {
            toast.error('Please add at least one item');
            return;
        }

        try {
            await api.post('/quotations', {
                ...formData,
                items: selectedItems,
                total_amount: calculateTotal()
            });
            toast.success('Quotation created successfully');
            onSuccess();
            onClose();
            setSelectedItems([]);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error creating quotation');
        }
    };

    if (!isOpen) return null;

    const filteredProducts = (products || []).filter(p =>
        p.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.product_code?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-10">
            <div className="bg-theme-secondary rounded-lg shadow-xl w-full max-w-5xl my-auto flex flex-col max-h-[85vh] overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-theme shrink-0">
                    <h2 className="text-xl font-semibold text-theme-primary">Create New Quotation</h2>
                    <button onClick={onClose} className="text-theme-muted hover:text-theme-primary transition">
                        <X size={24} />
                    </button>
                </div>

                {/* Body: split panel */}
                <div className="grow overflow-hidden flex flex-col md:flex-row min-h-0">
                    {/* Left: Product Search & Selection */}
                    <div className="w-full md:w-1/2 p-6 border-r border-theme flex flex-col min-h-0">
                        <h3 className="text-sm font-semibold text-accent-gold uppercase pb-2 border-b border-theme mb-4">Products</h3>
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted" size={16} />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none text-sm"
                            />
                        </div>
                        <div className="grow overflow-y-auto space-y-2 min-h-0">
                            {filteredProducts.length === 0 && (
                                <p className="text-sm text-theme-muted text-center py-6">No products found</p>
                            )}
                            {filteredProducts.map(p => (
                                <div key={p.id} className="p-3 bg-theme-primary border border-theme rounded-lg flex justify-between items-center hover:border-accent-gold/40 transition-colors">
                                    <div className="min-w-0 mr-3">
                                        <p className="text-sm font-medium text-theme-primary truncate">{p.product_name}</p>
                                        <p className="text-xs text-theme-muted mt-0.5">{p.product_code} · ₦{parseFloat(p.effective_price || p.retail_price).toLocaleString()}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => addItem(p)}
                                        className="shrink-0 p-1.5 bg-accent-gold text-white rounded-lg hover:bg-accent-goldDark transition-colors"
                                    >
                                        <Plus size={15} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Quotation Details & Summary */}
                    <form onSubmit={handleSubmit} className="w-full md:w-1/2 p-6 flex flex-col min-h-0">
                        <h3 className="text-sm font-semibold text-accent-gold uppercase pb-2 border-b border-theme mb-4">Quotation Details</h3>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-theme-secondary mb-1">Customer</label>
                                <select
                                    className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                    value={formData.customer_id}
                                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                                    required
                                >
                                    <option value="">Select Customer</option>
                                    {customers.map(c => <option key={c.id} value={c.id}>{c.customer_name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-theme-secondary mb-1">Valid Until</label>
                                <input
                                    type="date"
                                    className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                    value={formData.valid_until}
                                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grow overflow-y-auto min-h-0 mb-4">
                            <h3 className="text-sm font-semibold text-accent-gold uppercase pb-2 border-b border-theme mb-3">Selected Items</h3>
                            <div className="space-y-2">
                                {selectedItems.length === 0 && (
                                    <p className="text-sm text-theme-muted text-center py-6 border border-dashed border-theme rounded-lg">
                                        Click + on a product to add it
                                    </p>
                                )}
                                {selectedItems.map(item => (
                                    <div key={item.product_id} className="flex items-center gap-3 bg-theme-primary border border-theme rounded-lg p-3">
                                        <div className="grow min-w-0">
                                            <p className="text-sm font-medium text-theme-primary truncate">{item.product_name}</p>
                                            <p className="text-xs text-theme-muted mt-0.5">₦{item.unit_price.toLocaleString()} × {item.quantity}</p>
                                        </div>
                                        <input
                                            type="number"
                                            min="1"
                                            className="w-16 px-2 py-1 text-center border border-theme rounded-lg text-sm bg-theme-secondary text-theme-primary focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                            value={item.quantity}
                                            onChange={(e) => updateQuantity(item.product_id, parseInt(e.target.value))}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeItem(item.product_id)}
                                            className="text-theme-muted hover:text-red-500 transition p-1 shrink-0"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-theme mt-auto">
                            <div>
                                <span className="text-sm text-theme-muted">Total: </span>
                                <span className="text-lg font-bold text-accent-gold ml-1">₦{calculateTotal().toLocaleString()}</span>
                            </div>
                            <div className="flex gap-3 font-semibold">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-5 py-2 text-theme-secondary bg-theme-primary hover:bg-theme-tertiary border border-theme rounded-lg transition text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-accent-gold text-white rounded-lg hover:bg-accent-goldDark shadow-md transition text-sm"
                                >
                                    Save Quotation
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default QuotationForm;
