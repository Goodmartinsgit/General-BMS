import React, { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

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
        ? <img src={cfg.company_logo_url} alt="Logo" crossOrigin="anonymous" style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 8 }} />
        : null;
    const companyNameColor = cfg.company_primary_color || headingColor;
    const CompanyName = ({ style: s = {} }) =>
        <p style={{ fontWeight: 'bold', color: companyNameColor, fontSize: 14, ...s }}>{cfg.company_name || 'Your Business'}</p>;
    const CompanyDetails = ({ style: s = {} }) => cfg.show_company_details ? (
        <div style={{ fontSize: 8, color: labelColor, lineHeight: 1.6, ...s }}>
            {cfg.company_address && <p>{cfg.company_address}</p>}
            {cfg.company_phone && <p>Tel: {cfg.company_phone}</p>}
            {cfg.company_email && <p>{cfg.company_email}</p>}
            {cfg.company_website && <p>{cfg.company_website}</p>}
        </div>
    ) : null;
    const TaxNumber = ({ style: s = {} }) => cfg.show_tax_number && cfg.tax_number
        ? <p style={{ fontSize: 8, color: labelColor, ...s }}>{cfg.tax_label || 'TIN'}: {cfg.tax_number}</p>
        : null;
    const Dash = () => <div style={{ marginTop: 10, marginBottom: 10, borderTop: `1px dashed ${borderColor}` }} />;
    const SolidLine = ({ color }) => <div style={{ marginTop: 10, marginBottom: 10, borderTop: `1px solid ${color || borderColor}` }} />;

    const cellPad = { padding: '4px 4px' };
    const ItemsTable = ({ showCode = false, headerBg = '' }) => {
        const thBase = headerBg
            ? { background: headerBg, color: getContrastTextColor(headerBg), ...cellPad, padding: '6px 6px' }
            : { color: headingColor, borderBottom: `1px solid ${borderColor}`, ...cellPad, padding: '6px 6px' };
        return (
            <div style={{ borderRadius: 6, overflow: 'hidden' }}>
                <table style={{ width: '100%', fontSize: 8, color: textColor, fontWeight, borderCollapse: 'collapse', borderSpacing: 0 }}>
                    <thead>
                        <tr style={headerBg ? { background: headerBg, color: thBase.color } : {}}>
                            <th style={{ ...thBase, textAlign: 'left' }}>Item</th>
                            {showCode && <th style={{ ...thBase, textAlign: 'left' }}>Code</th>}
                            <th style={{ ...thBase, textAlign: 'center' }}>Qty</th>
                            <th style={{ ...thBase, textAlign: 'right' }}>Price</th>
                            <th style={{ ...thBase, textAlign: 'right' }}>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {normalizedItems.map((item, i) => (
                            <tr key={i} style={{ borderBottom: `1px dashed ${borderColor}` }}>
                                <td style={{ ...cellPad, textAlign: 'left' }}>
                                    {item.name}
                                    {item.variant && <span style={{ display: 'block', fontSize: 7, color: labelColor }}>({item.variant})</span>}
                                </td>
                                {showCode && <td style={{ ...cellPad, textAlign: 'left', color: labelColor }}>{item.code}</td>}
                                <td style={{ ...cellPad, textAlign: 'center' }}>{item.qty}</td>
                                <td style={{ ...cellPad, textAlign: 'right' }}>{fmt(item.price)}</td>
                                <td style={{ ...cellPad, textAlign: 'right', fontWeight: 500 }}>{fmt(item.total)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const rowFlex = { display: 'flex', justifyContent: 'space-between', fontSize: 8 };

    const Totals = ({ bold = false }) => (
        <div style={{ fontSize: 8, color: textColor, fontWeight }}>
            <div style={{ ...rowFlex, marginBottom: 5 }}><span style={{ color: labelColor }}>Subtotal</span><span>{fmt(subtotal)}</span></div>
            {discount > 0 && <div style={{ ...rowFlex, color: '#dc2626', marginBottom: 5, fontWeight: 600 }}><span>Discount</span><span>-{fmt(discount)}</span></div>}
            {cfg.show_tax_breakdown && <div style={{ ...rowFlex, marginBottom: 5 }}><span style={{ color: labelColor }}>{cfg.tax_label || 'VAT'} {cfg.tax_rate > 0 ? `(${cfg.tax_rate}%)` : ''}</span><span>{fmt(taxAmount)}</span></div>}
            <div style={{ ...rowFlex, paddingTop: 6, marginTop: 6, borderTop: `1px solid ${borderColor}`, fontWeight: 'bold', fontSize: bold ? 11 : 10 }}>
                <span>Total</span><span>{fmt(total)}</span>
            </div>
        </div>
    );

    const PaymentInfo = () => cfg.show_payment_details ? (
        <div style={{ fontSize: 8, color: textColor, fontWeight }}>
            <div style={{ ...rowFlex, marginBottom: 5 }}><span style={{ color: labelColor }}>Payment</span><span style={{ textTransform: 'capitalize' }}>{paymentMethod}</span></div>
            <div style={{ ...rowFlex, marginBottom: 5 }}><span style={{ color: labelColor }}>Paid</span><span style={{ color: '#16a34a', fontWeight: 600 }}>{fmt(paid)}</span></div>
            {change > 0 && <div style={{ ...rowFlex, fontWeight: 600 }}><span style={{ color: labelColor }}>Change</span><span>{fmt(change)}</span></div>}
        </div>
    ) : null;

    const ReferrerInfo = () => cfg.show_referrer_details && referrer ? (
        <div style={{ fontSize: 8, color: textColor, fontWeight }}><div style={rowFlex}><span style={{ color: labelColor }}>Referred by</span><span>{referrer}</span></div></div>
    ) : null;

    const FooterBlock = () => (
        <>
            {cfg.footer_text && <p style={{ fontSize: 8, textAlign: 'center', fontStyle: 'italic', color: labelColor, marginTop: 4 }}>{cfg.footer_text}</p>}
            {cfg.terms_and_conditions && <p style={{ fontSize: 7, textAlign: 'center', marginTop: 4, color: mutedColor }}>{cfg.terms_and_conditions}</p>}
        </>
    );

    const BarcodeBlock = () => cfg.show_barcode ? (
        <div style={{ marginTop: 10, display: 'flex', justifyContent: 'center', gap: 1 }}>{Array(25).fill(0).map((_, i) => <div key={i} style={{ background: textColor, width: i % 3 === 0 ? 2 : 1, height: 18 }} />)}</div>
    ) : null;

    const QRBlock = () => cfg.show_qr_code ? (
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center' }}>
            <QRCodeSVG
                value={`RECEIPT:${receiptNumber}`}
                size={56}
                level="M"
                bgColor="transparent"
                fgColor={textColor}
            />
        </div>
    ) : null;

    const InfoRow = ({ label, value }) => (
        <div style={{ ...rowFlex, color: textColor, fontWeight, marginBottom: 4 }}>
            <span style={{ color: labelColor }}>{label}</span>
            <span style={{ fontWeight: 500 }}>{value}</span>
        </div>
    );

    const outerStyle = { backgroundColor: bgColor, borderRadius: 14, overflow: 'hidden' };
    const outerProps = { ref, style: outerStyle, 'data-receipt-root': true };

    // Shared inline style helpers (px-based for html2canvas consistency)
    const pad16 = { padding: 20 };
    const pad12 = { padding: 16 };
    const center = { textAlign: 'center' };
    const right = { textAlign: 'right' };
    const flexCenter = { display: 'flex', justifyContent: 'center' };
    const flexBetween = { display: 'flex', justifyContent: 'space-between' };
    const flexItems = { display: 'flex', alignItems: 'center' };
    const mb8 = { marginBottom: 12 };
    const mb6 = { marginBottom: 10 };
    const mb4 = { marginBottom: 6 };
    const mb2 = { marginBottom: 4 };
    const mt8 = { marginTop: 12 };
    const mt4 = { marginTop: 6 };
    const mt6 = { marginTop: 10 };
    const mt2 = { marginTop: 4 };
    const spacer8 = { height: 12 };
    const spacer6 = { height: 10 };
    const boldLine = (c) => ({ marginTop: 12, marginBottom: 12, borderBottom: `2px solid ${c || borderStrong}` });
    const thinLine = (c) => ({ marginTop: 10, marginBottom: 10, borderBottom: `1px solid ${c || borderColor}` });
    const infoGroup = { marginBottom: 4 };
    const gridBox = (bg) => ({ borderRadius: 4, padding: 8, background: bg || 'transparent' });
    const gridBoxBorder = { borderRadius: 4, padding: 8, border: `1px solid ${borderColor}` };
    const elegantDivider = { display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, marginBottom: 12 };
    const elegantLine = { flex: 1, borderTop: `1px solid ${borderColor}` };
    const elegantDot = { width: 6, height: 6, borderRadius: '50%', background: accent };

    // ── Template 1: Standard ──
    const stdHeaderBg = isDark ? '#374151' : '#334155';
    if (tid === 1) return (
        <div {...outerProps}>
            <div style={{ ...pad16, color: textColor, fontWeight }}>
                <div style={{ ...center, ...mb8 }}>
                    <div style={{ ...flexCenter, ...mb4 }}><Logo /></div>
                    <CompanyName style={{ fontSize: 15 }} />
                    <CompanyDetails style={{ ...mt2 }} />
                    <TaxNumber style={{ ...mt2 }} />
                </div>
                <Dash />
                <div style={infoGroup}>
                    <InfoRow label="Receipt #" value={receiptNumber} />
                    <InfoRow label="Date" value={dateStr} />
                    {cfg.show_customer_details && customerName && <InfoRow label="Customer" value={`${customerName}${cashier ? `     ${cashier}` : ''}`} />}
                    {!customerName && cashier && <InfoRow label="Cashier" value={cashier} />}
                    {branchName && <InfoRow label="Branch" value={branchName} />}
                </div>
                <Dash />
                <ItemsTable headerBg={stdHeaderBg} />
                <div style={{ height: 10 }} />
                <Totals />
                <Dash />
                {cfg.show_payment_details && <><PaymentInfo /><div style={{ height: 6 }} /></>}
                {cfg.show_referrer_details && referrer && <><ReferrerInfo /><div style={{ height: 6 }} /></>}
                <Dash />
                <FooterBlock />
                <BarcodeBlock />
                <QRBlock />
                <div style={{ height: 6 }} />
            </div>
        </div>
    );

    // ── Template 2: Modern ──
    if (tid === 2) return (
        <div {...outerProps}>
            <div style={{ color: textColor, fontWeight }}>
                <div style={pad12}>
                    <div style={{ ...flexItems, gap: 8, ...mb8 }}>
                        <Logo />
                        <div>
                            <CompanyName style={{ fontSize: 14 }} />
                            <CompanyDetails style={{ fontSize: 7 }} />
                        </div>
                    </div>
                    <TaxNumber />
                </div>
                <div style={{ padding: '6px 12px', color: '#fff', fontSize: 8, ...flexBetween, background: accent }}>
                    <span style={{ fontWeight: 'bold' }}>{receiptNumber}</span>
                    <span>{dateStr}</span>
                </div>
                <div style={pad12}>
                    {cfg.show_customer_details && customerName && <div style={{ fontSize: 8, ...mb8 }}><span style={{ color: mutedSolid }}>Customer: </span><span style={{ fontWeight: 500 }}>{customerName}</span></div>}
                    <ItemsTable headerBg={accent} />
                    <div style={spacer8} />
                    <Totals bold />
                    {cfg.show_payment_details && <><SolidLine color={accent} /><PaymentInfo /></>}
                    {cfg.show_referrer_details && referrer && <><SolidLine /><ReferrerInfo /></>}
                    <div style={spacer8} />
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
            <div style={{ ...pad16, color: textColor, fontWeight }}>
                <div style={{ ...center, ...mb8 }}>
                    <div style={{ ...flexCenter, ...mb4 }}><Logo /></div>
                    <CompanyName style={{ fontSize: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }} />
                    <CompanyDetails style={mt2} />
                    <TaxNumber style={mt2} />
                </div>
                <div style={boldLine()} />
                <p style={{ ...center, fontFamily: 'monospace', fontWeight: 'bold', fontSize: 10, letterSpacing: '0.1em', ...mb4, color: accent }}>{receiptNumber}</p>
                <p style={{ ...center, fontSize: 8, ...mb6, color: mutedSolid }}>{dateStr}</p>
                <div style={infoGroup}>
                    {cfg.show_customer_details && customerName && <InfoRow label="Customer" value={customerName} />}
                    {cashier && <InfoRow label="Cashier" value={cashier} />}
                </div>
                <div style={boldLine()} />
                <ItemsTable />
                <div style={boldLine()} />
                <Totals bold />
                {cfg.show_payment_details && <><div style={thinLine()} /><PaymentInfo /></>}
                {cfg.show_referrer_details && referrer && <><div style={thinLine()} /><ReferrerInfo /></>}
                <div style={boldLine()} />
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
                <div style={{ padding: '8px 12px', fontSize: 7, textAlign: 'right', color: mutedSolid, borderBottom: `1px solid ${borderColor}` }}>{dateStr}</div>
                <div style={pad12}>
                    <div style={{ ...flexBetween, alignItems: 'flex-start', ...mb8 }}>
                        <div style={{ ...flexItems, gap: 6 }}><Logo /><CompanyName style={{ fontSize: 12 }} /></div>
                        <div style={{ ...right, fontSize: 8 }}><span style={{ fontWeight: 'bold', color: accent }}>INVOICE</span><br /><span style={{ color: mutedSolid }}>{receiptNumber}</span></div>
                    </div>
                    <CompanyDetails style={{ fontSize: 7 }} />
                    <TaxNumber style={mt2} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginTop: 8, marginBottom: 8, fontSize: 7 }}>
                        <div style={gridBox(subtleBg)}>
                            <p style={{ textTransform: 'uppercase', fontSize: 6, fontWeight: 'bold', color: mutedSolid }}>Bill To</p>
                            {cfg.show_customer_details && customerName && <p style={{ fontWeight: 500 }}>{customerName}</p>}
                        </div>
                        <div style={gridBox(subtleBg)}>
                            <p style={{ textTransform: 'uppercase', fontSize: 6, fontWeight: 'bold', color: mutedSolid }}>Date</p>
                            <p style={{ fontWeight: 500 }}>{dateStr}</p>
                        </div>
                        <div style={gridBox(subtleBg)}>
                            <p style={{ textTransform: 'uppercase', fontSize: 6, fontWeight: 'bold', color: mutedSolid }}>Cashier</p>
                            <p style={{ fontWeight: 500 }}>{cashier}</p>
                        </div>
                    </div>
                    <ItemsTable showCode headerBg={accent} />
                    <div style={spacer8} />
                    <Totals bold />
                    {cfg.show_payment_details && <><SolidLine /><PaymentInfo /></>}
                    {cfg.show_referrer_details && referrer && <><SolidLine /><ReferrerInfo /></>}
                    <div style={spacer8} />
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
                <div style={{ ...pad12, borderBottom: `2px solid ${accent}` }}>
                    <div style={{ ...flexBetween, alignItems: 'flex-start' }}>
                        <div><div style={{ ...flexItems, gap: 6 }}><Logo /><CompanyName style={{ fontSize: 12 }} /></div><CompanyDetails style={{ fontSize: 7, ...mt2 }} /></div>
                        <div style={right}><p style={{ fontSize: 10, fontWeight: 'bold', color: accent }}>RECEIPT</p><p style={{ fontSize: 7, color: mutedSolid }}>{receiptNumber}</p></div>
                    </div>
                </div>
                <div style={pad12}>
                    <TaxNumber style={mb4} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8, marginBottom: 8, fontSize: 7 }}>
                        <div>{cfg.show_customer_details && customerName && <><p style={{ textTransform: 'uppercase', fontSize: 6, fontWeight: 'bold', ...mb2, color: mutedSolid }}>Customer</p><p style={{ fontWeight: 500 }}>{customerName}</p>{customerPhone && <p style={{ color: mutedSolid }}>{customerPhone}</p>}</>}</div>
                        <div style={right}><p style={{ textTransform: 'uppercase', fontSize: 6, fontWeight: 'bold', ...mb2, color: mutedSolid }}>Details</p><p>{dateStr}</p>{cashier && <p>Cashier: {cashier}</p>}</div>
                    </div>
                    <ItemsTable showCode />
                    <div style={spacer8} />
                    <Totals bold />
                    {cfg.show_payment_details && <><SolidLine /><PaymentInfo /></>}
                    {cfg.show_referrer_details && referrer && <><SolidLine /><ReferrerInfo /></>}
                    <div style={spacer8} />
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
                <div style={{ padding: 10, margin: 8, borderRadius: 4, ...center, border: `2px solid ${borderStrong}` }}>
                    <div style={{ ...flexCenter, ...mb4 }}><Logo /></div>
                    <CompanyName style={{ fontSize: 14 }} />
                    <CompanyDetails style={mt2} />
                    <TaxNumber style={mt2} />
                </div>
                <div style={{ padding: '0 12px 12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, ...mb8 }}>
                        <div style={gridBoxBorder}>
                            <p style={{ fontSize: 6, fontWeight: 'bold', textTransform: 'uppercase', ...mb2, color: mutedSolid }}>Bill To</p>
                            {cfg.show_customer_details && customerName && <p style={{ fontSize: 8, fontWeight: 500 }}>{customerName}</p>}
                            {cfg.show_customer_details && customerPhone && <p style={{ fontSize: 7, color: mutedSolid }}>{customerPhone}</p>}
                        </div>
                        <div style={gridBoxBorder}>
                            <p style={{ fontSize: 6, fontWeight: 'bold', textTransform: 'uppercase', ...mb2, color: mutedSolid }}>Receipt Info</p>
                            <p style={{ fontSize: 8, fontWeight: 500 }}>{receiptNumber}</p>
                            <p style={{ fontSize: 7, color: mutedSolid }}>{dateStr}</p>
                            {cashier && <p style={{ fontSize: 7, color: mutedSolid }}>Cashier: {cashier}</p>}
                        </div>
                    </div>
                    <ItemsTable showCode headerBg={isDark ? '#374151' : '#212529'} />
                    <div style={{ marginTop: 8, borderRadius: 4, padding: 6, border: `1px solid ${borderColor}` }}>
                        <Totals bold />
                    </div>
                    {cfg.show_payment_details && <div style={mt6}><PaymentInfo /></div>}
                    {cfg.show_referrer_details && referrer && <div style={mt6}><ReferrerInfo /></div>}
                    <div style={spacer8} />
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
            <div style={{ ...pad16, color: textColor, fontWeight, fontFamily: 'Georgia, "Times New Roman", serif' }}>
                <div style={{ ...center, ...mb8 }}>
                    <div style={{ ...flexCenter, ...mb4 }}><Logo /></div>
                    <CompanyName style={{ fontSize: 14, letterSpacing: '0.05em' }} />
                    <CompanyDetails style={mt2} />
                    <TaxNumber style={mt2} />
                </div>
                <p style={{ ...center, fontSize: 9, fontWeight: 'bold', letterSpacing: '0.2em', textTransform: 'uppercase', ...mb4, color: accent }}>Official Receipt</p>
                <div style={elegantDivider}><div style={elegantLine} /><div style={elegantDot} /><div style={elegantLine} /></div>
                <div style={{ ...mb8 }}>
                    <InfoRow label="Receipt #" value={receiptNumber} />
                    <InfoRow label="Date" value={dateStr} />
                    {cfg.show_customer_details && customerName && <InfoRow label="Customer" value={customerName} />}
                    {cashier && <InfoRow label="Cashier" value={cashier} />}
                </div>
                <div style={elegantDivider}><div style={elegantLine} /><div style={elegantDot} /><div style={elegantLine} /></div>
                <ItemsTable />
                <div style={elegantDivider}><div style={elegantLine} /><div style={elegantDot} /><div style={elegantLine} /></div>
                <Totals bold />
                {cfg.show_payment_details && <><SolidLine /><PaymentInfo /></>}
                {cfg.show_referrer_details && referrer && <><SolidLine /><ReferrerInfo /></>}
                <div style={spacer8} />
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
                <div style={{ ...pad12, color: '#fff', background: isDark ? 'rgba(255,255,255,0.12)' : '#2c3e50' }}>
                    <div style={{ ...flexItems, gap: 8 }}>
                        <Logo />
                        <div>
                            <CompanyName style={{ fontSize: 14, color: '#fff' }} />
                            {cfg.show_company_details && <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.7)' }}>{cfg.company_address && <span>{cfg.company_address}</span>}{cfg.company_phone && <span> &bull; {cfg.company_phone}</span>}</div>}
                        </div>
                    </div>
                    <TaxNumber style={mt4} />
                </div>
                <div style={{ height: 4, background: accent }} />
                <div style={pad12}>
                    <div style={{ ...flexBetween, fontSize: 8, ...mb8 }}>
                        <div>
                            {cfg.show_customer_details && customerName && <><p style={{ fontSize: 6, textTransform: 'uppercase', fontWeight: 'bold', color: mutedSolid }}>Customer</p><p style={{ fontWeight: 500 }}>{customerName}</p></>}
                        </div>
                        <div style={right}>
                            <p style={{ fontWeight: 'bold', color: accent }}>{receiptNumber}</p>
                            <p style={{ color: mutedSolid }}>{dateStr}</p>
                            {cashier && <p style={{ color: mutedSolid }}>Cashier: {cashier}</p>}
                        </div>
                    </div>
                    <ItemsTable showCode headerBg={isDark ? 'rgba(255,255,255,0.12)' : '#2c3e50'} />
                    <div style={spacer8} />
                    <Totals bold />
                    {cfg.show_payment_details && <><SolidLine /><PaymentInfo /></>}
                    {cfg.show_referrer_details && referrer && <><SolidLine /><ReferrerInfo /></>}
                    <div style={spacer8} />
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
