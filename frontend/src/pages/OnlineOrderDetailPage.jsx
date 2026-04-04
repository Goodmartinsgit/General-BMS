import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, ShoppingBag, User, MapPin, CreditCard, Building2,
    CheckCircle, XCircle, Truck, FileText, Clock, Package,
    ChevronDown, Image as ImageIcon, ExternalLink, Loader2, Printer
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { ReceiptPreviewModal } from '../components/receipt';
import {
    getOnlineOrderById,
    updateOrderStatus,
    updateOrderTracking,
    updateOrderNotes,
    confirmPayment,
    rejectPayment,
} from '../api/onlineOrders';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';

const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

const ORDER_STATUS_CONFIG = {
    PENDING: { label: 'Pending', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700' },
    CONFIRMED: { label: 'Confirmed', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-700' },
    PROCESSING: { label: 'Processing', className: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700' },
    SHIPPED: { label: 'Shipped', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-700' },
    DELIVERED: { label: 'Delivered', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-700' },
    CANCELLED: { label: 'Cancelled', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-700' },
};

const PAYMENT_STATUS_CONFIG = {
    AWAITING_CONFIRMATION: { label: 'Awaiting Confirmation', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-700' },
    PAID: { label: 'Paid', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-700' },
    FAILED: { label: 'Failed', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-700' },
    PENDING: { label: 'Pending', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700' },
};

const StatusBadge = ({ status, config }) => {
    const cfg = config[status] || Object.values(config)[0];
    return (
        <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full ${cfg.className}`}>
            {cfg.label}
        </span>
    );
};

const Card = ({ title, icon: Icon, children, className = '' }) => (
    <div className={`bg-theme-secondary rounded-lg border border-theme shadow-theme-sm ${className}`}>
        {title && (
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-theme flex items-center gap-2">
                {Icon && <Icon size={16} className="text-theme-muted" />}
                <h3 className="font-semibold text-theme-primary text-sm sm:text-base">{title}</h3>
            </div>
        )}
        <div className="p-4 sm:p-6">{children}</div>
    </div>
);

const InfoRow = ({ label, value }) => (
    <div className="flex justify-between items-start py-1.5 border-b border-theme last:border-0">
        <span className="text-xs text-theme-muted">{label}</span>
        <span className="text-xs font-medium text-theme-primary text-right ml-4">{value || '—'}</span>
    </div>
);

// Confirmation modal
const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmLabel = 'Confirm', confirmClass = 'bg-green-600 hover:bg-green-700 text-white', loading = false }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-theme-secondary rounded-xl border border-theme shadow-xl w-full max-w-sm p-6 space-y-4">
                <h2 className="text-base font-semibold text-theme-primary">{title}</h2>
                <p className="text-sm text-theme-muted">{message}</p>
                <div className="flex justify-end gap-3 pt-2">
                    <button onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border border-theme text-theme-secondary hover:bg-theme-primary transition">
                        Cancel
                    </button>
                    <button onClick={onConfirm} disabled={loading} className={`px-4 py-2 text-sm rounded-lg font-medium transition flex items-center gap-2 ${confirmClass}`}>
                        {loading && <Loader2 size={14} className="animate-spin" />}
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Reject payment modal
const RejectModal = ({ isOpen, onConfirm, onCancel, loading }) => {
    const [reason, setReason] = useState('');
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-theme-secondary rounded-xl border border-theme shadow-xl w-full max-w-sm p-6 space-y-4">
                <h2 className="text-base font-semibold text-theme-primary">Reject Payment</h2>
                <p className="text-sm text-theme-muted">Please provide a reason for rejecting this payment. The customer will be notified.</p>
                <textarea
                    className="w-full px-3 py-2 text-sm bg-theme-primary border border-theme rounded-lg text-theme-primary placeholder-theme-muted focus:ring-2 focus:ring-red-400/20 focus:border-red-400/50 outline-none resize-none"
                    rows={3}
                    placeholder="e.g. Payment reference not found..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                />
                <div className="flex justify-end gap-3 pt-2">
                    <button onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border border-theme text-theme-secondary hover:bg-theme-primary transition">
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(reason)}
                        disabled={loading || !reason.trim()}
                        className="px-4 py-2 text-sm rounded-lg font-medium bg-red-600 hover:bg-red-700 text-white transition disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading && <Loader2 size={14} className="animate-spin" />}
                        Reject Payment
                    </button>
                </div>
            </div>
        </div>
    );
};

// Image viewer modal
const ImageViewerModal = ({ isOpen, src, onClose }) => {
    if (!isOpen || !src) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
            <div className="relative max-w-3xl max-h-[90vh] w-full" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-2 right-2 w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center text-sm font-bold hover:bg-black">
                    ✕
                </button>
                <img src={src} alt="Proof of payment" className="w-full h-auto max-h-[85vh] object-contain rounded-lg" />
            </div>
        </div>
    );
};

const OnlineOrderDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { formatCurrency } = useCurrency();
    const { auth } = useAuth();
    const userPerms = auth?.user?.permissions || {};
    const hasPerm = (key) => userPerms['admin'] === true || userPerms[key] === true;
    const canProcessOrders = hasPerm('process_online_orders');
    const canVerifyPayment = hasPerm('verify_order_payment');
    const canUpdateTracking = hasPerm('update_order_tracking');
    const canEditNotes = hasPerm('edit_order_notes');

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Action states
    const [newStatus, setNewStatus] = useState('');
    const [trackingNumber, setTrackingNumber] = useState('');
    const [carrier, setCarrier] = useState('');
    const [adminNotes, setAdminNotes] = useState('');

    const [actionLoading, setActionLoading] = useState('');

    // Modals
    const [confirmPaymentOpen, setConfirmPaymentOpen] = useState(false);
    const [rejectPaymentOpen, setRejectPaymentOpen] = useState(false);
    const [imageViewerOpen, setImageViewerOpen] = useState(false);
    const [imageViewerSrc, setImageViewerSrc] = useState('');
    const [showReceipt, setShowReceipt] = useState(false);

    const fetchOrder = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getOnlineOrderById(id);
            const data = res.data;
            setOrder(data);
            setNewStatus(data.status || data.order_status || '');
            setTrackingNumber(data.tracking_number || data.order_number || '');
            setCarrier(data.shipping_carrier || data.carrier || '');
            setAdminNotes(data.admin_notes || '');
        } catch (err) {
            console.error('Failed to load order', err);
            setError('Failed to load order details. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrder();
    }, [id]);

    const handleUpdateStatus = async () => {
        setActionLoading('status');
        try {
            await updateOrderStatus(id, { status: newStatus });
            await fetchOrder();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update status');
        } finally {
            setActionLoading('');
        }
    };

    const handleSaveTracking = async () => {
        setActionLoading('tracking');
        try {
            await updateOrderTracking(id, { tracking_number: trackingNumber, carrier });
            await fetchOrder();
            alert('Tracking info saved successfully.');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to save tracking info');
        } finally {
            setActionLoading('');
        }
    };

    const handleSaveNotes = async () => {
        setActionLoading('notes');
        try {
            await updateOrderNotes(id, { admin_notes: adminNotes });
            alert('Notes saved successfully.');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to save notes');
        } finally {
            setActionLoading('');
        }
    };

    const handleConfirmPayment = async () => {
        setActionLoading('confirm');
        try {
            await confirmPayment(id);
            setConfirmPaymentOpen(false);
            await fetchOrder();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to confirm payment');
        } finally {
            setActionLoading('');
        }
    };

    const handleRejectPayment = async (reason) => {
        setActionLoading('reject');
        try {
            await rejectPayment(id, { reason });
            setRejectPaymentOpen(false);
            await fetchOrder();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to reject payment');
        } finally {
            setActionLoading('');
        }
    };

    const openImageViewer = (src) => {
        setImageViewerSrc(src);
        setImageViewerOpen(true);
    };

    // Auto-open receipt modal if navigated with ?receipt=true
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('receipt') === 'true' && order) {
            setShowReceipt(true);
        }
    }, [order]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <LoadingSpinner />
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <p className="text-theme-muted text-sm">{error || 'Order not found.'}</p>
                <button onClick={() => navigate('/online-orders')} className="text-accent-gold text-sm underline">
                    Back to Online Orders
                </button>
            </div>
        );
    }

    const orderStatus = order.status || order.order_status;
    const paymentStatus = order.payment_status;
    const statusCfg = ORDER_STATUS_CONFIG[orderStatus] || ORDER_STATUS_CONFIG.PENDING;
    const shippingAddr = order.shipping_address || {};
    const billingAddr = order.billing_address || {};
    const isSameAddress = JSON.stringify(shippingAddr) === JSON.stringify(billingAddr);
    const canManagePayment = canVerifyPayment && paymentStatus === 'AWAITING_CONFIRMATION' && ['bank_transfer', 'manual'].includes(order.payment_method);
    const isPaymentPending = paymentStatus === 'AWAITING_CONFIRMATION';
    const items = order.items || order.order_items || [];
    const statusHistory = order.status_history || [];

    const subtotal = order.subtotal ?? order.sub_total ?? 0;
    const shippingCost = order.shipping_cost ?? order.shipping ?? 0;
    const taxAmount = order.tax_amount ?? order.tax ?? 0;
    const discountAmount = order.discount_amount ?? order.discount ?? 0;
    const totalAmount = order.total_amount ?? order.total ?? 0;

    return (
        <div className="space-y-4 sm:space-y-6 max-w-[1700px] mx-auto pb-6 sm:pb-10">
            {/* Back button */}
            <button
                onClick={() => navigate('/online-orders')}
                className="inline-flex items-center gap-2 text-sm text-theme-muted hover:text-theme-primary transition"
            >
                <ArrowLeft size={16} /> Back to Online Orders
            </button>

            <div className="flex items-start justify-between gap-4">
                <PageHeader
                    title={`Order #${order.order_number}`}
                    subtitle={`Placed on ${order.created_at ? new Date(order.created_at).toLocaleDateString(undefined, { dateStyle: 'long' }) : '—'}`}
                    icon={ShoppingBag}
                    badge={<StatusBadge status={orderStatus} config={ORDER_STATUS_CONFIG} />}
                />
                <button
                    onClick={() => setShowReceipt(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-accent-gold/10 text-accent-gold hover:bg-accent-gold hover:text-white transition shrink-0"
                >
                    <Printer size={14} /> Receipt
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* LEFT COLUMN — 2/3 */}
                <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                    {/* Order Items */}
                    <Card title="Order Items" icon={Package}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-theme">
                                        <th className="pb-2 text-[10px] font-semibold text-theme-muted uppercase pr-4">Product</th>
                                        <th className="pb-2 text-[10px] font-semibold text-theme-muted uppercase text-center">Qty</th>
                                        <th className="pb-2 text-[10px] font-semibold text-theme-muted uppercase text-right">Unit Price</th>
                                        <th className="pb-2 text-[10px] font-semibold text-theme-muted uppercase text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-theme">
                                    {items.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="py-8 text-center text-sm text-theme-muted">No items found.</td>
                                        </tr>
                                    ) : items.map((item, idx) => (
                                        <tr key={item.id || idx} className="py-2">
                                            <td className="py-3 pr-4">
                                                <div className="flex items-center gap-3">
                                                    {item.product_image || item.image_url ? (
                                                        <img
                                                            src={item.product_image || item.image_url}
                                                            alt={item.product_name || item.name}
                                                            className="w-10 h-10 rounded-lg object-cover border border-theme flex-shrink-0"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-lg bg-theme-tertiary flex items-center justify-center flex-shrink-0">
                                                            <Package size={16} className="text-theme-muted" />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-medium text-theme-primary truncate">
                                                            {item.product_name || item.name}
                                                        </div>
                                                        {item.variant_info && (
                                                            <div className="text-xs text-theme-muted">{item.variant_info}</div>
                                                        )}
                                                        {item.sku && (
                                                            <div className="text-[10px] text-theme-muted font-mono">SKU: {item.sku}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 text-center text-sm text-theme-secondary">{item.quantity}</td>
                                            <td className="py-3 text-right text-sm text-theme-secondary">{formatCurrency(item.unit_price ?? item.price ?? 0)}</td>
                                            <td className="py-3 text-right text-sm font-semibold text-theme-primary">{formatCurrency((item.unit_price ?? item.price ?? 0) * item.quantity)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Payment Card */}
                    <Card title="Payment" icon={CreditCard}>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-xs text-theme-muted mb-1">Payment Method</p>
                                    <div className="flex items-center gap-2">
                                        {order.payment_method === 'bank_transfer'
                                            ? <Building2 size={14} className="text-slate-500" />
                                            : <CreditCard size={14} className="text-teal-500" />
                                        }
                                        <span className="text-sm font-medium text-theme-primary capitalize">
                                            {order.payment_method?.replace('_', ' ') || '—'}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-theme-muted mb-1">Payment Status</p>
                                    <StatusBadge status={paymentStatus} config={PAYMENT_STATUS_CONFIG} />
                                </div>
                            </div>

                            {/* Bank transfer details */}
                            {['bank_transfer', 'manual'].includes(order.payment_method) && (
                                <div className="bg-theme-primary rounded-lg p-3 space-y-2 border border-theme">
                                    <p className="text-xs font-semibold text-theme-muted uppercase">Bank Transfer Details</p>
                                    {order.bank_channel && <InfoRow label="Bank Channel" value={order.bank_channel} />}
                                    {order.payment_reference && <InfoRow label="Reference" value={order.payment_reference} />}
                                    {order.payment_date && <InfoRow label="Payment Date" value={new Date(order.payment_date).toLocaleDateString()} />}
                                </div>
                            )}

                            {/* Proof of payment */}
                            {order.proof_of_payment && (
                                <div>
                                    <p className="text-xs text-theme-muted mb-2">Proof of Payment</p>
                                    <button
                                        onClick={() => openImageViewer(order.proof_of_payment)}
                                        className="group relative w-40 h-28 rounded-lg overflow-hidden border border-theme hover:border-accent-gold/50 transition"
                                    >
                                        <img
                                            src={order.proof_of_payment}
                                            alt="Proof of payment"
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                            <ExternalLink size={20} className="text-white" />
                                        </div>
                                    </button>
                                </div>
                            )}

                            {/* Payment action buttons */}
                            {canManagePayment && (
                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => setConfirmPaymentOpen(true)}
                                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-green-600 hover:bg-green-700 text-white transition"
                                    >
                                        <CheckCircle size={14} /> Confirm Payment
                                    </button>
                                    <button
                                        onClick={() => setRejectPaymentOpen(true)}
                                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition"
                                    >
                                        <XCircle size={14} /> Reject Payment
                                    </button>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Status Timeline */}
                    {statusHistory.length > 0 && (
                        <Card title="Status Timeline" icon={Clock}>
                            <div className="space-y-0">
                                {statusHistory.map((entry, idx) => {
                                    const cfg = ORDER_STATUS_CONFIG[entry.status] || ORDER_STATUS_CONFIG.PENDING;
                                    const isLast = idx === statusHistory.length - 1;
                                    return (
                                        <div key={idx} className="flex gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${cfg.className} flex-shrink-0`}>
                                                    {idx + 1}
                                                </div>
                                                {!isLast && <div className="w-0.5 bg-theme flex-1 my-1" />}
                                            </div>
                                            <div className={`pb-4 flex-1 ${isLast ? '' : ''}`}>
                                                <p className="text-sm font-semibold text-theme-primary">{cfg.label}</p>
                                                {entry.note && <p className="text-xs text-theme-muted mt-0.5">{entry.note}</p>}
                                                {entry.timestamp && (
                                                    <p className="text-[10px] text-theme-muted mt-1">
                                                        {new Date(entry.timestamp).toLocaleString()}
                                                    </p>
                                                )}
                                                {entry.changed_by && (
                                                    <p className="text-[10px] text-theme-muted">by {entry.changed_by}</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    )}
                </div>

                {/* RIGHT COLUMN — 1/3 */}
                <div className="space-y-4 sm:space-y-6">
                    {/* Customer Info */}
                    <Card title="Customer" icon={User}>
                        <div className="space-y-1">
                            <InfoRow label="Name" value={order.customer_name || order.customer?.name} />
                            <InfoRow label="Email" value={order.customer_email || order.customer?.email} />
                            <InfoRow label="Phone" value={order.customer_phone || order.customer?.phone} />
                        </div>
                    </Card>

                    {/* Shipping Address */}
                    <Card title="Shipping Address" icon={MapPin}>
                        {shippingAddr && Object.keys(shippingAddr).length > 0 ? (
                            <div className="text-sm text-theme-secondary space-y-0.5">
                                {shippingAddr.name && <p className="font-medium text-theme-primary">{shippingAddr.name}</p>}
                                {shippingAddr.line1 && <p>{shippingAddr.line1}</p>}
                                {shippingAddr.line2 && <p>{shippingAddr.line2}</p>}
                                <p>
                                    {[shippingAddr.city, shippingAddr.state, shippingAddr.postal_code].filter(Boolean).join(', ')}
                                </p>
                                {shippingAddr.country && <p>{shippingAddr.country}</p>}
                                {shippingAddr.phone && <p className="text-theme-muted">{shippingAddr.phone}</p>}
                            </div>
                        ) : (
                            <p className="text-sm text-theme-muted">No shipping address provided.</p>
                        )}
                    </Card>

                    {/* Billing Address — only if different */}
                    {!isSameAddress && billingAddr && Object.keys(billingAddr).length > 0 && (
                        <Card title="Billing Address" icon={MapPin}>
                            <div className="text-sm text-theme-secondary space-y-0.5">
                                {billingAddr.name && <p className="font-medium text-theme-primary">{billingAddr.name}</p>}
                                {billingAddr.line1 && <p>{billingAddr.line1}</p>}
                                {billingAddr.line2 && <p>{billingAddr.line2}</p>}
                                <p>
                                    {[billingAddr.city, billingAddr.state, billingAddr.postal_code].filter(Boolean).join(', ')}
                                </p>
                                {billingAddr.country && <p>{billingAddr.country}</p>}
                            </div>
                        </Card>
                    )}

                    {/* Order Summary */}
                    <Card title="Order Summary" icon={FileText}>
                        <div className="space-y-2">
                            <InfoRow label="Subtotal" value={formatCurrency(subtotal)} />
                            <InfoRow label="Shipping" value={formatCurrency(shippingCost)} />
                            <InfoRow label="Tax" value={formatCurrency(taxAmount)} />
                            {discountAmount > 0 && (
                                <InfoRow label="Discount" value={`-${formatCurrency(discountAmount)}`} />
                            )}
                            <div className="flex justify-between items-center pt-2 border-t border-theme mt-2">
                                <span className="text-sm font-semibold text-theme-primary">Total</span>
                                <span className="text-base font-bold text-accent-gold">{formatCurrency(totalAmount)}</span>
                            </div>
                        </div>
                    </Card>

                    {/* Admin Actions */}
                    {(canProcessOrders || canUpdateTracking || canEditNotes) && (
                    <Card title="Admin Actions" icon={Package}>
                        <div className="space-y-5">
                            {/* Payment pending warning */}
                            {isPaymentPending && (
                                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                                    <Clock size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
                                    <p className="text-xs text-amber-700 dark:text-amber-300">
                                        Payment must be confirmed before this order can be processed. Only cancellation is allowed.
                                    </p>
                                </div>
                            )}

                            {/* Status Update */}
                            {canProcessOrders && (
                            <div>
                                <label className="block text-xs font-semibold text-theme-muted mb-1.5">Update Order Status</label>
                                <div className="flex gap-2">
                                    <select
                                        className="flex-1 text-sm bg-theme-primary border border-theme rounded-lg px-3 py-2 text-theme-primary outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30"
                                        value={newStatus}
                                        onChange={(e) => setNewStatus(e.target.value)}
                                    >
                                        {ORDER_STATUSES.map(s => (
                                            <option
                                                key={s}
                                                value={s}
                                                className="bg-theme-secondary"
                                                disabled={isPaymentPending && !['PENDING', 'CANCELLED'].includes(s)}
                                            >
                                                {ORDER_STATUS_CONFIG[s]?.label || s}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={handleUpdateStatus}
                                        disabled={actionLoading === 'status' || newStatus === orderStatus || (isPaymentPending && !['PENDING', 'CANCELLED'].includes(newStatus))}
                                        className="px-3 py-2 text-xs font-medium rounded-lg bg-accent-gold text-white hover:bg-accent-goldDark transition disabled:opacity-50 flex items-center gap-1.5"
                                    >
                                        {actionLoading === 'status' && <Loader2 size={12} className="animate-spin" />}
                                        Update
                                    </button>
                                </div>
                            </div>
                            )}

                            {/* Tracking */}
                            {canUpdateTracking && (
                            <div>
                                <label className="block text-xs font-semibold text-theme-muted mb-1.5">Tracking</label>
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        placeholder="Tracking number"
                                        className="w-full text-sm bg-theme-primary border border-theme rounded-lg px-3 py-2 text-theme-primary placeholder-theme-muted outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30"
                                        value={trackingNumber}
                                        onChange={(e) => setTrackingNumber(e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Carrier (e.g. DHL, FedEx)"
                                        className="w-full text-sm bg-theme-primary border border-theme rounded-lg px-3 py-2 text-theme-primary placeholder-theme-muted outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30"
                                        value={carrier}
                                        onChange={(e) => setCarrier(e.target.value)}
                                    />
                                    <button
                                        onClick={handleSaveTracking}
                                        disabled={actionLoading === 'tracking'}
                                        className="w-full px-3 py-2 text-xs font-medium rounded-lg bg-theme-primary border border-theme text-theme-primary hover:bg-theme-secondary transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                                    >
                                        {actionLoading === 'tracking' ? <Loader2 size={12} className="animate-spin" /> : <Truck size={12} />}
                                        Save Tracking
                                    </button>
                                </div>
                            </div>
                            )}

                            {/* Admin Notes */}
                            {canEditNotes && (
                            <div>
                                <label className="block text-xs font-semibold text-theme-muted mb-1.5">Admin Notes</label>
                                <textarea
                                    className="w-full text-sm bg-theme-primary border border-theme rounded-lg px-3 py-2 text-theme-primary placeholder-theme-muted outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 resize-none"
                                    rows={3}
                                    placeholder="Internal notes about this order..."
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                />
                                <button
                                    onClick={handleSaveNotes}
                                    disabled={actionLoading === 'notes'}
                                    className="mt-1.5 w-full px-3 py-2 text-xs font-medium rounded-lg bg-theme-primary border border-theme text-theme-primary hover:bg-theme-secondary transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                                >
                                    {actionLoading === 'notes' ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
                                    Save Notes
                                </button>
                            </div>
                            )}
                        </div>
                    </Card>
                    )}
                </div>
            </div>

            {/* Modals */}
            <ConfirmModal
                isOpen={confirmPaymentOpen}
                title="Confirm Payment"
                message="Are you sure you want to confirm this payment? This will mark the order payment as PAID and move the order to Confirmed status."
                confirmLabel="Confirm Payment"
                confirmClass="bg-green-600 hover:bg-green-700 text-white"
                loading={actionLoading === 'confirm'}
                onConfirm={handleConfirmPayment}
                onCancel={() => setConfirmPaymentOpen(false)}
            />

            <RejectModal
                isOpen={rejectPaymentOpen}
                loading={actionLoading === 'reject'}
                onConfirm={handleRejectPayment}
                onCancel={() => setRejectPaymentOpen(false)}
            />

            <ImageViewerModal
                isOpen={imageViewerOpen}
                src={imageViewerSrc}
                onClose={() => setImageViewerOpen(false)}
            />

            <ReceiptPreviewModal
                isOpen={showReceipt}
                onClose={() => setShowReceipt(false)}
                onlineOrderId={id}
                receiptNumber={order.order_number}
                customerName={order.customer_name || order.shipping_address?.name || ''}
                customerPhone={order.customer_phone || order.shipping_address?.phone || ''}
                customerEmail={order.customer_email || order.email || ''}
                totalAmount={totalAmount}
                saleDate={order.created_at}
            />
        </div>
    );
};

export default OnlineOrderDetailPage;
