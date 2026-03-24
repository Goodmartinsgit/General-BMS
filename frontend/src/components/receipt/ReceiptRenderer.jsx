import React, { forwardRef } from 'react';
import { QrCode } from 'lucide-react';

// ── Auto-contrast helper ──
export const getContrastTextColor = (bgColor) => {
    if (!bgColor || bgColor.length < 4) return '#111827';
    let hex = bgColor.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    if (hex.length !== 6) return '#111827';
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    const lum = 0.2126 * (r <= 0.03928 ? r / 12.92 : ((r + 0.055) / 1.055) ** 2.4)
              + 0.7152 * (g <= 0.03928 ? g / 12.92 : ((g + 0.055) / 1.055) ** 2.4)
              + 0.0722 * (b <= 0.03928 ? b / 12.92 : ((b + 0.055) / 1.055) ** 2.4);
    return lum > 0.4 ? '#111827' : '#f9fafb';
};

const RECEIPT_TEMPLATES = [
    { id: 1, name: 'Standard', accent: '#d4a574' },
    { id: 2, name: 'Modern', accent: '#00d4ff' },
    { id: 3, name: 'Bold', accent: '#ff6b6b' },
    { id: 4, name: 'Invoice Pro', accent: '#52b788' },
    { id: 5, name: 'Invoice Classic', accent: '#e07a5f' },
    { id: 6, name: 'Detailed', accent: '#ffd166' },
    { id: 7, name: 'Elegant', accent: '#ef233c' },
    { id: 8, name: 'Corporate', accent: '#fcbf49' },
];

/**
 * ReceiptRenderer — template-aware receipt rendering.
 *
 * Props:
 *   config   — receipt_config row (template_id, colors, toggles, company info…)
 *   sale     — { sale_number, created_at, customer_name, customer_phone, salesperson_name,
 *               branch_name, referrer_name, subtotal, discount_amount, tax_amount,
 *               total_amount, amount_paid, payment_method }
 *   items    — [{ product_name, product_code, quantity, unit_price, line_total,
 *               discount_amount, variant_name, variant_sku }]
 *   currencySymbol — e.g. '₦'
 */
const ReceiptRenderer = forwardRef(({ config: cfg = {}, sale = {}, items = [], currencySymbol = '₦' }, ref) => {
    const tid = cfg.template_id || 1;
    const tmpl = RECEIPT_TEMPLATES.find(t => t.id === tid) || RECEIPT_TEMPLATES[0];
    const accent = cfg.receipt_accent_color || tmpl.accent;
    const bgColor = cfg.receipt_bg_color || '#ffffff';
    const autoText = getContrastTextColor(bgColor);
    const textColor = cfg.receipt_text_color || autoText;
    const isDark = autoText === '#f9fafb';
    const headingColor = cfg.receipt_heading_color || textColor;
    const labelColor = cfg.receipt_label_color || (isDark ? '#9ca3af' : '#6b7280');
    const mutedSolid = labelColor;
    const mutedColor = isDark ? 'rgba(209,213,219,0.6)' : 'rgba(107,114,128,0.6)';
    const borderColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';
    const borderStrong = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)';
    const subtleBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)';
    const fontWeight = cfg.receipt_font_weight || 'normal';

    const fmt = (v) => `${currencySymbol}${Number(v || 0).toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;

    // Normalize sale data
    const receiptNumber = sale.sale_number || sale.receipt_number || '';
    const saleDate = sale.created_at || sale.sale_date || sale.date || '';
    const dateStr = saleDate ? new Date(saleDate).toLocaleString() : '';
    const customerName = sale.customer_name || '';
    const customerPhone = sale.customer_phone || sale.phone_number || '';
    const cashier = sale.salesperson_name || sale.cashier || '';
    const branchName = sale.branch_name || '';
    const referrer = sale.referrer_name || sale.referrer || '';
    const subtotal = Number(sale.subtotal || 0);
    const discount = Number(sale.discount_amount || sale.discount || 0);
    const taxAmount = cfg.show_tax_breakdown && cfg.tax_rate > 0
        ? Math.round((subtotal - discount) * cfg.tax_rate / 100)
        : Number(sale.tax_amount || sale.tax || 0);
    const total = Number(sale.total_amount || sale.total || 0);
    const paid = Number(sale.amount_paid || sale.paid || 0);
    const change = paid > total ? paid - total : Number(sale.change || 0);
    const paymentMethod = sale.payment_method || '';

    // Normalize items
    const normalizedItems = items.map(item => ({
        name: item.product_name || item.name || '',
        code: item.product_code || item.code || '',
        qty: Number(item.quantity || item.qty || 0),
        price: Number(item.unit_price || item.price || 0),
        total: Number(item.line_total || item.subtotal || item.total || 0),
        discount: Number(item.discount_amount || 0),
        variant: item.variant_name || item.variant_sku || '',
    }));

    // ── Shared building blocks ──
    const Logo = () => cfg.show_logo && cfg.company_logo_url
        ? <img src={cfg.company_logo_url} alt="Logo" crossOrigin="anonymous" className="w-10 h-10 object-contain rounded-lg" />
        : null;
    const CompanyName = ({ className = '', style: s = {} }) =>
        <p className={`font-bold ${className}`} style={{ color: textColor, ...s }}>{cfg.company_name || 'Your Business'}</p>;
    const CompanyDetails = ({ className = '', size = 'text-[8px]' }) => cfg.show_company_details ? (
        <div className={`${size} ${className}`} style={{ color: labelColor }}>
            {cfg.company_address && <p>{cfg.company_address}</p>}
            {cfg.company_phone && <p>Tel: {cfg.company_phone}</p>}
            {cfg.company_email && <p>{cfg.company_email}</p>}
            {cfg.company_website && <p>{cfg.company_website}</p>}
        </div>
    ) : null;
    const TaxNumber = ({ className = '' }) => cfg.show_tax_number && cfg.tax_number
        ? <p className={`text-[8px] ${className}`} style={{ color: labelColor }}>{cfg.tax_label || 'TIN'}: {cfg.tax_number}</p>
        : null;
    const Dash = () => <div className="my-1.5" style={{ borderTop: `1px dashed ${borderColor}` }} />;
    const SolidLine = ({ color }) => <div className="my-1.5" style={{ borderTop: `1px solid ${color || borderColor}` }} />;

    const ItemsTable = ({ showCode = false, headerBg = '' }) => {
        const thStyle = headerBg
            ? { background: headerBg, color: getContrastTextColor(headerBg) }
            : { color: headingColor, borderBottom: `1px solid ${borderColor}` };
        return (
            <table className="w-full text-[8px]" style={{ color: textColor, fontWeight }}>
                <thead>
                    <tr style={headerBg ? { background: headerBg, color: thStyle.color } : {}}>
                        <th className="text-left py-0.5 px-0.5" style={!headerBg ? thStyle : {}}>Item</th>
                        {showCode && <th className="text-left py-0.5 px-0.5" style={!headerBg ? thStyle : {}}>Code</th>}
                        <th className="text-center py-0.5 px-0.5" style={!headerBg ? thStyle : {}}>Qty</th>
                        <th className="text-right py-0.5 px-0.5" style={!headerBg ? thStyle : {}}>Price</th>
                        <th className="text-right py-0.5 px-0.5" style={!headerBg ? thStyle : {}}>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {normalizedItems.map((item, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${borderColor}` }}>
                            <td className="py-0.5 px-0.5">
                                {item.name}
                                {item.variant && <span className="block text-[7px]" style={{ color: labelColor }}>({item.variant})</span>}
                            </td>
                            {showCode && <td className="py-0.5 px-0.5" style={{ color: labelColor }}>{item.code}</td>}
                            <td className="text-center py-0.5 px-0.5">{item.qty}</td>
                            <td className="text-right py-0.5 px-0.5">{fmt(item.price)}</td>
                            <td className="text-right py-0.5 px-0.5 font-medium">{fmt(item.total)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };

    const Totals = ({ bold = false }) => (
        <div className="text-[8px] space-y-0.5" style={{ color: textColor, fontWeight }}>
            <div className="flex justify-between"><span style={{ color: labelColor }}>Subtotal</span><span>{fmt(subtotal)}</span></div>
            {discount > 0 && <div className="flex justify-between" style={{ color: '#ef4444' }}><span>Discount</span><span>-{fmt(discount)}</span></div>}
            {cfg.show_tax_breakdown && <div className="flex justify-between"><span style={{ color: labelColor }}>{cfg.tax_label || 'VAT'} {cfg.tax_rate > 0 ? `(${cfg.tax_rate}%)` : ''}</span><span>{fmt(taxAmount)}</span></div>}
            <div className={`flex justify-between pt-0.5 mt-0.5 ${bold ? 'font-bold text-[10px]' : 'font-bold text-[9px]'}`} style={{ borderTop: `1px solid ${borderColor}` }}>
                <span>Total</span><span>{fmt(total)}</span>
            </div>
        </div>
    );

    const PaymentInfo = () => cfg.show_payment_details ? (
        <div className="text-[8px] space-y-0.5" style={{ color: textColor, fontWeight }}>
            <div className="flex justify-between"><span style={{ color: labelColor }}>Payment</span><span className="capitalize">{paymentMethod}</span></div>
            <div className="flex justify-between"><span style={{ color: labelColor }}>Paid</span><span>{fmt(paid)}</span></div>
            {change > 0 && <div className="flex justify-between font-semibold" style={{ color: '#16a34a' }}><span>Change</span><span>{fmt(change)}</span></div>}
        </div>
    ) : null;

    const ReferrerInfo = () => cfg.show_referrer_details && referrer ? (
        <div className="text-[8px]" style={{ color: textColor, fontWeight }}><div className="flex justify-between"><span style={{ color: labelColor }}>Referred by</span><span>{referrer}</span></div></div>
    ) : null;

    const FooterBlock = () => (
        <>
            {cfg.footer_text && <p className="text-[8px] text-center italic" style={{ color: labelColor }}>{cfg.footer_text}</p>}
            {cfg.terms_and_conditions && <p className="text-[7px] text-center mt-0.5" style={{ color: mutedColor }}>{cfg.terms_and_conditions}</p>}
        </>
    );

    const BarcodeBlock = () => cfg.show_barcode ? (
        <div className="mt-1.5 flex justify-center gap-px">{Array(25).fill(0).map((_, i) => <div key={i} style={{ background: textColor, width: i % 3 === 0 ? 2 : 1, height: 18 }} />)}</div>
    ) : null;

    const QRBlock = () => cfg.show_qr_code ? (
        <div className="mt-1.5 flex justify-center"><div className="w-10 h-10 rounded flex items-center justify-center" style={{ border: `1px solid ${borderColor}`, background: subtleBg }}><QrCode size={20} style={{ color: labelColor }} /></div></div>
    ) : null;

    const InfoRow = ({ label, value }) => (
        <div className="flex justify-between text-[8px]" style={{ color: textColor, fontWeight }}>
            <span style={{ color: labelColor }}>{label}</span>
            <span className="font-medium">{value}</span>
        </div>
    );

    const outerStyle = { backgroundColor: bgColor };
    const outerProps = { ref, style: outerStyle, 'data-receipt-root': true };

    // ── Template 1: Standard ──
    if (tid === 1) return (
        <div {...outerProps}>
            <div className="p-4" style={{ color: textColor, fontWeight }}>
                <div className="text-center mb-2">
                    <div className="flex justify-center mb-1"><Logo /></div>
                    <CompanyName className="text-sm" />
                    <CompanyDetails className="mt-0.5" />
                    <TaxNumber className="mt-0.5" />
                </div>
                <Dash />
                <div className="space-y-0.5 mb-1.5">
                    <InfoRow label="Receipt #" value={receiptNumber} />
                    <InfoRow label="Date" value={dateStr} />
                    {cfg.show_customer_details && customerName && <InfoRow label="Customer" value={customerName} />}
                    {cashier && <InfoRow label="Cashier" value={cashier} />}
                    {branchName && <InfoRow label="Branch" value={branchName} />}
                </div>
                <Dash />
                <ItemsTable />
                <Dash />
                <Totals />
                {cfg.show_payment_details && <><Dash /><PaymentInfo /></>}
                {cfg.show_referrer_details && referrer && <><Dash /><ReferrerInfo /></>}
                <Dash />
                <FooterBlock />
                <BarcodeBlock />
                <QRBlock />
            </div>
        </div>
    );

    // ── Template 2: Modern ──
    if (tid === 2) return (
        <div {...outerProps}>
            <div style={{ color: textColor, fontWeight }}>
                <div className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                        <Logo />
                        <div>
                            <CompanyName className="text-sm" />
                            <CompanyDetails size="text-[7px]" />
                        </div>
                    </div>
                    <TaxNumber />
                </div>
                <div className="px-3 py-1.5 text-white text-[8px] flex justify-between" style={{ background: accent }}>
                    <span className="font-bold">{receiptNumber}</span>
                    <span>{dateStr}</span>
                </div>
                <div className="p-3">
                    {cfg.show_customer_details && customerName && <div className="text-[8px] mb-2"><span style={{ color: mutedSolid }}>Customer: </span><span className="font-medium">{customerName}</span></div>}
                    <ItemsTable headerBg={accent} />
                    <div className="mt-2" />
                    <Totals bold />
                    {cfg.show_payment_details && <><SolidLine color={accent} /><PaymentInfo /></>}
                    {cfg.show_referrer_details && referrer && <><SolidLine /><ReferrerInfo /></>}
                    <div className="mt-2" />
                    <FooterBlock />
                    <BarcodeBlock />
                    <QRBlock />
                </div>
            </div>
        </div>
    );

    // ── Template 3: Bold ──
    if (tid === 3) return (
        <div {...outerProps}>
            <div className="p-4" style={{ color: textColor, fontWeight }}>
                <div className="text-center mb-2">
                    <div className="flex justify-center mb-1"><Logo /></div>
                    <CompanyName className="text-base uppercase tracking-wide" />
                    <CompanyDetails className="mt-0.5" />
                    <TaxNumber className="mt-0.5" />
                </div>
                <div className="my-2" style={{ borderBottom: `2px solid ${borderStrong}` }} />
                <p className="text-center font-mono font-bold text-[10px] tracking-widest mb-1" style={{ color: accent }}>{receiptNumber}</p>
                <p className="text-center text-[8px] mb-1.5" style={{ color: mutedSolid }}>{dateStr}</p>
                <div className="space-y-0.5 mb-1.5">
                    {cfg.show_customer_details && customerName && <InfoRow label="Customer" value={customerName} />}
                    {cashier && <InfoRow label="Cashier" value={cashier} />}
                </div>
                <div className="my-2" style={{ borderBottom: `2px solid ${borderStrong}` }} />
                <ItemsTable />
                <div className="my-2" style={{ borderBottom: `2px solid ${borderStrong}` }} />
                <Totals bold />
                {cfg.show_payment_details && <><div className="my-1.5" style={{ borderBottom: `1px solid ${borderColor}` }} /><PaymentInfo /></>}
                {cfg.show_referrer_details && referrer && <><div className="my-1.5" style={{ borderBottom: `1px solid ${borderColor}` }} /><ReferrerInfo /></>}
                <div className="my-2" style={{ borderBottom: `2px solid ${borderStrong}` }} />
                <FooterBlock />
                <BarcodeBlock />
                <QRBlock />
            </div>
        </div>
    );

    // ── Template 4: Invoice Pro ──
    if (tid === 4) return (
        <div {...outerProps}>
            <div style={{ color: textColor, fontWeight }}>
                <div className="px-3 py-2 text-[7px] text-right" style={{ color: mutedSolid, borderBottom: `1px solid ${borderColor}` }}>{dateStr}</div>
                <div className="p-3">
                    <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-1.5"><Logo /><CompanyName className="text-xs" /></div>
                        <div className="text-right text-[8px]"><span className="font-bold" style={{ color: accent }}>INVOICE</span><br /><span style={{ color: mutedSolid }}>{receiptNumber}</span></div>
                    </div>
                    <CompanyDetails size="text-[7px]" />
                    <TaxNumber className="mt-0.5" />
                    <div className="grid grid-cols-3 gap-1.5 my-2 text-[7px]">
                        <div className="rounded p-1.5" style={{ background: subtleBg }}>
                            <p className="uppercase text-[6px] font-bold" style={{ color: mutedSolid }}>Bill To</p>
                            {cfg.show_customer_details && customerName && <p className="font-medium">{customerName}</p>}
                        </div>
                        <div className="rounded p-1.5" style={{ background: subtleBg }}>
                            <p className="uppercase text-[6px] font-bold" style={{ color: mutedSolid }}>Date</p>
                            <p className="font-medium">{dateStr}</p>
                        </div>
                        <div className="rounded p-1.5" style={{ background: subtleBg }}>
                            <p className="uppercase text-[6px] font-bold" style={{ color: mutedSolid }}>Cashier</p>
                            <p className="font-medium">{cashier}</p>
                        </div>
                    </div>
                    <ItemsTable showCode headerBg={accent} />
                    <div className="mt-2" />
                    <Totals bold />
                    {cfg.show_payment_details && <><SolidLine /><PaymentInfo /></>}
                    {cfg.show_referrer_details && referrer && <><SolidLine /><ReferrerInfo /></>}
                    <div className="mt-2" />
                    <FooterBlock />
                    <BarcodeBlock />
                    <QRBlock />
                </div>
            </div>
        </div>
    );

    // ── Template 5: Invoice Classic ──
    if (tid === 5) return (
        <div {...outerProps}>
            <div style={{ color: textColor, fontWeight }}>
                <div className="p-3 border-b-2" style={{ borderColor: accent }}>
                    <div className="flex items-start justify-between">
                        <div><div className="flex items-center gap-1.5"><Logo /><CompanyName className="text-xs" /></div><CompanyDetails size="text-[7px]" className="mt-0.5" /></div>
                        <div className="text-right"><p className="text-[10px] font-bold" style={{ color: accent }}>RECEIPT</p><p className="text-[7px]" style={{ color: mutedSolid }}>{receiptNumber}</p></div>
                    </div>
                </div>
                <div className="p-3">
                    <TaxNumber className="mb-1" />
                    <div className="grid grid-cols-2 gap-2 my-2 text-[7px]">
                        <div>{cfg.show_customer_details && customerName && <><p className="uppercase text-[6px] font-bold mb-0.5" style={{ color: mutedSolid }}>Customer</p><p className="font-medium">{customerName}</p>{customerPhone && <p style={{ color: mutedSolid }}>{customerPhone}</p>}</>}</div>
                        <div className="text-right"><p className="uppercase text-[6px] font-bold mb-0.5" style={{ color: mutedSolid }}>Details</p><p>{dateStr}</p>{cashier && <p>Cashier: {cashier}</p>}</div>
                    </div>
                    <ItemsTable showCode />
                    <div className="mt-2" />
                    <Totals bold />
                    {cfg.show_payment_details && <><SolidLine /><PaymentInfo /></>}
                    {cfg.show_referrer_details && referrer && <><SolidLine /><ReferrerInfo /></>}
                    <div className="mt-2" />
                    <FooterBlock />
                    <BarcodeBlock />
                    <QRBlock />
                </div>
            </div>
        </div>
    );

    // ── Template 6: Detailed (Boxed Grid) ──
    if (tid === 6) return (
        <div {...outerProps}>
            <div style={{ color: textColor, fontWeight }}>
                <div className="p-2.5 m-2 rounded text-center" style={{ border: `2px solid ${borderStrong}` }}>
                    <div className="flex justify-center mb-1"><Logo /></div>
                    <CompanyName className="text-sm" />
                    <CompanyDetails className="mt-0.5" />
                    <TaxNumber className="mt-0.5" />
                </div>
                <div className="px-3 pb-3">
                    <div className="grid grid-cols-2 gap-1.5 mb-2">
                        <div className="rounded p-1.5" style={{ border: `1px solid ${borderColor}` }}>
                            <p className="text-[6px] font-bold uppercase mb-0.5" style={{ color: mutedSolid }}>Bill To</p>
                            {cfg.show_customer_details && customerName && <p className="text-[8px] font-medium">{customerName}</p>}
                            {cfg.show_customer_details && customerPhone && <p className="text-[7px]" style={{ color: mutedSolid }}>{customerPhone}</p>}
                        </div>
                        <div className="rounded p-1.5" style={{ border: `1px solid ${borderColor}` }}>
                            <p className="text-[6px] font-bold uppercase mb-0.5" style={{ color: mutedSolid }}>Receipt Info</p>
                            <p className="text-[8px] font-medium">{receiptNumber}</p>
                            <p className="text-[7px]" style={{ color: mutedSolid }}>{dateStr}</p>
                            {cashier && <p className="text-[7px]" style={{ color: mutedSolid }}>Cashier: {cashier}</p>}
                        </div>
                    </div>
                    <ItemsTable showCode headerBg={isDark ? '#374151' : '#212529'} />
                    <div className="mt-2 rounded p-1.5" style={{ border: `1px solid ${borderColor}` }}>
                        <Totals bold />
                    </div>
                    {cfg.show_payment_details && <div className="mt-1.5"><PaymentInfo /></div>}
                    {cfg.show_referrer_details && referrer && <div className="mt-1.5"><ReferrerInfo /></div>}
                    <div className="mt-2" />
                    <FooterBlock />
                    <BarcodeBlock />
                    <QRBlock />
                </div>
            </div>
        </div>
    );

    // ── Template 7: Elegant (Serif Luxury) ──
    if (tid === 7) return (
        <div {...outerProps}>
            <div className="p-4" style={{ color: textColor, fontWeight, fontFamily: 'Georgia, "Times New Roman", serif' }}>
                <div className="text-center mb-2">
                    <div className="flex justify-center mb-1"><Logo /></div>
                    <CompanyName className="text-sm tracking-wider" />
                    <CompanyDetails className="mt-0.5" />
                    <TaxNumber className="mt-0.5" />
                </div>
                <p className="text-center text-[9px] font-bold tracking-[0.2em] uppercase mb-1" style={{ color: accent }}>Official Receipt</p>
                <div className="flex items-center gap-1.5 my-2"><div className="flex-1" style={{ borderTop: `1px solid ${borderColor}` }} /><div className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} /><div className="flex-1" style={{ borderTop: `1px solid ${borderColor}` }} /></div>
                <div className="space-y-0.5 mb-2">
                    <InfoRow label="Receipt #" value={receiptNumber} />
                    <InfoRow label="Date" value={dateStr} />
                    {cfg.show_customer_details && customerName && <InfoRow label="Customer" value={customerName} />}
                    {cashier && <InfoRow label="Cashier" value={cashier} />}
                </div>
                <div className="flex items-center gap-1.5 my-2"><div className="flex-1" style={{ borderTop: `1px solid ${borderColor}` }} /><div className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} /><div className="flex-1" style={{ borderTop: `1px solid ${borderColor}` }} /></div>
                <ItemsTable />
                <div className="flex items-center gap-1.5 my-2"><div className="flex-1" style={{ borderTop: `1px solid ${borderColor}` }} /><div className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} /><div className="flex-1" style={{ borderTop: `1px solid ${borderColor}` }} /></div>
                <Totals bold />
                {cfg.show_payment_details && <><SolidLine /><PaymentInfo /></>}
                {cfg.show_referrer_details && referrer && <><SolidLine /><ReferrerInfo /></>}
                <div className="mt-2" />
                <FooterBlock />
                <BarcodeBlock />
                <QRBlock />
            </div>
        </div>
    );

    // ── Template 8: Corporate ──
    if (tid === 8) return (
        <div {...outerProps}>
            <div style={{ color: textColor, fontWeight }}>
                <div className="p-3 text-white relative" style={{ background: isDark ? 'rgba(255,255,255,0.12)' : '#2c3e50' }}>
                    <div className="flex items-center gap-2">
                        <Logo />
                        <div>
                            <CompanyName className="text-sm" style={{ color: '#fff' }} />
                            {cfg.show_company_details && <div className="text-[7px]" style={{ color: 'rgba(255,255,255,0.7)' }}>{cfg.company_address && <span>{cfg.company_address}</span>}{cfg.company_phone && <span> &bull; {cfg.company_phone}</span>}</div>}
                        </div>
                    </div>
                    <TaxNumber className="mt-1" />
                </div>
                <div className="h-1" style={{ background: accent }} />
                <div className="p-3">
                    <div className="flex justify-between text-[8px] mb-2">
                        <div>
                            {cfg.show_customer_details && customerName && <><p className="text-[6px] uppercase font-bold" style={{ color: mutedSolid }}>Customer</p><p className="font-medium">{customerName}</p></>}
                        </div>
                        <div className="text-right">
                            <p className="font-bold" style={{ color: accent }}>{receiptNumber}</p>
                            <p style={{ color: mutedSolid }}>{dateStr}</p>
                            {cashier && <p style={{ color: mutedSolid }}>Cashier: {cashier}</p>}
                        </div>
                    </div>
                    <ItemsTable showCode headerBg={isDark ? 'rgba(255,255,255,0.12)' : '#2c3e50'} />
                    <div className="mt-2" />
                    <Totals bold />
                    {cfg.show_payment_details && <><SolidLine /><PaymentInfo /></>}
                    {cfg.show_referrer_details && referrer && <><SolidLine /><ReferrerInfo /></>}
                    <div className="mt-2" />
                    <FooterBlock />
                    <BarcodeBlock />
                    <QRBlock />
                </div>
            </div>
        </div>
    );

    // Fallback — template 1
    return null;
});

ReceiptRenderer.displayName = 'ReceiptRenderer';

export default ReceiptRenderer;
