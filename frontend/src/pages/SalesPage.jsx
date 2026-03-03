import React, { useState, useEffect } from 'react';

import api from '../api/axios';
import { useCurrency } from '../context/CurrencyContext';
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, User, Package, MapPin } from 'lucide-react';

const SalesPage = () => {
    const { formatCurrency, symbol } = useCurrency();
    const [products, setProducts] = useState([]);
    const [branches, setBranches] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [referrers, setReferrers] = useState([]);
    const [selectedReferrer, setSelectedReferrer] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [channels, setChannels] = useState([]);
    const [selectedChannel, setSelectedChannel] = useState('');

    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('Cash');

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [prodRes, branchRes, custRes, refRes, channelRes] = await Promise.all([
                api.get('/products'),
                api.get('/branches'),
                api.get('/customers'),
                api.get('/referrers'),
                api.get('/banks/channels')
            ]);
            setProducts(prodRes.data?.products || []);
            setBranches(branchRes.data);
            setCustomers(custRes.data);
            setReferrers(refRes.data);
            setChannels(channelRes.data);

            if (branchRes.data.length > 0) setSelectedBranch(branchRes.data[0].id);
            if (channelRes.data.length > 0) {
                setSelectedChannel(channelRes.data[0].id);
            }
        } catch (error) {
            console.error('Error fetching POS data:', error);
        }
    };

    const addToCart = (product) => {
        if (!selectedBranch) {
            alert('Please select a branch first');
            return;
        }

        const existingItem = cart.find(item => item.product_id === product.id);
        if (existingItem) {
            setCart(cart.map(item => 
                item.product_id === product.id 
                ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.unit_price } 
                : item
            ));
        } else {
            setCart([...cart, {
                product_id: product.id,
                product_name: product.product_name,
                product_code: product.product_code,
                unit_price: product.base_price,
                quantity: 1,
                subtotal: product.base_price
            }]);
        }
    };

    const updateQuantity = (productId, delta) => {
        setCart(cart.map(item => {
            if (item.product_id === productId) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty, subtotal: newQty * item.unit_price };
            }
            return item;
        }));
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.product_id !== productId));
    };

    const calculateTotals = () => {
        const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
        const tax = subtotal * 0.075; // 7.5% VAT example
        return {
            subtotal,
            tax,
            total: subtotal + tax
        };
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        
        setLoading(true);
        const { subtotal, tax, total } = calculateTotals();
        
        const payload = {
            branch_id: selectedBranch,
            customer_id: selectedCustomer || null,
            items: cart,
            subtotal,
            discount_amount: 0,
            tax_amount: tax,
            total_amount: total,
            payment_method: paymentMethod,
            amount_paid: totals.total,
            referrer_id: selectedReferrer || null,
            channel_id: selectedChannel
        };


        try {
            await api.post('/sales', payload);
            alert('Sale completed successfully!');
            setCart([]);
            setSelectedCustomer('');
        } catch (error) {
            console.error('Checkout error:', error);
            alert(error.response?.data?.message || 'Checkout failed');
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter(p => 
        p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.product_code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totals = calculateTotals();

    return (
        <div className="flex h-[calc(100vh-120px)] gap-6 overflow-hidden">
            {/* Catalog Section */}
            <div className="flex-1 flex flex-col bg-theme-secondary rounded-xl shadow-theme-sm border border-theme p-4 overflow-hidden">
                <div className="flex flex-wrap gap-4 mb-4">
                    <div className="flex-1 min-w-[250px] relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted w-5 h-5" size={18} />
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="w-full pl-10 pr-4 py-2 bg-theme-primary border border-theme rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-theme-primary placeholder-theme-muted"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 bg-theme-primary px-3 py-1 rounded-lg border border-theme">
                        <MapPin size={16} className="text-blue-500" />
                        <select 
                            className="bg-transparent text-sm font-semibold outline-none text-theme-primary"
                            value={selectedBranch}
                            onChange={(e) => setSelectedBranch(e.target.value)}
                        >
                            {branches.map(b => (
                                <option key={b.id} value={b.id} className="bg-theme-secondary text-theme-primary">{b.branch_name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pr-2 pb-4">
                    {filteredProducts.map(p => (
                        <div 
                            key={p.id} 
                            onClick={() => addToCart(p)}
                            className="flex flex-col p-3 border border-theme rounded-xl hover:border-blue-500 hover:shadow-md transition cursor-pointer group bg-theme-secondary"
                        >
                            <div className="aspect-square bg-theme-tertiary rounded-lg mb-2 flex items-center justify-center text-theme-muted">
                                <Package size={40} />
                            </div>
                            <div className="font-bold text-theme-primary text-sm truncate">{p.product_name}</div>
                            <div className="text-[10px] text-theme-muted font-mono mb-2">{p.product_code}</div>
                            <div className="flex justify-between items-center mt-auto">
                                <span className="text-blue-600 dark:text-blue-400 font-black">{formatCurrency(p.base_price)}</span>
                                <div className="p-1 bg-blue-50 dark:bg-blue-900/20 group-hover:bg-blue-600 rounded text-blue-600 dark:text-blue-400 group-hover:text-white transition">
                                    <Plus size={16} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Cart Section */}
            <div className="w-[400px] flex flex-col bg-theme-primary rounded-xl border border-theme overflow-hidden">
                <div className="p-4 bg-theme-secondary border-b border-theme flex justify-between items-center">
                    <div className="flex items-center gap-2 font-bold text-theme-primary uppercase tracking-wider">
                        <ShoppingCart size={20} className="text-blue-600" /> Current Cart
                    </div>
                    <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded text-xs font-bold dark:bg-blue-900/30 dark:text-blue-400">
                        {cart.length} ITEMS
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-theme-tertiary/30">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-theme-muted italic">
                            Cart is empty
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.product_id} className="bg-theme-secondary p-3 rounded-lg shadow-sm border border-theme flex items-center gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-theme-primary text-sm truncate">{item.product_name}</div>
                                    <div className="text-blue-600 dark:text-blue-400 text-xs font-bold">{formatCurrency(item.unit_price)}</div>
                                </div>
                                <div className="flex items-center gap-2 bg-theme-tertiary rounded-lg p-1">
                                    <button onClick={() => updateQuantity(item.product_id, -1)} className="p-1 hover:bg-theme-secondary rounded shadow-sm text-theme-secondary"><Minus size={14} /></button>
                                    <span className="w-6 text-center text-sm font-bold text-theme-primary">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.product_id, 1)} className="p-1 hover:bg-theme-secondary rounded shadow-sm text-theme-secondary"><Plus size={14} /></button>
                                </div>
                                <button onClick={() => removeFromCart(item.product_id)} className="text-theme-muted hover:text-red-500 transition">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 bg-theme-secondary border-t border-theme space-y-4">
                    <div>
                        <label className="text-[10px] font-bold text-theme-muted uppercase mb-1 block">Customer (Optional)</label>
                        <div className="flex items-center gap-2 border border-theme rounded-lg px-3 py-2 bg-theme-primary">
                            <User size={16} className="text-theme-muted" />
                            <select 
                                className="bg-transparent flex-1 text-sm outline-none text-theme-primary cursor-pointer"
                                value={selectedCustomer}
                                onChange={(e) => setSelectedCustomer(e.target.value)}
                            >
                                <option value="" className="bg-theme-secondary text-theme-primary">Walk-in Customer</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id} className="bg-theme-secondary text-theme-primary">{c.customer_name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-theme-muted uppercase mb-1 block text-blue-500">Referrer / Agent (Optional)</label>
                        <div className="flex items-center gap-2 border border-blue-100 dark:border-blue-900 rounded-lg px-3 py-2 bg-blue-50/30 dark:bg-blue-900/10">
                            <User size={16} className="text-blue-400" />
                            <select 
                                className="bg-transparent flex-1 text-sm outline-none text-blue-900 dark:text-blue-300 font-medium cursor-pointer"
                                value={selectedReferrer}
                                onChange={(e) => setSelectedReferrer(e.target.value)}
                            >
                                <option value="" className="bg-theme-secondary text-theme-primary">No Referrer</option>
                                {referrers.map(r => (
                                    <option key={r.id} value={r.id} className="bg-theme-secondary text-theme-primary">{r.full_name} ({r.referrer_code})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-theme-muted uppercase mb-1 block">Deposit To (Bank / Channel)</label>
                        <div className="flex items-center gap-2 border border-theme rounded-lg px-3 py-2 bg-theme-primary">
                            <Banknote size={16} className="text-theme-muted" />
                            <select 
                                className="bg-transparent flex-1 text-sm outline-none font-medium text-theme-primary cursor-pointer"
                                value={selectedChannel}
                                onChange={(e) => setSelectedChannel(e.target.value)}
                            >
                                {channels.map(c => (
                                    <option key={c.id} value={c.id} className="bg-theme-secondary text-theme-primary">{c.channel_name} ({formatCurrency(c.current_balance)})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1 text-sm">
                        <div className="flex justify-between text-theme-secondary">
                            <span>Subtotal</span>
                            <span>{formatCurrency(totals.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-theme-secondary">
                            <span>Tax (7.5%)</span>
                            <span>{formatCurrency(totals.tax)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-black text-blue-600 dark:text-blue-400 pt-2 border-t border-theme mt-2">
                            <span>Total</span>
                            <span>{formatCurrency(totals.total)}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <button 
                            onClick={() => setPaymentMethod('Cash')}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition ${paymentMethod === 'Cash' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-theme-tertiary text-theme-secondary hover:border-theme'}`}
                        >
                            <Banknote size={24} />
                            <span className="text-xs font-bold mt-1">Cash</span>
                        </button>
                        <button 
                            onClick={() => setPaymentMethod('Card')}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition ${paymentMethod === 'Card' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-theme-tertiary text-theme-secondary hover:border-theme'}`}
                        >
                            <CreditCard size={24} />
                            <span className="text-xs font-bold mt-1">Card / POS</span>
                        </button>
                    </div>

                    <button 
                        onClick={handleCheckout}
                        disabled={loading || cart.length === 0}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-200 dark:shadow-none transition active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        {loading ? 'Processing...' : `COMPLETE PAYMENT • ${formatCurrency(totals.total)}`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SalesPage;
