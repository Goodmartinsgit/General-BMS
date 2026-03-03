import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { X, Plus, Trash2 } from 'lucide-react';

const emptyLineItem = {
    description: '',
    gl_account_id: '',
    quantity: 1,
    unit_price: 0,
    tax_rate: 0
};

const BillFormModal = ({ isOpen, onClose, onSubmit, bill }) => {
    const [formData, setFormData] = useState({
        vendor_id: '',
        bill_date: '',
        due_date: '',
        reference: '',
        notes: '',
        status: 'draft'
    });
    const [lineItems, setLineItems] = useState([{ ...emptyLineItem }]);
    const [vendors, setVendors] = useState([]);
    const [glAccounts, setGlAccounts] = useState([]);
    const [loadingData, setLoadingData] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchDropdownData();
        }
    }, [isOpen]);

    useEffect(() => {
        if (bill) {
            setFormData({
                vendor_id: bill.vendor_id || '',
                bill_date: bill.bill_date ? bill.bill_date.substring(0, 10) : '',
                due_date: bill.due_date ? bill.due_date.substring(0, 10) : '',
                reference: bill.reference || '',
                notes: bill.notes || '',
                status: bill.status || 'draft'
            });
            if (bill.line_items && bill.line_items.length > 0) {
                setLineItems(bill.line_items.map(item => ({
                    description: item.description || '',
                    gl_account_id: item.gl_account_id || '',
                    quantity: item.quantity || 1,
                    unit_price: item.unit_price || 0,
                    tax_rate: item.tax_rate || 0
                })));
            } else {
                setLineItems([{ ...emptyLineItem }]);
            }
        } else {
            setFormData({
                vendor_id: '',
                bill_date: new Date().toISOString().substring(0, 10),
                due_date: '',
                reference: '',
                notes: '',
                status: 'draft'
            });
            setLineItems([{ ...emptyLineItem }]);
        }
    }, [bill, isOpen]);

    const fetchDropdownData = async () => {
        setLoadingData(true);
        try {
            const [vendorsRes, accountsRes] = await Promise.allSettled([
                api.get('/vendors'),
                api.get('/gl-accounts')
            ]);
            if (vendorsRes.status === 'fulfilled') setVendors(vendorsRes.value.data);
            if (accountsRes.status === 'fulfilled') setGlAccounts(accountsRes.value.data);
        } catch (error) {
            console.error('Error fetching dropdown data:', error);
        } finally {
            setLoadingData(false);
        }
    };

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLineItemChange = (index, field, value) => {
        setLineItems(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const addLineItem = () => {
        setLineItems(prev => [...prev, { ...emptyLineItem }]);
    };

    const removeLineItem = (index) => {
        if (lineItems.length <= 1) return;
        setLineItems(prev => prev.filter((_, i) => i !== index));
    };

    const calcLineAmount = (item) => {
        return (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
    };

    const calcLineTax = (item) => {
        const amount = calcLineAmount(item);
        return amount * ((parseFloat(item.tax_rate) || 0) / 100);
    };

    const subtotal = lineItems.reduce((sum, item) => sum + calcLineAmount(item), 0);
    const totalTax = lineItems.reduce((sum, item) => sum + calcLineTax(item), 0);
    const total = subtotal + totalTax;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            ...formData,
            line_items: lineItems.map(item => ({
                ...item,
                quantity: parseFloat(item.quantity) || 0,
                unit_price: parseFloat(item.unit_price) || 0,
                tax_rate: parseFloat(item.tax_rate) || 0,
                amount: calcLineAmount(item),
                tax_amount: calcLineTax(item)
            })),
            subtotal,
            tax_amount: totalTax,
            total_amount: total
        });
    };

    const inputClass = "w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-10">
            <div className="bg-theme-secondary rounded-lg shadow-xl w-full max-w-3xl my-auto">
                <div className="flex justify-between items-center p-4 border-b border-theme">
                    <h2 className="text-xl font-semibold text-theme-primary">{bill ? 'Edit Bill' : 'New Bill'}</h2>
                    <button onClick={onClose} className="text-theme-muted hover:text-theme-primary transition">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6">
                    {/* Header Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="col-span-1 md:col-span-2 pb-2 border-b border-theme">
                            <h3 className="text-sm font-semibold text-accent-gold uppercase">Bill Details</h3>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Vendor *</label>
                            <select
                                name="vendor_id"
                                value={formData.vendor_id}
                                onChange={handleChange}
                                className={inputClass}
                                required
                            >
                                <option value="">Select Vendor</option>
                                {vendors.map(v => (
                                    <option key={v.id} value={v.id}>{v.name} {v.code ? `(${v.code})` : ''}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Bill Date *</label>
                            <input
                                type="date"
                                name="bill_date"
                                value={formData.bill_date}
                                onChange={handleChange}
                                className={inputClass}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Due Date *</label>
                            <input
                                type="date"
                                name="due_date"
                                value={formData.due_date}
                                onChange={handleChange}
                                className={inputClass}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Reference</label>
                            <input
                                type="text"
                                name="reference"
                                value={formData.reference}
                                onChange={handleChange}
                                placeholder="PO number, vendor invoice #, etc."
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Status</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className={inputClass}
                            >
                                <option value="draft">Draft</option>
                                <option value="pending">Pending</option>
                            </select>
                        </div>
                    </div>

                    {/* Line Items */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between pb-2 border-b border-theme mb-4">
                            <h3 className="text-sm font-semibold text-accent-gold uppercase">Line Items</h3>
                            <button
                                type="button"
                                onClick={addLineItem}
                                className="text-accent-gold hover:text-accent-goldDark text-sm font-medium flex items-center gap-1 transition"
                            >
                                <Plus size={16} /> Add Line
                            </button>
                        </div>

                        <div className="space-y-3">
                            {/* Column headers */}
                            <div className="hidden md:grid md:grid-cols-12 gap-2 text-xs font-semibold text-theme-muted uppercase px-1">
                                <div className="col-span-3">Description</div>
                                <div className="col-span-2">GL Account</div>
                                <div className="col-span-1 text-right">Qty</div>
                                <div className="col-span-2 text-right">Unit Price</div>
                                <div className="col-span-1 text-right">Tax %</div>
                                <div className="col-span-2 text-right">Amount</div>
                                <div className="col-span-1"></div>
                            </div>

                            {lineItems.map((item, index) => (
                                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start bg-theme-primary p-3 rounded-lg border border-theme">
                                    <div className="md:col-span-3">
                                        <label className="block text-xs text-theme-muted mb-1 md:hidden">Description</label>
                                        <input
                                            type="text"
                                            value={item.description}
                                            onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                                            placeholder="Description"
                                            className="w-full px-2 py-1.5 border border-theme bg-theme-secondary text-theme-primary rounded text-sm focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                            required
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs text-theme-muted mb-1 md:hidden">GL Account</label>
                                        <select
                                            value={item.gl_account_id}
                                            onChange={(e) => handleLineItemChange(index, 'gl_account_id', e.target.value)}
                                            className="w-full px-2 py-1.5 border border-theme bg-theme-secondary text-theme-primary rounded text-sm focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                        >
                                            <option value="">Select Account</option>
                                            {glAccounts.map(a => (
                                                <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="block text-xs text-theme-muted mb-1 md:hidden">Qty</label>
                                        <input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)}
                                            min="0"
                                            step="any"
                                            className="w-full px-2 py-1.5 border border-theme bg-theme-secondary text-theme-primary rounded text-sm text-right focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs text-theme-muted mb-1 md:hidden">Unit Price</label>
                                        <input
                                            type="number"
                                            value={item.unit_price}
                                            onChange={(e) => handleLineItemChange(index, 'unit_price', e.target.value)}
                                            min="0"
                                            step="0.01"
                                            className="w-full px-2 py-1.5 border border-theme bg-theme-secondary text-theme-primary rounded text-sm text-right focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="block text-xs text-theme-muted mb-1 md:hidden">Tax %</label>
                                        <input
                                            type="number"
                                            value={item.tax_rate}
                                            onChange={(e) => handleLineItemChange(index, 'tax_rate', e.target.value)}
                                            min="0"
                                            max="100"
                                            step="0.01"
                                            className="w-full px-2 py-1.5 border border-theme bg-theme-secondary text-theme-primary rounded text-sm text-right focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                        />
                                    </div>
                                    <div className="md:col-span-2 flex items-center justify-end">
                                        <label className="block text-xs text-theme-muted mb-1 md:hidden">Amount</label>
                                        <span className="text-sm font-semibold text-theme-primary py-1.5">
                                            {(calcLineAmount(item) + calcLineTax(item)).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="md:col-span-1 flex items-center justify-center">
                                        <button
                                            type="button"
                                            onClick={() => removeLineItem(index)}
                                            disabled={lineItems.length <= 1}
                                            className="p-1.5 text-theme-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Totals */}
                    <div className="flex justify-end mb-6">
                        <div className="w-full md:w-72 space-y-2 bg-theme-primary p-4 rounded-lg border border-theme">
                            <div className="flex justify-between text-sm">
                                <span className="text-theme-muted">Subtotal</span>
                                <span className="text-theme-primary font-medium">{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-theme-muted">Tax</span>
                                <span className="text-theme-primary font-medium">{totalTax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm font-bold pt-2 border-t border-theme">
                                <span className="text-theme-primary">Total</span>
                                <span className="text-accent-gold">{total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-theme-secondary mb-1">Notes</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows="2"
                            className={inputClass}
                            placeholder="Additional notes..."
                        ></textarea>
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
                            {bill ? 'Update Bill' : 'Save Bill'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BillFormModal;
