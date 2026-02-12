import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ShoppingBag } from 'lucide-react';
import axios from 'axios';

const WholesaleOrderFormModal = ({ isOpen, onClose, onSuccess }) => {
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [branches, setBranches] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [selectedBranch, setSelectedBranch] = useState('');
    const [orderItems, setOrderItems] = useState([]);
    const [notes, setNotes] = useState('');
    const [paymentTerms, setPaymentTerms] = useState(0);

    const API_URL = 'http://localhost:5000/api';

    useEffect(() => {
        if (isOpen) {
            fetchData();
        }
    }, [isOpen]);

    const fetchData = async () => {
        try {
            const [prodRes, custRes, branchRes] = await Promise.all([
                axios.get(`${API_URL}/products`),
                axios.get(`${API_URL}/customers?type=Wholesale`),
                axios.get(`${API_URL}/branches`)
            ]);
            setProducts(prodRes.data);
            setCustomers(custRes.data);
            setBranches(branchRes.data);
            if (branchRes.data.length > 0) setSelectedBranch(branchRes.data[0].id);
        } catch (error) {
            console.error('Error fetching data:', error);
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
        if (orderItems.length === 0) return alert('Add at least one item');
        
        try {
            const payload = {
                customer_id: selectedCustomer,
                branch_id: selectedBranch,
                items: orderItems,
                total_amount: calculateTotal(),
                payment_terms_days: paymentTerms,
                notes
            };
            await axios.post(`${API_URL}/wholesale-orders`, payload);
            onSuccess();
            onClose();
            setOrderItems([]);
            setNotes('');
        } catch (error) {
            alert('Failed to create wholesale order');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b">
                    <div className="flex items-center gap-2">
                        <ShoppingBag className="text-blue-600" />
                        <h2 className="text-2xl font-black text-gray-900">New Wholesale Order</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                        <X size={28} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Customer</label>
                            <select
                                value={selectedCustomer}
                                onChange={(e) => setSelectedCustomer(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            >
                                <option value="">Select Wholesale Client</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>{c.customer_name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Fulfillment Branch</label>
                            <select
                                value={selectedBranch}
                                onChange={(e) => setSelectedBranch(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            >
                                {branches.map(b => (
                                    <option key={b.id} value={b.id}>{b.branch_name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Payment Terms (Days)</label>
                            <input
                                type="number"
                                value={paymentTerms}
                                onChange={(e) => setPaymentTerms(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest">Order Items</h3>
                            <button
                                type="button"
                                onClick={addItem}
                                className="text-xs flex items-center gap-1 text-blue-600 font-bold hover:bg-blue-50 px-3 py-1.5 rounded-lg transition"
                            >
                                <Plus size={14} /> Add Product
                            </button>
                        </div>

                        {orderItems.map((item, index) => (
                            <div key={index} className="grid grid-cols-12 gap-3 items-end bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <div className="col-span-12 md:col-span-5">
                                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Product</label>
                                    <select
                                        value={item.product_id}
                                        onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                                        className="w-full px-3 py-1.5 bg-white border rounded-lg text-sm outline-none"
                                        required
                                    >
                                        <option value="">Select Product</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.product_name} ({p.product_code})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-4 md:col-span-2">
                                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Quantity</label>
                                    <input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                                        className="w-full px-3 py-1.5 bg-white border rounded-lg text-sm outline-none"
                                        required
                                    />
                                </div>
                                <div className="col-span-4 md:col-span-2">
                                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Unit Price</label>
                                    <input
                                        type="number"
                                        value={item.unit_price}
                                        onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value))}
                                        className="w-full px-3 py-1.5 bg-white border rounded-lg text-sm outline-none font-bold"
                                        required
                                    />
                                </div>
                                <div className="col-span-3 md:col-span-2 text-right self-center">
                                    <div className="text-[9px] font-bold text-gray-400 uppercase mb-1">Subtotal</div>
                                    <div className="font-black text-gray-800">₦{item.subtotal.toLocaleString()}</div>
                                </div>
                                <div className="col-span-1 flex justify-end pb-1.5">
                                    <button
                                        type="button"
                                        onClick={() => removeItem(index)}
                                        className="text-gray-300 hover:text-red-500 transition"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Internal Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows="3"
                            placeholder="Special shipping instructions or reference numbers..."
                            className="w-full px-4 py-2 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        ></textarea>
                    </div>
                </form>

                <div className="p-6 bg-slate-900 flex justify-between items-center text-white">
                    <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">Total Order Value</div>
                        <div className="text-3xl font-black">₦{calculateTotal().toLocaleString()}</div>
                    </div>
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 text-slate-300 hover:text-white transition font-bold"
                        >
                            Discard
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-3 rounded-xl font-black shadow-xl shadow-blue-900/50 transition active:scale-95"
                        >
                            SUBMIT ORDER
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WholesaleOrderFormModal;
