import React, { useState, useEffect, useCallback } from 'react';
import {
    Store, Palette, Home, Phone, Search, ShoppingCart, Settings,
    Plus, Trash2, Save, Upload, Image as ImageIcon, Loader2, Globe,
    ToggleLeft, ToggleRight, CheckSquare, Square,
} from 'lucide-react';
import { toast } from 'react-toastify';
import PageHeader from '../components/common/PageHeader';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { getStoreConfig, updateStoreConfig } from '../api/storeConfig';
import api from '../api/axios';

const TABS = [
    { key: 'general', label: 'General', icon: Store },
    { key: 'branding', label: 'Branding', icon: Palette },
    { key: 'homepage', label: 'Homepage', icon: Home },
    { key: 'contact', label: 'Contact & Social', icon: Phone },
    { key: 'seo', label: 'SEO', icon: Search },
    { key: 'commerce', label: 'Commerce', icon: ShoppingCart },
    { key: 'advanced', label: 'Advanced', icon: Settings },
];

const FONT_FAMILIES = [
    'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins',
    'Nunito', 'Raleway', 'Ubuntu', 'Playfair Display', 'Merriweather',
];

const CURRENCIES = ['NGN', 'USD', 'GBP', 'EUR', 'GHS', 'KES', 'ZAR', 'CAD', 'AUD'];

const SectionLabel = ({ children }) => (
    <h3 className="text-sm font-semibold text-theme-primary mb-3 pb-2 border-b border-theme">{children}</h3>
);

const FormField = ({ label, hint, children }) => (
    <div className="space-y-1.5">
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

const TextArea = ({ value, onChange, placeholder, rows = 3 }) => (
    <textarea
        value={value ?? ''}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2 text-sm bg-theme-primary border border-theme rounded-lg text-theme-primary placeholder-theme-muted focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition resize-none"
    />
);

const SelectInput = ({ value, onChange, children }) => (
    <select
        value={value ?? ''}
        onChange={onChange}
        className="w-full px-3 py-2 text-sm bg-theme-primary border border-theme rounded-lg text-theme-primary outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 transition cursor-pointer"
    >
        {children}
    </select>
);

const Toggle = ({ checked, onChange, label }) => (
    <label className="flex items-center gap-3 cursor-pointer group">
        <div
            onClick={() => onChange(!checked)}
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

const LogoUploadField = ({ label, value, onChange, category = 'branding' }) => {
    const [uploading, setUploading] = useState(false);

    const handleFileChange = async (e) => {
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
        <div className="space-y-2">
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
                    <label className="inline-flex items-center gap-2 cursor-pointer px-3 py-1.5 text-xs font-medium rounded-lg bg-theme-primary border border-theme text-theme-secondary hover:bg-theme-secondary transition">
                        {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                        {uploading ? 'Uploading...' : 'Upload Image'}
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={uploading} />
                    </label>
                    {value && (
                        <div className="mt-1">
                            <input
                                type="text"
                                value={value}
                                onChange={(e) => onChange(e.target.value)}
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

const ColorField = ({ label, value, onChange }) => (
    <div className="space-y-1.5">
        <label className="block text-xs font-medium text-theme-muted">{label}</label>
        <div className="flex items-center gap-2">
            <input
                type="color"
                value={value || '#000000'}
                onChange={(e) => onChange(e.target.value)}
                className="w-8 h-8 rounded border border-theme cursor-pointer bg-transparent p-0.5"
            />
            <input
                type="text"
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder="#000000"
                className="flex-1 px-3 py-1.5 text-xs bg-theme-primary border border-theme rounded-lg text-theme-primary outline-none focus:ring-2 focus:ring-accent-gold/20"
            />
        </div>
    </div>
);

const defaultConfig = {
    store_name: '',
    tagline: '',
    description: '',
    currency: 'NGN',
    store_slug: '',
    branding: {
        logo_primary: '',
        logo_icon: '',
        logo_dark: '',
        primary_color: '#d4a017',
        secondary_color: '#1a1a2e',
        accent_color: '#f0c040',
        background_color: '#ffffff',
        text_color: '#111827',
        font_family: 'Inter',
    },
    homepage: {
        promo_bar_enabled: false,
        promo_bar_text: '',
        hero_banners: [],
        featured_categories: [],
        featured_products: [],
    },
    contact: {
        email: '',
        phone: '',
        whatsapp: '',
        address: '',
        social: {
            facebook: '',
            instagram: '',
            twitter: '',
            youtube: '',
        },
    },
    seo: {
        meta_title: '',
        meta_description: '',
        og_image: '',
    },
    commerce: {
        tax_rate: 0,
        shipping_methods: [],
        payment_methods: { paystack: true, bank_transfer: false },
    },
    advanced: {
        maintenance_mode: false,
        maintenance_message: '',
        custom_domain: '',
        store_active: true,
    },
};

const StoreSettingsPage = () => {
    const [activeTab, setActiveTab] = useState('general');
    const [config, setConfig] = useState(defaultConfig);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Extra data for homepage
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const res = await getStoreConfig();
            const data = res.data;
            setConfig(prev => ({
                ...defaultConfig,
                ...data,
                branding: { ...defaultConfig.branding, ...(data.branding || {}) },
                homepage: { ...defaultConfig.homepage, ...(data.homepage || {}) },
                contact: {
                    ...defaultConfig.contact,
                    ...(data.contact || {}),
                    social: { ...defaultConfig.contact.social, ...(data.contact?.social || {}) },
                },
                seo: { ...defaultConfig.seo, ...(data.seo || {}) },
                commerce: {
                    ...defaultConfig.commerce,
                    ...(data.commerce || {}),
                    shipping_methods: data.commerce?.shipping_methods || [],
                    payment_methods: { ...defaultConfig.commerce.payment_methods, ...(data.commerce?.payment_methods || {}) },
                },
                advanced: { ...defaultConfig.advanced, ...(data.advanced || {}) },
            }));
        } catch (err) {
            console.error('Failed to load store config', err);
            toast.error('Failed to load store settings. Please refresh the page.');
        } finally {
            setLoading(false);
        }
    };

    const fetchSupportingData = async () => {
        try {
            const [catRes, prodRes] = await Promise.all([
                api.get('/products/categories').catch(() => ({ data: [] })),
                api.get('/products?limit=200').catch(() => ({ data: [] })),
            ]);
            setCategories(Array.isArray(catRes.data) ? catRes.data : catRes.data?.categories || []);
            setProducts(Array.isArray(prodRes.data) ? prodRes.data : prodRes.data?.products || []);
        } catch {}
    };

    useEffect(() => {
        fetchConfig();
        fetchSupportingData();
    }, []);

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

    const toSlug = (name) =>
        name.toLowerCase().trim()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');

    const handleStoreNameChange = (value) => {
        setConfig(prev => ({
            ...prev,
            store_name: value,
            store_slug: toSlug(value),
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateStoreConfig(config);
            toast.success('Store settings saved successfully!');
        } catch (err) {
            toast.error('Failed to save: ' + (err.response?.data?.message || err.message));
        } finally {
            setSaving(false);
        }
    };

    // Hero banner helpers
    const addHeroBanner = () => {
        set('homepage.hero_banners', [...(config.homepage.hero_banners || []), { image_url: '', title: '', subtitle: '', cta_text: '', cta_link: '' }]);
    };
    const updateHeroBanner = (idx, field, value) => {
        const banners = [...(config.homepage.hero_banners || [])];
        banners[idx] = { ...banners[idx], [field]: value };
        set('homepage.hero_banners', banners);
    };
    const removeHeroBanner = (idx) => {
        set('homepage.hero_banners', config.homepage.hero_banners.filter((_, i) => i !== idx));
    };

    // Shipping method helpers
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

    // Multi-select toggle helper
    const toggleArrayItem = (path, item) => {
        const arr = path.split('.').reduce((o, k) => o?.[k], config) || [];
        const next = arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];
        set(path, next);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <LoadingSpinner />
            </div>
        );
    }

    const renderTab = () => {
        switch (activeTab) {
            case 'general':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <FormField label="Store Name" hint="Your store's display name">
                            <TextInput value={config.store_name} onChange={e => handleStoreNameChange(e.target.value)} placeholder="My Awesome Store" />
                        </FormField>
                        <FormField label="Store Slug" hint="Slug is auto-generated from the store name. You can still edit it manually.">
                            <TextInput value={config.store_slug} onChange={e => set('store_slug', e.target.value)} placeholder="my-store" />
                            {config.store_slug && (
                                <p className="mt-1 text-[10px] text-theme-muted font-mono truncate">
                                    URL: /store/<span className="text-accent-gold">{config.store_slug}</span>
                                </p>
                            )}
                        </FormField>
                        <FormField label="Tagline">
                            <TextInput value={config.tagline} onChange={e => set('tagline', e.target.value)} placeholder="Quality products delivered fast" />
                        </FormField>
                        <FormField label="Currency">
                            <SelectInput value={config.currency} onChange={e => set('currency', e.target.value)}>
                                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </SelectInput>
                        </FormField>
                        <div className="md:col-span-2">
                            <FormField label="Store Description">
                                <TextArea value={config.description} onChange={e => set('description', e.target.value)} placeholder="Tell customers about your store..." rows={4} />
                            </FormField>
                        </div>
                    </div>
                );

            case 'branding':
                return (
                    <div className="space-y-6">
                        <div>
                            <SectionLabel>Logos</SectionLabel>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <LogoUploadField label="Primary Logo" value={config.branding.logo_primary} onChange={v => set('branding.logo_primary', v)} category="branding" />
                                <LogoUploadField label="Icon / Favicon" value={config.branding.logo_icon} onChange={v => set('branding.logo_icon', v)} category="branding" />
                                <LogoUploadField label="Dark Mode Logo" value={config.branding.logo_dark} onChange={v => set('branding.logo_dark', v)} category="branding" />
                            </div>
                        </div>
                        <div>
                            <SectionLabel>Colors</SectionLabel>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <ColorField label="Primary Color" value={config.branding.primary_color} onChange={v => set('branding.primary_color', v)} />
                                <ColorField label="Secondary Color" value={config.branding.secondary_color} onChange={v => set('branding.secondary_color', v)} />
                                <ColorField label="Accent Color" value={config.branding.accent_color} onChange={v => set('branding.accent_color', v)} />
                                <ColorField label="Background Color" value={config.branding.background_color} onChange={v => set('branding.background_color', v)} />
                                <ColorField label="Text Color" value={config.branding.text_color} onChange={v => set('branding.text_color', v)} />
                            </div>
                        </div>
                        <div>
                            <SectionLabel>Typography</SectionLabel>
                            <div className="max-w-xs">
                                <FormField label="Font Family">
                                    <SelectInput value={config.branding.font_family} onChange={e => set('branding.font_family', e.target.value)}>
                                        {FONT_FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
                                    </SelectInput>
                                </FormField>
                            </div>
                        </div>
                    </div>
                );

            case 'homepage':
                return (
                    <div className="space-y-6">
                        <div>
                            <SectionLabel>Promotional Bar</SectionLabel>
                            <div className="space-y-3">
                                <Toggle
                                    checked={config.homepage.promo_bar_enabled}
                                    onChange={v => set('homepage.promo_bar_enabled', v)}
                                    label="Enable promotional bar at top of store"
                                />
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
                                    <p className="text-xs text-theme-muted leading-relaxed mb-3">
                                        Choose from 5 desktop templates (Split, Full-Width, Fashion, Spotlight, Deals Grid) and 3 mobile templates, then set your heading, image, CTA and colours — all from the App Builder.
                                    </p>
                                    <a
                                        href="/app-builder"
                                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-accent-gold text-white rounded-lg hover:bg-accent-gold-dark transition"
                                    >
                                        Open App Builder →
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div>
                            <SectionLabel>Featured Categories</SectionLabel>
                            {categories.length === 0 ? (
                                <p className="text-sm text-theme-muted">No categories found.</p>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                    {categories.map(cat => {
                                        const selected = (config.homepage.featured_categories || []).includes(cat.id);
                                        return (
                                            <button
                                                key={cat.id}
                                                onClick={() => toggleArrayItem('homepage.featured_categories', cat.id)}
                                                className={`flex items-center gap-2 px-3 py-2 text-xs rounded-lg border transition text-left ${selected ? 'border-accent-gold bg-accent-gold/10 text-accent-gold' : 'border-theme bg-theme-primary text-theme-secondary hover:border-accent-gold/50'}`}
                                            >
                                                {selected ? <CheckSquare size={12} /> : <Square size={12} />}
                                                {cat.name || cat.category_name}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div>
                            <SectionLabel>Featured Products</SectionLabel>
                            {products.length === 0 ? (
                                <p className="text-sm text-theme-muted">No products found.</p>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-60 overflow-y-auto">
                                    {products.map(prod => {
                                        const selected = (config.homepage.featured_products || []).includes(prod.id);
                                        return (
                                            <button
                                                key={prod.id}
                                                onClick={() => toggleArrayItem('homepage.featured_products', prod.id)}
                                                className={`flex items-center gap-2 px-3 py-2 text-xs rounded-lg border transition text-left ${selected ? 'border-accent-gold bg-accent-gold/10 text-accent-gold' : 'border-theme bg-theme-primary text-theme-secondary hover:border-accent-gold/50'}`}
                                            >
                                                {selected ? <CheckSquare size={12} /> : <Square size={12} />}
                                                <span className="truncate">{prod.product_name || prod.name}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 'contact':
                return (
                    <div className="space-y-6">
                        <div>
                            <SectionLabel>Contact Information</SectionLabel>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField label="Contact Email">
                                    <TextInput type="email" value={config.contact.email} onChange={e => set('contact.email', e.target.value)} placeholder="hello@store.com" />
                                </FormField>
                                <FormField label="Phone Number">
                                    <TextInput value={config.contact.phone} onChange={e => set('contact.phone', e.target.value)} placeholder="+234 800 000 0000" />
                                </FormField>
                                <FormField label="WhatsApp Number" hint="Include country code">
                                    <TextInput value={config.contact.whatsapp} onChange={e => set('contact.whatsapp', e.target.value)} placeholder="+2348000000000" />
                                </FormField>
                                <div className="md:col-span-2">
                                    <FormField label="Business Address">
                                        <TextArea value={config.contact.address} onChange={e => set('contact.address', e.target.value)} placeholder="123 Main St, Lagos, Nigeria" rows={2} />
                                    </FormField>
                                </div>
                            </div>
                        </div>
                        <div>
                            <SectionLabel>Social Links</SectionLabel>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {['facebook', 'instagram', 'twitter', 'youtube'].map(platform => (
                                    <FormField key={platform} label={platform.charAt(0).toUpperCase() + platform.slice(1)}>
                                        <TextInput
                                            value={config.contact.social?.[platform] || ''}
                                            onChange={e => set(`contact.social.${platform}`, e.target.value)}
                                            placeholder={`https://${platform}.com/yourpage`}
                                        />
                                    </FormField>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 'seo':
                return (
                    <div className="space-y-4">
                        <FormField label="Meta Title" hint="Recommended: 50–60 characters">
                            <TextInput value={config.seo.meta_title} onChange={e => set('seo.meta_title', e.target.value)} placeholder="My Store — Quality Products" />
                        </FormField>
                        <FormField label="Meta Description" hint="Recommended: 150–160 characters">
                            <TextArea value={config.seo.meta_description} onChange={e => set('seo.meta_description', e.target.value)} placeholder="Discover quality products at great prices..." rows={3} />
                        </FormField>
                        <FormField label="OG Image URL" hint="Image shown when sharing on social media (1200x630px recommended)">
                            <TextInput value={config.seo.og_image} onChange={e => set('seo.og_image', e.target.value)} placeholder="https://..." />
                        </FormField>
                        {config.seo.og_image && (
                            <div>
                                <p className="text-xs text-theme-muted mb-2">Preview:</p>
                                <img src={config.seo.og_image} alt="OG preview" className="h-24 w-auto rounded border border-theme object-cover" />
                            </div>
                        )}
                    </div>
                );

            case 'commerce':
                return (
                    <div className="space-y-6">
                        <div>
                            <SectionLabel>Tax</SectionLabel>
                            <div className="max-w-xs">
                                <FormField label="Tax Rate (%)" hint="Applied to all products unless overridden">
                                    <TextInput type="number" value={config.commerce.tax_rate} onChange={e => set('commerce.tax_rate', parseFloat(e.target.value) || 0)} placeholder="7.5" />
                                </FormField>
                            </div>
                        </div>

                        <div>
                            <SectionLabel>Payment Methods</SectionLabel>
                            <div className="space-y-3">
                                <Toggle
                                    checked={!!config.commerce.payment_methods?.paystack}
                                    onChange={v => set('commerce.payment_methods.paystack', v)}
                                    label="Paystack (card payments)"
                                />
                                <Toggle
                                    checked={!!config.commerce.payment_methods?.bank_transfer}
                                    onChange={v => set('commerce.payment_methods.bank_transfer', v)}
                                    label="Bank Transfer (manual verification)"
                                />
                            </div>
                        </div>

                        <div>
                            <SectionLabel>Shipping Methods</SectionLabel>
                            <div className="space-y-3">
                                {(config.commerce.shipping_methods || []).map((method, idx) => (
                                    <div key={idx} className="bg-theme-primary rounded-lg border border-theme p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-semibold text-theme-muted">Shipping Method {idx + 1}</span>
                                            <button onClick={() => removeShippingMethod(idx)} className="p-1 text-theme-muted hover:text-red-500 transition">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <FormField label="Name">
                                                <TextInput value={method.name} onChange={e => updateShippingMethod(idx, 'name', e.target.value)} placeholder="Standard Delivery" />
                                            </FormField>
                                            <FormField label="Price">
                                                <TextInput type="number" value={method.price} onChange={e => updateShippingMethod(idx, 'price', parseFloat(e.target.value) || 0)} placeholder="0" />
                                            </FormField>
                                            <FormField label="Description">
                                                <TextInput value={method.description} onChange={e => updateShippingMethod(idx, 'description', e.target.value)} placeholder="3–5 business days" />
                                            </FormField>
                                        </div>
                                    </div>
                                ))}
                                <button
                                    onClick={addShippingMethod}
                                    className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-dashed border-theme text-theme-muted hover:border-accent-gold hover:text-accent-gold transition"
                                >
                                    <Plus size={14} /> Add Shipping Method
                                </button>
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
                                <Toggle
                                    checked={!!config.advanced.store_active}
                                    onChange={v => set('advanced.store_active', v)}
                                    label="Store is active and accepting orders"
                                />
                                <div className="pt-2 border-t border-theme">
                                    <Toggle
                                        checked={!!config.advanced.maintenance_mode}
                                        onChange={v => set('advanced.maintenance_mode', v)}
                                        label="Enable maintenance mode"
                                    />
                                    {config.advanced.maintenance_mode && (
                                        <div className="mt-3">
                                            <FormField label="Maintenance Message">
                                                <TextArea
                                                    value={config.advanced.maintenance_message}
                                                    onChange={e => set('advanced.maintenance_message', e.target.value)}
                                                    placeholder="We're currently undergoing maintenance. We'll be back shortly!"
                                                    rows={2}
                                                />
                                            </FormField>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div>
                            <SectionLabel>Domain</SectionLabel>
                            <div className="max-w-md">
                                <FormField label="Custom Domain" hint="Point your domain's DNS to this store (e.g. shop.yourbrand.com)">
                                    <TextInput value={config.advanced.custom_domain} onChange={e => set('advanced.custom_domain', e.target.value)} placeholder="shop.yourbrand.com" />
                                </FormField>
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
            <PageHeader
                title="Store Settings"
                subtitle="Configure your online storefront"
                icon={Store}
            />

            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
                {/* Sidebar Tabs */}
                <div className="lg:w-48 xl:w-56 flex-shrink-0">
                    <nav className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm overflow-hidden">
                        {TABS.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium transition text-left border-b border-theme last:border-0 ${isActive ? 'bg-accent-gold/10 text-accent-gold' : 'text-theme-secondary hover:bg-theme-primary hover:text-theme-primary'}`}
                                >
                                    <Icon size={15} className={isActive ? 'text-accent-gold' : 'text-theme-muted'} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Content Panel */}
                <div className="flex-1 min-w-0">
                    <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-5 sm:mb-6">
                            <h2 className="text-base sm:text-lg font-semibold text-theme-primary">
                                {TABS.find(t => t.key === activeTab)?.label}
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
