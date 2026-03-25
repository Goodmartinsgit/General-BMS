import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Printer, Download, Mail, X, Loader2, RefreshCw,
    CheckCircle, AlertCircle, Send, Image, FileText, ChevronDown
} from 'lucide-react';
import WhatsAppIcon from '../icons/WhatsAppIcon';
import WhatsAppSendModal from './WhatsAppSendModal';
import ReceiptRenderer, { getContrastTextColor } from './ReceiptRenderer';
import { getReceiptData } from '../../api/receipts';

/**
 * ReceiptPreviewModal — saleId-based
 * Fetches receipt data from backend, renders via ReceiptRenderer (template-aware),
 * supports Print, Download (Image/PDF), WhatsApp, and Email actions.
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

    // Download
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const downloadMenuRef = useRef(null);

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

    // Close download menu on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target)) {
                setShowDownloadMenu(false);
            }
        };
        if (showDownloadMenu) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showDownloadMenu]);

    const fileName = receiptData?.sale?.sale_number || receiptNumber || 'receipt';

    // ── Helper: convert cross-origin images to inline data URLs ──
    const inlineExternalImages = async (element) => {
        const images = element.querySelectorAll('img');
        await Promise.all(Array.from(images).map(async (img) => {
            if (!img.src || img.src.startsWith('data:')) return;
            try {
                const resp = await fetch(img.src, { mode: 'cors' });
                const blob = await resp.blob();
                const dataUrl = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(blob);
                });
                img.src = dataUrl;
            } catch {
                // If CORS fetch fails, leave as-is
            }
        }));
    };

    // ── Helper: create a standalone receipt clone with all styles inlined ──
    const createStandaloneClone = async () => {
        if (!receiptRef.current) return null;

        // Clone the receipt DOM
        const clone = receiptRef.current.cloneNode(true);

        // Create an off-screen container at the configured paper width
        const paperSize = receiptData?.config?.paper_size || 'A5';
        const paper = getPaperConfig(paperSize);
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.left = '-9999px';
        container.style.top = '0';
        container.style.width = paper.width;
        document.body.appendChild(container);
        container.appendChild(clone);

        // Copy computed styles from original to clone recursively
        const copyComputedStyles = (source, target) => {
            const computed = window.getComputedStyle(source);
            for (let i = 0; i < computed.length; i++) {
                const prop = computed[i];
                try {
                    target.style.setProperty(prop, computed.getPropertyValue(prop));
                } catch { /* skip read-only */ }
            }
            const sourceChildren = source.children;
            const targetChildren = target.children;
            for (let i = 0; i < sourceChildren.length; i++) {
                if (targetChildren[i]) {
                    copyComputedStyles(sourceChildren[i], targetChildren[i]);
                }
            }
        };
        copyComputedStyles(receiptRef.current, clone);

        // Inline external images as data URLs
        await inlineExternalImages(clone);

        document.body.removeChild(container);
        return clone;
    };

    // ── Paper-size helpers ──
    const getPaperConfig = (paperSize) => {
        switch (paperSize) {
            case 'A4': return { width: '190mm', widthPx: 719, pageSize: 'A4', margin: '10mm', pdfW: 190 };
            case 'A5': return { width: '128mm', widthPx: 484, pageSize: 'A5', margin: '10mm', pdfW: 128 };
            case 'A6': return { width: '85mm', widthPx: 321, pageSize: 'A6', margin: '10mm', pdfW: 85 };
            case '80mm': return { width: '80mm', widthPx: 302, pageSize: '80mm 297mm', margin: '0', pdfW: 80 };
            default: return { width: '128mm', widthPx: 484, pageSize: 'A5', margin: '10mm', pdfW: 128 };
        }
    };

    // ── Print ──
    const handlePrint = () => {
        if (!receiptRef.current) return;
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Please allow popups to print the receipt');
            return;
        }

        const styleSheets = Array.from(document.styleSheets);
        let cssText = '';
        styleSheets.forEach(sheet => {
            try {
                Array.from(sheet.cssRules || []).forEach(rule => { cssText += rule.cssText + '\n'; });
            } catch { /* cross-origin sheets */ }
        });

        const bgColor = receiptData?.config?.receipt_bg_color || '#ffffff';
        const paperSize = receiptData?.config?.paper_size || 'A5';
        const paper = getPaperConfig(paperSize);

        printWindow.document.write(`<!DOCTYPE html><html><head>
            <title>Receipt - ${fileName}</title>
            <style>${cssText}
            * { margin:0; padding:0; box-sizing:border-box; }
            body { padding:10px; background:#fff; display:flex; justify-content:center; }
            .receipt-print-wrapper { width:${paper.width}; margin:0 auto; background:${bgColor}; }
            table { width:100%; border-collapse:collapse; }
            @media print {
                body { padding:0; }
                @page { size:${paper.pageSize}; margin:${paper.margin}; }
                .receipt-print-wrapper { width:100%; }
            }
            </style>
        </head><body>
            <div class="receipt-print-wrapper" id="receipt-container"></div>
            <script>window.onload=function(){window.print();window.onafterprint=function(){window.close();};};<\/script>
        </body></html>`);
        printWindow.document.close();

        const container = printWindow.document.getElementById('receipt-container');
        if (container && receiptRef.current) {
            const cloned = receiptRef.current.cloneNode(true);
            container.appendChild(printWindow.document.adoptNode(cloned));
        }
    };

    // ── Capture receipt to canvas (shared by image + PDF downloads) ──
    const captureToCanvas = async () => {
        if (!receiptRef.current) return null;
        const bgColor = receiptData?.config?.receipt_bg_color || '#ffffff';
        const paperSize = receiptData?.config?.paper_size || 'A5';
        const paper = getPaperConfig(paperSize);
        const html2canvas = (await import('html2canvas')).default;

        // Temporarily expand receipt to paper-size width for higher quality capture
        const wrapper = receiptRef.current.parentElement;
        const origMaxWidth = wrapper ? wrapper.style.maxWidth : '';
        const origWidth = wrapper ? wrapper.style.width : '';
        if (wrapper) {
            wrapper.style.maxWidth = paper.width;
            wrapper.style.width = paper.width;
        }

        try {
            const canvas = await html2canvas(receiptRef.current, {
                scale: 3,
                backgroundColor: bgColor,
                useCORS: true,
                allowTaint: false,
                logging: false,
                imageTimeout: 15000,
                onclone: async (clonedDoc) => {
                    const clonedEl = clonedDoc.body.querySelector('[data-receipt-root]') || clonedDoc.body;
                    await inlineExternalImages(clonedEl);
                },
            });
            return canvas;
        } finally {
            // Restore original preview width
            if (wrapper) {
                wrapper.style.maxWidth = origMaxWidth;
                wrapper.style.width = origWidth;
            }
        }
    };

    // ── Download as Image ──
    const handleDownloadImage = async () => {
        setDownloading(true);
        setShowDownloadMenu(false);
        try {
            const canvas = await captureToCanvas();
            if (!canvas) return;
            const link = document.createElement('a');
            link.download = `receipt-${fileName}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error('Image download failed:', err);
            // Fallback to HTML download
            if (receiptRef.current) {
                const blob = new Blob([receiptRef.current.outerHTML], { type: 'text/html' });
                const link = document.createElement('a');
                link.download = `receipt-${fileName}.html`;
                link.href = URL.createObjectURL(blob);
                link.click();
                URL.revokeObjectURL(link.href);
            }
        } finally {
            setDownloading(false);
        }
    };

    // ── Download as PDF ──
    const handleDownloadPDF = async () => {
        setDownloading(true);
        setShowDownloadMenu(false);
        try {
            const canvas = await captureToCanvas();
            if (!canvas) return;
            const { default: jsPDF } = await import('jspdf');

            const imgData = canvas.toDataURL('image/png');
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;

            // Use paper_size setting for PDF dimensions
            const paperSize = receiptData?.config?.paper_size || 'A5';
            const paper = getPaperConfig(paperSize);
            const pdfWidth = paper.pdfW;
            const pdfHeight = (imgHeight * pdfWidth) / imgWidth;

            const pdf = new jsPDF({
                orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
                unit: 'mm',
                format: [pdfWidth + 20, pdfHeight + 20], // +20mm padding
            });

            pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth, pdfHeight);
            pdf.save(`receipt-${fileName}.pdf`);
        } catch (err) {
            console.error('PDF download failed:', err);
            // Fallback to image download
            handleDownloadImage();
        } finally {
            setDownloading(false);
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

    // Apply auto-contrast if text color not explicitly set
    const effectiveConfig = { ...config };
    if (!effectiveConfig.receipt_text_color) {
        effectiveConfig.receipt_text_color = getContrastTextColor(effectiveConfig.receipt_bg_color || '#ffffff');
    }

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

                        {/* Download with format dropdown */}
                        <div className="relative" ref={downloadMenuRef}>
                            <button
                                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                                disabled={loading || !!error || downloading}
                                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-theme text-theme-secondary hover:bg-theme-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                                <span className="hidden sm:inline">Download</span>
                                <ChevronDown size={12} className={`transition-transform ${showDownloadMenu ? 'rotate-180' : ''}`} />
                            </button>

                            {showDownloadMenu && (
                                <div className="absolute top-full left-0 mt-1 w-44 bg-theme-secondary border border-theme rounded-lg shadow-xl overflow-hidden z-10 animate-in fade-in slide-in-from-top-1 duration-150">
                                    <button
                                        onClick={handleDownloadImage}
                                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-theme-secondary hover:bg-theme-primary transition-colors text-left"
                                    >
                                        <Image size={15} className="text-purple-500 shrink-0" />
                                        <div>
                                            <p className="font-medium">Image (PNG)</p>
                                            <p className="text-[10px] text-theme-muted">High quality image</p>
                                        </div>
                                    </button>
                                    <div className="border-t border-theme" />
                                    <button
                                        onClick={handleDownloadPDF}
                                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-theme-secondary hover:bg-theme-primary transition-colors text-left"
                                    >
                                        <FileText size={15} className="text-red-500 shrink-0" />
                                        <div>
                                            <p className="font-medium">PDF Document</p>
                                            <p className="text-[10px] text-theme-muted">Ready to print or share</p>
                                        </div>
                                    </button>
                                </div>
                            )}
                        </div>

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

                        {!loading && !error && receiptData && (
                            <div className="rounded-xl shadow-lg max-w-xs mx-auto overflow-hidden">
                                <ReceiptRenderer
                                    ref={receiptRef}
                                    config={effectiveConfig}
                                    sale={sale || {}}
                                    items={items}
                                    currencySymbol={currencySymbol}
                                />
                            </div>
                        )}
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
