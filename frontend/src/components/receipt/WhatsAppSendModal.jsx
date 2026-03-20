import React, { useState, useEffect, useMemo } from 'react';
import { X, Send, FileText, Image, Loader2, CheckCircle, AlertCircle, Info } from 'lucide-react';
import WhatsAppIcon from '../icons/WhatsAppIcon';
import { sendReceipt, validatePhoneNumber, normalizePhoneNumber, formatPhoneNumber, getNetworkProvider } from '../../api/whatsapp';

/**
 * WhatsAppSendModal — send receipt via WhatsApp
 * Includes phone validation (Nigerian), network provider detection, and format toggle.
 */
const WhatsAppSendModal = ({
    isOpen,
    onClose,
    saleId,
    receiptNumber,
    customerName,
    customerPhone,
    totalAmount,
    currencySymbol = '₦',
}) => {
    const [phone, setPhone] = useState('');
    const [format, setFormat] = useState('pdf');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState(null);

    // Pre-fill customer phone
    useEffect(() => {
        if (isOpen && customerPhone) {
            setPhone(customerPhone);
        }
        if (isOpen) {
            setSent(false);
            setError(null);
        }
    }, [isOpen, customerPhone]);

    // Phone validation
    const validation = useMemo(() => validatePhoneNumber(phone), [phone]);
    const networkProvider = useMemo(() => getNetworkProvider(phone), [phone]);
    const formattedPhone = useMemo(() => formatPhoneNumber(phone), [phone]);

    const handleSend = async () => {
        if (!validation.isValid) return;
        setSending(true);
        setError(null);
        try {
            await sendReceipt({
                saleId,
                phoneNumber: normalizePhoneNumber(phone),
                format,
            });
            setSent(true);
            setTimeout(() => onClose(), 2000);
        } catch (err) {
            console.error('WhatsApp send failed:', err);
            setError('Failed to send receipt. Please try again.');
        } finally {
            setSending(false);
        }
    };

    if (!isOpen) return null;

    const formatAmount = (val) => {
        const n = Number(val) || 0;
        return `${currencySymbol}${n.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;
    };

    return (
        <>
            <div className="fixed inset-0 z-[10002] bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="fixed inset-0 z-[10003] flex items-center justify-center p-4">
                <div className="bg-theme-secondary rounded-xl border border-theme shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">

                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-theme bg-[#075E54]">
                        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                            <WhatsAppIcon size={18} color="#25D366" />
                            Send via WhatsApp
                        </h3>
                        <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 transition text-white/70 hover:text-white">
                            <X size={16} />
                        </button>
                    </div>

                    {sent ? (
                        <div className="flex flex-col items-center gap-3 py-10 px-5">
                            <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <CheckCircle className="w-8 h-8 text-green-500" />
                            </div>
                            <p className="text-sm font-medium text-theme-primary">Receipt sent successfully!</p>
                            <p className="text-xs text-theme-muted">The receipt has been sent to {formattedPhone}</p>
                        </div>
                    ) : (
                        <div className="p-5 space-y-4">

                            {/* Receipt Info Card */}
                            <div className="bg-theme-primary rounded-lg border border-theme p-3">
                                <div className="text-[10px] text-theme-muted uppercase tracking-wider mb-1.5 font-medium">Receipt Info</div>
                                <div className="space-y-1 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-theme-muted">Receipt #</span>
                                        <span className="text-theme-primary font-medium">{receiptNumber || '—'}</span>
                                    </div>
                                    {customerName && (
                                        <div className="flex justify-between">
                                            <span className="text-theme-muted">Customer</span>
                                            <span className="text-theme-primary font-medium">{customerName}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-theme-muted">Total</span>
                                        <span className="text-theme-primary font-semibold">{formatAmount(totalAmount)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Format Toggle */}
                            <div>
                                <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">Format</label>
                                <div className="flex bg-theme-primary p-1 rounded-lg border border-theme">
                                    <button
                                        type="button"
                                        onClick={() => setFormat('pdf')}
                                        className={`flex-1 py-2 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${
                                            format === 'pdf'
                                                ? 'bg-[#25D366] text-white shadow-sm'
                                                : 'text-theme-muted hover:text-theme-primary'
                                        }`}
                                    >
                                        <FileText size={14} />
                                        PDF
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormat('image')}
                                        className={`flex-1 py-2 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${
                                            format === 'image'
                                                ? 'bg-[#25D366] text-white shadow-sm'
                                                : 'text-theme-muted hover:text-theme-primary'
                                        }`}
                                    >
                                        <Image size={14} />
                                        Image
                                    </button>
                                </div>
                            </div>

                            {/* Phone Number */}
                            <div>
                                <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">Phone Number</label>
                                <div className="relative">
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className={`w-full px-3 py-2.5 pr-10 bg-theme-primary border rounded-lg text-sm text-theme-primary placeholder-theme-muted focus:ring-2 outline-none transition-all ${
                                            phone.trim() === ''
                                                ? 'border-theme focus:ring-accent-gold/20 focus:border-accent-gold/30'
                                                : validation.isValid
                                                    ? 'border-green-500/50 focus:ring-green-500/20 focus:border-green-500/50'
                                                    : 'border-red-500/50 focus:ring-red-500/20 focus:border-red-500/50'
                                        }`}
                                        placeholder="e.g. 08012345678"
                                    />
                                    {/* Validation icon */}
                                    {phone.trim() !== '' && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            {validation.isValid
                                                ? <CheckCircle size={16} className="text-green-500" />
                                                : <AlertCircle size={16} className="text-red-500" />
                                            }
                                        </div>
                                    )}
                                </div>
                                {/* Validation feedback */}
                                {phone.trim() !== '' && (
                                    <div className="mt-1 flex items-center gap-2">
                                        <p className={`text-[10px] ${validation.isValid ? 'text-green-500' : 'text-red-500'}`}>
                                            {validation.message}
                                        </p>
                                        {validation.isValid && networkProvider !== 'Unknown' && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-theme-tertiary text-theme-muted font-medium">
                                                {networkProvider}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Info Note */}
                            <div className="flex items-start gap-2 p-2.5 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200/50 dark:border-blue-800/30">
                                <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
                                <p className="text-[10px] text-blue-600 dark:text-blue-400 leading-relaxed">
                                    The receipt will be sent as a {format === 'pdf' ? 'PDF document' : 'image'} to the customer's WhatsApp number. Ensure the number has an active WhatsApp account.
                                </p>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="flex items-center gap-2 p-2.5 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200/50 dark:border-red-800/30">
                                    <AlertCircle size={14} className="text-red-500 shrink-0" />
                                    <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2 pt-1">
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-4 py-2.5 bg-theme-tertiary text-theme-secondary rounded-lg text-sm font-medium hover:bg-theme-primary transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSend}
                                    disabled={sending || !validation.isValid}
                                    className="flex-1 px-4 py-2.5 bg-[#25D366] text-white rounded-lg text-sm font-medium hover:bg-[#128C7E] transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-green-500/20"
                                >
                                    {sending ? (
                                        <><Loader2 size={14} className="animate-spin" /> Sending…</>
                                    ) : (
                                        <><Send size={14} /> Send Receipt</>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default WhatsAppSendModal;
