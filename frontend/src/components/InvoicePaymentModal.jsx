import React, { useState, useEffect } from 'react';
import { X, DollarSign } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

const InvoicePaymentModal = ({ isOpen, onClose, onSubmit, invoice }) => {
    const { formatCurrency } = useCurrency();
    const [formData, setFormData] = useState({
        amount: '',
        payment_date: '',
        payment_method: 'bank_transfer',
        reference: '',
        notes: ''
    });

    const balanceDue = invoice
        ? parseFloat(invoice.total_amount || 0) - parseFloat(invoice.amount_paid || 0)
        : 0;

    useEffect(() => {
        if (invoice && isOpen) {
            setFormData({
                amount: balanceDue > 0 ? balanceDue.toFixed(2) : '',
                payment_date: new Date().toISOString().substring(0, 10),
                payment_method: 'bank_transfer',
                reference: '',
                notes: ''
            });
        }
    }, [invoice, isOpen]);

    if (!isOpen || !invoice) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            ...formData,
            amount: parseFloat(formData.amount)
        });
    };

    const inputClass = "w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-10">
            <div className="bg-theme-secondary rounded-lg shadow-xl w-full max-w-md my-auto">
                <div className="flex justify-between items-center p-4 border-b border-theme">
                    <h2 className="text-xl font-semibold text-theme-primary">Record Payment</h2>
                    <button onClick={onClose} className="text-theme-muted hover:text-theme-primary transition">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Invoice Info Card */}
                    <div className="bg-theme-primary p-4 rounded-lg border border-theme space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-theme-muted">Invoice</span>
                            <span className="text-sm font-mono font-semibold text-accent-gold">{invoice.invoice_number}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-theme-muted">Customer</span>
                            <span className="text-sm font-medium text-theme-primary">{invoice.customer_name || 'N/A'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-theme-muted">Total Amount</span>
                            <span className="text-sm font-medium text-theme-primary">{formatCurrency(invoice.total_amount || 0)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-theme-muted">Already Paid</span>
                            <span className="text-sm font-medium text-green-600 dark:text-green-400">{formatCurrency(invoice.amount_paid || 0)}</span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-theme">
                            <span className="text-sm font-semibold text-theme-primary">Balance Due</span>
                            <div className="flex items-center gap-1.5">
                                <DollarSign size={14} className="text-red-500" />
                                <span className="text-sm font-bold text-red-600 dark:text-red-400">{formatCurrency(balanceDue)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Payment Amount */}
                    <div>
                        <label className="block text-sm font-medium text-theme-secondary mb-1">Payment Amount *</label>
                        <input
                            type="number"
                            name="amount"
                            value={formData.amount}
                            onChange={handleChange}
                            max={balanceDue}
                            step="0.01"
                            min="0.01"
                            required
                            className={inputClass}
                        />
                        <p className="text-xs text-theme-muted mt-1">Maximum: {formatCurrency(balanceDue)}</p>
                    </div>

                    {/* Payment Date */}
                    <div>
                        <label className="block text-sm font-medium text-theme-secondary mb-1">Payment Date *</label>
                        <input
                            type="date"
                            name="payment_date"
                            value={formData.payment_date}
                            onChange={handleChange}
                            required
                            className={inputClass}
                        />
                    </div>

                    {/* Payment Method */}
                    <div>
                        <label className="block text-sm font-medium text-theme-secondary mb-1">Payment Method *</label>
                        <select
                            name="payment_method"
                            value={formData.payment_method}
                            onChange={handleChange}
                            required
                            className={inputClass}
                        >
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="cash">Cash</option>
                            <option value="cheque">Cheque</option>
                            <option value="mobile_money">Mobile Money</option>
                            <option value="credit_card">Credit Card</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    {/* Reference */}
                    <div>
                        <label className="block text-sm font-medium text-theme-secondary mb-1">Reference</label>
                        <input
                            type="text"
                            name="reference"
                            value={formData.reference}
                            onChange={handleChange}
                            placeholder="Transaction ID, cheque number, etc."
                            className={inputClass}
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-theme-secondary mb-1">Notes</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows="2"
                            placeholder="Optional payment notes..."
                            className={inputClass}
                        ></textarea>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-theme font-semibold">
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
                            Record Payment
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InvoicePaymentModal;
