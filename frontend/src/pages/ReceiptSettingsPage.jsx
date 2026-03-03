import React, { useState, useEffect } from 'react';
import {
    Receipt,
    Save,
    RefreshCw,
    Eye,
    Building2,
    Phone,
    Mail,
    MapPin,
    FileText,
    QrCode,
    Barcode,
    Image,
    Hash,
    Layout
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { useCurrency } from '../context/CurrencyContext';

const ReceiptSettingsPage = () => {
    const { symbol } = useCurrency();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [config, setConfig] = useState({
        company_name: '',
        company_address: '',
        company_phone: '',
        company_email: '',
        company_logo_url: '',
        show_logo: true,
        show_tax_number: true,
        tax_number: '',
        footer_text: 'Thank you for your business!',
        terms_and_conditions: '',
        template_style: 'modern',
        show_barcode: true,
        show_qr_code: false
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [configRes, templatesRes] = await Promise.all([
                api.get('/settings/receipt-template').catch(() => ({ data: config })),
                api.get('/receipts/templates').catch(() => ({ data: [] }))
            ]);
            setConfig(prev => ({ ...prev, ...configRes.data }));
            setTemplates(templatesRes.data || []);
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
            await api.put('/settings/receipt-template', config);
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

    const inputClass = "w-full px-3 py-2.5 bg-theme-primary border border-theme rounded-lg text-sm text-theme-primary placeholder-theme-muted focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all";

    const actions = (
        <div className="flex items-center gap-3">
            <button
                onClick={fetchData}
                className="bg-theme-secondary border border-theme text-theme-secondary px-4 py-2 rounded-lg font-medium text-sm hover:bg-theme-tertiary transition flex items-center gap-2"
            >
                <RefreshCw size={16} /> Reset
            </button>
            <button
                onClick={handleSave}
                disabled={saving}
                className="bg-accent-gold text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-accent-goldDark transition flex items-center gap-2 disabled:opacity-50"
            >
                <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
        </div>
    );

    if (loading) {
        return (
            <div className="space-y-6 max-w-[1700px] mx-auto pb-10">
                <PageHeader
                    title="Receipt Settings"
                    subtitle="Configure your receipt template and company details"
                    icon={Receipt}
                    actions={actions}
                />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {Array(3).fill(0).map((_, i) => (
                        <div key={i} className={`bg-theme-secondary p-6 rounded-lg border border-theme shadow-theme-sm animate-pulse ${i === 2 ? '' : ''}`}>
                            <div className="h-5 w-40 bg-theme-tertiary rounded mb-6"></div>
                            <div className="space-y-4">
                                {Array(4).fill(0).map((_, j) => (
                                    <div key={j}>
                                        <div className="h-3 w-24 bg-theme-tertiary rounded mb-2"></div>
                                        <div className="h-10 bg-theme-tertiary rounded-lg"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-[1700px] mx-auto pb-10">
            <PageHeader
                title="Receipt Settings"
                subtitle="Configure your receipt template and company details"
                icon={Receipt}
                actions={actions}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Company Information */}
                <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm p-6">
                    <h3 className="text-lg font-semibold text-theme-primary mb-5 flex items-center gap-2">
                        <Building2 size={18} className="text-accent-gold" />
                        Company Information
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">Company Name</label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted w-4 h-4 pointer-events-none" />
                                <input
                                    type="text"
                                    value={config.company_name}
                                    onChange={(e) => handleChange('company_name', e.target.value)}
                                    className={`${inputClass} pl-10`}
                                    placeholder="Your Business Name"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">Address</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 text-theme-muted w-4 h-4 pointer-events-none" />
                                <textarea
                                    value={config.company_address}
                                    onChange={(e) => handleChange('company_address', e.target.value)}
                                    className={`${inputClass} pl-10 resize-none`}
                                    rows={2}
                                    placeholder="Business address"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">Phone</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted w-4 h-4 pointer-events-none" />
                                <input
                                    type="text"
                                    value={config.company_phone}
                                    onChange={(e) => handleChange('company_phone', e.target.value)}
                                    className={`${inputClass} pl-10`}
                                    placeholder="+234 800 000 0000"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted w-4 h-4 pointer-events-none" />
                                <input
                                    type="email"
                                    value={config.company_email}
                                    onChange={(e) => handleChange('company_email', e.target.value)}
                                    className={`${inputClass} pl-10`}
                                    placeholder="info@yourbusiness.com"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">Tax / TIN Number</label>
                            <div className="relative">
                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted w-4 h-4 pointer-events-none" />
                                <input
                                    type="text"
                                    value={config.tax_number}
                                    onChange={(e) => handleChange('tax_number', e.target.value)}
                                    className={`${inputClass} pl-10`}
                                    placeholder="Tax identification number"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">Logo URL</label>
                            <div className="relative">
                                <Image className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted w-4 h-4 pointer-events-none" />
                                <input
                                    type="text"
                                    value={config.company_logo_url || ''}
                                    onChange={(e) => handleChange('company_logo_url', e.target.value)}
                                    className={`${inputClass} pl-10`}
                                    placeholder="https://example.com/logo.png"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Receipt Content */}
                <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm p-6">
                    <h3 className="text-lg font-semibold text-theme-primary mb-5 flex items-center gap-2">
                        <FileText size={18} className="text-accent-gold" />
                        Receipt Content
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">Footer Text</label>
                            <textarea
                                value={config.footer_text}
                                onChange={(e) => handleChange('footer_text', e.target.value)}
                                className={`${inputClass} resize-none`}
                                rows={2}
                                placeholder="Thank you for your business!"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">Terms & Conditions</label>
                            <textarea
                                value={config.terms_and_conditions}
                                onChange={(e) => handleChange('terms_and_conditions', e.target.value)}
                                className={`${inputClass} resize-none`}
                                rows={3}
                                placeholder="Return policy, warranty info, etc."
                            />
                        </div>

                        {/* Toggle Options */}
                        <div className="pt-2 space-y-3">
                            <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider">Display Options</label>

                            {[
                                { field: 'show_logo', label: 'Show Company Logo', icon: Image },
                                { field: 'show_tax_number', label: 'Show Tax Number', icon: Hash },
                                { field: 'show_barcode', label: 'Show Barcode', icon: Barcode },
                                { field: 'show_qr_code', label: 'Show QR Code', icon: QrCode },
                            ].map(({ field, label, icon: Icon }) => (
                                <label key={field} className="flex items-center justify-between p-3 bg-theme-primary rounded-lg border border-theme cursor-pointer hover:border-accent-gold/30 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <Icon size={16} className="text-theme-muted" />
                                        <span className="text-sm font-medium text-theme-secondary">{label}</span>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={config[field]}
                                            onChange={(e) => handleChange(field, e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-10 h-5 bg-theme-tertiary rounded-full peer-checked:bg-accent-gold transition-colors"></div>
                                        <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-5"></div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Template Selection + Preview */}
                <div className="space-y-6">
                    {/* Template Selection */}
                    <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm p-6">
                        <h3 className="text-lg font-semibold text-theme-primary mb-5 flex items-center gap-2">
                            <Layout size={18} className="text-accent-gold" />
                            Template Style
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            {(templates.length > 0 ? templates : [
                                { id: 'modern', name: 'Modern', description: 'Clean and bold' },
                                { id: 'classic', name: 'Classic', description: 'Traditional layout' },
                                { id: 'minimal', name: 'Minimal', description: 'Essential info only' },
                                { id: 'detailed', name: 'Detailed', description: 'All details included' }
                            ]).map((template) => (
                                <button
                                    key={template.id}
                                    onClick={() => handleChange('template_style', template.id)}
                                    className={`p-3 rounded-lg border text-left transition-all ${
                                        config.template_style === template.id
                                            ? 'border-accent-gold bg-accent-gold/10 ring-2 ring-accent-gold/20'
                                            : 'border-theme bg-theme-primary hover:border-accent-gold/30'
                                    }`}
                                >
                                    <p className={`text-sm font-semibold ${
                                        config.template_style === template.id ? 'text-accent-gold' : 'text-theme-primary'
                                    }`}>
                                        {template.name}
                                    </p>
                                    <p className="text-xs text-theme-muted mt-0.5">{template.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Receipt Preview */}
                    <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm p-6">
                        <h3 className="text-lg font-semibold text-theme-primary mb-5 flex items-center gap-2">
                            <Eye size={18} className="text-accent-gold" />
                            Preview
                        </h3>
                        <div className="bg-white rounded-lg border border-gray-200 p-6 text-gray-900 max-w-xs mx-auto text-center">
                            {config.show_logo && config.company_logo_url && (
                                <img src={config.company_logo_url} alt="Logo" className="w-16 h-16 mx-auto mb-2 object-contain" />
                            )}
                            <p className="font-bold text-lg">{config.company_name || 'Your Business'}</p>
                            {config.company_address && <p className="text-xs text-gray-500 mt-1">{config.company_address}</p>}
                            {config.company_phone && <p className="text-xs text-gray-500">{config.company_phone}</p>}
                            {config.company_email && <p className="text-xs text-gray-500">{config.company_email}</p>}
                            {config.show_tax_number && config.tax_number && (
                                <p className="text-xs text-gray-500 mt-1">TIN: {config.tax_number}</p>
                            )}

                            <div className="border-t border-dashed border-gray-300 my-3"></div>

                            <div className="text-left text-xs space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Receipt #</span>
                                    <span className="font-medium">INV-0001</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Date</span>
                                    <span className="font-medium">{new Date().toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Cashier</span>
                                    <span className="font-medium">John Doe</span>
                                </div>
                            </div>

                            <div className="border-t border-dashed border-gray-300 my-3"></div>

                            <div className="text-left text-xs space-y-1.5">
                                <div className="flex justify-between">
                                    <span>Sample Product x2</span>
                                    <span className="font-medium">{symbol}5,000</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Another Item x1</span>
                                    <span className="font-medium">{symbol}2,500</span>
                                </div>
                            </div>

                            <div className="border-t border-dashed border-gray-300 my-3"></div>

                            <div className="text-left text-xs space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Subtotal</span>
                                    <span>{symbol}7,500</span>
                                </div>
                                <div className="flex justify-between font-bold text-sm">
                                    <span>Total</span>
                                    <span>{symbol}7,500</span>
                                </div>
                            </div>

                            <div className="border-t border-dashed border-gray-300 my-3"></div>

                            {config.footer_text && (
                                <p className="text-xs text-gray-500 italic">{config.footer_text}</p>
                            )}

                            {config.show_barcode && (
                                <div className="mt-3 flex justify-center">
                                    <div className="flex gap-px">
                                        {Array(30).fill(0).map((_, i) => (
                                            <div key={i} className="bg-gray-900" style={{ width: Math.random() > 0.5 ? 2 : 1, height: 28 }}></div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {config.show_qr_code && (
                                <div className="mt-3 flex justify-center">
                                    <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                                        <QrCode size={32} className="text-gray-400" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReceiptSettingsPage;
