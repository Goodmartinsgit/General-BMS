import React, { useState, useEffect } from 'react';
import {
    X, Printer, RotateCcw, RefreshCw, User, Package, Calendar,
    CreditCard, Landmark, Tag, MessageSquare, ShoppingBag, AlertTriangle
} from 'lucide-react';
import { salesAPI } from '../../api/sales';
import { ReceiptPreviewModal } from '../receipt';
import { SaleCommentList, SaleCommentForm } from '.';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const ADMIN_ROLES = ['super_admin', 'admin', 'manager'];

const SaleDetailModal = ({ saleId, onClose, onReverse }) => {
    const { auth } = useAuth();
    const { symbol } = useCurrency();
    const [sale, setSale] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showReceipt, setShowReceipt] = useState(false);
    const [reversing, setReversing] = useState(false);
    const [showReverseConfirm, setShowReverseConfirm] = useState(false);
    const [reverseReason, setReverseReason] = useState('');

    const isAdmin = ADMIN_ROLES.includes(auth?.user?.role);
    const cs = symbol || '₦';

    useEffect(() => {
        if (!saleId) return;
        fetchSale();
    }, [saleId]);

    const fetchSale = async () => {
        setLoading(true);
        try {
            const data = await salesAPI.getSale(saleId);
            setSale(data);
        } catch {
            toast.error('Failed to load sale details');
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const handleReverse = async () => {
        if (!reverseReason.trim()) {
            toast.error('Please enter a reversal reason');
            return;
        }
        setReversing(true);
        try {
            await salesAPI.reverseSale(saleId, reverseReason);
            toast.success('Sale reversed successfully');
            setShowReverseConfirm(false);
            if (onReverse) onReverse();
            onClose();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to reverse sale');
        } finally {
            setReversing(false);
        }
    };

    const paymentStatusConfig = {
        paid:      { label: 'Fully Paid',     cls: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
        partial:   { label: 'Partial Payment', cls: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
        credit:    { label: 'Credit',          cls: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
        cancelled: { label: 'Cancelled',       cls: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
    };

    const getPaymentStatus = (s) => {
        if (s.reversed_at) return 'cancelled';
        if (parseFloat(s.amount_paid) >= parseFloat(s.total_amount)) return 'paid';
        if (parseFloat(s.amount_paid) > 0) return 'partial';
        return 'credit';
    };

    // Backdrop click closes modal
    const handleBackdrop = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto pt-6 pb-6"
            onClick={handleBackdrop}
        >
            <div className="relative bg-theme-secondary rounded-2xl shadow-2xl border border-theme w-full max-w-4xl mx-4 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-theme">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-lg font-bold text-theme-primary">
                            {loading ? 'Loading…' : sale?.sale_number}
                        </h2>
                        {!loading && sale && (() => {
                            const ps = getPaymentStatus(sale);
                            const cfg = paymentStatusConfig[ps] || paymentStatusConfig.credit;
                            return (
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${cfg.cls}`}>
                                    {cfg.label}
                                </span>
                            );
                        })()}
                    </div>
                    <div className="flex items-center gap-2">
                        {!loading && sale && (
                            <>
                                <button
                                    onClick={() => setShowReceipt(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-theme-primary border border-theme rounded-lg text-theme-secondary hover:bg-theme-tertiary transition"
                                >
                                    <Printer className="w-3.5 h-3.5" />
                                    Receipt
                                </button>
                                {isAdmin && !sale.reversed_at && (
                                    <button
                                        onClick={() => setShowReverseConfirm(true)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        Reverse
                                    </button>
                                )}
                            </>
                        )}
                        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-theme-tertiary text-theme-muted transition">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-theme border-t-accent-gold rounded-full animate-spin" />
                    </div>
                ) : !sale ? null : (
                    <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">

                        {/* Reversal info banner */}
                        {sale.reversed_at && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-sm font-bold text-red-700 dark:text-red-400">Sale Reversed</p>
                                    {sale.reversed_by_name && (
                                        <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                                            By {sale.reversed_by_name} • {format(new Date(sale.reversed_at), 'PPp')}
                                        </p>
                                    )}
                                    {sale.reversal_reason && (
                                        <p className="text-xs text-red-500 mt-1">Reason: {sale.reversal_reason}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left: Items + Comments */}
                            <div className="lg:col-span-2 space-y-5">
                                {/* Items */}
                                <div className="bg-theme-primary rounded-xl border border-theme overflow-hidden">
                                    <div className="px-4 py-3 border-b border-theme bg-theme-tertiary flex items-center gap-2">
                                        <ShoppingBag className="w-4 h-4 text-accent-gold" />
                                        <h3 className="text-sm font-semibold text-theme-primary">
                                            Items ({sale.items?.length || 0})
                                        </h3>
                                    </div>
                                    <div className="divide-y divide-theme">
                                        {sale.items?.map((item, idx) => (
                                            <div key={idx} className="px-4 py-3 flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-theme-tertiary flex items-center justify-center shrink-0">
                                                    <Package className="w-4 h-4 text-theme-muted" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm text-theme-primary truncate">{item.product_name}</p>
                                                    {item.product_code && (
                                                        <p className="text-[10px] font-mono text-theme-muted">{item.product_code}</p>
                                                    )}
                                                    {item.variant_values && (
                                                        <p className="text-[10px] text-accent-gold mt-0.5">
                                                            {Object.entries(item.variant_values).map(([k, v]) => `${k}: ${v}`).join(' | ')}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-xs text-theme-muted">×{item.quantity}</p>
                                                    <p className="text-xs text-theme-muted">{cs}{parseFloat(item.unit_price).toLocaleString()}</p>
                                                </div>
                                                <div className="text-right shrink-0 min-w-[70px]">
                                                    <p className="font-semibold text-sm text-accent-gold">
                                                        {cs}{parseFloat(item.subtotal || item.line_total || item.unit_price * item.quantity).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Comments */}
                                <div className="bg-theme-primary rounded-xl border border-theme p-4 space-y-4">
                                    <h3 className="text-sm font-semibold text-theme-primary flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4 text-accent-gold" />
                                        Notes &amp; Comments
                                    </h3>
                                    <SaleCommentList comments={sale.comments} />
                                    <div className="pt-3 border-t border-theme">
                                        <SaleCommentForm saleId={saleId} onCommentAdded={fetchSale} />
                                    </div>
                                </div>
                            </div>

                            {/* Right: Summary + Info */}
                            <div className="space-y-4">
                                {/* Payment Summary */}
                                <div className="bg-theme-tertiary rounded-xl p-4 border border-theme">
                                    <h3 className="text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-3">Payment Summary</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-theme-muted">Subtotal</span>
                                            <span className="text-theme-primary font-medium">{cs}{parseFloat(sale.subtotal).toLocaleString()}</span>
                                        </div>
                                        {parseFloat(sale.discount_amount) > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-theme-muted">Discount</span>
                                                <span className="text-red-500">-{cs}{parseFloat(sale.discount_amount).toLocaleString()}</span>
                                            </div>
                                        )}
                                        {parseFloat(sale.tax_amount) > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-theme-muted">Tax</span>
                                                <span className="text-theme-primary font-medium">{cs}{parseFloat(sale.tax_amount).toLocaleString()}</span>
                                            </div>
                                        )}
                                        <div className="pt-2 border-t border-theme flex justify-between font-bold">
                                            <span className="text-theme-primary">Total</span>
                                            <span className="text-accent-gold text-base">{cs}{parseFloat(sale.total_amount).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-theme-muted">Amount Paid</span>
                                            <span className="text-green-600 font-medium">{cs}{parseFloat(sale.amount_paid).toLocaleString()}</span>
                                        </div>
                                        {parseFloat(sale.amount_paid) > parseFloat(sale.total_amount) && (
                                            <div className="flex justify-between text-xs">
                                                <span className="text-theme-muted">Change</span>
                                                <span className="text-theme-primary font-medium">
                                                    {cs}{(parseFloat(sale.amount_paid) - parseFloat(sale.total_amount)).toLocaleString()}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="bg-theme-primary rounded-xl border border-theme p-4 space-y-4">
                                    <h3 className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">Details</h3>

                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-accent-gold/10 text-accent-gold flex items-center justify-center shrink-0">
                                            <Calendar className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-theme-muted uppercase font-bold">Date</p>
                                            <p className="text-sm font-medium text-theme-primary">{format(new Date(sale.created_at), 'PPp')}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center shrink-0">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-theme-muted uppercase font-bold">Customer</p>
                                            <p className="text-sm font-medium text-theme-primary">{sale.customer_name || 'Walk-in Customer'}</p>
                                            {sale.phone_number && <p className="text-xs text-theme-muted">{sale.phone_number}</p>}
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 flex items-center justify-center shrink-0">
                                            <CreditCard className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-theme-muted uppercase font-bold">Payment</p>
                                            <p className="text-sm font-medium text-theme-primary capitalize">{sale.payment_method}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center shrink-0">
                                            <Landmark className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-theme-muted uppercase font-bold">Branch</p>
                                            <p className="text-sm font-medium text-theme-primary">{sale.branch_name}</p>
                                        </div>
                                    </div>

                                    {sale.salesperson && (
                                        <div className="flex gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-theme-tertiary text-theme-muted flex items-center justify-center shrink-0">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-theme-muted uppercase font-bold">Processed By</p>
                                                <p className="text-sm font-medium text-theme-primary">{sale.salesperson}</p>
                                            </div>
                                        </div>
                                    )}

                                    {sale.referrer_name && (
                                        <div className="flex gap-3 p-3 bg-accent-gold/5 rounded-lg border border-accent-gold/20">
                                            <div className="w-8 h-8 rounded-lg bg-accent-gold/20 text-accent-gold flex items-center justify-center shrink-0">
                                                <Tag className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-accent-gold uppercase font-bold">Referral Agent</p>
                                                <p className="text-sm font-medium text-theme-primary">{sale.referrer_name}</p>
                                                {sale.commission_amount > 0 && (
                                                    <p className="text-xs text-theme-muted">Commission: {cs}{parseFloat(sale.commission_amount).toLocaleString()}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Reverse Confirmation Dialog */}
            {showReverseConfirm && (
                <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70">
                    <div className="bg-theme-secondary rounded-xl border border-theme shadow-2xl p-6 w-full max-w-md mx-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                                <RotateCcw className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-theme-primary">Reverse Sale?</h3>
                                <p className="text-xs text-theme-muted">{sale?.sale_number}</p>
                            </div>
                        </div>
                        <p className="text-sm text-theme-muted mb-4">
                            This will cancel the sale, restore stock, and reverse payments. This action cannot be undone easily.
                        </p>
                        <textarea
                            value={reverseReason}
                            onChange={(e) => setReverseReason(e.target.value)}
                            placeholder="Enter reason for reversal (required)..."
                            rows={3}
                            className="w-full px-3 py-2 bg-theme-primary border border-theme rounded-lg text-sm text-theme-primary placeholder-theme-muted focus:ring-2 focus:ring-red-400/20 focus:border-red-400/40 outline-none resize-none mb-4"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowReverseConfirm(false); setReverseReason(''); }}
                                className="flex-1 px-4 py-2 text-sm font-medium bg-theme-primary border border-theme rounded-lg text-theme-secondary hover:bg-theme-tertiary transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReverse}
                                disabled={reversing || !reverseReason.trim()}
                                className="flex-1 px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {reversing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                                {reversing ? 'Reversing…' : 'Confirm Reversal'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Receipt Modal */}
            {showReceipt && sale && (
                <ReceiptPreviewModal
                    isOpen={showReceipt}
                    onClose={() => setShowReceipt(false)}
                    saleId={sale.id}
                    receiptNumber={sale.sale_number}
                    customerName={sale.customer_name}
                    customerPhone={sale.phone_number}
                    customerEmail={sale.email}
                    totalAmount={sale.total_amount}
                    saleDate={sale.created_at}
                />
            )}
        </div>
    );
};

export default SaleDetailModal;
