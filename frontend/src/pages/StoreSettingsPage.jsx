import React, { useState, useEffect, useCallback } from 'react';
import {
    Store, Palette, Home, Phone, Search, ShoppingCart, Settings,
    Plus, Trash2, Save, Upload, Image as ImageIcon, Loader2,
    CheckSquare, Square, Building2, Calculator, Receipt, CreditCard,
    Bell, Shield, Monitor, Lock, QrCode, Barcode, MessageCircle, UserCheck
} from 'lucide-react';
import { toast } from 'react-toastify';
import PageHeader from '../components/common/PageHeader';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import SearchableSelect from '../components/ui/SearchableSelect';
import { CURRENCIES, getCurrencySymbol } from '../utils/currency';
import { useTheme, themes as themeList } from '../context/ThemeContext';
import { getStoreConfig, updateStoreConfig, getCompanySettingsForStore } from '../api/storeConfig';
import api from '../api/axios';
import { setFavicon } from '../hooks/useFavicon';
import { useBranding } from '../context/BrandingContext';

// ── African timezone data ────────────────────────────────────────────────
const AFRICA_TIMEZONES = [
    { label: 'UTC+0 · GMT — West / Atlantic Africa', zones: [
        { value: 'Africa/Abidjan', label: "Abidjan — Côte d'Ivoire" }, { value: 'Africa/Accra', label: 'Accra — Ghana' },
    ]},
    { label: 'UTC+1 · WAT — West Africa Time', zones: [
        { value: 'Africa/Lagos', label: 'Lagos — Nigeria' }, { value: 'Africa/Luanda', label: 'Luanda — Angola' },
        { value: 'Africa/Douala', label: 'Douala — Cameroon' }, { value: 'Africa/Kinshasa', label: 'Kinshasa — DR Congo (West)' },
    ]},
    { label: 'UTC+1 · CET / WET — North Africa', zones: [
        { value: 'Africa/Algiers', label: 'Algiers — Algeria' }, { value: 'Africa/Casablanca', label: 'Casablanca — Morocco' },
    ]},
    { label: 'UTC+2 · CAT — Central Africa Time', zones: [
        { value: 'Africa/Johannesburg', label: 'Johannesburg — South Africa' }, { value: 'Africa/Harare', label: 'Harare — Zimbabwe' },
        { value: 'Africa/Lusaka', label: 'Lusaka — Zambia' }, { value: 'Africa/Kigali', label: 'Kigali — Rwanda' },
    ]},
    { label: 'UTC+2 · EET — North-East Africa', zones: [
        { value: 'Africa/Cairo', label: 'Cairo — Egypt' }, { value: 'Africa/Tripoli', label: 'Tripoli — Libya' },
    ]},
    { label: 'UTC+3 · EAT — East Africa Time', zones: [
        { value: 'Africa/Nairobi', label: 'Nairobi — Kenya' }, { value: 'Africa/Dar_es_Salaam', label: 'Dar es Salaam — Tanzania' },
        { value: 'Africa/Kampala', label: 'Kampala — Uganda' }, { value: 'Africa/Addis_Ababa', label: 'Addis Ababa — Ethiopia' },
    ]},
    { label: 'UTC+4 · Indian Ocean Islands', zones: [
        { value: 'Indian/Mauritius', label: 'Port Louis — Mauritius' },
    ]},
];

const TIMEZONE_OPTIONS = [
    ...AFRICA_TIMEZONES.map(g => ({ group: g.label, items: g.zones.map(z => ({ value: z.value, label: z.label })) })),
    { group: 'Other Timezones', items: [
        { value: 'UTC', label: 'UTC — Coordinated Universal Time' },
        { value: 'Europe/London', label: 'London — UK (GMT/BST)' },
        { value: 'America/New_York', label: 'New York — Eastern Time (ET)' },
    ]},
];

const RECEIPT_TEMPLATES = [
    { id: 'modern', name: 'Modern', description: 'Clean and bold' },
    { id: 'classic', name: 'Classic', description: 'Traditional layout' },
    { id: 'minimal', name: 'Minimal', description: 'Essential info only' },
    { id: 'detailed', name: 'Detailed', description: 'All details included' },
];

const COMPANY_TABS = [
    { key: 'general', label: 'General', icon: Building2 },
    { key: 'branding', label: 'Branding', icon: Palette },
    { key: 'tax', label: 'Tax', icon: Calculator },
    { key: 'receipt', label: 'Receipt', icon: Receipt },
    { key: 'payment', label: 'Payment', icon: CreditCard },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'security', label: 'Security', icon: Shield },
    { key: 'display', label: 'Display', icon: Monitor },
];

const STORE_TABS = [
    { key: 'homepage', label: 'Homepage', icon: Home },
    { key: 'contact', label: 'Contact & Social', icon: Phone },
    { key: 'seo', label: 'SEO', icon: Search },
    { key: 'commerce', label: 'Commerce', icon: ShoppingCart },
    { key: 'communication', label: 'Communication', icon: MessageCircle },
    { key: 'registration', label: 'Registration', icon: UserCheck },
    { key: 'advanced', label: 'Advanced', icon: Settings },
];

const ALL_TABS = [...COMPANY_TABS, ...STORE_TABS];

const FONT_FAMILIES = [
    'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins',
    'Nunito', 'Raleway', 'Ubuntu', 'Playfair Display', 'Merriweather',
];

const CURRENCY_OPTIONS = Object.values(CURRENCIES).map(c => ({
    value: c.code,
    label: `${c.code} — ${c.symbol} — ${c.name}`,
}));

const SectionLabel = ({ children }) => (
    <h3 className="text-sm font-semibold text-theme-primary mb-3 pb-2 border-b border-theme">{children}</h3>
);

const FormField = ({ label, hint, children }) => (
    <div className="space-y-1.5 w-full">
        <label className="block text-xs font-medium text-theme-muted">{label}</label>
        {children}
        {hint && <p className="text-[10px] text-theme-muted">{hint}</p>}
    </div>
);

const TextInput = ({ value, onChange, placeholder, type = 'text', disabled }) => (
    <input
        type={type}
        value={value ?? ''}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-3 py-2 text-sm bg-theme-primary border border-theme rounded-lg text-theme-primary placeholder-theme-muted focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition disabled:opacity-60"
    />
);

const TextArea = ({ value, onChange, placeholder, rows = 3, disabled }) => (
    <textarea
        value={value ?? ''}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className="w-full px-3 py-2 text-sm bg-theme-primary border border-theme rounded-lg text-theme-primary placeholder-theme-muted focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition resize-none disabled:opacity-60"
    />
);

const SelectInput = ({ value, onChange, children, disabled }) => (
    <select
        value={value ?? ''}
        onChange={onChange}
        disabled={disabled}
        className="w-full px-3 py-2 text-sm bg-theme-primary border border-theme rounded-lg text-theme-primary outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 transition cursor-pointer disabled:opacity-60"
    >
        {children}
    </select>
);

const Toggle = ({ checked, onChange, label, disabled }) => (
    <label className={`flex items-center gap-3 group ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
        <div
            onClick={() => !disabled && onChange(!checked)}
            className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 flex-shrink-0 ${checked ? 'bg-accent-gold' : 'bg-theme-tertiary'}`}
        >
            <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
        </div>
        {label && <span className="text-sm text-theme-primary">{label}</span>}
    </label>
);

const SaveButton = ({ onClick, loading }) => (
    <button
        onClick={onClick}
        disabled={loading}
        className="flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg bg-accent-gold hover:bg-accent-goldDark text-white transition disabled:opacity-60"
    >
        {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
        Save Changes
    </button>
);

const LogoUploadField = ({ label, value, onChange, category = 'branding', disabled }) => {
    const [uploading, setUploading] = useState(false);

    const handleFileChange = async (e) => {
        if (disabled) return;
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await api.post(`/upload/${category}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const url = res.data?.url || res.data?.secure_url || res.data;
            onChange(url);
        } catch (err) {
            toast.error('Upload failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className={`space-y-2 ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
            <label className="block text-xs font-medium text-theme-muted">{label}</label>
            <div className="flex items-center gap-3">
                {value ? (
                    <img src={value} alt={label} className="h-12 w-auto max-w-[120px] object-contain rounded border border-theme bg-theme-primary p-1" />
                ) : (
                    <div className="w-12 h-12 rounded border border-dashed border-theme bg-theme-primary flex items-center justify-center text-theme-muted">
                        <ImageIcon size={18} />
                    </div>
                )}
                <div className="flex-1">
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-theme-primary border border-theme text-theme-secondary transition" style={{ cursor: disabled ? 'not-allowed' : 'pointer', hover: disabled ? 'none' : 'bg-theme-secondary' }}>
                        {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                        {uploading ? 'Uploading...' : 'Upload Image'}
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={uploading || disabled} />
                    </label>
                    {value && (
                        <div className="mt-1">
                            <input
                                type="text"
                                value={value}
                                onChange={(e) => !disabled && onChange(e.target.value)}
                                disabled={disabled}
                                className="w-full px-2 py-1 text-[10px] bg-theme-primary border border-theme rounded text-theme-muted outline-none"
                                placeholder="Or paste URL..."
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ColorField = ({ label, value, onChange, disabled }) => (
    <div className={`space-y-1.5 ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
        <label className="block text-xs font-medium text-theme-muted">{label}</label>
        <div className="flex items-center gap-2">
            <input
                type="color"
                value={value || '#000000'}
                onChange={(e) => !disabled && onChange(e.target.value)}
                disabled={disabled}
                className="w-8 h-8 rounded border border-theme bg-transparent p-0.5"
                style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
            />
            <input
                type="text"
                value={value || ''}
                onChange={(e) => !disabled && onChange(e.target.value)}
                disabled={disabled}
                placeholder="#000000"
                className="flex-1 px-3 py-1.5 text-xs bg-theme-primary border border-theme rounded-lg text-theme-primary outline-none focus:ring-2 focus:ring-accent-gold/20"
            />
        </div>
    </div>
);

// Toggle Banner for Company Settings
const CompanySettingsBanner = ({ isUsingCompanySettings, toggleSettings, sectionName }) => (
    <div className={`flex items-center justify-between p-4 mb-6 rounded-xl border ${isUsingCompanySettings ? 'bg-accent-gold/10 border-accent-gold/30' : 'bg-theme-secondary border-theme'}`}>
        <div>
            <h3 className={`text-sm font-semibold flex items-center gap-2 ${isUsingCompanySettings ? 'text-accent-gold' : 'text-theme-primary'}`}>
                {isUsingCompanySettings ? <Lock size={15} /> : <Store size={15} />}
                Use Company Settings for {sectionName}
            </h3>
            <p className="text-xs text-theme-muted mt-1">
                {isUsingCompanySettings 
                    ? `Currently inheriting the company's ${sectionName.toLowerCase()} settings. Turn off to customize specifically for this store.` 
                    : `Currently using store-specific ${sectionName.toLowerCase()} settings. Turn on to inherit from company settings.`}
            </p>
        </div>
        <div
            onClick={() => toggleSettings(!isUsingCompanySettings)}
            className={`w-14 h-7 rounded-full transition-colors flex items-center px-1 flex-shrink-0 cursor-pointer ${isUsingCompanySettings ? 'bg-accent-gold' : 'bg-theme-tertiary border border-theme'}`}
        >
            <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${isUsingCompanySettings ? 'translate-x-7' : 'translate-x-0'}`} />
        </div>
    </div>
);

const defaultStoreConfig = {
    store_name: '',
    tagline: '',
    description: '',
    currency: 'NGN',
    store_slug: '',
    use_company_settings: {
        general: true, branding: true, tax: true, receipt: true, 
        payment: true, notifications: true, security: true, display: true
    },
    store_settings: {
        general: {}, branding: {}, tax: {}, receipt: {}, 
        payment: {}, notifications: {}, security: {}, display: {}
    },
    homepage: {
        promo_bar_enabled: false,
        promo_bar_text: '',
        hero_banners: [],
        featured_categories: [],
        featured_products: [],
    },
    contact: {
        email: '', phone: '', whatsapp: '', address: '',
        social: { facebook: '', instagram: '', twitter: '', youtube: '' },
    },
    seo: { meta_title: '', meta_description: '', og_image: '' },
    commerce: {
        tax_rate: 0,
        shipping_methods: [],
        payment_methods: { paystack: true, manual: false },
    },
    advanced: {
        maintenance_mode: false, maintenance_message: '',
        custom_domain: '', store_active: true,
    },
};

const StoreSettingsPage = () => {
    const { persistTheme } = useTheme();
    const { config: brandingConfig } = useBranding();
    const [activeTab, setActiveTab] = useState('general');
    const [config, setConfig] = useState(defaultStoreConfig);
    const [companySettings, setCompanySettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Extra data for homepage
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);

    // ── Store favicon: show the store's own logo (circular) while on the branding tab ──
    useEffect(() => {
        if (activeTab === 'branding') {
            const storeLogo = config.logo_primary || null;
            const storeName  = config.store_name || brandingConfig.company_name || 'S';
            const accent     = config.accent_color || brandingConfig.accent_color || '#D4AF37';
            setFavicon(storeLogo, accent, storeName.charAt(0));
        } else {
            // Restore company-level favicon on other tabs
            const companyName = brandingConfig.organization_name || brandingConfig.company_name || 'BMS';
            setFavicon(
                brandingConfig.logo_url,
                brandingConfig.accent_color || '#D4AF37',
                companyName.charAt(0)
            );
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, config.logo_primary, config.store_name, config.accent_color]);

    // Restore company favicon when the page unmounts
    useEffect(() => {
        return () => {
            const companyName = brandingConfig.organization_name || brandingConfig.company_name || 'BMS';
            setFavicon(
                brandingConfig.logo_url,
                brandingConfig.accent_color || '#D4AF37',
                companyName.charAt(0)
            );
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [configRes, companyRes, catRes, prodRes] = await Promise.all([
                getStoreConfig(),
                getCompanySettingsForStore(),
                api.get('/products/categories').catch(() => ({ data: [] })),
                api.get('/products?limit=200').catch(() => ({ data: [] }))
            ]);

            const d = configRes.data;

            // Parse JSONB fields that might come as strings
            const parseJson = (v, fallback = {}) => {
                if (!v) return fallback;
                if (typeof v === 'string') { try { return JSON.parse(v); } catch { return fallback; } }
                return v;
            };

            // Map flat DB columns to the nested structure the frontend uses
            const mappedConfig = {
                ...defaultStoreConfig,
                // Top-level fields
                store_name: d.store_name || '',
                store_slug: d.store_slug || '',
                tagline: d.tagline || '',
                description: d.description || '',
                currency: d.currency || 'NGN',

                // Company settings toggle fields
                use_company_settings: {
                    ...defaultStoreConfig.use_company_settings,
                    ...parseJson(d.use_company_settings, {}),
                },
                store_settings: {
                    ...defaultStoreConfig.store_settings,
                    ...parseJson(d.store_settings, {}),
                },

                // Store branding (these are the online store branding, distinct from company branding)
                logo_primary: d.logo_primary || '',
                logo_icon: d.logo_icon || '',
                logo_dark: d.logo_dark || '',
                logo_type: d.logo_type || 'icon_text',
                sidebar_name_size: d.sidebar_name_size || 'medium',
                primary_color: d.primary_color || '#3B82F6',
                secondary_color: d.secondary_color || '#1E40AF',
                accent_color: d.accent_color || '#F59E0B',
                background_color: d.background_color || '#FFFFFF',
                text_color: d.text_color || '#111827',
                font_family: d.font_family || 'Inter',
                hover_color: d.hover_color || '',
                active_text_color: d.active_text_color || '',
                sidebar_bg_color: d.sidebar_bg_color || '',
                navbar_bg_color: d.navbar_bg_color || '',
                button_color: d.button_color || '',

                // Homepage (mapped from flat columns)
                homepage: {
                    promo_bar_enabled: d.show_promo_bar ?? false,
                    promo_bar_text: d.promo_bar_text || '',
                    hero_banners: parseJson(d.hero_banners, []),
                    featured_categories: parseJson(d.featured_category_ids, []),
                    featured_products: parseJson(d.featured_product_ids, []),
                },

                // Contact (mapped from flat columns)
                contact: {
                    email: d.contact_email || '',
                    phone: d.contact_phone || '',
                    whatsapp: d.contact_whatsapp || '',
                    address: d.contact_address || '',
                    social: parseJson(d.social_links, { facebook: '', instagram: '', twitter: '', youtube: '' }),
                },

                // SEO (mapped from flat columns)
                seo: {
                    meta_title: d.seo_meta_title || '',
                    meta_description: d.seo_meta_description || '',
                    og_image: d.seo_og_image || '',
                },

                // Commerce (mapped from flat columns)
                commerce: {
                    tax_rate: d.tax_rate || 0,
                    shipping_methods: parseJson(d.shipping_methods, []),
                    payment_methods: parseJson(d.payment_methods, { paystack: true, manual: false }),
                },

                // Communication
                communication: {
                    customer_channel: d.customer_channel || 'email',
                    whatsapp_phone_number_id: d.whatsapp_phone_number_id || '',
                    whatsapp_business_account_id: d.whatsapp_business_account_id || '',
                    whatsapp_access_token: d.whatsapp_access_token || '',
                    whatsapp_verify_token: d.whatsapp_verify_token || '',
                },

                // Registration
                registration: {
                    require_registration: d.require_registration ?? false,
                    min_order_amount_for_guest: d.min_order_amount_for_guest || '',
                },

                // Advanced (mapped from flat columns)
                advanced: {
                    store_active: d.is_active ?? true,
                    maintenance_mode: d.maintenance_mode ?? false,
                    maintenance_message: d.maintenance_message || '',
                    custom_domain: d.custom_domain || '',
                },
            };

            setConfig(mappedConfig);
            setCompanySettings(companyRes.data);
            setCategories(Array.isArray(catRes.data) ? catRes.data : catRes.data?.categories || []);
            setProducts(Array.isArray(prodRes.data) ? prodRes.data : prodRes.data?.products || []);
        } catch (err) {
            console.error('Failed to load store config', err);
            toast.error('Failed to load store settings. Please refresh the page.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const set = useCallback((path, value) => {
        setConfig(prev => {
            const keys = path.split('.');
            const next = { ...prev };
            let cur = next;
            for (let i = 0; i < keys.length - 1; i++) {
                cur[keys[i]] = { ...cur[keys[i]] };
                cur = cur[keys[i]];
            }
            cur[keys[keys.length - 1]] = value;
            return next;
        });
    }, []);

    const handleToggleCompanySettings = (section, value) => {
        set(`use_company_settings.${section}`, value);
    };

    // Helper to get exactly what should be displayed (company fallback or store specific)
    const getSectionData = (section) => {
        const useCompany = config.use_company_settings[section];
        if (useCompany && companySettings) {
            return companySettings[section] || {};
        }
        return config.store_settings[section] || {};
    };

    const handleSectionChange = (section, field, value) => {
        setConfig(prev => ({
            ...prev,
            store_settings: {
                ...prev.store_settings,
                [section]: {
                    ...prev.store_settings[section],
                    [field]: value
                }
            }
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Flatten nested config back to flat DB columns for the backend
            const payload = {
                store_slug: config.store_slug,
                store_name: config.store_name,
                tagline: config.tagline,
                description: config.description,
                currency: config.currency,

                // Branding (store-specific storefront branding flat columns)
                logo_primary: config.logo_primary,
                logo_icon: config.logo_icon,
                logo_dark: config.logo_dark,
                logo_type: config.logo_type,
                sidebar_name_size: config.sidebar_name_size,
                primary_color: config.primary_color,
                secondary_color: config.secondary_color,
                accent_color: config.accent_color,
                background_color: config.background_color,
                text_color: config.text_color,
                font_family: config.font_family,
                hover_color: config.hover_color,
                active_text_color: config.active_text_color,
                sidebar_bg_color: config.sidebar_bg_color,
                navbar_bg_color: config.navbar_bg_color,
                button_color: config.button_color,

                // Homepage
                show_promo_bar: config.homepage.promo_bar_enabled,
                promo_bar_text: config.homepage.promo_bar_text,
                hero_banners: config.homepage.hero_banners,
                featured_category_ids: config.homepage.featured_categories,
                featured_product_ids: config.homepage.featured_products,

                // Contact
                contact_email: config.contact.email,
                contact_phone: config.contact.phone,
                contact_whatsapp: config.contact.whatsapp,
                contact_address: config.contact.address,
                social_links: config.contact.social,

                // SEO
                seo_meta_title: config.seo.meta_title,
                seo_meta_description: config.seo.meta_description,
                seo_og_image: config.seo.og_image,

                // Commerce
                tax_rate: config.commerce.tax_rate,
                shipping_methods: config.commerce.shipping_methods,
                payment_methods: config.commerce.payment_methods,

                // Communication
                customer_channel: config.communication.customer_channel,
                whatsapp_phone_number_id: config.communication.whatsapp_phone_number_id,
                whatsapp_business_account_id: config.communication.whatsapp_business_account_id,
                whatsapp_access_token: config.communication.whatsapp_access_token,
                whatsapp_verify_token: config.communication.whatsapp_verify_token,

                // Registration
                require_registration: config.registration.require_registration,
                min_order_amount_for_guest: config.registration.min_order_amount_for_guest || null,

                // Advanced
                is_active: config.advanced.store_active,
                maintenance_mode: config.advanced.maintenance_mode,
                maintenance_message: config.advanced.maintenance_message,
                custom_domain: config.advanced.custom_domain,

                // Company settings integration
                use_company_settings: config.use_company_settings,
                store_settings: config.store_settings,
            };

            await updateStoreConfig(payload);
            toast.success('Store settings saved successfully!');
        } catch (err) {
            toast.error('Failed to save: ' + (err.response?.data?.message || err.message));
        } finally {
            setSaving(false);
        }
    };

    // Helper for shipping
    const addShippingMethod = () => {
        set('commerce.shipping_methods', [...(config.commerce.shipping_methods || []), { name: '', price: 0, description: '' }]);
    };
    const updateShippingMethod = (idx, field, value) => {
        const methods = [...(config.commerce.shipping_methods || [])];
        methods[idx] = { ...methods[idx], [field]: value };
        set('commerce.shipping_methods', methods);
    };
    const removeShippingMethod = (idx) => {
        set('commerce.shipping_methods', config.commerce.shipping_methods.filter((_, i) => i !== idx));
    };

    const toggleArrayItem = (path, item) => {
        const arr = path.split('.').reduce((o, k) => o?.[k], config) || [];
        const next = arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];
        set(path, next);
    };

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner /></div>;

    const renderTab = () => {
        const useCS = (section) => config.use_company_settings[section];
        const data = (section) => getSectionData(section);
        const setVal = (section, field, val) => handleSectionChange(section, field, val);

        switch (activeTab) {
            // ─── MIRRORED SECTIONS ──────────────────────────────────────────
            case 'general':
                const gen = data('general');
                const disGen = useCS('general');
                return (
                    <div className="space-y-6">
                        <CompanySettingsBanner isUsingCompanySettings={disGen} toggleSettings={(v) => handleToggleCompanySettings('general', v)} sectionName="General" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            <FormField label="Company Name"><TextInput value={gen.company_name} onChange={e => setVal('general','company_name', e.target.value)} disabled={disGen} /></FormField>
                            <FormField label="Company Email"><TextInput type="email" value={gen.company_email} onChange={e => setVal('general','company_email', e.target.value)} disabled={disGen} /></FormField>
                            <FormField label="Company Phone"><TextInput value={gen.company_phone} onChange={e => setVal('general','company_phone', e.target.value)} disabled={disGen} /></FormField>
                            <FormField label="Currency">
                                <div className={disGen ? 'opacity-60 pointer-events-none' : ''}>
                                    <SearchableSelect
                                        value={gen.currency}
                                        onChange={val => setVal('general','currency', val)}
                                        options={CURRENCY_OPTIONS}
                                        placeholder="Select currency"
                                        searchPlaceholder="Search currencies…"
                                    />
                                </div>
                            </FormField>
                            <FormField label="Currency Symbol">
                                <TextInput
                                    value={getCurrencySymbol(gen.currency)}
                                    disabled
                                    onChange={() => {}}
                                />
                            </FormField>
                            <div className="md:col-span-2">
                                <FormField label="Company Address"><TextArea value={gen.company_address} onChange={e => setVal('general','company_address', e.target.value)} disabled={disGen} /></FormField>
                            </div>
                            <FormField label="Timezone">
                                <div className={disGen ? 'opacity-60 pointer-events-none' : ''}>
                                    <SearchableSelect
                                        value={gen.timezone}
                                        onChange={val => setVal('general','timezone', val)}
                                        options={TIMEZONE_OPTIONS}
                                        placeholder="Select timezone"
                                        searchPlaceholder="Search timezones…"
                                    />
                                </div>
                            </FormField>
                            <FormField label="Date Format">
                                <SelectInput value={gen.date_format} onChange={e => setVal('general','date_format', e.target.value)} disabled={disGen}>
                                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                </SelectInput>
                            </FormField>
                        </div>
                    </div>
                );

            case 'branding': {
                const disBr = useCS('branding');
                // When toggle is OFF: read/write flat store_config columns directly so
                // handleSave can persist them and formatConfig can return them to the store.
                // When toggle is ON: show company settings (read-only) from getSectionData.
                const br = disBr ? data('branding') : {
                    logo_url:          config.logo_primary,
                    logo_type:         config.logo_type,
                    logo_icon_text:    config.logo_icon,
                    sidebar_name_size: config.sidebar_name_size,
                    font_family:       config.font_family,
                    primary_color:     config.primary_color,
                    secondary_color:   config.secondary_color,
                    accent_color:      config.accent_color,
                    hover_color:       config.hover_color,
                    active_text_color: config.active_text_color,
                    sidebar_bg_color:  config.sidebar_bg_color,
                    navbar_bg_color:   config.navbar_bg_color,
                    button_color:      config.button_color,
                    background_color:  config.background_color,
                };
                // Write directly to flat config fields (not store_settings)
                const setBr = (field, value) => {
                    const flatMap = {
                        logo_url:          'logo_primary',
                        logo_type:         'logo_type',
                        logo_icon_text:    'logo_icon',
                        sidebar_name_size: 'sidebar_name_size',
                        font_family:       'font_family',
                    };
                    const flatKey = flatMap[field] || field;
                    set(flatKey, value);
                };
                const brandingColorFields = [
                    { key: 'primary_color',     label: 'Primary Color',      desc: 'Main brand colour' },
                    { key: 'secondary_color',   label: 'Secondary Color',    desc: 'Background and panels' },
                    { key: 'accent_color',      label: 'Accent Color',       desc: 'Highlights and active elements' },
                    { key: 'hover_color',       label: 'Hover Color',        desc: 'Button and link hover state' },
                    { key: 'active_text_color', label: 'Active Text Color',  desc: 'Text on active buttons and selected nav items' },
                    { key: 'sidebar_bg_color',  label: 'Sidebar Background', desc: 'Sidebar background override' },
                    { key: 'navbar_bg_color',   label: 'Navbar Background',  desc: 'Top navbar override' },
                    { key: 'button_color',      label: 'Button Color',       desc: 'Primary button colour' },
                    { key: 'background_color',  label: 'App Background',     desc: 'Main content background' },
                ];
                return (
                    <div className="space-y-6">
                        <CompanySettingsBanner isUsingCompanySettings={disBr} toggleSettings={(v) => handleToggleCompanySettings('branding', v)} sectionName="Branding" />
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Logo & Identity */}
                            <div className="space-y-5">
                                <h3 className="text-xs font-semibold text-theme-muted uppercase tracking-wider flex items-center gap-2">
                                    <ImageIcon size={13} className="text-accent-gold" /> Logo &amp; Identity
                                </h3>
                                <FormField label="Logo Type">
                                    <SelectInput value={br.logo_type || 'icon_text'} onChange={e => !disBr && setBr('logo_type', e.target.value)} disabled={disBr}>
                                        <option value="icon_text">Icon + Company Name</option>
                                        <option value="full">Full Logo Image</option>
                                        <option value="none">Company Name Only</option>
                                    </SelectInput>
                                    <p className="text-xs text-theme-muted mt-1">
                                        {(br.logo_type || 'icon_text') === 'icon_text' && 'Displays an icon alongside the company name.'}
                                        {br.logo_type === 'full' && 'Displays only the uploaded logo image, no text.'}
                                        {br.logo_type === 'none' && 'Displays only the company name from General Settings.'}
                                    </p>
                                </FormField>
                                {br.logo_type !== 'none' && (
                                    <LogoUploadField label="Logo Image" value={br.logo_url} onChange={v => !disBr && setBr('logo_url', v)} disabled={disBr} />
                                )}
                                {(br.logo_type === 'icon_text' || !br.logo_type) && (
                                    <FormField label="Icon Text (shown when no logo uploaded)">
                                        <TextInput
                                            value={br.logo_icon_text || ''}
                                            onChange={e => !disBr && setBr('logo_icon_text', e.target.value)}
                                            placeholder="BMS"
                                            disabled={disBr}
                                        />
                                        <p className="text-xs text-theme-muted mt-1">Up to 4 characters — used as icon placeholder</p>
                                    </FormField>
                                )}
                                <FormField label="Sidebar Name Size">
                                    <SelectInput value={br.sidebar_name_size || 'medium'} onChange={e => !disBr && setBr('sidebar_name_size', e.target.value)} disabled={disBr}>
                                        <option value="small">Small</option>
                                        <option value="medium">Medium</option>
                                        <option value="large">Large</option>
                                    </SelectInput>
                                </FormField>
                                <FormField label="Font Family">
                                    <SelectInput value={br.font_family || 'Inter'} onChange={e => !disBr && setBr('font_family', e.target.value)} disabled={disBr}>
                                        {['Inter','Roboto','Poppins','Open Sans','Lato','Montserrat'].map(f => <option key={f} value={f}>{f}</option>)}
                                    </SelectInput>
                                </FormField>
                            </div>
                            {/* Colours */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-semibold text-theme-muted uppercase tracking-wider flex items-center gap-2">
                                    <Palette size={13} className="text-accent-gold" /> Colours
                                </h3>
                                {brandingColorFields.map(({ key, label, desc }) => (
                                    <div key={key}>
                                        <label className="block text-[10px] sm:text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">{label}</label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="color"
                                                value={br[key] || '#000000'}
                                                onChange={e => !disBr && setBr(key, e.target.value)}
                                                disabled={disBr}
                                                className="w-10 h-10 rounded-lg cursor-pointer border border-theme flex-shrink-0"
                                                style={{ cursor: disBr ? 'not-allowed' : 'pointer' }}
                                            />
                                            <input
                                                type="text"
                                                value={br[key] || ''}
                                                onChange={e => !disBr && setBr(key, e.target.value)}
                                                disabled={disBr}
                                                placeholder="#000000"
                                                className="flex-1 px-3 py-2.5 text-sm bg-theme-primary border border-theme rounded-lg text-theme-primary outline-none focus:ring-2 focus:ring-accent-gold/20 disabled:opacity-60"
                                            />
                                        </div>
                                        <p className="text-xs text-theme-muted mt-0.5">{desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            }

            case 'tax':
                const tx = data('tax');
                const disTx = useCS('tax');
                return (
                    <div className="space-y-6">
                        <CompanySettingsBanner isUsingCompanySettings={disTx} toggleSettings={(v) => handleToggleCompanySettings('tax', v)} sectionName="Tax" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-5">
                                <Toggle label="Enable Tax" checked={tx.tax_enabled} onChange={v => setVal('tax','tax_enabled',v)} disabled={disTx} />
                                {tx.tax_enabled && (
                                    <>
                                        <FormField label="Standard Tax Rate (%)" hint="Applied to most goods and services"><TextInput type="number" value={tx.standard_rate} onChange={e => setVal('tax','standard_rate',e.target.value)} disabled={disTx}/></FormField>
                                        <FormField label="Reduced Tax Rate (%)" hint="For eligible items with lower tax rates"><TextInput type="number" value={tx.reduced_rate} onChange={e => setVal('tax','reduced_rate',e.target.value)} disabled={disTx}/></FormField>
                                        <FormField label="Zero-Rated (%)" hint="Always 0% — exempt items"><TextInput type="number" value={0} disabled onChange={() => {}} /></FormField>
                                        <div>
                                            <label className="block text-xs font-medium text-theme-muted mb-1.5">Tax Application Mode</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {[
                                                    { value: 'exclusive', label: 'Tax Exclusive', desc: 'Tax added on top of prices' },
                                                    { value: 'inclusive', label: 'Tax Inclusive', desc: 'Prices already include tax' }
                                                ].map(o => (
                                                    <button key={o.value} type="button"
                                                        onClick={() => !disTx && setVal('tax', 'tax_application_mode', o.value)}
                                                        disabled={disTx}
                                                        className={`p-3 rounded-lg border text-left transition-all disabled:opacity-60 ${(tx.tax_application_mode || 'exclusive') === o.value ? 'border-accent-gold bg-accent-gold/10 ring-2 ring-accent-gold/20' : 'border-theme bg-theme-primary hover:border-accent-gold/30'}`}>
                                                        <p className={`text-sm font-semibold ${(tx.tax_application_mode || 'exclusive') === o.value ? 'text-accent-gold' : 'text-theme-primary'}`}>{o.label}</p>
                                                        <p className="text-xs text-theme-muted mt-0.5">{o.desc}</p>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="space-y-5">
                                <SectionLabel>Tax Registration</SectionLabel>
                                <FormField label="Tax Identification Number (TIN)"><TextInput value={tx.tax_number} onChange={e => setVal('tax','tax_number',e.target.value)} disabled={disTx} /></FormField>
                                <FormField label="Effective Date" hint="Date these tax rates take effect"><TextInput type="date" value={tx.effective_date?.split('T')[0] || ''} onChange={e => setVal('tax','effective_date',e.target.value)} disabled={disTx} /></FormField>
                                {tx.tax_enabled && (
                                    <div className="p-4 bg-theme-primary rounded-lg border border-theme">
                                        <h4 className="text-sm font-semibold text-theme-primary mb-3">Current Tax Summary</h4>
                                        <div className="space-y-2 text-sm">
                                            {[
                                                ['Standard Rate', `${tx.standard_rate || 0}%`],
                                                ['Reduced Rate', `${tx.reduced_rate || 0}%`],
                                                ['Mode', tx.tax_application_mode || 'exclusive'],
                                                ['TIN', tx.tax_number || 'Not set']
                                            ].map(([k, v]) => (
                                                <div key={k} className="flex justify-between">
                                                    <span className="text-theme-muted">{k}</span>
                                                    <span className="text-theme-primary font-medium capitalize">{v}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );

            case 'receipt':
                const rc = data('receipt');
                const disRc = useCS('receipt');
                return (
                    <div className="space-y-6">
                        <CompanySettingsBanner isUsingCompanySettings={disRc} toggleSettings={(v) => handleToggleCompanySettings('receipt', v)} sectionName="Receipt" />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Company on Receipt */}
                            <div className="space-y-4">
                                <SectionLabel>Company on Receipt</SectionLabel>
                                <FormField label="Company Name"><TextInput value={rc.company_name} onChange={e => setVal('receipt','company_name',e.target.value)} disabled={disRc} /></FormField>
                                <FormField label="Address"><TextArea value={rc.company_address} onChange={e => setVal('receipt','company_address',e.target.value)} disabled={disRc} /></FormField>
                                <FormField label="Phone"><TextInput value={rc.company_phone} onChange={e => setVal('receipt','company_phone',e.target.value)} disabled={disRc} /></FormField>
                                <FormField label="Email"><TextInput type="email" value={rc.company_email} onChange={e => setVal('receipt','company_email',e.target.value)} disabled={disRc} /></FormField>
                                <FormField label="Tax / TIN Number"><TextInput value={rc.tax_number} onChange={e => setVal('receipt','tax_number',e.target.value)} disabled={disRc} placeholder="Tax identification number" /></FormField>
                                <LogoUploadField label="Receipt Logo" value={rc.company_logo_url} onChange={v => setVal('receipt','company_logo_url',v)} disabled={disRc} category="receipts" />
                            </div>
                            {/* Content & Display Options */}
                            <div className="space-y-4">
                                <SectionLabel>Content & Display</SectionLabel>
                                <FormField label="Footer Text"><TextArea value={rc.footer_text} onChange={e => setVal('receipt','footer_text',e.target.value)} disabled={disRc} /></FormField>
                                <FormField label="Terms & Conditions"><TextArea value={rc.terms_and_conditions} onChange={e => setVal('receipt','terms_and_conditions',e.target.value)} disabled={disRc} /></FormField>
                                <Toggle label="Show Logo" checked={rc.show_logo} onChange={v => setVal('receipt','show_logo',v)} disabled={disRc} />
                                <Toggle label="Show Tax Number" checked={rc.show_tax_number} onChange={v => setVal('receipt','show_tax_number',v)} disabled={disRc} />
                                <Toggle label="Show Barcode" checked={rc.show_barcode} onChange={v => setVal('receipt','show_barcode',v)} disabled={disRc} />
                                <Toggle label="Show QR Code" checked={rc.show_qr_code} onChange={v => setVal('receipt','show_qr_code',v)} disabled={disRc} />
                            </div>
                            {/* Template Style & Preview */}
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <SectionLabel>Template Style</SectionLabel>
                                    <div className="grid grid-cols-2 gap-2">
                                        {RECEIPT_TEMPLATES.map(t => (
                                            <button key={t.id} type="button"
                                                onClick={() => !disRc && setVal('receipt','template_style', t.id)}
                                                disabled={disRc}
                                                className={`p-3 rounded-lg border text-left transition-all disabled:opacity-60 ${(rc.template_style || 'modern') === t.id ? 'border-accent-gold bg-accent-gold/10 ring-2 ring-accent-gold/20' : 'border-theme bg-theme-primary hover:border-accent-gold/30'}`}>
                                                <p className={`text-sm font-semibold ${(rc.template_style || 'modern') === t.id ? 'text-accent-gold' : 'text-theme-primary'}`}>{t.name}</p>
                                                <p className="text-xs text-theme-muted mt-0.5">{t.description}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {/* Preview */}
                                <div>
                                    <SectionLabel>Preview</SectionLabel>
                                    <div className="bg-white rounded-lg border border-gray-200 p-4 text-gray-900 text-center max-w-[200px] mx-auto">
                                        {rc.show_logo && rc.company_logo_url && (
                                            <img src={rc.company_logo_url} alt="Logo" className="w-12 h-12 mx-auto mb-2 object-contain rounded-lg" />
                                        )}
                                        <p className="font-bold text-sm">{rc.company_name || 'Your Business'}</p>
                                        {rc.company_address && <p className="text-[10px] text-gray-500 mt-0.5">{rc.company_address}</p>}
                                        {rc.company_phone && <p className="text-[10px] text-gray-500">{rc.company_phone}</p>}
                                        {rc.show_tax_number && rc.tax_number && <p className="text-[10px] text-gray-500">TIN: {rc.tax_number}</p>}
                                        <div className="border-t border-dashed border-gray-300 my-2" />
                                        <div className="text-left text-[10px] space-y-1">
                                            <div className="flex justify-between"><span className="text-gray-500">Item x2</span><span>5,000</span></div>
                                            <div className="flex justify-between font-bold text-xs mt-1"><span>Total</span><span>5,000</span></div>
                                        </div>
                                        <div className="border-t border-dashed border-gray-300 my-2" />
                                        {rc.footer_text && <p className="text-[10px] text-gray-500 italic">{rc.footer_text}</p>}
                                        {rc.show_barcode && (
                                            <div className="mt-2 flex justify-center gap-px">
                                                {Array(20).fill(0).map((_, i) => (
                                                    <div key={i} className="bg-gray-900" style={{ width: i % 3 === 0 ? 2 : 1, height: 20 }} />
                                                ))}
                                            </div>
                                        )}
                                        {rc.show_qr_code && (
                                            <div className="mt-2 flex justify-center">
                                                <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                                                    <QrCode size={24} className="text-gray-400" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'payment':
                const pay = data('payment');
                const disPay = useCS('payment');
                return (
                    <div className="space-y-6">
                        <CompanySettingsBanner isUsingCompanySettings={disPay} toggleSettings={(v) => handleToggleCompanySettings('payment', v)} sectionName="Payment" />
                        <div className="space-y-4 max-w-lg">
                            <Toggle label="Cash Payments" checked={pay.cash_enabled} onChange={v => setVal('payment','cash_enabled',v)} disabled={disPay} />
                            <Toggle label="Card Payments" checked={pay.card_enabled} onChange={v => setVal('payment','card_enabled',v)} disabled={disPay} />
                            <Toggle label="Bank Transfer" checked={pay.bank_transfer_enabled} onChange={v => setVal('payment','bank_transfer_enabled',v)} disabled={disPay} />
                            <Toggle label="Mobile Money" checked={pay.mobile_money_enabled} onChange={v => setVal('payment','mobile_money_enabled',v)} disabled={disPay} />
                            <FormField label="Default Payment Method">
                                <SelectInput value={pay.default_payment_method} onChange={e => setVal('payment','default_payment_method', e.target.value)} disabled={disPay}>
                                    <option value="cash">Cash</option>
                                    <option value="card">Card</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="mobile_money">Mobile Money</option>
                                </SelectInput>
                            </FormField>
                        </div>
                    </div>
                );

            case 'notifications':
                const not = data('notifications');
                const disNot = useCS('notifications');
                return (
                    <div className="space-y-6">
                        <CompanySettingsBanner isUsingCompanySettings={disNot} toggleSettings={(v) => handleToggleCompanySettings('notifications', v)} sectionName="Notifications" />
                        <div className="space-y-4 max-w-lg">
                            <Toggle label="Email Notifications" checked={not.email_notifications} onChange={v => setVal('notifications','email_notifications',v)} disabled={disNot} />
                            <Toggle label="Low Stock Alerts" checked={not.low_stock_alerts} onChange={v => setVal('notifications','low_stock_alerts',v)} disabled={disNot} />
                            {not.low_stock_alerts && (
                                <FormField label="Low Stock Threshold">
                                    <TextInput type="number" value={not.low_stock_threshold} onChange={e => setVal('notifications','low_stock_threshold', e.target.value)} disabled={disNot} />
                                </FormField>
                            )}
                            <Toggle label="Daily Summary" checked={not.daily_summary} onChange={v => setVal('notifications','daily_summary',v)} disabled={disNot} />
                            <Toggle label="Order Notifications" checked={not.order_notifications} onChange={v => setVal('notifications','order_notifications',v)} disabled={disNot} />
                        </div>
                    </div>
                );

            case 'security':
                const sec = data('security');
                const disSec = useCS('security');
                return (
                    <div className="space-y-6">
                        <CompanySettingsBanner isUsingCompanySettings={disSec} toggleSettings={(v) => handleToggleCompanySettings('security', v)} sectionName="Security" />
                        <div className="space-y-4 max-w-lg">
                            <FormField label="Session Timeout (minutes)">
                                <TextInput type="number" value={sec.session_timeout} onChange={e => setVal('security','session_timeout', e.target.value)} disabled={disSec} />
                            </FormField>
                            <Toggle label="Require Password Change" checked={sec.require_password_change} onChange={v => setVal('security','require_password_change',v)} disabled={disSec} />
                            {sec.require_password_change && (
                                <FormField label="Password Expiry (days)">
                                    <TextInput type="number" value={sec.password_expiry_days} onChange={e => setVal('security','password_expiry_days', e.target.value)} disabled={disSec} />
                                </FormField>
                            )}
                            <Toggle label="Two-Factor Authentication" checked={sec.two_factor_enabled} onChange={v => setVal('security','two_factor_enabled',v)} disabled={disSec} />
                        </div>
                    </div>
                );

            case 'display':
                const disp = data('display');
                const disDisp = useCS('display');
                return (
                    <div className="space-y-6">
                        <CompanySettingsBanner isUsingCompanySettings={disDisp} toggleSettings={(v) => handleToggleCompanySettings('display', v)} sectionName="Display" />
                        <div className="space-y-4 max-w-lg">
                            <FormField label="Items Per Page">
                                <SelectInput value={disp.items_per_page} onChange={e => setVal('display','items_per_page', e.target.value)} disabled={disDisp}>
                                    <option value="10">10</option><option value="20">20</option><option value="50">50</option><option value="100">100</option>
                                </SelectInput>
                            </FormField>
                            <FormField label="Default View Mode">
                                <SelectInput value={disp.default_view_mode} onChange={e => setVal('display','default_view_mode', e.target.value)} disabled={disDisp}>
                                    <option value="grid">Grid</option><option value="list">List</option>
                                </SelectInput>
                            </FormField>
                            <Toggle label="Show Product Images" checked={disp.show_product_images} onChange={v => setVal('display','show_product_images',v)} disabled={disDisp} />
                            <Toggle label="Compact Mode" checked={disp.compact_mode} onChange={v => setVal('display','compact_mode',v)} disabled={disDisp} />
                            <FormField label="Theme">
                                <SelectInput
                                    value={disp.theme || 'midnight'}
                                    onChange={e => {
                                        if (!disDisp) {
                                            setVal('display','theme', e.target.value);
                                            persistTheme(e.target.value);
                                        }
                                    }}
                                    disabled={disDisp}
                                >
                                    {themeList.map(t => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
                                </SelectInput>
                            </FormField>
                        </div>
                    </div>
                );

            // ─── STORE ONLY SECTIONS ─────────────────────────────────────────
            case 'homepage':
                return (
                    <div className="space-y-6">
                        <div>
                            <SectionLabel>Promotional Bar</SectionLabel>
                            <div className="space-y-3">
                                <Toggle checked={config.homepage.promo_bar_enabled} onChange={v => set('homepage.promo_bar_enabled', v)} label="Enable promotional bar at top of store" />
                                {config.homepage.promo_bar_enabled && (
                                    <FormField label="Promo Bar Text">
                                        <TextInput value={config.homepage.promo_bar_text} onChange={e => set('homepage.promo_bar_text', e.target.value)} placeholder="Free shipping on orders over $50!" />
                                    </FormField>
                                )}
                            </div>
                        </div>
                        <div>
                            <SectionLabel>Hero Section</SectionLabel>
                            <div className="flex items-start gap-3 p-4 rounded-xl border border-accent-gold/30 bg-accent-gold/5">
                                <ImageIcon className="w-5 h-5 text-accent-gold flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-semibold text-theme-primary mb-1">Hero section has moved to App Builder</p>
                                    <a href="/app-builder" className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-accent-gold text-white rounded-lg hover:bg-accent-gold-dark transition">Open App Builder →</a>
                                </div>
                            </div>
                        </div>
                        <div>
                            <SectionLabel>Featured Categories</SectionLabel>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                {categories.map(cat => {
                                    const selected = (config.homepage.featured_categories || []).includes(cat.id);
                                    return (
                                        <button key={cat.id} onClick={() => toggleArrayItem('homepage.featured_categories', cat.id)} className={`flex items-center gap-2 px-3 py-2 text-xs rounded-lg border transition text-left ${selected ? 'border-accent-gold bg-accent-gold/10 text-accent-gold' : 'border-theme bg-theme-primary text-theme-secondary'}`}>
                                            {selected ? <CheckSquare size={12} /> : <Square size={12} />}
                                            {cat.name || cat.category_name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                );

            case 'contact':
                return (
                    <div className="space-y-6">
                        <div>
                            <SectionLabel>Contact Information</SectionLabel>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField label="Contact Email"><TextInput type="email" value={config.contact.email} onChange={e => set('contact.email', e.target.value)} /></FormField>
                                <FormField label="Phone Number"><TextInput value={config.contact.phone} onChange={e => set('contact.phone', e.target.value)} /></FormField>
                                <FormField label="WhatsApp Number"><TextInput value={config.contact.whatsapp} onChange={e => set('contact.whatsapp', e.target.value)} /></FormField>
                                <div className="md:col-span-2">
                                    <FormField label="Business Address"><TextArea value={config.contact.address} onChange={e => set('contact.address', e.target.value)} rows={2} /></FormField>
                                </div>
                            </div>
                        </div>
                        <div>
                            <SectionLabel>Social Links</SectionLabel>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {['facebook', 'instagram', 'twitter', 'youtube'].map(platform => (
                                    <FormField key={platform} label={platform.charAt(0).toUpperCase() + platform.slice(1)}>
                                        <TextInput value={config.contact.social?.[platform] || ''} onChange={e => set(`contact.social.${platform}`, e.target.value)} />
                                    </FormField>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 'seo':
                return (
                    <div className="space-y-4">
                        <FormField label="Meta Title"><TextInput value={config.seo.meta_title} onChange={e => set('seo.meta_title', e.target.value)} /></FormField>
                        <FormField label="Meta Description"><TextArea value={config.seo.meta_description} onChange={e => set('seo.meta_description', e.target.value)} /></FormField>
                        <FormField label="OG Image URL"><TextInput value={config.seo.og_image} onChange={e => set('seo.og_image', e.target.value)} /></FormField>
                    </div>
                );

            case 'commerce':
                return (
                    <div className="space-y-6">
                        <div>
                            <SectionLabel>Tax</SectionLabel>
                            <div className="max-w-xs">
                                <FormField label="Tax Rate (%) (Storefront Override)">
                                    <TextInput type="number" value={config.commerce.tax_rate} onChange={e => set('commerce.tax_rate', parseFloat(e.target.value) || 0)} />
                                </FormField>
                            </div>
                        </div>
                        <div>
                            <SectionLabel>Payment Methods</SectionLabel>
                            <div className="space-y-3">
                                <Toggle checked={!!config.commerce.payment_methods?.paystack} onChange={v => set('commerce.payment_methods.paystack', v)} label="Paystack (Card, Bank Transfer, USSD)" />
                                <Toggle checked={!!config.commerce.payment_methods?.manual} onChange={v => set('commerce.payment_methods.manual', v)} label="Manual Payment / Bank Transfer (customer transfers to your bank account)" />
                            </div>
                        </div>
                        <div>
                            <SectionLabel>Shipping Methods</SectionLabel>
                            <div className="space-y-3">
                                {(config.commerce.shipping_methods || []).map((m, idx) => (
                                    <div key={idx} className="bg-theme-primary rounded-lg border border-theme p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-semibold text-theme-muted">Shipping Method {idx + 1}</span>
                                            <button onClick={() => removeShippingMethod(idx)} className="p-1 text-theme-muted hover:text-red-500 transition"><Trash2 size={14} /></button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <FormField label="Name"><TextInput value={m.name} onChange={e => updateShippingMethod(idx, 'name', e.target.value)} /></FormField>
                                            <FormField label="Price"><TextInput type="number" value={m.price} onChange={e => updateShippingMethod(idx, 'price', parseFloat(e.target.value) || 0)} /></FormField>
                                            <FormField label="Description"><TextInput value={m.description} onChange={e => updateShippingMethod(idx, 'description', e.target.value)} /></FormField>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={addShippingMethod} className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-dashed border-theme text-theme-muted hover:border-accent-gold hover:text-accent-gold transition">
                                    <Plus size={14} /> Add Shipping Method
                                </button>
                            </div>
                        </div>
                    </div>
                );

            case 'communication':
                return (
                    <div className="space-y-6">
                        <div>
                            <SectionLabel>Customer Communication Channel</SectionLabel>
                            <p className="text-xs text-theme-muted mb-4">Choose how your store communicates with customers — receipts, notifications, and authentication will use this channel.</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => set('communication.customer_channel', 'email')}
                                    className={`flex-1 flex items-center gap-3 p-4 rounded-lg border-2 transition ${config.communication.customer_channel === 'email' ? 'border-accent-gold bg-accent-gold/5' : 'border-theme hover:border-accent-gold/30'}`}
                                >
                                    <Bell size={20} className={config.communication.customer_channel === 'email' ? 'text-accent-gold' : 'text-theme-muted'} />
                                    <div className="text-left">
                                        <p className="text-sm font-semibold text-theme-primary">Email</p>
                                        <p className="text-xs text-theme-muted">Send receipts, OTPs and notifications via email</p>
                                    </div>
                                </button>
                                <button
                                    onClick={() => set('communication.customer_channel', 'whatsapp')}
                                    className={`flex-1 flex items-center gap-3 p-4 rounded-lg border-2 transition ${config.communication.customer_channel === 'whatsapp' ? 'border-green-500 bg-green-50 dark:bg-green-900/10' : 'border-theme hover:border-green-300'}`}
                                >
                                    <MessageCircle size={20} className={config.communication.customer_channel === 'whatsapp' ? 'text-green-600' : 'text-theme-muted'} />
                                    <div className="text-left">
                                        <p className="text-sm font-semibold text-theme-primary">WhatsApp</p>
                                        <p className="text-xs text-theme-muted">Send receipts, OTPs and notifications via WhatsApp</p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {config.communication.customer_channel === 'whatsapp' && (
                            <div>
                                <SectionLabel>WhatsApp Cloud API Configuration</SectionLabel>
                                <p className="text-xs text-theme-muted mb-4">
                                    Get these from your{' '}
                                    <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer" className="text-accent-gold underline">Meta Developer Dashboard</a>.
                                    You need a Meta Business account with WhatsApp Business API access.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                                    <FormField label="Phone Number ID">
                                        <TextInput value={config.communication.whatsapp_phone_number_id} onChange={e => set('communication.whatsapp_phone_number_id', e.target.value)} placeholder="e.g. 123456789012345" />
                                    </FormField>
                                    <FormField label="Business Account ID">
                                        <TextInput value={config.communication.whatsapp_business_account_id} onChange={e => set('communication.whatsapp_business_account_id', e.target.value)} placeholder="e.g. 123456789012345" />
                                    </FormField>
                                    <div className="md:col-span-2">
                                        <FormField label="Permanent Access Token">
                                            <TextInput type="password" value={config.communication.whatsapp_access_token} onChange={e => set('communication.whatsapp_access_token', e.target.value)} placeholder="EAAxxxxxxx..." />
                                        </FormField>
                                    </div>
                                    <div className="md:col-span-2">
                                        <FormField label="Webhook Verify Token">
                                            <TextInput value={config.communication.whatsapp_verify_token} onChange={e => set('communication.whatsapp_verify_token', e.target.value)} placeholder="A random secret string for webhook verification" />
                                        </FormField>
                                        <p className="text-[10px] text-theme-muted mt-1">
                                            Set your webhook URL in the Meta dashboard to: <code className="bg-theme-primary px-1.5 py-0.5 rounded text-accent-gold">{'https://<your-domain>/api/webhooks/whatsapp'}</code>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 'registration':
                return (
                    <div className="space-y-6">
                        <div>
                            <SectionLabel>Customer Registration Requirements</SectionLabel>
                            <p className="text-xs text-theme-muted mb-4">Control whether customers must register before placing orders.</p>
                            <div className="space-y-4 max-w-lg">
                                <Toggle
                                    checked={!!config.registration.require_registration}
                                    onChange={v => set('registration.require_registration', v)}
                                    label="Require customers to register and log in before placing an order"
                                />
                                {!config.registration.require_registration && (
                                    <div className="pl-1">
                                        <FormField label="Minimum Order Amount for Guest Checkout">
                                            <TextInput
                                                type="number"
                                                value={config.registration.min_order_amount_for_guest}
                                                onChange={e => set('registration.min_order_amount_for_guest', e.target.value)}
                                                placeholder="Leave empty for no minimum"
                                            />
                                        </FormField>
                                        <p className="text-[10px] text-theme-muted mt-1">
                                            Orders above this amount will require the customer to be registered and logged in. Leave empty to allow all guest orders.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );

            case 'advanced':
                return (
                    <div className="space-y-6">
                        <div>
                            <SectionLabel>Store Status</SectionLabel>
                            <div className="space-y-4">
                                <Toggle checked={!!config.advanced.store_active} onChange={v => set('advanced.store_active', v)} label="Store is active and accepting orders" />
                                <div className="pt-2 border-t border-theme">
                                    <Toggle checked={!!config.advanced.maintenance_mode} onChange={v => set('advanced.maintenance_mode', v)} label="Enable maintenance mode" />
                                    {config.advanced.maintenance_mode && (
                                        <div className="mt-3">
                                            <FormField label="Maintenance Message">
                                                <TextArea value={config.advanced.maintenance_message} onChange={e => set('advanced.maintenance_message', e.target.value)} rows={2} />
                                            </FormField>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div>
                            <SectionLabel>Domain</SectionLabel>
                            <div className="max-w-md">
                                <FormField label="Custom Domain"><TextInput value={config.advanced.custom_domain} onChange={e => set('advanced.custom_domain', e.target.value)} /></FormField>
                            </div>
                            <div className="max-w-md mt-4">
                                <FormField label="Store Slug"><TextInput value={config.store_slug} onChange={e => set('store_slug', e.target.value)} /></FormField>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="space-y-4 sm:space-y-6 max-w-[1400px] mx-auto pb-6 sm:pb-10">
            <PageHeader title="Store Settings" subtitle="Configure your online storefront and integrations" icon={Store} />

            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
                {/* Sidebar Tabs */}
                <div className="lg:w-48 xl:w-56 flex-shrink-0 space-y-4">
                    <nav className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm overflow-hidden">
                        <div className="px-4 py-2 text-xs font-semibold text-theme-muted uppercase tracking-wide bg-theme-tertiary/30 border-b border-theme">
                            Company Settings
                        </div>
                        {COMPANY_TABS.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.key;
                            return (
                                <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium transition text-left border-b border-theme last:border-0 ${isActive ? 'bg-accent-gold/10 text-accent-gold' : 'text-theme-secondary hover:bg-theme-primary'}`}>
                                    <Icon size={15} className={isActive ? 'text-accent-gold' : 'text-theme-muted'} />{tab.label}
                                </button>
                            );
                        })}
                    </nav>

                    <nav className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm overflow-hidden">
                        <div className="px-4 py-2 text-xs font-semibold text-theme-muted uppercase tracking-wide bg-theme-tertiary/30 border-b border-theme">
                            Store Settings
                        </div>
                        {STORE_TABS.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.key;
                            return (
                                <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium transition text-left border-b border-theme last:border-0 ${isActive ? 'bg-accent-gold/10 text-accent-gold' : 'text-theme-secondary hover:bg-theme-primary'}`}>
                                    <Icon size={15} className={isActive ? 'text-accent-gold' : 'text-theme-muted'} />{tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Content Panel */}
                <div className="flex-1 min-w-0">
                    <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-5 sm:mb-6 pb-4 border-b border-theme">
                            <h2 className="text-base sm:text-lg font-semibold text-theme-primary">
                                {ALL_TABS.find(t => t.key === activeTab)?.label}
                            </h2>
                            <SaveButton onClick={handleSave} loading={saving} />
                        </div>
                        {renderTab()}
                        <div className="mt-6 pt-4 border-t border-theme flex justify-end">
                            <SaveButton onClick={handleSave} loading={saving} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StoreSettingsPage;
