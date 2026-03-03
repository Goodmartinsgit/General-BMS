import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiPrinter, FiCheckCircle, FiTrash2, FiClock, FiCreditCard } from 'react-icons/fi';
import api from '../api/axios';
import { format } from 'date-fns';
import { useCurrency } from '../context/CurrencyContext';

const QuotationDetailPage = () => {
    const { formatCurrency } = useCurrency();
    const { id } = useParams();
    const navigate = useNavigate();
    const [quotation, setQuotation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showConvertModal, setShowConvertModal] = useState(false);
    const [bankChannels, setBankChannels] = useState([]);
    
    // Convert Form Data
    const [convertData, setConvertData] = useState({
        payment_method: 'Cash',
        amount_paid: '',
        bank_channel_id: ''
    });

    useEffect(() => {
        fetchQuotation();
        fetchBankChannels();
    }, [id]);

    const fetchQuotation = async () => {
        try {
            const res = await api.get(`/quotations/${id}`);
            setQuotation(res.data);
            setConvertData(prev => ({ ...prev, amount_paid: res.data.total_amount }));
        } catch (error) {
            console.error('Error fetching quotation:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBankChannels = async () => {
        try {
            const res = await api.get('/banks/channels');
            setBankChannels(res.data);
        } catch (error) {
            console.error('Error fetching banks:', error);
        }
    };

    const handleConvertToSale = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const res = await api.post(`/quotations/${id}/convert`, convertData);
            alert('Quotation converted to sale successfully!');
            navigate(`/sales-history`); // Redirect to sales history
        } catch (error) {
            alert(error.response?.data?.message || 'Error converting quotation');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center font-bold">Loading quote details...</div>;
    if (!quotation) return <div className="p-8 text-center font-bold text-red-500">Quotation not found</div>;

    const isPending = quotation.status === 'Pending';

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen dark:bg-gray-900">
            <div className="max-w-4xl mx-auto">
                <button 
                    onClick={() => navigate('/quotations')} 
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 font-bold text-sm"
                >
                    <FiArrowLeft /> BACK TO LIST
                </button>

                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden mb-8">
                    {/* Invoice Header */}
                    <div className="p-8 md:p-12 border-b dark:border-gray-700 flex flex-col md:flex-row justify-between items-start gap-8">
                        <div>
                            <span className="text-[10px] font-black tracking-[0.2em] text-blue-600 uppercase bg-blue-50 px-3 py-1.5 rounded-full dark:bg-blue-900/40">{quotation.quotation_number}</span>
                            <h1 className="text-4xl font-black mt-4 text-gray-900 dark:text-white">PRO-FORMA INVOICE</h1>
                            <div className="flex gap-4 mt-6">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Issue Date</p>
                                    <p className="font-bold text-sm">{format(new Date(quotation.created_at), 'dd MMM yyyy')}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Valid Until</p>
                                    <p className="font-bold text-sm text-red-500">{format(new Date(quotation.valid_until), 'dd MMM yyyy')}</p>
                                </div>
                            </div>
                        </div>

                        <div className="text-right md:min-w-[200px]">
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">Customer Details</p>
                            <p className="text-xl font-black text-gray-900 dark:text-white">{quotation.customer_name}</p>
                            <p className="text-sm text-gray-500 mt-1">{quotation.customer_email || 'No email'}</p>
                            <p className="text-sm text-gray-500">{quotation.customer_phone || 'No phone'}</p>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="p-8 md:p-12 overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b dark:border-gray-700">
                                <tr>
                                    <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</th>
                                    <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Qty</th>
                                    <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Unit Price</th>
                                    <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                {quotation.items.map(item => (
                                    <tr key={item.id}>
                                        <td className="py-5">
                                            <p className="font-bold text-gray-900 dark:text-white">{item.product_name}</p>
                                            <p className="text-[10px] text-gray-400 font-mono italic">{item.product_code}</p>
                                        </td>
                                        <td className="py-5 text-center font-bold text-gray-600 dark:text-gray-400">{item.quantity}</td>
                                        <td className="py-5 text-right font-bold text-gray-600 dark:text-gray-400">{formatCurrency(item.unit_price)}</td>
                                        <td className="py-5 text-right font-black text-gray-900 dark:text-white">{formatCurrency(item.subtotal)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary Footer */}
                    <div className="p-8 md:p-12 bg-gray-50/50 dark:bg-gray-900/50 border-t dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="max-w-xs text-center md:text-left">
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Terms & Conditions</p>
                            <p className="text-xs text-gray-500 italic">This is an automated pro-forma invoice. Prices are valid until the specified date. Payment should be made within the validity period.</p>
                        </div>
                        <div className="text-center md:text-right">
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Grand Total</p>
                            <p className="text-4xl font-black text-blue-600">{formatCurrency(quotation.total_amount)}</p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-4 justify-center">
                    <button className="flex items-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold shadow-lg hover:bg-gray-800 transition-transform hover:scale-[1.02]">
                        <FiPrinter /> PRINT QUOTE
                    </button>
                    
                    {isPending && (
                        <button 
                            onClick={() => setShowConvertModal(true)}
                            className="flex items-center gap-2 px-8 py-4 bg-green-600 text-white rounded-2xl font-bold shadow-lg shadow-green-100 hover:bg-green-700 transition-transform hover:scale-[1.02]"
                        >
                            <FiCheckCircle /> CONVERT TO SALE
                        </button>
                    )}

                    {isPending && (
                        <button className="flex items-center gap-2 px-8 py-4 bg-red-100 text-red-600 rounded-2xl font-bold hover:bg-red-200 transition-colors">
                            <FiTrash2 /> CANCEL QUOTE
                        </button>
                    )}
                </div>
            </div>

            {/* Convert to Sale Modal */}
            {showConvertModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl">
                        <h3 className="text-2xl font-black mb-2 flex items-center gap-3"><FiCreditCard className="text-green-600" /> Convert to Sale</h3>
                        <p className="text-sm text-gray-500 mb-6">Process the payment to finalize the transaction.</p>
                        
                        <form onSubmit={handleConvertToSale} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Payment Method</label>
                                <select 
                                    className="w-full p-3 bg-gray-50 dark:bg-gray-900 border rounded-xl font-bold outline-none"
                                    value={convertData.payment_method}
                                    onChange={(e) => setConvertData({...convertData, payment_method: e.target.value})}
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="Transfer">Transfer</option>
                                    <option value="POS">POS</option>
                                </select>
                            </div>

                            {(convertData.payment_method === 'Transfer' || convertData.payment_method === 'POS') && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Destination Bank (Required)</label>
                                    <select 
                                        className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-green-200 rounded-xl font-bold outline-none"
                                        value={convertData.bank_channel_id}
                                        onChange={(e) => setConvertData({...convertData, bank_channel_id: e.target.value})}
                                        required
                                    >
                                        <option value="">Select Bank Account</option>
                                        {bankChannels.map(b => (
                                            <option key={b.id} value={b.id}>{b.bank_name} - {b.account_number}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Amount Paid</label>
                                <input 
                                    type="number" 
                                    className="w-full p-3 bg-gray-50 dark:bg-gray-900 border rounded-xl font-bold outline-none"
                                    value={convertData.amount_paid}
                                    onChange={(e) => setConvertData({...convertData, amount_paid: e.target.value})}
                                    required
                                />
                            </div>

                            <div className="flex gap-4 pt-6">
                                <button type="button" onClick={() => setShowConvertModal(false)} className="flex-1 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl">CANCEL</button>
                                <button 
                                    type="submit" 
                                    disabled={actionLoading}
                                    className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:bg-green-700"
                                >
                                    {actionLoading ? 'Processing...' : 'CONFIRM SALE'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuotationDetailPage;
