import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Printer, Download, Mail, X, Loader2, RefreshCw,
    CheckCircle, AlertCircle, Send
} from 'lucide-react';
import WhatsAppIcon from '../icons/WhatsAppIcon';
import WhatsAppSendModal from './WhatsAppSendModal';
import { getReceiptData } from '../../api/receipts';
import { getCachedReceiptImage, cacheReceiptImage } from '../../utils/receiptImageCache';

/**
 * ReceiptPreviewModal — saleId-based
 * Fetches receipt data from backend, renders via ReceiptTemplate, supports
 * Print, Download, WhatsApp, and Email actions.
 */
const ReceiptPreviewModal = ({
    isOpen,
    onClose,
    saleId,
    receiptNumber,
    customerName,
    customerPhone,
    customerEmail,
    totalAmount,
    saleDate,
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [receiptData, setReceiptData] = useState(null);

    // Sub-modals
    const [showWhatsApp, setShowWhatsApp] = useState(false);
    const [showEmail, setShowEmail] = useState(false);
    const [emailAddress, setEmailAddress] = useState('');
    const [emailMessage, setEmailMessage] = useState('');
    const [emailSending, setEmailSending] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const receiptRef = useRef(null);

    // ── Fetch receipt data ──
    const fetchReceiptData = useCallback(async () => {
        if (!saleId) return;
        setLoading(true);
        setError(null);
        try {
            const res = await getReceiptData(saleId);
            setReceiptData(res.data);
        } catch (err) {
            console.error('Failed to fetch receipt data:', err);
            setError('Failed to load receipt. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [saleId]);

    useEffect(() => {
        if (isOpen && saleId) {
            fetchReceiptData();
            setEmailAddress(customerEmail || '');
            setEmailMessage('');
            setEmailSent(false);
        }
    }, [isOpen, saleId, fetchReceiptData, customerEmail]);

    // ── Print ──
    const handlePrint = () => {
        if (!receiptRef.current) return;
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Please allow popups to print the receipt');
            return;
        }

        const styles = `<style>
            * { margin:0; padding:0; box-sizing:border-box; }
            body { font-family:'Segoe UI','Courier New',monospace; padding:10px; }
            .receipt { max-width:320px; margin:0 auto; }
            table { width:100%; border-collapse:collapse; }
            th, td { padding:4px; text-align:left; }
            .text-right { text-align:right; }
            .text-center { text-align:center; }
            .font-bold { font-weight:bold; }
            .border-dashed { border-bottom:1px dashed #ccc; padding-bottom:10px; margin-bottom:10px; }
            .text-sm { font-size:12px; }
            .text-xs { font-size:10px; }
            .text-lg { font-size:16px; }
            .mb-1 { margin-bottom:4px; }
            .mb-2 { margin-bottom:8px; }
            .mb-3 { margin-bottom:12px; }
            .mt-2 { margin-top:8px; }
            @media print { body { padding:0; } @page { margin:10mm; } }
        </style>`;

        printWindow.document.write(`<!DOCTYPE html><html><head>
            <title>Receipt - ${receiptData?.sale?.sale_number || receiptNumber || 'Print'}</title>
            ${styles}
        </head><body>
            <div class="receipt" id="receipt-container"></div>
            <script>window.onload=function(){window.print();window.onafterprint=function(){window.close();};};<\/script>
        </body></html>`);
        printWindow.document.close();

        const container = printWindow.document.getElementById('receipt-container');
        if (container && receiptRef.current) {
            const cloned = receiptRef.current.cloneNode(true);
            container.appendChild(printWindow.document.adoptNode(cloned));
        }
    };

    // ── Download ──
    const handleDownload = async () => {
        if (!receiptRef.current) return;
        try {
            const html2canvas = (await import('html2canvas')).default;
            const canvas = await html2canvas(receiptRef.current, { scale: 2, backgroundColor: '#ffffff' });
            const link = document.createElement('a');
            link.download = `receipt-${receiptData?.sale?.sale_number || receiptNumber || 'download'}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch {
            const blob = new Blob([receiptRef.current.outerHTML], { type: 'text/html' });
            const link = document.createElement('a');
            link.download = `receipt-${receiptData?.sale?.sale_number || receiptNumber || 'download'}.html`;
            link.href = URL.createObjectURL(blob);
            link.click();
            URL.revokeObjectURL(link.href);
        }
    };

    // ── Email ──
    const handleSendEmail = async () => {
        if (!emailAddress.trim()) return;
        setEmailSending(true);
        try {
            const { emailReceipt } = await import('../../api/receipts');
            await emailReceipt(saleId, emailAddress, emailMessage);
            setEmailSent(true);
            setTimeout(() => setShowEmail(false), 1500);
        } catch (err) {
            console.error('Email send failed:', err);
        } finally {
            setEmailSending(false);
        }
    };

    if (!isOpen) return null;

    const sale = receiptData?.sale;
    const items = receiptData?.items || [];
    const config = receiptData?.config || {};
    const currencySymbol = config.currency_symbol || '₦';

    const formatPrice = (val) => {
        const n = Number(val) || 0;
        return `${currencySymbol}${n.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;
    };

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                <div className="bg-theme-secondary rounded-2xl shadow-2xl border border-theme w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-theme bg-theme-primary">
                        <h2 className="text-base font-semibold text-theme-primary flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            Receipt Preview
                        </h2>
                        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-theme-tertiary transition-colors text-theme-muted hover:text-theme-primary">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-center gap-2 px-4 py-3 border-b border-theme bg-theme-secondary">
                        <ActionBtn icon={Printer} label="Print" onClick={handlePrint} disabled={loading || !!error} />
                        <ActionBtn icon={Download} label="Download" onClick={handleDownload} disabled={loading || !!error} />
                        <ActionBtn
                            icon={() => <WhatsAppIcon size={16} color="#25D366" />}
                            label="WhatsApp"
                            onClick={() => setShowWhatsApp(true)}
                            disabled={loading || !!error}
                            className="!text-green-600 hover:!bg-green-50 dark:hover:!bg-green-900/20"
                        />
                        <ActionBtn
                            icon={Mail}
                            label="Email"
                            onClick={() => setShowEmail(true)}
                            disabled={loading || !!error}
                            className="!text-blue-600 hover:!bg-blue-50 dark:hover:!bg-blue-900/20"
                        />
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-4 bg-gray-100 dark:bg-gray-900/30">
                        {loading && (
                            <div className="flex flex-col items-center justify-center py-16 gap-3">
                                <Loader2 className="w-8 h-8 text-accent-gold animate-spin" />
                                <p className="text-sm text-theme-muted">Loading receipt…</p>
                            </div>
                        )}

                        {error && (
                            <div className="flex flex-col items-center justify-center py-16 gap-3">
                                <AlertCircle className="w-8 h-8 text-red-500" />
                                <p className="text-sm text-red-500">{error}</p>
                                <button
                                    onClick={fetchReceiptData}
                                    className="flex items-center gap-2 px-4 py-2 bg-accent-gold text-white rounded-lg text-sm font-medium hover:bg-accent-goldDark transition"
                                >
                                    <RefreshCw size={14} /> Retry
                                </button>
                            </div>
                        )}

                        {!loading && !error && receiptData && (() => {
                            // Template styling from config
                            const bgColor = config.receipt_bg_color || '#ffffff';
                            const textColor = config.receipt_text_color || '#111827';
                            const accentColor = config.receipt_accent_color || '';
                            const headingColor = config.receipt_heading_color || textColor;
                            const labelColor = config.receipt_label_color || '#6b7280';
                            const fontWeight = config.receipt_font_weight || 'normal';
                            const dividerColor = accentColor || '#d1d5db';

                            return (
                            <div
                                className="rounded-xl shadow-lg max-w-xs mx-auto overflow-hidden"
                                ref={receiptRef}
                                style={{ backgroundColor: bgColor }}
                            >
                                <div className="p-5" style={{ color: textColor, fontWeight }}>
                                    {/* Company Header */}
                                    {config.show_logo && config.company_logo_url && (
                                        <img src={config.company_logo_url} alt="Logo" className="w-14 h-14 mx-auto mb-2 object-contain rounded-lg" />
                                    )}
                                    {config.show_company_details && (
                                        <div className="text-center mb-3">
                                            <p className="font-bold text-base" style={{ color: headingColor }}>{config.company_name || 'Business'}</p>
                                            {config.company_address && <p className="text-[10px] mt-0.5" style={{ color: labelColor }}>{config.company_address}</p>}
                                            {config.company_phone && <p className="text-[10px]" style={{ color: labelColor }}>{config.company_phone}</p>}
                                            {config.company_email && <p className="text-[10px]" style={{ color: labelColor }}>{config.company_email}</p>}
                                            {config.company_website && <p className="text-[10px]" style={{ color: labelColor }}>{config.company_website}</p>}
                                        </div>
                                    )}
                                    {config.show_tax_number && config.tax_number && (
                                        <p className="text-[10px] text-center mb-2" style={{ color: labelColor }}>{config.tax_label || 'TIN'}: {config.tax_number}</p>
                                    )}

                                    <StyledDivider color={dividerColor} />

                                    {/* Receipt Info */}
                                    <div className="text-[10px] space-y-0.5 mb-2">
                                        <StyledInfoRow label="Receipt #" value={sale?.sale_number || receiptNumber} labelColor={labelColor} valueColor={textColor} />
                                        <StyledInfoRow label="Date" value={new Date(sale?.sale_date || sale?.created_at || saleDate).toLocaleString()} labelColor={labelColor} valueColor={textColor} />
                                        {config.show_customer_details && sale?.customer_name && (
                                            <StyledInfoRow label="Customer" value={sale.customer_name} labelColor={labelColor} valueColor={textColor} />
                                        )}
                                        {sale?.salesperson_name && (
                                            <StyledInfoRow label="Cashier" value={sale.salesperson_name} labelColor={labelColor} valueColor={textColor} />
                                        )}
                                        {sale?.branch_name && (
                                            <StyledInfoRow label="Branch" value={sale.branch_name} labelColor={labelColor} valueColor={textColor} />
                                        )}
                                    </div>

                                    <StyledDivider color={dividerColor} />

                                    {/* Items */}
                                    <div className="text-[10px] space-y-1.5 mb-2">
                                        {items.map((item, i) => {
                                            const variantLabel = item.variant_name || item.variant_sku;
                                            return (
                                                <div key={i}>
                                                    <div className="flex justify-between">
                                                        <span className="flex-1 pr-2 font-medium" style={{ color: textColor }}>
                                                            {item.product_name}
                                                            {variantLabel ? ` (${variantLabel})` : ''}
                                                        </span>
                                                        <span className="font-semibold whitespace-nowrap" style={{ color: headingColor }}>
                                                            {formatPrice(item.line_total)}
                                                        </span>
                                                    </div>
                                                    <div className="text-[9px]" style={{ color: labelColor }}>
                                                        {formatPrice(item.unit_price)} x {item.quantity}
                                                        {Number(item.discount_amount) > 0 && (
                                                            <span className="ml-1 text-red-500">(-{formatPrice(item.discount_amount)})</span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <StyledDivider color={dividerColor} />

                                    {/* Totals */}
                                    <div className="text-[10px] space-y-0.5">
                                        <StyledInfoRow label="Subtotal" value={formatPrice(sale?.subtotal)} labelColor={labelColor} valueColor={textColor} />
                                        {sale?.discount_amount > 0 && (
                                            <StyledInfoRow label="Discount" value={`-${formatPrice(sale.discount_amount)}`} labelColor={labelColor} valueColor="#ef4444" />
                                        )}
                                        {config.show_tax_breakdown && (
                                            <StyledInfoRow label={config.tax_label || 'VAT'} value={formatPrice(sale?.tax_amount || 0)} labelColor={labelColor} valueColor={textColor} />
                                        )}
                                        <div className="flex justify-between font-bold text-xs pt-1 mt-1" style={{ borderTop: `1px solid ${dividerColor}`, color: headingColor }}>
                                            <span>Total</span>
                                            <span>{formatPrice(sale?.total_amount)}</span>
                                        </div>
                                    </div>

                                    {/* Payment Details */}
                                    {config.show_payment_details && (
                                        <>
                                            <StyledDivider color={dividerColor} />
                                            <div className="text-[10px] space-y-0.5">
                                                <StyledInfoRow label="Payment" value={sale?.payment_method} labelColor={labelColor} valueColor={textColor} className="capitalize" />
                                                <StyledInfoRow label="Paid" value={formatPrice(sale?.amount_paid)} labelColor={labelColor} valueColor={textColor} />
                                                {(Number(sale?.amount_paid) || 0) > (Number(sale?.total_amount) || 0) && (
                                                    <div className="flex justify-between font-semibold text-green-600">
                                                        <span>Change</span>
                                                        <span>{formatPrice((Number(sale?.amount_paid) || 0) - (Number(sale?.total_amount) || 0))}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}

                                    {/* Referrer */}
                                    {config.show_referrer_details && sale?.referrer_name && (
                                        <>
                                            <StyledDivider color={dividerColor} />
                                            <div className="text-[10px]">
                                                <StyledInfoRow label="Referred by" value={sale.referrer_name} labelColor={labelColor} valueColor={textColor} />
                                            </div>
                                        </>
                                    )}

                                    <StyledDivider color={dividerColor} />

                                    {/* Footer */}
                                    {config.footer_text && (
                                        <p className="text-[10px] text-center italic" style={{ color: labelColor }}>{config.footer_text}</p>
                                    )}
                                    {config.terms_and_conditions && (
                                        <p className="text-[8px] text-center mt-1" style={{ color: labelColor, opacity: 0.7 }}>{config.terms_and_conditions}</p>
                                    )}

                                    {/* Barcode placeholder */}
                                    {config.show_barcode && (
                                        <div className="mt-2 flex justify-center">
                                            <div className="flex gap-px">
                                                {Array(30).fill(0).map((_, i) => (
                                                    <div key={i} style={{ backgroundColor: textColor, width: i % 3 === 0 ? 2 : 1, height: 24 }} />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            );
                        })()}
                    </div>
                </div>
            </div>

            {/* WhatsApp Send Modal */}
            {showWhatsApp && (
                <WhatsAppSendModal
                    isOpen={showWhatsApp}
                    onClose={() => setShowWhatsApp(false)}
                    saleId={saleId}
                    receiptNumber={receiptData?.sale?.sale_number || receiptNumber}
                    customerName={receiptData?.sale?.customer_name || customerName}
                    customerPhone={receiptData?.sale?.customer_phone || customerPhone}
                    totalAmount={receiptData?.sale?.total_amount || totalAmount}
                    currencySymbol={currencySymbol}
                />
            )}

            {/* Inline Email Modal */}
            {showEmail && (
                <>
                    <div className="fixed inset-0 z-[10000] bg-black/40" onClick={() => setShowEmail(false)} />
                    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
                        <div className="bg-theme-secondary rounded-xl border border-theme shadow-2xl w-full max-w-sm p-5 animate-in fade-in zoom-in-95 duration-150">
                            <h3 className="text-sm font-semibold text-theme-primary flex items-center gap-2 mb-4">
                                <Mail size={16} className="text-blue-500" />
                                Email Receipt
                            </h3>
                            {emailSent ? (
                                <div className="flex flex-col items-center gap-2 py-6">
                                    <CheckCircle className="w-10 h-10 text-green-500" />
                                    <p className="text-sm text-theme-primary font-medium">Email sent!</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium text-theme-muted mb-1">Email Address</label>
                                        <input
                                            type="email"
                                            value={emailAddress}
                                            onChange={(e) => setEmailAddress(e.target.value)}
                                            className="w-full px-3 py-2 bg-theme-primary border border-theme rounded-lg text-sm text-theme-primary placeholder-theme-muted focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 outline-none"
                                            placeholder="customer@email.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-theme-muted mb-1">Message (optional)</label>
                                        <textarea
                                            value={emailMessage}
                                            onChange={(e) => setEmailMessage(e.target.value)}
                                            rows={3}
                                            className="w-full px-3 py-2 bg-theme-primary border border-theme rounded-lg text-sm text-theme-primary placeholder-theme-muted focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 outline-none resize-none"
                                            placeholder="Additional message..."
                                        />
                                    </div>
                                    <div className="flex gap-2 pt-1">
                                        <button
                                            onClick={() => setShowEmail(false)}
                                            className="flex-1 px-4 py-2 bg-theme-tertiary text-theme-secondary rounded-lg text-sm font-medium hover:bg-theme-primary transition"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSendEmail}
                                            disabled={emailSending || !emailAddress.trim()}
                                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {emailSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                            {emailSending ? 'Sending…' : 'Send'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

// ── Small helpers ──
const StyledDivider = ({ color = '#d1d5db' }) => (
    <div className="my-2" style={{ borderTop: `1px dashed ${color}` }} />
);

const StyledInfoRow = ({ label, value, labelColor, valueColor, className = '' }) => (
    <div className={`flex justify-between ${className}`}>
        <span style={{ color: labelColor }}>{label}</span>
        <span className="font-medium" style={{ color: valueColor }}>{value || '—'}</span>
    </div>
);

const ActionBtn = ({ icon: Icon, label, onClick, disabled, className = '' }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-theme text-theme-secondary hover:bg-theme-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    >
        {typeof Icon === 'function' ? <Icon /> : <Icon size={16} />}
        <span className="hidden sm:inline">{label}</span>
    </button>
);

export default ReceiptPreviewModal;
