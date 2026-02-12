import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Printer, MessageSquare, RotateCcw, 
    User, Package, Calendar, CreditCard, Landmark, 
    ShoppingBag, Tag, FileText
} from 'lucide-react';
import { salesAPI } from '../api/sales';
import { Button, LoadingSpinner, Badge } from '../components/ui';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const SaleDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [sale, setSale] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSaleDetails();
    }, [id]);

    const fetchSaleDetails = async () => {
        setLoading(true);
        try {
            const data = await salesAPI.getSale(id);
            setSale(data);
        } catch (error) {
            console.error('Error fetching sale details:', error);
            toast.error('Failed to load sale details');
            navigate('/sales-history');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="h-full flex items-center justify-center">
            <LoadingSpinner size="lg" />
        </div>
    );

    if (!sale) return null;

    const isReversed = !!sale.reversed_at;

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-12">
            {/* Header / Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button 
                        variant="white" 
                        size="sm" 
                        onClick={() => navigate('/sales-history')}
                        className="rounded-full w-10 h-10 p-0 flex items-center justify-center"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-black text-gray-900">{sale.sale_number}</h2>
                            <Badge variant={isReversed ? 'danger' : 'success'}>
                                {isReversed ? 'CANCELLED / REVERSED' : 'COMPLETED'}
                            </Badge>
                        </div>
                        <p className="text-gray-500 text-sm">Recorded on {format(new Date(sale.created_at), 'PPPpppp')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="white" className="gap-2">
                        <Printer className="w-4 h-4" /> Print Receipt
                    </Button>
                    {!isReversed && (
                        <Button variant="danger" className="gap-2">
                            <RotateCcw className="w-4 h-4" /> Reverse Sale
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sale Items */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2 bg-gray-50/50">
                            <ShoppingBag className="w-5 h-5 text-blue-600" />
                            <h3 className="font-bold text-gray-900">Items Bundled</h3>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {sale.items?.map((item, idx) => (
                                <div key={idx} className="px-6 py-4 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 transition">
                                        <Package className="w-6 h-6" />
                                    </div>
                                    <div className="flex-grow">
                                        <div className="font-bold text-gray-900">{item.product_name}</div>
                                        <div className="text-xs text-gray-400 font-mono">{item.product_code}</div>
                                        {item.variant_values && (
                                            <div className="text-[10px] text-blue-600 font-bold mt-1 uppercase">
                                                {Object.entries(item.variant_values).map(([k, v]) => `${k}: ${v}`).join(' | ')}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-gray-900">x{item.quantity}</div>
                                        <div className="text-xs text-gray-400">${parseFloat(item.unit_price).toFixed(2)} / ea</div>
                                    </div>
                                    <div className="text-right min-w-[80px]">
                                        <div className="font-bold text-blue-600">${parseFloat(item.subtotal).toFixed(2)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

import { SaleCommentList, SaleCommentForm } from '../components/sales';

                    {/* Comments Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-blue-600" />
                            Audit Notes / Comments
                        </h3>
                        
                        <SaleCommentList comments={sale.comments} />
                        
                        <div className="pt-6 border-t border-gray-50">
                            <SaleCommentForm saleId={id} onCommentAdded={fetchSaleDetails} />
                        </div>
                    </div>
                </div>

                {/* Summary & Customer Info */}
                <div className="space-y-6">
                    {/* Totals */}
                    <div className="bg-gray-900 text-white rounded-2xl p-6 shadow-xl">
                        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-6">Payment Summary</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400">Subtotal</span>
                                <span className="font-mono">${parseFloat(sale.subtotal).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400">Discount</span>
                                <span className="font-mono text-red-400">-${parseFloat(sale.discount_amount).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400">Tax</span>
                                <span className="font-mono">$0.00</span>
                            </div>
                            <div className="pt-4 border-t border-gray-800 flex justify-between items-center">
                                <span className="font-bold">TOTAL</span>
                                <span className="text-2xl font-black text-blue-400">${parseFloat(sale.total_amount).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Info Blocks */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6 shadow-sm">
                        {/* Customer */}
                        <div className="flex items-start gap-3">
                            <div className="mt-1 w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <User className="w-4 h-4" />
                            </div>
                            <div className="flex-grow">
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Customer</div>
                                <div className="font-bold text-gray-900">{sale.customer_name || 'Walk-in Customer'}</div>
                                {sale.phone_number && <div className="text-xs text-gray-500">{sale.phone_number}</div>}
                            </div>
                        </div>

                        {/* Payment Details */}
                        <div className="flex items-start gap-3">
                            <div className="mt-1 w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                <CreditCard className="w-4 h-4" />
                            </div>
                            <div className="flex-grow">
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Payment Method</div>
                                <div className="font-bold text-gray-900">{sale.payment_method}</div>
                                <div className="text-xs text-gray-500">Paid fully on receipt</div>
                            </div>
                        </div>

                        {/* Branch */}
                        <div className="flex items-start gap-3">
                            <div className="mt-1 w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                                <Landmark className="w-4 h-4" />
                            </div>
                            <div className="flex-grow">
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Origin Branch</div>
                                <div className="font-bold text-gray-900">{sale.branch_name}</div>
                            </div>
                        </div>

                        {/* Referenced By */}
                        {sale.referrer_name && (
                            <div className="flex items-start gap-3 bg-amber-50 p-3 rounded-xl border border-amber-100">
                                <div className="mt-1 w-8 h-8 rounded-lg bg-amber-200 text-amber-800 flex items-center justify-center">
                                    <Tag className="w-4 h-4" />
                                </div>
                                <div className="flex-grow">
                                    <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Referral Agent</div>
                                    <div className="font-bold text-amber-900">{sale.referrer_name}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SaleDetail;
