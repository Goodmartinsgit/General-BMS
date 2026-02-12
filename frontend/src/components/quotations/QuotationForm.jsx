import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Search } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
                axios.get(`${API_URL}/products`),
                axios.get(`${API_URL}/customers`),
                axios.get(`${API_URL}/branches`)
            ]);
            setProducts(prodRes.data);
            setCustomers(custRes.data);
            setBranches(branchRes.data);
            
            if (branchRes.data.length > 0) {
                setFormData(prev => ({ ...prev, branch_id: branchRes.data[0].id }));
            }
        } catch (error) {
            console.error('Error fetching data:', error);
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
                unit_price: product.retail_price,
                subtotal: product.retail_price
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
        if (selectedItems.length === 0) return alert('Please add at least one item');
        
        try {
            await axios.post(`${API_URL}/quotations`, {
                ...formData,
                items: selectedItems,
                total_amount: calculateTotal()
            });
            onSuccess();
            onClose();
            setSelectedItems([]);
        } catch (error) {
            alert(error.response?.data?.message || 'Error creating quotation');
        }
    };

    if (!isOpen) return null;

    const filteredProducts = products.filter(p => 
        p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.product_code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold">Create New Quotation</h2>
                        <p className="text-sm text-gray-500">Draft a professional quote for a customer</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={24} /></button>
                </div>

                <div className="flex-grow overflow-hidden flex flex-col md:flex-row">
                    {/* Left: Product Selection */}
                    <div className="w-full md:w-1/2 p-6 border-r dark:border-gray-700 flex flex-col">
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="text"
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex-grow overflow-y-auto pr-2 space-y-2">
                            {filteredProducts.map(p => (
                                <div key={p.id} className="p-3 bg-gray-50 dark:bg-gray-900 border rounded-xl flex justify-between items-center hover:border-blue-300 transition-colors">
                                    <div>
                                        <p className="font-bold text-sm">{p.product_name}</p>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold">{p.product_code} • ₦{parseFloat(p.retail_price).toLocaleString()}</p>
                                    </div>
                                    <button 
                                        onClick={() => addItem(p)}
                                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Order Summary */}
                    <form onSubmit={handleSubmit} className="w-full md:w-1/2 p-6 flex flex-col bg-gray-50/50 dark:bg-gray-900/10">
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Customer</label>
                                <select 
                                    className="w-full p-2 border rounded-lg dark:bg-gray-800"
                                    value={formData.customer_id}
                                    onChange={(e) => setFormData({...formData, customer_id: e.target.value})}
                                    required
                                >
                                    <option value="">Select Customer</option>
                                    {customers.map(c => <option key={c.id} value={c.id}>{c.customer_name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Valid Until</label>
                                <input 
                                    type="date"
                                    className="w-full p-2 border rounded-lg dark:bg-gray-800"
                                    value={formData.valid_until}
                                    onChange={(e) => setFormData({...formData, valid_until: e.target.value})}
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex-grow overflow-y-auto mb-6">
                            <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Selected Items</h3>
                            <div className="space-y-3">
                                {selectedItems.map(item => (
                                    <div key={item.product_id} className="flex items-center gap-3 bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm">
                                        <div className="flex-grow">
                                            <p className="text-sm font-bold">{item.product_name}</p>
                                            <p className="text-[10px] text-gray-500 font-bold">₦{item.unit_price.toLocaleString()} x {item.quantity}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="number" 
                                                className="w-16 p-1 text-center border rounded font-bold text-sm dark:bg-gray-900"
                                                value={item.quantity}
                                                onChange={(e) => updateQuantity(item.product_id, parseInt(e.target.value))}
                                            />
                                            <button onClick={() => removeItem(item.product_id)} className="text-red-500 p-1"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                                {selectedItems.length === 0 && <p className="text-center text-gray-400 italic text-sm py-4">No items added yet</p>}
                            </div>
                        </div>

                        <div className="mt-auto pt-6 border-t dark:border-gray-700">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-lg font-bold text-gray-500 uppercase">Total Amount</span>
                                <span className="text-2xl font-black text-blue-600">₦{calculateTotal().toLocaleString()}</span>
                            </div>
                            <div className="flex gap-4">
                                <button type="button" onClick={onClose} className="flex-1 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">CANCEL</button>
                                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all hover:scale-[1.02]">SAVE QUOTATION</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default QuotationForm;
