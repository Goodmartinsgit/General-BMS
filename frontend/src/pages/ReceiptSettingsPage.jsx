import React, { useState, useEffect, useRef } from 'react';
import {
    Receipt, Save, RefreshCw, Eye, Building2, Phone, Mail, MapPin,
    FileText, QrCode, Barcode, Image, Hash, Layout, Settings,
    Loader2, Globe, MessageCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import { getReceiptConfig, updateReceiptConfig } from '../api/receipts';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { useCurrency } from '../context/CurrencyContext';

// ============================================================================
// TEMPLATE DEFINITIONS
// ============================================================================
const TEMPLATES = [
    { id: 1, name: 'Standard', desc: 'Classic Business', color: '#1a1a2e', accent: '#d4a574' },
    { id: 2, name: 'Modern', desc: 'Clean & Bold', color: '#0f0f23', accent: '#00d4ff' },
    { id: 3, name: 'Bold', desc: 'High Contrast', color: '#2d1b69', accent: '#ff6b6b' },
    { id: 4, name: 'Invoice Pro', desc: 'Custom Design', color: '#1b4332', accent: '#52b788' },
    { id: 5, name: 'Invoice Classic', desc: 'Professional', color: '#3d405b', accent: '#e07a5f' },
    { id: 6, name: 'Detailed', desc: 'Boxed Grid', color: '#212529', accent: '#ffd166' },
    { id: 7, name: 'Elegant', desc: 'Serif Luxury', color: '#2b2d42', accent: '#ef233c' },
    { id: 8, name: 'Corporate', desc: 'Formal Blue', color: '#003049', accent: '#fcbf49' },
];

const PAPER_SIZES = ['A4', 'A5', 'A6', '80mm'];
const DELIVERY_FORMATS = [
    { val: 'auto', label: 'Auto', icon: Settings },
    { val: 'pdf', label: 'PDF', icon: FileText },
    { val: 'image', label: 'Image', icon: Image },
];

// ============================================================================
// MINI TEMPLATE PREVIEW
// ============================================================================
const MiniTemplatePreview = ({ template, isSelected }) => {
    return (
        <div
            className="rounded-lg overflow-hidden border"
            style={{
                borderColor: isSelected ? template.accent : 'transparent',
                background: `linear-gradient(135deg, ${template.color} 0%, ${template.color}dd 100%)`
            }}
        >
            <div className="p-2 h-[72px] flex flex-col justify-between">
                {/* Mini header */}
                <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-sm" style={{ background: template.accent, opacity: 0.9 }} />
                    <div className="flex-1 space-y-0.5">
                        <div className="h-1 rounded-full w-3/4" style={{ background: template.accent, opacity: 0.7 }} />
                        <div className="h-0.5 rounded-full w-1/2 bg-white/20" />
                    </div>
                </div>
                {/* Mini lines */}
                <div className="space-y-[3px]">
                    <div className="flex justify-between">
                        <div className="h-0.5 rounded-full w-2/3 bg-white/15" />
                        <div className="h-0.5 rounded-full w-1/4 bg-white/15" />
                    </div>
                    <div className="flex justify-between">
                        <div className="h-0.5 rounded-full w-1/2 bg-white/15" />
                        <div className="h-0.5 rounded-full w-1/5 bg-white/15" />
                    </div>
                    <div className="flex justify-between">
                        <div className="h-0.5 rounded-full w-3/5 bg-white/15" />
                        <div className="h-0.5 rounded-full w-1/4 bg-white/15" />
                    </div>
                </div>
                {/* Mini total */}
                <div className="flex justify-between items-center pt-0.5 border-t border-white/10">
                    <div className="h-1 rounded-full w-1/4 bg-white/25" />
                    <div className="h-1.5 rounded-full w-1/3" style={{ background: template.accent, opacity: 0.8 }} />
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// RECEIPT SETTINGS PAGE
// ============================================================================
const ReceiptSettingsPage = () => {
    const { symbol } = useCurrency();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [expandedSections, setExpandedSections] = useState({
        email: false,
        whatsapp: false
    });

    const [config, setConfig] = useState({
        company_name: '',
        company_address: '',
        company_phone: '',
        company_email: '',
        company_website: '',
        company_logo_url: '',
        tax_number: '',
        tax_rate: 0,
        tax_label: 'VAT',
        template_id: 1,
        template_style: 'modern',
        show_logo: true,
        show_tax_number: true,
        show_company_details: true,
        show_tax_breakdown: false,
        show_payment_details: true,
        show_customer_details: true,
        show_referrer_details: true,
        show_barcode: true,
        show_qr_code: false,
        footer_text: 'Thank you for your business!',
        terms_and_conditions: '',
        currency_symbol: '₦',
        currency_code: 'NGN',
        paper_size: 'A5',
        delivery_format: 'auto',
        email_enabled: false,
        email_subject_template: '',
        email_body_template: '',
        whatsapp_enabled: false,
        whatsapp_message_template: `Hello {customer_name},

Thank you for your purchase at {company_name}!

📄 Receipt Number: {receipt_number}
💰 Total Amount: ₦{total_amount}

For any inquiries, please contact us.

Thank you for your business!

- {company_name} Team`,
    });

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const response = await getReceiptConfig();
            const data = response.data;
            setConfig(prev => ({ ...prev, ...data }));
        } catch (error) {
            console.error('Error fetching receipt settings:', error);
            toast.error('Failed to load receipt settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateReceiptConfig(config);
            toast.success('Receipt settings saved successfully');
        } catch (error) {
            console.error('Error saving receipt settings:', error);
            toast.error('Failed to save receipt settings');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field, value) => {
        setConfig(prev => ({ ...prev, [field]: value }));
    };

    const toggleSection = (section) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const inputClass = "w-full px-3 py-2.5 bg-theme-primary border border-theme rounded-lg text-sm text-theme-primary placeholder-theme-muted focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all";

    const actions = (
        <div className="flex items-center gap-3">
            <button
                onClick={fetchConfig}
                className="bg-theme-secondary border border-theme text-theme-secondary px-4 py-2 rounded-lg font-medium text-sm hover:bg-theme-tertiary transition flex items-center gap-2"
            >
                <RefreshCw size={16} /> Reset
            </button>
            <button
                onClick={handleSave}
                disabled={saving}
                className="bg-accent-gold text-white px-5 py-2 rounded-lg font-semibold text-sm hover:bg-accent-goldDark transition flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-accent-gold/20"
            >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? 'Saving...' : 'Save Changes'}
            </button>
        </div>
    );

    // Loading skeleton
    if (loading) {
        return (
            <div className="space-y-6 max-w-[1700px] mx-auto pb-10">
                <PageHeader title="Receipt Settings" subtitle="Configure your receipt template and company details" icon={Receipt} actions={actions} />
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Template skeleton */}
                    <div className="lg:col-span-7 bg-theme-secondary p-6 rounded-xl border border-theme shadow-theme-sm animate-pulse">
                        <div className="h-5 w-40 bg-theme-tertiary rounded mb-6" />
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                            {Array(8).fill(0).map((_, i) => (
                                <div key={i} className="h-28 bg-theme-tertiary rounded-xl" />
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="h-12 bg-theme-tertiary rounded-lg" />
                            <div className="h-12 bg-theme-tertiary rounded-lg" />
                        </div>
                    </div>
                    {/* Preview skeleton */}
                    <div className="lg:col-span-5 bg-theme-secondary p-6 rounded-xl border border-theme shadow-theme-sm animate-pulse">
                        <div className="h-5 w-24 bg-theme-tertiary rounded mb-6" />
                        <div className="h-[400px] bg-theme-tertiary rounded-lg" />
                    </div>
                </div>
            </div>
        );
    }

    const selectedTemplate = TEMPLATES.find(t => t.id === (config.template_id || 1)) || TEMPLATES[0];

    return (
        <div className="space-y-6 max-w-[1700px] mx-auto pb-10">
            <PageHeader
                title="Receipt Settings"
                subtitle="Configure your receipt template, company details, and delivery preferences"
                icon={Receipt}
                actions={actions}
            />

            {/* ================================================================
                ROW 1: TEMPLATE DESIGN + LIVE PREVIEW
            ================================================================ */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Template Selection */}
                <div className="lg:col-span-7">
                    <div className="bg-theme-secondary rounded-xl border border-theme shadow-theme-sm p-6 h-full">
                        <h3 className="text-lg font-semibold text-theme-primary mb-5 flex items-center gap-2">
                            <Layout size={18} className="text-accent-gold" />
                            Template Design
                        </h3>

                        {/* Template Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                            {TEMPLATES.map((template) => {
                                const isSelected = (config.template_id || 1) === template.id;
                                return (
                                    <label
                                        key={template.id}
                                        className={`relative flex flex-col p-2.5 border-2 rounded-xl cursor-pointer transition-all hover:shadow-lg group ${
                                            isSelected
                                                ? 'border-accent-gold bg-accent-gold/5 ring-1 ring-accent-gold/20 shadow-md'
                                                : 'border-theme hover:border-accent-gold/40 bg-theme-primary'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="template_id"
                                            value={template.id}
                                            checked={isSelected}
                                            onChange={() => handleChange('template_id', template.id)}
                                            className="sr-only"
                                        />
                                        <MiniTemplatePreview template={template} isSelected={isSelected} />
                                        <div className="mt-2">
                                            <span className="font-semibold text-xs text-theme-primary block">{template.name}</span>
                                            <span className="text-[10px] text-theme-muted">{template.desc}</span>
                                        </div>
                                        {isSelected && (
                                            <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-accent-gold rounded-full flex items-center justify-center shadow-sm">
                                                <span className="text-white text-[10px] font-bold">✓</span>
                                            </div>
                                        )}
                                    </label>
                                );
                            })}
                        </div>

                        {/* Paper Size & Delivery Format */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-2">Paper Size</label>
                                <div className="flex bg-theme-primary p-1 rounded-lg border border-theme">
                                    {PAPER_SIZES.map((size) => (
                                        <button
                                            key={size}
                                            type="button"
                                            onClick={() => handleChange('paper_size', size)}
                                            className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
                                                config.paper_size === size
                                                    ? 'bg-accent-gold text-white shadow-sm'
                                                    : 'text-theme-muted hover:text-theme-primary'
                                            }`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-2">Default Delivery Format</label>
                                <div className="flex bg-theme-primary p-1 rounded-lg border border-theme">
                                    {DELIVERY_FORMATS.map((fmt) => (
                                        <button
                                            key={fmt.val}
                                            type="button"
                                            onClick={() => handleChange('delivery_format', fmt.val)}
                                            className={`flex-1 py-2 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1 ${
                                                (config.delivery_format || 'auto') === fmt.val
                                                    ? 'bg-accent-gold text-white shadow-sm'
                                                    : 'text-theme-muted hover:text-theme-primary'
                                            }`}
                                            title={fmt.val === 'auto' ? 'Best fit for device' : fmt.label}
                                        >
                                            <fmt.icon className="w-3 h-3" />
                                            {fmt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Live Preview Panel */}
                <div className="lg:col-span-5">
                    <div className="bg-theme-secondary rounded-xl border border-theme shadow-theme-sm overflow-hidden h-full flex flex-col">
                        <div className="px-5 py-3 flex items-center justify-between border-b border-theme"
                             style={{ background: `linear-gradient(135deg, ${selectedTemplate.color} 0%, ${selectedTemplate.color}ee 100%)` }}>
                            <h3 className="font-semibold text-white flex items-center gap-2 text-sm">
                                <Eye className="w-4 h-4" style={{ color: selectedTemplate.accent }} />
                                Live Preview
                            </h3>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                                {selectedTemplate.name} • {config.paper_size}
                            </span>
                        </div>

                        {/* Preview body */}
                        <div className="flex-1 p-4 bg-theme-primary overflow-auto">
                            {(() => {
                                const bgColor = config.receipt_bg_color || '#ffffff';
                                const textColor = config.receipt_text_color || '#111827';
                                const accentColor = config.receipt_accent_color || '';
                                const headingColor = config.receipt_heading_color || textColor;
                                const labelColor = config.receipt_label_color || '#6b7280';
                                const fontWeight = config.receipt_font_weight || 'normal';
                                const dividerColor = accentColor || '#d1d5db';
                                const cs = config.currency_symbol || symbol;

                                const PvDivider = () => <div className="my-2" style={{ borderTop: `1px dashed ${dividerColor}` }} />;
                                const PvRow = ({ label, value, vColor }) => (
                                    <div className="flex justify-between">
                                        <span style={{ color: labelColor }}>{label}</span>
                                        <span className="font-medium" style={{ color: vColor || textColor }}>{value}</span>
                                    </div>
                                );

                                return (
                                <div className="rounded-lg border shadow-lg p-5 max-w-xs mx-auto" style={{ backgroundColor: bgColor, borderColor: dividerColor, color: textColor, fontWeight }}>
                                {/* Company header */}
                                {config.show_logo && config.company_logo_url && (
                                    <img src={config.company_logo_url} alt="Logo" className="w-14 h-14 mx-auto mb-2 object-contain rounded-lg" />
                                )}
                                {config.show_company_details && (
                                    <div className="text-center mb-3">
                                        <p className="font-bold text-base" style={{ color: config.company_primary_color || headingColor }}>{config.company_name || 'Your Business'}</p>
                                        {config.company_address && <p className="text-[10px] mt-0.5" style={{ color: labelColor }}>{config.company_address}</p>}
                                        {config.company_phone && <p className="text-[10px]" style={{ color: labelColor }}>{config.company_phone}</p>}
                                        {config.company_email && <p className="text-[10px]" style={{ color: labelColor }}>{config.company_email}</p>}
                                        {config.company_website && <p className="text-[10px]" style={{ color: labelColor }}>{config.company_website}</p>}
                                    </div>
                                )}
                                {config.show_tax_number && config.tax_number && (
                                    <p className="text-[10px] text-center mb-2" style={{ color: labelColor }}>TIN: {config.tax_number}</p>
                                )}

                                <PvDivider />

                                {/* Receipt info */}
                                <div className="text-[10px] space-y-0.5 mb-2">
                                    <PvRow label="Receipt #" value="INV-0001" />
                                    <PvRow label="Date" value={new Date().toLocaleDateString()} />
                                    {config.show_customer_details && <PvRow label="Customer" value="John Doe" />}
                                    <PvRow label="Cashier" value="Staff User" />
                                </div>

                                <PvDivider />

                                {/* Items */}
                                <div className="text-[10px] mb-2">
                                    {/* Table header */}
                                    <div className="flex justify-between px-1.5 py-1 rounded-sm mb-1" style={{ background: '#334155', color: '#ffffff' }}>
                                        <span className="font-semibold flex-1">Item</span>
                                        <span className="font-semibold w-8 text-center">Qty</span>
                                        <span className="font-semibold w-14 text-right">Price</span>
                                        <span className="font-semibold w-14 text-right">Total</span>
                                    </div>
                                    {/* Item rows */}
                                    <div className="space-y-1 px-0.5">
                                        <div className="flex justify-between items-baseline pb-1" style={{ borderBottom: `1px dashed ${dividerColor}` }}>
                                            <span className="font-medium flex-1" style={{ color: textColor }}>Sample Product</span>
                                            <span className="w-8 text-center" style={{ color: textColor }}>2</span>
                                            <span className="w-14 text-right" style={{ color: textColor }}>{cs}2,500</span>
                                            <span className="w-14 text-right font-semibold" style={{ color: headingColor }}>{cs}5,000</span>
                                        </div>
                                        <div className="flex justify-between items-baseline pb-1" style={{ borderBottom: `1px dashed ${dividerColor}` }}>
                                            <span className="font-medium flex-1" style={{ color: textColor }}>Another Item</span>
                                            <span className="w-8 text-center" style={{ color: textColor }}>1</span>
                                            <span className="w-14 text-right" style={{ color: textColor }}>{cs}2,500</span>
                                            <span className="w-14 text-right font-semibold" style={{ color: headingColor }}>{cs}2,500</span>
                                        </div>
                                    </div>
                                </div>

                                <PvDivider />

                                {/* Totals */}
                                <div className="text-[10px] space-y-0.5">
                                    <PvRow label="Subtotal" value={`${cs}7,500`} />
                                    <div className="flex justify-between" style={{ color: '#ef4444' }}><span>Discount</span><span>-{cs}500</span></div>
                                    {config.show_tax_breakdown && <PvRow label={config.tax_label || 'VAT'} value={`${cs}0`} />}
                                    <div className="flex justify-between font-bold text-xs pt-1 mt-1" style={{ borderTop: `1px solid ${dividerColor}`, color: headingColor }}>
                                        <span>Total</span><span>{cs}7,000</span>
                                    </div>
                                </div>

                                {/* Payment details */}
                                {config.show_payment_details && (
                                    <>
                                        <PvDivider />
                                        <div className="text-[10px] space-y-0.5">
                                            <PvRow label="Payment" value="Cash" />
                                            <PvRow label="Paid" value={`${cs}10,000`} />
                                            <div className="flex justify-between font-semibold" style={{ color: '#16a34a' }}><span>Change</span><span>{cs}3,000</span></div>
                                        </div>
                                    </>
                                )}

                                {/* Referrer */}
                                {config.show_referrer_details && (
                                    <>
                                        <PvDivider />
                                        <div className="text-[10px]">
                                            <PvRow label="Referred by" value="Jane Smith" />
                                        </div>
                                    </>
                                )}

                                <PvDivider />

                                {/* Footer */}
                                {config.footer_text && (
                                    <p className="text-[10px] text-center italic" style={{ color: labelColor }}>{config.footer_text}</p>
                                )}

                                {config.show_barcode && (
                                    <div className="mt-2 flex justify-center">
                                        <div className="flex gap-px">
                                            {Array(30).fill(0).map((_, i) => (
                                                <div key={i} style={{ backgroundColor: textColor, width: i % 3 === 0 ? 2 : 1, height: 24 }} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {config.show_qr_code && (
                                    <div className="mt-2 flex justify-center">
                                        <div className="w-14 h-14 rounded flex items-center justify-center" style={{ backgroundColor: `${labelColor}20`, border: `1px solid ${dividerColor}` }}>
                                            <QrCode size={28} style={{ color: labelColor }} />
                                        </div>
                                    </div>
                                )}
                                </div>
                                );
                            })()}
                        </div>

                        <div className="px-4 py-2 border-t border-theme text-[10px] text-center text-theme-muted bg-theme-secondary">
                            Preview updates as you change settings
                        </div>
                    </div>
                </div>
            </div>

            {/* ================================================================
                ROW 2: COMPANY INFO + CONTENT & DISPLAY OPTIONS
            ================================================================ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Company Information */}
                <div className="bg-theme-secondary rounded-xl border border-theme shadow-theme-sm p-6">
                    <h3 className="text-lg font-semibold text-theme-primary mb-5 flex items-center gap-2">
                        <Building2 size={18} className="text-accent-gold" />
                        Company Information
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">Company Name</label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted w-4 h-4 pointer-events-none" />
                                <input type="text" value={config.company_name} onChange={(e) => handleChange('company_name', e.target.value)} className={`${inputClass} pl-10`} placeholder="Your Business Name" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">Address</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 text-theme-muted w-4 h-4 pointer-events-none" />
                                <textarea value={config.company_address} onChange={(e) => handleChange('company_address', e.target.value)} className={`${inputClass} pl-10 resize-none`} rows={2} placeholder="Business address" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">Phone</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted w-4 h-4 pointer-events-none" />
                                    <input type="text" value={config.company_phone} onChange={(e) => handleChange('company_phone', e.target.value)} className={`${inputClass} pl-10`} placeholder="+234 800 000 0000" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted w-4 h-4 pointer-events-none" />
                                    <input type="email" value={config.company_email} onChange={(e) => handleChange('company_email', e.target.value)} className={`${inputClass} pl-10`} placeholder="info@company.com" />
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">Website</label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted w-4 h-4 pointer-events-none" />
                                    <input type="text" value={config.company_website || ''} onChange={(e) => handleChange('company_website', e.target.value)} className={`${inputClass} pl-10`} placeholder="www.company.com" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">Tax / TIN Number</label>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted w-4 h-4 pointer-events-none" />
                                    <input type="text" value={config.tax_number || ''} onChange={(e) => handleChange('tax_number', e.target.value)} className={`${inputClass} pl-10`} placeholder="Tax ID" />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">Logo URL</label>
                            <div className="relative">
                                <Image className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted w-4 h-4 pointer-events-none" />
                                <input type="text" value={config.company_logo_url || ''} onChange={(e) => handleChange('company_logo_url', e.target.value)} className={`${inputClass} pl-10`} placeholder="https://example.com/logo.png" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content & Display Options */}
                <div className="space-y-6">
                    {/* Display Toggles */}
                    <div className="bg-theme-secondary rounded-xl border border-theme shadow-theme-sm p-6">
                        <h3 className="text-lg font-semibold text-theme-primary mb-5 flex items-center gap-2">
                            <Eye size={18} className="text-accent-gold" />
                            Display Options
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {[
                                { field: 'show_logo', label: 'Show Company Logo', icon: Image },
                                { field: 'show_company_details', label: 'Show Company Details', icon: Building2 },
                                { field: 'show_tax_number', label: 'Show Tax Number', icon: Hash },
                                { field: 'show_tax_breakdown', label: 'Show Tax Breakdown', icon: Receipt },
                                { field: 'show_payment_details', label: 'Show Payment Details', icon: FileText },
                                { field: 'show_customer_details', label: 'Show Customer Details', icon: Building2 },
                                { field: 'show_referrer_details', label: 'Show Referrer Details', icon: Building2 },
                                { field: 'show_barcode', label: 'Show Barcode', icon: Barcode },
                                { field: 'show_qr_code', label: 'Show QR Code', icon: QrCode },
                            ].map(({ field, label, icon: Icon }) => (
                                <label key={field} className="flex items-center justify-between p-2.5 bg-theme-primary rounded-lg border border-theme cursor-pointer hover:border-accent-gold/30 transition-colors">
                                    <div className="flex items-center gap-2.5">
                                        <Icon size={14} className="text-theme-muted" />
                                        <span className="text-xs font-medium text-theme-secondary">{label}</span>
                                    </div>
                                    <div className="relative">
                                        <input type="checkbox" checked={config[field]} onChange={(e) => handleChange(field, e.target.checked)} className="sr-only peer" />
                                        <div className="w-9 h-5 bg-theme-tertiary rounded-full peer-checked:bg-accent-gold transition-colors" />
                                        <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-4" />
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Footer & Terms */}
                    <div className="bg-theme-secondary rounded-xl border border-theme shadow-theme-sm p-6">
                        <h3 className="text-lg font-semibold text-theme-primary mb-5 flex items-center gap-2">
                            <FileText size={18} className="text-accent-gold" />
                            Footer & Terms
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">Footer Text</label>
                                <textarea value={config.footer_text} onChange={(e) => handleChange('footer_text', e.target.value)} className={`${inputClass} resize-none`} rows={2} placeholder="Thank you for your business!" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">Terms & Conditions</label>
                                <textarea value={config.terms_and_conditions} onChange={(e) => handleChange('terms_and_conditions', e.target.value)} className={`${inputClass} resize-none`} rows={3} placeholder="Return policy, warranty info, etc." />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ================================================================
                ROW 3: EMAIL + WHATSAPP + CURRENCY
            ================================================================ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Currency Settings */}
                <div className="bg-theme-secondary rounded-xl border border-theme shadow-theme-sm p-6">
                    <h3 className="text-lg font-semibold text-theme-primary mb-5 flex items-center gap-2">
                        <Hash size={18} className="text-accent-gold" />
                        Currency & Tax
                    </h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">Currency Symbol</label>
                                <input type="text" value={config.currency_symbol || ''} onChange={(e) => handleChange('currency_symbol', e.target.value)} className={inputClass} placeholder="₦" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">Currency Code</label>
                                <input type="text" value={config.currency_code || ''} onChange={(e) => handleChange('currency_code', e.target.value)} className={inputClass} placeholder="NGN" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">Tax Rate (%)</label>
                                <input type="number" value={config.tax_rate || 0} onChange={(e) => handleChange('tax_rate', parseFloat(e.target.value) || 0)} className={inputClass} placeholder="0" min="0" max="100" step="0.5" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">Tax Label</label>
                                <input type="text" value={config.tax_label || ''} onChange={(e) => handleChange('tax_label', e.target.value)} className={inputClass} placeholder="VAT" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Email Settings */}
                <div className="bg-theme-secondary rounded-xl border border-theme shadow-theme-sm p-6">
                    <button
                        onClick={() => toggleSection('email')}
                        className="flex items-center justify-between w-full mb-4"
                    >
                        <h3 className="text-lg font-semibold text-theme-primary flex items-center gap-2">
                            <Mail size={18} className="text-accent-gold" />
                            Email Settings
                        </h3>
                        <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                                <div className="relative">
                                    <input type="checkbox" checked={config.email_enabled} onChange={(e) => handleChange('email_enabled', e.target.checked)} className="sr-only peer" />
                                    <div className="w-9 h-5 bg-theme-tertiary rounded-full peer-checked:bg-accent-gold transition-colors" />
                                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-4" />
                                </div>
                            </label>
                            {expandedSections.email ? <ChevronUp size={16} className="text-theme-muted" /> : <ChevronDown size={16} className="text-theme-muted" />}
                        </div>
                    </button>

                    {expandedSections.email && config.email_enabled && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div>
                                <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">Subject Template</label>
                                <input type="text" value={config.email_subject_template || ''} onChange={(e) => handleChange('email_subject_template', e.target.value)} className={inputClass} placeholder="Receipt #{receipt_number} - {company_name}" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">Body Template</label>
                                <textarea value={config.email_body_template || ''} onChange={(e) => handleChange('email_body_template', e.target.value)} className={`${inputClass} resize-none`} rows={4} />
                                <p className="text-[10px] text-theme-muted mt-1">
                                    Placeholders: {'{receipt_number}'}, {'{customer_name}'}, {'{company_name}'}, {'{total_amount}'}
                                </p>
                            </div>
                        </div>
                    )}
                    {!expandedSections.email && (
                        <p className="text-xs text-theme-muted">
                            {config.email_enabled ? 'Email receipts enabled — click to expand' : 'Email receipts disabled'}
                        </p>
                    )}
                </div>

                {/* WhatsApp Template */}
                <div className="bg-theme-secondary rounded-xl border border-theme shadow-theme-sm p-6">
                    <button
                        onClick={() => toggleSection('whatsapp')}
                        className="flex items-center justify-between w-full mb-4"
                    >
                        <h3 className="text-lg font-semibold text-theme-primary flex items-center gap-2">
                            <svg className="w-[18px] h-[18px] text-green-500" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2.546 20.2a1 1 0 001.254 1.254l3.032-.892A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 2a8 8 0 110 16 8 8 0 010-16z" />
                            </svg>
                            WhatsApp Template
                        </h3>
                        {expandedSections.whatsapp ? <ChevronUp size={16} className="text-theme-muted" /> : <ChevronDown size={16} className="text-theme-muted" />}
                    </button>

                    {expandedSections.whatsapp ? (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div>
                                <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">Message Template</label>
                                <textarea
                                    value={config.whatsapp_message_template || ''}
                                    onChange={(e) => handleChange('whatsapp_message_template', e.target.value)}
                                    rows={8}
                                    className={`${inputClass} resize-none font-mono text-xs`}
                                    placeholder="Enter your WhatsApp message template..."
                                />
                                <p className="text-[10px] text-theme-muted mt-1">
                                    Placeholders: <code className="bg-theme-tertiary px-1 rounded">{'{customer_name}'}</code>, <code className="bg-theme-tertiary px-1 rounded">{'{receipt_number}'}</code>, <code className="bg-theme-tertiary px-1 rounded">{'{total_amount}'}</code>, <code className="bg-theme-tertiary px-1 rounded">{'{company_name}'}</code>
                                </p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs text-theme-muted">Customize WhatsApp message sent with receipts — click to expand</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReceiptSettingsPage;
