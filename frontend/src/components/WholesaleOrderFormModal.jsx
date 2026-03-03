import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import api from '../api/axios';
import { toast } from 'react-toastify';

const WholesaleOrderFormModal = ({ isOpen, onClose, onSuccess }) => {
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [branches, setBranches] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [selectedBranch, setSelectedBranch] = useState('');
    const [orderItems, setOrderItems] = useState([]);
    const [notes, setNotes] = useState('');
    const [paymentTerms, setPaymentTerms] = useState(0);

    useEffect(() => {
        if (isOpen) {
            fetchData();
        }
    }, [isOpen]);

    const fetchData = async () => {
        try {
            const [prodRes, custRes, branchRes] = await Promise.all([
                api.get('/products'),
                api.get('/customers?type=Wholesale'),
                api.get('/branches')
            ]);
            setProducts(prodRes.data?.products || []);
            setCustomers(custRes.data || []);
            setBranches(branchRes.data || []);
            if (branchRes.data?.length > 0) setSelectedBranch(branchRes.data[0].id);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load form data');
        }
    };

    const addItem = () => {
        setOrderItems([...orderItems, {
            product_id: '',
            quantity: 1,
            unit_price: 0,
            subtotal: 0
        }]);
    };

    const removeItem = (index) => {
        setOrderItems(orderItems.filter((_, i) => i !== index));
    };

    const updateItem = (index, field, value) => {
        const newItems = [...orderItems];
        newItems[index][field] = value;

        if (field === 'product_id') {
            const product = products.find(p => p.id.toString() === value);
            if (product) {
                newItems[index].unit_price = product.base_price;
            }
        }

        newItems[index].subtotal = newItems[index].quantity * newItems[index].unit_price;
        setOrderItems(newItems);
    };

    const calculateTotal = () => {
        return orderItems.reduce((sum, item) => sum + item.subtotal, 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (orderItems.length === 0) {
            toast.error('Add at least one item');
            return;
        }

        try {
            const payload = {
                customer_id: selectedCustomer,
                branch_id: selectedBranch,
                items: orderItems,
                total_amount: calculateTotal(),
                payment_terms_days: paymentTerms,
                notes
            };
            await api.post('/wholesale-orders', payload);
            toast.success('Wholesale order created successfully');
            onSuccess();
            onClose();
            setOrderItems([]);
            setNotes('');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create wholesale order');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-10">
            <div className="bg-theme-secondary rounded-lg shadow-xl w-full max-w-4xl my-auto">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-theme">
                    <h2 className="text-xl font-semibold text-theme-primary">New Wholesale Order</h2>
                    <button onClick={onClose} className="text-theme-muted hover:text-theme-primary transition">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {/* Order Details */}
                    <div className="col-span-full pb-2 border-b border-theme mb-4">
                        <h3 className="text-sm font-semibold text-accent-gold uppercase">Order Details</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Customer</label>
                            <select
                                value={selectedCustomer}
                                onChange={(e) => setSelectedCustomer(e.target.value)}
                                className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                required
                            >
                                <option value="">Select Wholesale Client</option>
                                {(customers || []).map(c => (
                                    <option key={c.id} value={c.id}>{c.customer_name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Fulfillment Branch</label>
                            <select
                                value={selectedBranch}
                                onChange={(e) => setSelectedBranch(e.target.value)}
                                className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                required
                            >
                                {(branches || []).map(b => (
                                    <option key={b.id} value={b.id}>{b.branch_name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Payment Terms (Days)</label>
                            <input
                                type="number"
                                value={paymentTerms}
                                onChange={(e) => setPaymentTerms(e.target.value)}
                                className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                            />
                        </div>
                    </div>

                    {/* Order Items */}
                    <div className="flex justify-between items-center pb-2 border-b border-theme mb-4">
                        <h3 className="text-sm font-semibold text-accent-gold uppercase">Order Items</h3>
                        <button
                            type="button"
                            onClick={addItem}
                            className="flex items-center gap-1.5 text-sm font-medium text-accent-gold hover:text-accent-goldDark transition"
                        >
                            <Plus size={16} /> Add Product
                        </button>
                    </div>

                    {orderItems.length === 0 && (
                        <p className="text-sm text-theme-muted text-center py-6 border border-dashed border-theme rounded-lg mb-4">
                            No items added yet. Click "Add Product" to begin.
                        </p>
                    )}

                    <div className="space-y-3 mb-6">
                        {orderItems.map((item, index) => (
                            <div key={index} className="grid grid-cols-12 gap-3 items-end bg-theme-primary border border-theme rounded-lg p-4">
                                <div className="col-span-12 md:col-span-5">
                                    <label className="block text-sm font-medium text-theme-secondary mb-1">Product</label>
                                    <select
                                        value={item.product_id}
                                        onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                                        className="w-full px-3 py-2 border border-theme bg-theme-secondary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                        required
                                    >
                                        <option value="">Select Product</option>
                                        {(products || []).map(p => (
                                            <option key={p.id} value={p.id}>{p.product_name} ({p.product_code})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-5 md:col-span-2">
                                    <label className="block text-sm font-medium text-theme-secondary mb-1">Qty</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                                        className="w-full px-3 py-2 border border-theme bg-theme-secondary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                        required
                                    />
                                </div>
                                <div className="col-span-5 md:col-span-2">
                                    <label className="block text-sm font-medium text-theme-secondary mb-1">Unit Price</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={item.unit_price}
                                        onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value))}
                                        className="w-full px-3 py-2 border border-theme bg-theme-secondary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                        required
                                    />
                                </div>
                                <div className="col-span-1 md:col-span-2 text-right self-end pb-1">
                                    <div className="text-xs text-theme-muted mb-0.5">Subtotal</div>
                                    <div className="text-sm font-semibold text-accent-gold">
                                        ₦{item.subtotal.toLocaleString()}
                                    </div>
                                </div>
                                <div className="col-span-1 flex justify-end self-end pb-1">
                                    <button
                                        type="button"
                                        onClick={() => removeItem(index)}
                                        className="text-theme-muted hover:text-red-500 transition p-1"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Notes */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-theme-secondary mb-1">Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows="3"
                            placeholder="Special instructions or reference numbers..."
                            className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none resize-none"
                        />
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-center pt-6 border-t border-theme">
                        <div>
                            <span className="text-sm text-theme-muted">Order Total: </span>
                            <span className="text-lg font-bold text-accent-gold ml-1">
                                ₦{calculateTotal().toLocaleString()}
                            </span>
                        </div>
                        <div className="flex gap-3 font-semibold">
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
                                Submit Order
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default WholesaleOrderFormModal;
