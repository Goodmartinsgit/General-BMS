import React from 'react';
import { Printer, Download, Mail, X } from 'lucide-react';

const InvoicePrintModal = ({ isOpen, onClose, data }) => {
    if (!isOpen || !data) return null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 print:p-0">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden print:shadow-none print:w-full print:h-full print:max-w-none print:rounded-none">
                <div className="flex justify-between items-center p-6 border-b print:hidden">
                    <h2 className="text-xl font-black text-gray-900 uppercase tracking-widest">Document Preview</h2>
                    <div className="flex gap-2">
                        <button onClick={handlePrint} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-bold">
                            <Printer size={18} /> Print / Save PDF
                        </button>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition p-2">
                                <X size={24} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-12 bg-white text-slate-900" id="printable-invoice">
                    <div className="flex justify-between items-start mb-12">
                        <div>
                            <div className="text-3xl font-black text-blue-600 mb-1 tracking-tighter italic">BMS UNIFIED</div>
                            <div className="text-xs text-gray-400 font-bold uppercase tracking-widest">Enterprise Management System</div>
                        </div>
                        <div className="text-right">
                            <h1 className="text-5xl font-black text-gray-100 uppercase absolute right-12 top-12 -z-10 select-none">INVOICE</h1>
                            <div className="text-sm font-black text-gray-800 uppercase tracking-widest mb-1">INVOICE #{data.sale_number || data.order_number}</div>
                            <div className="text-[10px] text-gray-400 font-bold">DATE: {new Date().toLocaleDateString('en-GB')}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-12 mb-12">
                        <div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">Billed From</div>
                            <div className="font-black text-slate-800 uppercase">{data.branch_name || 'Main Branch'}</div>
                            <div className="text-xs text-slate-500 leading-relaxed max-w-[200px]">
                                Industrial Area, Phase 1<br />
                                Lagos, Nigeria
                            </div>
                        </div>
                        <div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">Billed To</div>
                            <div className="font-black text-slate-800 uppercase">{data.customer_name || 'Walk-in Customer'}</div>
                            <div className="text-xs text-slate-500 leading-relaxed">
                                {data.customer_email || 'No email provided'}<br />
                                {data.customer_phone || ''}
                            </div>
                        </div>
                    </div>

                    <div className="mb-12">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900 text-white text-[9px] font-bold uppercase tracking-widest">
                                <tr>
                                    <th className="px-4 py-3">Description</th>
                                    <th className="px-4 py-3 text-center">Qty</th>
                                    <th className="px-4 py-3 text-right">Unit Price</th>
                                    <th className="px-4 py-3 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm font-medium">
                                {(data.items || []).map((item, idx) => (
                                    <tr key={idx} className="border-b border-gray-100">
                                        <td className="px-4 py-4">
                                            <div className="font-bold text-slate-800 uppercase">{item.product_name}</div>
                                            <div className="text-[10px] text-gray-400">{item.product_code}</div>
                                        </td>
                                        <td className="px-4 py-4 text-center">{item.quantity}</td>
                                        <td className="px-4 py-4 text-right">₦{parseFloat(item.unit_price).toLocaleString()}</td>
                                        <td className="px-4 py-4 text-right font-black italic">₦{parseFloat(item.subtotal).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end">
                        <div className="w-64 space-y-3">
                            <div className="flex justify-between text-xs text-gray-400 font-bold uppercase px-2">
                                <span>Subtotal</span>
                                <span>₦{parseFloat(data.subtotal || data.total_amount).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-400 font-bold uppercase px-2">
                                <span>Tax (Vat 7.5%)</span>
                                <span>₦{parseFloat(data.tax_amount || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-xl font-black bg-slate-900 text-white p-3 rounded-lg">
                                <span>TOTAL</span>
                                <span>₦{parseFloat(data.total_amount).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-20 pt-8 border-t border-dashed border-gray-200 text-center">
                        <div className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-2">Thank you for your business</div>
                        <div className="text-[9px] text-gray-300 italic">This is a computer generated document. Signature not required.</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoicePrintModal;
