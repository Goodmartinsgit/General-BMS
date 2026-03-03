import React, { useState, useEffect } from 'react';
import { Palette, Save, RefreshCw, Image, Type } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import CloudinaryUpload from '../components/common/CloudinaryUpload';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { useBranding } from '../context/BrandingContext';

const colorFields = [
    { key: 'primary_color', label: 'Primary Color', desc: 'Main brand color' },
    { key: 'secondary_color', label: 'Secondary Color', desc: 'Background and panels' },
    { key: 'accent_color', label: 'Accent Color', desc: 'Highlights and active elements' },
    { key: 'hover_color', label: 'Hover Color', desc: 'Button and link hover state' },
    { key: 'active_text_color', label: 'Active Text Color', desc: 'Text on active buttons and selected nav items' },
    { key: 'sidebar_bg_color', label: 'Sidebar Background', desc: 'Sidebar background override' },
    { key: 'navbar_bg_color', label: 'Navbar Background', desc: 'Top navbar override' },
    { key: 'button_color', label: 'Button Color', desc: 'Primary button color' },
    { key: 'background_color', label: 'App Background', desc: 'Main content background' },
];

const BrandingSettingsPage = () => {
    const { refreshBranding, setBrandingConfig } = useBranding();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState({
        logo_url: '', logo_type: 'icon_text', logo_icon_text: 'BMS', company_name: '',
        primary_color: '#D4AF37', secondary_color: '#1a1a2e', accent_color: '#D4AF37',
        font_family: 'Inter', sidebar_bg_color: '', navbar_bg_color: '', button_color: '',
        background_color: '', sidebar_name_size: 'medium',
        hover_color: '#C5A353', active_text_color: '#000000'
    });

    useEffect(() => { fetchConfig(); }, []);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const res = await api.get('/branding');
            setConfig(prev => ({ ...prev, ...res.data }));
        } catch (err) {
            toast.error('Failed to load branding settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await api.put('/branding', config);
            setBrandingConfig(res.data || config);
            toast.success('Branding settings saved');
        } catch (err) {
            toast.error('Failed to save branding settings');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field, value) => setConfig(prev => ({ ...prev, [field]: value }));

    const inputClass = "w-full px-3 py-2.5 bg-theme-primary border border-theme rounded-lg text-sm text-theme-primary placeholder-theme-muted focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all";
    const selectClass = "w-full px-3 py-2.5 bg-theme-primary border border-theme rounded-lg text-sm text-theme-primary focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all appearance-none cursor-pointer";

    const actions = (
        <div className="flex items-center gap-3">
            <button onClick={fetchConfig} className="px-4 py-2.5 text-sm font-medium text-theme-secondary bg-theme-tertiary hover:bg-theme-primary border border-theme rounded-lg transition-colors flex items-center gap-2">
                <RefreshCw size={16} /> Reset
            </button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2.5 text-sm font-semibold bg-accent-gold text-white rounded-lg hover:bg-accent-goldDark transition-colors flex items-center gap-2 disabled:opacity-50">
                {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />} {saving ? 'Saving...' : 'Save Changes'}
            </button>
        </div>
    );

    if (loading) {
        return (
            <div className="space-y-6 max-w-[1700px] mx-auto pb-10">
                <div className="animate-pulse"><div className="h-8 w-48 bg-theme-tertiary rounded mb-2"></div></div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {Array(3).fill(0).map((_, i) => (<div key={i} className="h-64 bg-theme-tertiary rounded-xl animate-pulse"></div>))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-[1700px] mx-auto pb-10">
            <PageHeader title="Branding Settings" subtitle="Customize your application appearance" icon={Palette} actions={actions} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Logo & Identity */}
                <div className="bg-theme-secondary rounded-xl border border-theme shadow-theme-sm p-6">
                    <h3 className="text-lg font-semibold text-theme-primary mb-5 flex items-center gap-2">
                        <Image size={18} className="text-accent-gold" /> Logo & Identity
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">Company Name</label>
                            <input type="text" value={config.company_name || ''} onChange={(e) => handleChange('company_name', e.target.value)} className={inputClass} placeholder="Your Company" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">Logo Type</label>
                            <select value={config.logo_type} onChange={(e) => handleChange('logo_type', e.target.value)} className={selectClass}>
                                <option value="icon_text">Icon + Text</option>
                                <option value="full">Full Logo Image</option>
                                <option value="none">Text Only</option>
                            </select>
                        </div>
                        {config.logo_type !== 'none' && (
                            <CloudinaryUpload
                                category="branding"
                                label="Logo Image"
                                value={config.logo_url || ''}
                                onChange={(url) => handleChange('logo_url', url)}
                            />
                        )}
                        {config.logo_type === 'icon_text' && (
                            <div>
                                <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">Icon Text</label>
                                <input type="text" maxLength={4} value={config.logo_icon_text || ''} onChange={(e) => handleChange('logo_icon_text', e.target.value)} className={`${inputClass} max-w-[120px]`} placeholder="BMS" />
                            </div>
                        )}
                        <div>
                            <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">Sidebar Name Size</label>
                            <select value={config.sidebar_name_size} onChange={(e) => handleChange('sidebar_name_size', e.target.value)} className={selectClass}>
                                <option value="small">Small</option>
                                <option value="medium">Medium</option>
                                <option value="large">Large</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Colors */}
                <div className="bg-theme-secondary rounded-xl border border-theme shadow-theme-sm p-6">
                    <h3 className="text-lg font-semibold text-theme-primary mb-5 flex items-center gap-2">
                        <Palette size={18} className="text-accent-gold" /> Colors
                    </h3>
                    <div className="space-y-4">
                        {colorFields.map(({ key, label, desc }) => (
                            <div key={key}>
                                <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">{label}</label>
                                <div className="flex items-center gap-3">
                                    <input type="color" value={config[key] || '#000000'} onChange={(e) => handleChange(key, e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border border-theme" />
                                    <input type="text" value={config[key] || ''} onChange={(e) => handleChange(key, e.target.value)} className={`${inputClass} flex-1`} placeholder="#000000" />
                                </div>
                                <p className="text-xs text-theme-muted mt-0.5">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Typography & Preview */}
                <div className="space-y-6">
                    <div className="bg-theme-secondary rounded-xl border border-theme shadow-theme-sm p-6">
                        <h3 className="text-lg font-semibold text-theme-primary mb-5 flex items-center gap-2">
                            <Type size={18} className="text-accent-gold" /> Typography
                        </h3>
                        <div>
                            <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">Font Family</label>
                            <select value={config.font_family} onChange={(e) => handleChange('font_family', e.target.value)} className={selectClass}>
                                <option value="Inter">Inter</option>
                                <option value="Roboto">Roboto</option>
                                <option value="Poppins">Poppins</option>
                                <option value="Open Sans">Open Sans</option>
                                <option value="Lato">Lato</option>
                                <option value="Montserrat">Montserrat</option>
                            </select>
                        </div>
                    </div>

                    {/* Live Preview */}
                    <div className="bg-theme-secondary rounded-xl border border-theme shadow-theme-sm p-6">
                        <h3 className="text-lg font-semibold text-theme-primary mb-5">Preview</h3>
                        <div className="rounded-lg border border-theme overflow-hidden" style={{ fontFamily: config.font_family }}>
                            {/* Mini sidebar */}
                            <div className="flex">
                                <div className="w-16 p-3 flex flex-col items-center gap-2" style={{ backgroundColor: config.sidebar_bg_color || config.secondary_color }}>
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: config.accent_color || config.primary_color }}>
                                        {config.logo_icon_text?.slice(0, 2) || 'BM'}
                                    </div>
                                    <div className="w-8 h-1 rounded" style={{ backgroundColor: config.primary_color, opacity: 0.3 }}></div>
                                    <div className="w-8 h-1 rounded" style={{ backgroundColor: config.primary_color, opacity: 0.2 }}></div>
                                    <div className="w-8 h-1 rounded" style={{ backgroundColor: config.primary_color, opacity: 0.2 }}></div>
                                </div>
                                <div className="flex-1 p-3" style={{ backgroundColor: config.background_color || '#0f0f1a' }}>
                                    <div className="h-4 rounded mb-2" style={{ backgroundColor: config.navbar_bg_color || config.secondary_color, width: '100%' }}></div>
                                    <div className="flex gap-2 mt-3">
                                        <div className="h-6 px-3 rounded text-xs flex items-center text-white font-medium" style={{ backgroundColor: config.button_color || config.accent_color }}>Button</div>
                                        <div className="h-6 px-3 rounded text-xs flex items-center border" style={{ borderColor: config.primary_color, color: config.primary_color }}>Outline</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BrandingSettingsPage;
