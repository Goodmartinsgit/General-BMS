import React, { useState, useEffect } from 'react';
import { X, DollarSign, CreditCard, Banknote, FileText } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

const CommissionPaymentModal = ({ isOpen, onClose, onSubmit, referrer }) => {
    const { formatCurrency, symbol } = useCurrency();
    const [formData, setFormData] = useState({
        referrer_id: '',
        amount: '',
        payment_method: 'Cash',
        reference_number: '',
        notes: ''
    });

    useEffect(() => {
        if (referrer) {
            setFormData(prev => ({
                ...prev,
                referrer_id: referrer.id,
                amount: referrer.commission_balance || 0
            }));
        }
    }, [referrer, isOpen]);

    if (!isOpen || !referrer) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold">Process Commission</h2>
                        <p className="text-slate-400 text-xs mt-1">Paying out earnings to {referrer.full_name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                        <div className="text-sm text-slate-500 font-medium">Available Balance</div>
                        <div className="text-xl font-black text-slate-900 text-right">
                            {formatCurrency(referrer.commission_balance || 0)}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Payment Amount ({symbol})</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="number"
                                    required
                                    max={referrer.commission_balance}
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-lg font-bold"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Payment Method</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, payment_method: 'Cash' })}
                                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition ${formData.payment_method === 'Cash' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-200'}`}
                                >
                                    <Banknote size={18} />
                                    <span className="font-bold text-sm">Cash</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, payment_method: 'Transfer' })}
                                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition ${formData.payment_method === 'Transfer' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-200'}`}
                                >
                                    <CreditCard size={18} />
                                    <span className="font-bold text-sm">Transfer</span>
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Reference Number</label>
                            <input
                                type="text"
                                placeholder="Bank Ref, Receipt ID, etc."
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                value={formData.reference_number}
                                onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Notes</label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-3 text-slate-400" size={18} />
                                <textarea
                                    rows="2"
                                    placeholder="Add payment details..."
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-2 px-8 py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition active:scale-95"
                        >
                            CONFIRM PAYMENT
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CommissionPaymentModal;
