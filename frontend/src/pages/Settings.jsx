import React, { useState, useEffect, useCallback } from 'react';
import { useBranding } from '../context/BrandingContext';
import { useTheme, themes as themeList } from '../context/ThemeContext';
import { useCurrency } from '../context/CurrencyContext';
import { CURRENCIES, getCurrencySymbol } from '../utils/currency';
import {
    Settings as SettingsIcon, Building2, CreditCard, Bell, Shield, Palette,
    Save, RefreshCw, Receipt, Calendar, Calculator, Eye, EyeOff, ShieldAlert,
    Plus, Lock, Unlock, Play, Trash2, XCircle, Image, Type, FileText, Mail,
    QrCode, Barcode, Hash, Layout, Monitor, ChevronRight, ChevronDown, ChevronUp, Globe, Clock, Check
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import SearchableSelect from '../components/ui/SearchableSelect';
import CloudinaryUpload from '../components/common/CloudinaryUpload';
import { toast } from 'react-toastify';
import { settingsAPI } from '../api/settings';
import { fiscalPeriodsAPI } from '../api/fiscalPeriods';
import api from '../api/axios';

// ─── Shared style tokens ─────────────────────────────────────────────────────
const inputClass = "w-full px-2.5 sm:px-3 py-2 sm:py-2.5 bg-theme-primary border border-theme rounded-lg text-xs sm:text-sm text-theme-primary placeholder-theme-muted focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all";
const selectClass = "w-full px-2.5 sm:px-3 py-2 sm:py-2.5 bg-theme-primary border border-theme rounded-lg text-xs sm:text-sm text-theme-primary focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all appearance-none cursor-pointer";
const labelClass = "block text-[10px] sm:text-xs font-medium text-theme-muted uppercase tracking-wider mb-1 sm:mb-1.5";
const btnPrimary = "px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold bg-accent-gold text-white rounded-lg hover:bg-accent-goldDark transition-colors flex items-center justify-center gap-1.5 sm:gap-2 disabled:opacity-50 w-full sm:w-auto";
const btnSecondary = "px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-theme-secondary bg-theme-tertiary hover:bg-theme-primary border border-theme rounded-lg transition-colors flex items-center justify-center gap-1.5 sm:gap-2 w-full sm:w-auto";

// ─── Shared helpers ──────────────────────────────────────────────────────────
const ToggleSetting = ({ label, description, checked, onChange }) => (
    <div className="flex items-center justify-between py-3 border-b border-theme last:border-0">
        <div>
            <p className="font-medium text-sm text-theme-primary">{label}</p>
            {description && <p className="text-xs text-theme-muted mt-0.5">{description}</p>}
        </div>
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${checked ? 'bg-accent-gold' : 'bg-theme-tertiary'}`}
        >
            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
    </div>
);

const SectionHeader = ({ title, subtitle }) => (
    <div className="mb-6">
        <h2 className="text-lg font-semibold text-theme-primary">{title}</h2>
        {subtitle && <p className="text-sm text-theme-muted mt-1">{subtitle}</p>}
    </div>
);

const SaveBar = ({ onSave, onReset, saving, hasChanges }) => (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-theme mt-4 sm:mt-6">
        {hasChanges && <span className="text-xs sm:text-sm text-accent-gold font-medium animate-pulse">Unsaved changes</span>}
        <div className="hidden sm:block flex-1" />
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button type="button" onClick={onReset} disabled={saving} className={btnSecondary}>
                <RefreshCw size={13} className="sm:w-[15px] sm:h-[15px]" /> Reset
            </button>
            <button type="button" onClick={onSave} disabled={saving || !hasChanges} className={btnPrimary}>
                {saving ? <RefreshCw size={13} className="sm:w-[15px] sm:h-[15px] animate-spin" /> : <Save size={13} className="sm:w-[15px] sm:h-[15px]" />}
                {saving ? 'Saving…' : 'Save Changes'}
            </button>
        </div>
    </div>
);

// ── African timezone data ─────────────────────────────────────────────────
const AFRICA_TIMEZONES = [
    {
        label: 'UTC+0 · GMT — West / Atlantic Africa',
        zones: [
            { value: 'Africa/Abidjan',    label: "Abidjan — Côte d'Ivoire · Burkina Faso · Gambia · Guinea · Guinea-Bissau · Liberia · Mali · Mauritania · Senegal · Sierra Leone · Togo" },
            { value: 'Africa/Accra',      label: 'Accra — Ghana' },
            { value: 'Africa/Sao_Tome',   label: 'São Tomé — São Tomé & Príncipe' },
        ],
    },
    {
        label: 'UTC+1 · WAT — West Africa Time',
        zones: [
            { value: 'Africa/Lagos',       label: 'Lagos — Nigeria' },
            { value: 'Africa/Luanda',      label: 'Luanda — Angola' },
            { value: 'Africa/Bangui',      label: 'Bangui — Central African Republic' },
            { value: 'Africa/Brazzaville', label: 'Brazzaville — Republic of Congo' },
            { value: 'Africa/Kinshasa',    label: 'Kinshasa — DR Congo (West)' },
            { value: 'Africa/Douala',      label: 'Douala — Cameroon' },
            { value: 'Africa/Libreville',  label: 'Libreville — Gabon' },
            { value: 'Africa/Malabo',      label: 'Malabo — Equatorial Guinea' },
            { value: 'Africa/Ndjamena',    label: 'Ndjamena — Chad' },
            { value: 'Africa/Niamey',      label: 'Niamey — Niger' },
            { value: 'Africa/Porto-Novo',  label: 'Porto-Novo — Benin' },
        ],
    },
    {
        label: 'UTC+1 · CET / WET — North Africa',
        zones: [
            { value: 'Africa/Algiers',    label: 'Algiers — Algeria' },
            { value: 'Africa/Tunis',      label: 'Tunis — Tunisia' },
            { value: 'Africa/Casablanca', label: 'Casablanca — Morocco' },
            { value: 'Africa/El_Aaiun',   label: 'El Aaiun — Western Sahara' },
        ],
    },
    {
        label: 'UTC+2 · CAT — Central Africa Time',
        zones: [
            { value: 'Africa/Johannesburg', label: 'Johannesburg — South Africa' },
            { value: 'Africa/Maseru',       label: 'Maseru — Lesotho' },
            { value: 'Africa/Mbabane',      label: 'Mbabane — Eswatini' },
            { value: 'Africa/Harare',       label: 'Harare — Zimbabwe' },
            { value: 'Africa/Lusaka',       label: 'Lusaka — Zambia' },
            { value: 'Africa/Maputo',       label: 'Maputo — Mozambique' },
            { value: 'Africa/Blantyre',     label: 'Blantyre — Malawi' },
            { value: 'Africa/Gaborone',     label: 'Gaborone — Botswana' },
            { value: 'Africa/Lubumbashi',   label: 'Lubumbashi — DR Congo (East)' },
            { value: 'Africa/Kigali',       label: 'Kigali — Rwanda' },
            { value: 'Africa/Bujumbura',    label: 'Bujumbura — Burundi' },
            { value: 'Africa/Windhoek',     label: 'Windhoek — Namibia' },
        ],
    },
    {
        label: 'UTC+2 · EET — North-East Africa',
        zones: [
            { value: 'Africa/Cairo',   label: 'Cairo — Egypt' },
            { value: 'Africa/Tripoli', label: 'Tripoli — Libya' },
        ],
    },
    {
        label: 'UTC+3 · EAT — East Africa Time',
        zones: [
            { value: 'Africa/Nairobi',       label: 'Nairobi — Kenya' },
            { value: 'Africa/Dar_es_Salaam', label: 'Dar es Salaam — Tanzania' },
            { value: 'Africa/Kampala',       label: 'Kampala — Uganda' },
            { value: 'Africa/Addis_Ababa',   label: 'Addis Ababa — Ethiopia' },
            { value: 'Africa/Asmara',        label: 'Asmara — Eritrea' },
            { value: 'Africa/Mogadishu',     label: 'Mogadishu — Somalia' },
            { value: 'Africa/Djibouti',      label: 'Djibouti — Djibouti' },
            { value: 'Africa/Juba',          label: 'Juba — South Sudan' },
            { value: 'Africa/Khartoum',      label: 'Khartoum — Sudan' },
            { value: 'Africa/Antananarivo',  label: 'Antananarivo — Madagascar' },
            { value: 'Indian/Comoro',        label: 'Moroni — Comoros' },
            { value: 'Indian/Mayotte',       label: 'Mayotte — Mayotte' },
        ],
    },
    {
        label: 'UTC+4 · Indian Ocean Islands',
        zones: [
            { value: 'Indian/Mauritius', label: 'Port Louis — Mauritius' },
            { value: 'Indian/Mahe',      label: 'Mahé — Seychelles' },
            { value: 'Indian/Reunion',   label: 'Saint-Denis — Réunion' },
        ],
    },
];

// ── Pre-built option lists for SearchableSelect ─────────────────────────────
const CURRENCY_OPTIONS = Object.values(CURRENCIES).map(c => ({
    value: c.code,
    label: `${c.code} — ${c.symbol} — ${c.name}`,
}));

const TIMEZONE_OPTIONS = [
    ...AFRICA_TIMEZONES.map(g => ({
        group: g.label,
        items: g.zones.map(z => ({ value: z.value, label: z.label })),
    })),
    {
        group: 'Other Timezones',
        items: [
            { value: 'UTC',                  label: 'UTC — Coordinated Universal Time' },
            { value: 'Europe/London',         label: 'London — UK (GMT/BST)' },
            { value: 'America/New_York',      label: 'New York — Eastern Time (ET)' },
            { value: 'America/Chicago',       label: 'Chicago — Central Time (CT)' },
            { value: 'America/Los_Angeles',   label: 'Los Angeles — Pacific Time (PT)' },
        ],
    },
];

// ════════════════════════════════════════════════════════════════════════════
// SECTION: General
// ════════════════════════════════════════════════════════════════════════════
const GeneralSection = ({ shared, onChange, onSave, onReset, saving }) => {
    const g = shared.general;
    return (
        <div>
            <SectionHeader title="General Settings" subtitle="Basic company information and regional preferences" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label className={labelClass}>Company Name</label>
                    <input type="text" value={g.company_name} onChange={e => onChange('general', 'company_name', e.target.value)} className={inputClass} placeholder="Enter company name" />
                </div>
                <div>
                    <label className={labelClass}>Company Email</label>
                    <input type="email" value={g.company_email} onChange={e => onChange('general', 'company_email', e.target.value)} className={inputClass} placeholder="info@company.com" />
                </div>
                <div>
                    <label className={labelClass}>Company Phone</label>
                    <input type="text" value={g.company_phone} onChange={e => onChange('general', 'company_phone', e.target.value)} className={inputClass} placeholder="+1 000 000 0000" />
                </div>
                <div>
                    <label className={labelClass}>Currency</label>
                    <SearchableSelect
                        value={g.currency}
                        onChange={val => onChange('general', 'currency', val)}
                        options={CURRENCY_OPTIONS}
                        placeholder="Select currency"
                        searchPlaceholder="Search currencies…"
                    />
                </div>
                <div>
                    <label className={labelClass}>Currency Symbol</label>
                    <input type="text" readOnly value={getCurrencySymbol(g.currency)} className={`${inputClass} max-w-[100px] opacity-70 cursor-default`} tabIndex={-1} />
                </div>
                <div className="md:col-span-2">
                    <label className={labelClass}>Company Address</label>
                    <textarea value={g.company_address} onChange={e => onChange('general', 'company_address', e.target.value)} rows={3} className={inputClass} placeholder="Enter company address" />
                </div>
                <div>
                    <label className={labelClass}>Timezone</label>
                    <SearchableSelect
                        value={g.timezone}
                        onChange={val => onChange('general', 'timezone', val)}
                        options={TIMEZONE_OPTIONS}
                        placeholder="Select timezone"
                        searchPlaceholder="Search timezones…"
                    />
                </div>
                <div>
                    <label className={labelClass}>Date Format</label>
                    <select value={g.date_format} onChange={e => onChange('general', 'date_format', e.target.value)} className={selectClass}>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                </div>
            </div>
            <SaveBar onSave={() => onSave('general')} onReset={() => onReset('general')} saving={saving} hasChanges={shared.hasChanges.general} />
        </div>
    );
};

// ════════════════════════════════════════════════════════════════════════════
// SECTION: Branding
// ════════════════════════════════════════════════════════════════════════════
const colorFields = [
    { key: 'primary_color',   label: 'Primary Color',     desc: 'Main brand colour' },
    { key: 'secondary_color', label: 'Secondary Color',   desc: 'Background and panels' },
    { key: 'accent_color',    label: 'Accent Color',      desc: 'Highlights and active elements' },
    { key: 'hover_color',     label: 'Hover Color',       desc: 'Button and link hover state' },
    { key: 'active_text_color', label: 'Active Text Color', desc: 'Text on active buttons and selected nav items' },
    { key: 'sidebar_bg_color',label: 'Sidebar Background',desc: 'Sidebar background override' },
    { key: 'navbar_bg_color', label: 'Navbar Background', desc: 'Top navbar override' },
    { key: 'button_color',    label: 'Button Color',      desc: 'Primary button colour' },
    { key: 'background_color',label: 'App Background',    desc: 'Main content background' },
];

const BrandingSection = () => {
    const { refreshBranding, setBrandingConfig } = useBranding();
    const [cfg, setCfg] = useState({
        logo_url: '', logo_type: 'icon_text', logo_icon_text: 'BMS',
        primary_color: '#D4AF37', secondary_color: '#1a1a2e', accent_color: '#D4AF37',
        font_family: 'Inter', sidebar_bg_color: '', navbar_bg_color: '',
        button_color: '', background_color: '', sidebar_name_size: 'medium',
        hover_color: '#C5A353', active_text_color: '#000000'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    const fetchConfig = useCallback(async () => {
        setLoading(true);
        try { const r = await api.get('/branding'); setCfg(p => ({ ...p, ...r.data })); setHasChanges(false); }
        catch { toast.error('Failed to load branding settings'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchConfig(); }, [fetchConfig]);

    const set = (field, value) => { setCfg(p => ({ ...p, [field]: value })); setHasChanges(true); };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await api.put('/branding', cfg);
            toast.success('Branding saved');
            setHasChanges(false);
            // Push saved config directly into BrandingContext so sidebar updates instantly
            setBrandingConfig(res.data || cfg);
        }
        catch { toast.error('Failed to save branding'); }
        finally { setSaving(false); }
    };

    if (loading) return <div className="space-y-4">{Array(4).fill(0).map((_, i) => <div key={i} className="h-12 bg-theme-tertiary rounded-lg animate-pulse" />)}</div>;

    return (
        <div>
            <SectionHeader title="Branding" subtitle="Logo, colours, and typography" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Identity */}
                <div className="space-y-5">
                    <h3 className="text-xs font-semibold text-theme-muted uppercase tracking-wider flex items-center gap-2"><Image size={13} className="text-accent-gold" /> Logo & Identity</h3>
                    <div>
                        <label className={labelClass}>Logo Type</label>
                        <select value={cfg.logo_type} onChange={e => set('logo_type', e.target.value)} className={selectClass}>
                            <option value="icon_text">Icon + Company Name</option>
                            <option value="full">Full Logo Image</option>
                            <option value="none">Company Name Only</option>
                        </select>
                        <p className="text-xs text-theme-muted mt-1">
                            {cfg.logo_type === 'icon_text' && 'Displays an icon alongside the company name set in General Settings.'}
                            {cfg.logo_type === 'full' && 'Displays only the uploaded logo image, no text.'}
                            {cfg.logo_type === 'none' && 'Displays only the company name set in General Settings.'}
                        </p>
                    </div>
                    {cfg.logo_type !== 'none' && (
                        <CloudinaryUpload category="branding" label="Logo Image" value={cfg.logo_url || ''} onChange={url => set('logo_url', url)} />
                    )}
                    {cfg.logo_type === 'icon_text' && (
                        <div>
                            <label className={labelClass}>Icon Text <span className="normal-case font-normal">(shown when no logo is uploaded)</span></label>
                            <input type="text" maxLength={4} value={cfg.logo_icon_text || ''} onChange={e => set('logo_icon_text', e.target.value)} className={`${inputClass} max-w-[120px]`} placeholder="BMS" />
                            <p className="text-xs text-theme-muted mt-1">Up to 4 characters — used as the icon placeholder</p>
                        </div>
                    )}
                    <div>
                        <label className={labelClass}>Sidebar Name Size</label>
                        <select value={cfg.sidebar_name_size} onChange={e => set('sidebar_name_size', e.target.value)} className={selectClass}>
                            <option value="small">Small</option>
                            <option value="medium">Medium</option>
                            <option value="large">Large</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Font Family</label>
                        <select value={cfg.font_family} onChange={e => set('font_family', e.target.value)} className={selectClass}>
                            {['Inter','Roboto','Poppins','Open Sans','Lato','Montserrat'].map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                    </div>
                </div>

                {/* Colours */}
                <div className="space-y-4">
                    <h3 className="text-xs font-semibold text-theme-muted uppercase tracking-wider flex items-center gap-2"><Palette size={13} className="text-accent-gold" /> Colours</h3>
                    {colorFields.map(({ key, label, desc }) => (
                        <div key={key}>
                            <label className={labelClass}>{label}</label>
                            <div className="flex items-center gap-3">
                                <input type="color" value={cfg[key] || '#000000'} onChange={e => set(key, e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border border-theme" />
                                <input type="text" value={cfg[key] || ''} onChange={e => set(key, e.target.value)} className={`${inputClass} flex-1`} placeholder="#000000" />
                            </div>
                            <p className="text-xs text-theme-muted mt-0.5">{desc}</p>
                        </div>
                    ))}
                </div>
            </div>
            <SaveBar onSave={handleSave} onReset={fetchConfig} saving={saving} hasChanges={hasChanges} />
        </div>
    );
};

// ════════════════════════════════════════════════════════════════════════════
// SECTION: Tax
// ════════════════════════════════════════════════════════════════════════════
const TaxSection = () => {
    const [s, setS] = useState({ tax_enabled: true, standard_rate: 0, reduced_rate: 0, zero_rate: 0, tax_application_mode: 'exclusive', tax_number: '', effective_date: new Date().toISOString().split('T')[0] });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try { const r = await api.get('/tax-settings'); setS(p => ({ ...p, ...r.data })); setHasChanges(false); }
        catch { toast.error('Failed to load tax settings'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const set = (field, value) => { setS(p => ({ ...p, [field]: value })); setHasChanges(true); };

    const handleSave = async () => {
        setSaving(true);
        try { await api.put('/tax-settings', s); toast.success('Tax settings saved'); setHasChanges(false); }
        catch { toast.error('Failed to save tax settings'); }
        finally { setSaving(false); }
    };

    if (loading) return <div className="space-y-4">{Array(5).fill(0).map((_, i) => <div key={i} className="h-12 bg-theme-tertiary rounded-lg animate-pulse" />)}</div>;

    return (
        <div>
            <SectionHeader title="Tax Settings" subtitle="Configure tax rates and registration details" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-5">
                    <ToggleSetting label="Enable Tax" description="Apply tax calculations to transactions" checked={s.tax_enabled} onChange={v => set('tax_enabled', v)} />
                    {s.tax_enabled && (
                        <>
                            <div>
                                <label className={labelClass}>Standard Tax Rate (%)</label>
                                <input type="number" step="0.01" min="0" max="100" value={s.standard_rate} onChange={e => set('standard_rate', parseFloat(e.target.value) || 0)} className={`${inputClass} max-w-[200px]`} />
                                <p className="text-xs text-theme-muted mt-1">Applied to most goods and services</p>
                            </div>
                            <div>
                                <label className={labelClass}>Reduced Tax Rate (%)</label>
                                <input type="number" step="0.01" min="0" max="100" value={s.reduced_rate} onChange={e => set('reduced_rate', parseFloat(e.target.value) || 0)} className={`${inputClass} max-w-[200px]`} />
                                <p className="text-xs text-theme-muted mt-1">For eligible items with lower tax rates</p>
                            </div>
                            <div>
                                <label className={labelClass}>Zero-Rated (%)</label>
                                <input type="number" value={s.zero_rate} disabled className={`${inputClass} max-w-[200px] opacity-60`} />
                                <p className="text-xs text-theme-muted mt-1">Always 0% — exempt items</p>
                            </div>
                            <div>
                                <label className={labelClass}>Tax Application Mode</label>
                                <div className="grid grid-cols-2 gap-3 mt-1">
                                    {[
                                        { value: 'exclusive', label: 'Tax Exclusive', desc: 'Tax added on top of prices' },
                                        { value: 'inclusive', label: 'Tax Inclusive', desc: 'Prices already include tax' }
                                    ].map(o => (
                                        <button key={o.value} type="button" onClick={() => set('tax_application_mode', o.value)}
                                            className={`p-3 rounded-lg border text-left transition-all ${s.tax_application_mode === o.value ? 'border-accent-gold bg-accent-gold/10 ring-2 ring-accent-gold/20' : 'border-theme bg-theme-primary hover:border-accent-gold/30'}`}>
                                            <p className={`text-sm font-semibold ${s.tax_application_mode === o.value ? 'text-accent-gold' : 'text-theme-primary'}`}>{o.label}</p>
                                            <p className="text-xs text-theme-muted mt-0.5">{o.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
                <div className="space-y-5">
                    <h3 className="text-xs font-semibold text-theme-muted uppercase tracking-wider">Tax Registration</h3>
                    <div>
                        <label className={labelClass}>Tax Identification Number (TIN)</label>
                        <input type="text" value={s.tax_number} onChange={e => set('tax_number', e.target.value)} placeholder="Enter your TIN" className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Effective Date</label>
                        <input type="date" value={s.effective_date?.split('T')[0] || ''} onChange={e => set('effective_date', e.target.value)} className={inputClass} />
                        <p className="text-xs text-theme-muted mt-1">Date these tax rates take effect</p>
                    </div>
                    {s.tax_enabled && (
                        <div className="p-4 bg-theme-primary rounded-lg border border-theme">
                            <h4 className="text-sm font-semibold text-theme-primary mb-3">Current Tax Summary</h4>
                            <div className="space-y-2 text-sm">
                                {[['Standard Rate', `${s.standard_rate}%`], ['Reduced Rate', `${s.reduced_rate}%`], ['Mode', s.tax_application_mode], ['TIN', s.tax_number || 'Not set']].map(([k, v]) => (
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
            <SaveBar onSave={handleSave} onReset={fetchData} saving={saving} hasChanges={hasChanges} />
        </div>
    );
};

// ════════════════════════════════════════════════════════════════════════════
// SECTION: Receipt
// ════════════════════════════════════════════════════════════════════════════
const RECEIPT_TEMPLATES = [
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
    { val: 'auto', label: 'Auto' },
    { val: 'pdf', label: 'PDF' },
    { val: 'image', label: 'Image' },
];

const MiniReceiptPreview = ({ template, isSelected }) => (
    <div className="rounded-lg overflow-hidden border"
        style={{ borderColor: isSelected ? template.accent : 'transparent', background: `linear-gradient(135deg, ${template.color} 0%, ${template.color}dd 100%)` }}>
        <div className="p-2 h-[60px] sm:h-[68px] flex flex-col justify-between">
            <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded-sm" style={{ background: template.accent, opacity: 0.9 }} />
                <div className="flex-1 space-y-0.5">
                    <div className="h-1 rounded-full w-3/4" style={{ background: template.accent, opacity: 0.7 }} />
                    <div className="h-0.5 rounded-full w-1/2 bg-white/20" />
                </div>
            </div>
            <div className="space-y-[2px]">
                <div className="flex justify-between"><div className="h-0.5 rounded-full w-2/3 bg-white/15" /><div className="h-0.5 rounded-full w-1/4 bg-white/15" /></div>
                <div className="flex justify-between"><div className="h-0.5 rounded-full w-1/2 bg-white/15" /><div className="h-0.5 rounded-full w-1/5 bg-white/15" /></div>
            </div>
            <div className="flex justify-between items-center pt-0.5 border-t border-white/10">
                <div className="h-1 rounded-full w-1/4 bg-white/25" />
                <div className="h-1 rounded-full w-1/3" style={{ background: template.accent, opacity: 0.8 }} />
            </div>
        </div>
    </div>
);

// ── Auto-contrast helper: returns light or dark text based on background luminance ──
const getContrastTextColor = (bgColor) => {
    if (!bgColor || bgColor.length < 4) return '#111827';
    let hex = bgColor.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    if (hex.length !== 6) return '#111827';
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    // sRGB luminance
    const lum = 0.2126 * (r <= 0.03928 ? r / 12.92 : ((r + 0.055) / 1.055) ** 2.4)
              + 0.7152 * (g <= 0.03928 ? g / 12.92 : ((g + 0.055) / 1.055) ** 2.4)
              + 0.0722 * (b <= 0.03928 ? b / 12.92 : ((b + 0.055) / 1.055) ** 2.4);
    return lum > 0.4 ? '#111827' : '#f9fafb';
};

// ── Receipt Live Preview (template-aware) ──
const SAMPLE_SALE = {
    receipt_number: 'RCP-00247',
    date: new Date().toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    customer_name: 'John Doe',
    customer_phone: '08012345678',
    cashier: 'Admin User',
    referrer: 'Jane Smith',
    items: [
        { name: 'Premium Floor Tile', code: 'FLR-001', qty: 3, price: 5000, total: 15000 },
        { name: 'Wall Tile Set', code: 'WLL-002', qty: 1, price: 8500, total: 8500 },
    ],
    subtotal: 23500,
    discount: 500,
    tax: 0,
    total: 23000,
    paid: 25000,
    change: 2000,
    payment_method: 'Cash',
};

const ReceiptLivePreview = ({ cfg, template, cs }) => {
    const sale = SAMPLE_SALE;
    const tid = cfg.template_id || 1;
    const accent = cfg.receipt_accent_color || template.accent;
    const bgColor = cfg.receipt_bg_color || '#ffffff';
    const textColor = getContrastTextColor(bgColor);
    const mutedColor = textColor === '#f9fafb' ? '#d1d5db99' : '#6b728099';
    const fmt = (v) => `${cs}${Number(v).toLocaleString('en-NG')}`;

    if (cfg.show_tax_breakdown && cfg.tax_rate > 0) {
        sale.tax = Math.round((sale.subtotal - sale.discount) * cfg.tax_rate / 100);
    } else {
        sale.tax = 0;
    }

    // Shared pieces — use dynamic colors
    const Logo = () => cfg.show_logo && cfg.company_logo_url ? <img src={cfg.company_logo_url} alt="Logo" className="w-10 h-10 object-contain" /> : null;
    const CompanyName = ({ className = '', style: s = {} }) => <p className={`font-bold ${className}`} style={s}>{cfg.company_name || 'Your Business'}</p>;
    const CompanyDetails = ({ className = '', size = 'text-[8px]' }) => cfg.show_company_details ? (
        <div className={`${size} ${className}`} style={{ color: mutedColor }}>
            {cfg.company_address && <p>{cfg.company_address}</p>}
            {cfg.company_phone && <p>Tel: {cfg.company_phone}</p>}
            {cfg.company_email && <p>{cfg.company_email}</p>}
            {cfg.company_website && <p>{cfg.company_website}</p>}
        </div>
    ) : null;
    const TaxNumber = ({ className = '' }) => cfg.show_tax_number && cfg.tax_number ? <p className={`text-[8px] ${className}`} style={{ color: mutedColor }}>{cfg.tax_label || 'TIN'}: {cfg.tax_number}</p> : null;
    const Dash = () => <div className="my-1.5" style={{ borderTop: `1px dashed ${mutedColor}50` }} />;
    const SolidLine = ({ color }) => <div className="my-1.5" style={{ borderTop: `1px solid ${color || mutedColor + '40'}` }} />;
    const AccentLine = () => <div className="my-1.5" style={{ borderTop: `2px solid ${accent}` }} />;

    const ItemsTable = ({ showCode = false, headerBg = '', headerText = '' }) => (
        <table className="w-full text-[8px]">
            <thead>
                <tr style={headerBg ? { background: headerBg, color: headerText || '#fff' } : {}}>
                    <th className="text-left py-0.5 px-0.5" style={!headerBg ? { borderBottom: `1px solid ${mutedColor}30` } : {}}>Item</th>
                    {showCode && <th className="text-left py-0.5 px-0.5" style={!headerBg ? { borderBottom: `1px solid ${mutedColor}30` } : {}}>Code</th>}
                    <th className="text-center py-0.5 px-0.5" style={!headerBg ? { borderBottom: `1px solid ${mutedColor}30` } : {}}>Qty</th>
                    <th className="text-right py-0.5 px-0.5" style={!headerBg ? { borderBottom: `1px solid ${mutedColor}30` } : {}}>Price</th>
                    <th className="text-right py-0.5 px-0.5" style={!headerBg ? { borderBottom: `1px solid ${mutedColor}30` } : {}}>Total</th>
                </tr>
            </thead>
            <tbody>
                {sale.items.map((item, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${mutedColor}20` }}>
                        <td className="py-0.5 px-0.5">{item.name}</td>
                        {showCode && <td className="py-0.5 px-0.5" style={{ color: mutedColor }}>{item.code}</td>}
                        <td className="text-center py-0.5 px-0.5">{item.qty}</td>
                        <td className="text-right py-0.5 px-0.5">{fmt(item.price)}</td>
                        <td className="text-right py-0.5 px-0.5 font-medium">{fmt(item.total)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    const Totals = ({ bold = false }) => (
        <div className="text-[8px] space-y-0.5">
            <div className="flex justify-between"><span style={{ color: mutedColor }}>Subtotal</span><span>{fmt(sale.subtotal)}</span></div>
            {sale.discount > 0 && <div className="flex justify-between" style={{ color: '#ef4444' }}><span>Discount</span><span>-{fmt(sale.discount)}</span></div>}
            {cfg.show_tax_breakdown && <div className="flex justify-between"><span style={{ color: mutedColor }}>{cfg.tax_label || 'VAT'} {cfg.tax_rate > 0 ? `(${cfg.tax_rate}%)` : ''}</span><span>{fmt(sale.tax)}</span></div>}
            <div className={`flex justify-between pt-0.5 mt-0.5 ${bold ? 'font-bold text-[10px]' : 'font-bold text-[9px]'}`} style={{ borderTop: `1px solid ${mutedColor}40` }}>
                <span>Total</span><span>{fmt(sale.total)}</span>
            </div>
        </div>
    );

    const PaymentInfo = () => cfg.show_payment_details ? (
        <div className="text-[8px] space-y-0.5">
            <div className="flex justify-between"><span style={{ color: mutedColor }}>Payment</span><span>{sale.payment_method}</span></div>
            <div className="flex justify-between"><span style={{ color: mutedColor }}>Paid</span><span>{fmt(sale.paid)}</span></div>
            {sale.change > 0 && <div className="flex justify-between font-semibold" style={{ color: '#16a34a' }}><span>Change</span><span>{fmt(sale.change)}</span></div>}
        </div>
    ) : null;

    const ReferrerInfo = () => cfg.show_referrer_details ? (
        <div className="text-[8px]"><div className="flex justify-between"><span style={{ color: mutedColor }}>Referred by</span><span>{sale.referrer}</span></div></div>
    ) : null;

    const FooterBlock = () => (
        <>
            {cfg.footer_text && <p className="text-[8px] text-center italic" style={{ color: mutedColor }}>{cfg.footer_text}</p>}
            {cfg.terms_and_conditions && <p className="text-[7px] text-center mt-0.5" style={{ color: mutedColor + 'aa' }}>{cfg.terms_and_conditions}</p>}
        </>
    );

    const BarcodeBlock = () => cfg.show_barcode ? (
        <div className="mt-1.5 flex justify-center gap-px">{Array(25).fill(0).map((_, i) => <div key={i} style={{ background: textColor, width: i % 3 === 0 ? 2 : 1, height: 18 }} />)}</div>
    ) : null;

    const QRBlock = () => cfg.show_qr_code ? (
        <div className="mt-1.5 flex justify-center"><div className="w-10 h-10 rounded flex items-center justify-center" style={{ border: `1px solid ${mutedColor}40`, background: mutedColor + '10' }}><QrCode size={20} style={{ color: mutedColor }} /></div></div>
    ) : null;

    const InfoRow = ({ label, value }) => <div className="flex justify-between text-[8px]"><span style={{ color: mutedColor }}>{label}</span><span className="font-medium">{value}</span></div>;

    // ── Template 1: Standard (Classic) ──
    if (tid === 1) return (
        <div className="p-4 text-gray-900">
            <div className="text-center mb-2">
                <div className="flex justify-center mb-1"><Logo /></div>
                <CompanyName className="text-sm" />
                <CompanyDetails className="mt-0.5" />
                <TaxNumber className="mt-0.5" />
            </div>
            <Dash />
            <div className="space-y-0.5 mb-1.5">
                <InfoRow label="Receipt #" value={sale.receipt_number} />
                <InfoRow label="Date" value={sale.date} />
                {cfg.show_customer_details && <InfoRow label="Customer" value={sale.customer_name} />}
                <InfoRow label="Cashier" value={sale.cashier} />
            </div>
            <Dash />
            <ItemsTable />
            <Dash />
            <Totals />
            {cfg.show_payment_details && <><Dash /><PaymentInfo /></>}
            {cfg.show_referrer_details && <><Dash /><ReferrerInfo /></>}
            <Dash />
            <FooterBlock />
            <BarcodeBlock />
            <QRBlock />
        </div>
    );

    // ── Template 2: Modern (Clean & Bold) ──
    if (tid === 2) return (
        <div className="text-gray-900">
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
                <span className="font-bold">{sale.receipt_number}</span>
                <span>{sale.date}</span>
            </div>
            <div className="p-3">
                {cfg.show_customer_details && <div className="text-[8px] mb-2"><span className="text-gray-500">Customer: </span><span className="font-medium">{sale.customer_name}</span></div>}
                <ItemsTable headerBg={accent} headerText="#fff" />
                <div className="mt-2" />
                <Totals bold />
                {cfg.show_payment_details && <><SolidLine color={accent} /><PaymentInfo /></>}
                {cfg.show_referrer_details && <><SolidLine /><ReferrerInfo /></>}
                <div className="mt-2" />
                <FooterBlock />
                <BarcodeBlock />
                <QRBlock />
            </div>
        </div>
    );

    // ── Template 3: Bold (High Contrast) ──
    if (tid === 3) return (
        <div className="p-4 text-gray-900">
            <div className="text-center mb-2">
                <div className="flex justify-center mb-1"><Logo /></div>
                <CompanyName className="text-base uppercase tracking-wide" />
                <CompanyDetails className="mt-0.5" />
                <TaxNumber className="mt-0.5" />
            </div>
            <div className="border-b-2 border-gray-900 my-2" />
            <p className="text-center font-mono font-bold text-[10px] tracking-widest mb-1" style={{ color: accent }}>{sale.receipt_number}</p>
            <p className="text-center text-[8px] text-gray-500 mb-1.5">{sale.date}</p>
            <div className="space-y-0.5 mb-1.5">
                {cfg.show_customer_details && <InfoRow label="Customer" value={sale.customer_name} />}
                <InfoRow label="Cashier" value={sale.cashier} />
            </div>
            <div className="border-b-2 border-gray-900 my-2" />
            <ItemsTable />
            <div className="border-b-2 border-gray-900 my-2" />
            <Totals bold />
            {cfg.show_payment_details && <><div className="border-b border-gray-400 my-1.5" /><PaymentInfo /></>}
            {cfg.show_referrer_details && <><div className="border-b border-gray-400 my-1.5" /><ReferrerInfo /></>}
            <div className="border-b-2 border-gray-900 my-2" />
            <FooterBlock />
            <BarcodeBlock />
            <QRBlock />
        </div>
    );

    // ── Template 4: Invoice Pro ──
    if (tid === 4) return (
        <div className="text-gray-900">
            <div className="px-3 py-2 text-[7px] text-gray-400 text-right border-b border-gray-200">{sale.date}</div>
            <div className="p-3">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-1.5"><Logo /><CompanyName className="text-xs" /></div>
                    <div className="text-right text-[8px]"><span className="font-bold" style={{ color: accent }}>INVOICE</span><br /><span className="text-gray-500">{sale.receipt_number}</span></div>
                </div>
                <CompanyDetails size="text-[7px]" />
                <TaxNumber className="mt-0.5" />
                <div className="grid grid-cols-3 gap-1.5 my-2 text-[7px]">
                    <div className="bg-gray-50 rounded p-1.5">
                        <p className="text-gray-400 uppercase text-[6px] font-bold">Bill To</p>
                        {cfg.show_customer_details && <p className="font-medium">{sale.customer_name}</p>}
                    </div>
                    <div className="bg-gray-50 rounded p-1.5">
                        <p className="text-gray-400 uppercase text-[6px] font-bold">Date</p>
                        <p className="font-medium">{sale.date}</p>
                    </div>
                    <div className="bg-gray-50 rounded p-1.5">
                        <p className="text-gray-400 uppercase text-[6px] font-bold">Cashier</p>
                        <p className="font-medium">{sale.cashier}</p>
                    </div>
                </div>
                <ItemsTable showCode headerBg={accent} />
                <div className="mt-2" />
                <Totals bold />
                {cfg.show_payment_details && <><SolidLine /><PaymentInfo /></>}
                {cfg.show_referrer_details && <><SolidLine /><ReferrerInfo /></>}
                <div className="mt-2" />
                <FooterBlock />
                <BarcodeBlock />
                <QRBlock />
            </div>
        </div>
    );

    // ── Template 5: Invoice Classic (Professional) ──
    if (tid === 5) return (
        <div className="text-gray-900">
            <div className="p-3 border-b-2" style={{ borderColor: accent }}>
                <div className="flex items-start justify-between">
                    <div><div className="flex items-center gap-1.5"><Logo /><CompanyName className="text-xs" /></div><CompanyDetails size="text-[7px]" className="mt-0.5" /></div>
                    <div className="text-right"><p className="text-[10px] font-bold" style={{ color: accent }}>RECEIPT</p><p className="text-[7px] text-gray-500">{sale.receipt_number}</p></div>
                </div>
            </div>
            <div className="p-3">
                <TaxNumber className="mb-1" />
                <div className="grid grid-cols-2 gap-2 my-2 text-[7px]">
                    <div>{cfg.show_customer_details && <><p className="text-gray-400 uppercase text-[6px] font-bold mb-0.5">Customer</p><p className="font-medium">{sale.customer_name}</p><p className="text-gray-500">{sale.customer_phone}</p></>}</div>
                    <div className="text-right"><p className="text-gray-400 uppercase text-[6px] font-bold mb-0.5">Details</p><p>{sale.date}</p><p>Cashier: {sale.cashier}</p></div>
                </div>
                <ItemsTable showCode />
                <div className="mt-2" />
                <Totals bold />
                {cfg.show_payment_details && <><SolidLine /><PaymentInfo /></>}
                {cfg.show_referrer_details && <><SolidLine /><ReferrerInfo /></>}
                <div className="mt-2" />
                <FooterBlock />
                <BarcodeBlock />
                <QRBlock />
            </div>
        </div>
    );

    // ── Template 6: Detailed (Boxed Grid) ──
    if (tid === 6) return (
        <div className="text-gray-900">
            <div className="p-2.5 border-2 border-gray-800 m-2 rounded text-center">
                <div className="flex justify-center mb-1"><Logo /></div>
                <CompanyName className="text-sm" />
                <CompanyDetails className="mt-0.5" />
                <TaxNumber className="mt-0.5" />
            </div>
            <div className="px-3 pb-3">
                <div className="grid grid-cols-2 gap-1.5 mb-2">
                    <div className="border border-gray-300 rounded p-1.5">
                        <p className="text-[6px] font-bold text-gray-400 uppercase mb-0.5">Bill To</p>
                        {cfg.show_customer_details && <p className="text-[8px] font-medium">{sale.customer_name}</p>}
                        {cfg.show_customer_details && <p className="text-[7px] text-gray-500">{sale.customer_phone}</p>}
                    </div>
                    <div className="border border-gray-300 rounded p-1.5">
                        <p className="text-[6px] font-bold text-gray-400 uppercase mb-0.5">Receipt Info</p>
                        <p className="text-[8px] font-medium">{sale.receipt_number}</p>
                        <p className="text-[7px] text-gray-500">{sale.date}</p>
                        <p className="text-[7px] text-gray-500">Cashier: {sale.cashier}</p>
                    </div>
                </div>
                <ItemsTable showCode headerBg="#212529" />
                <div className="mt-2 border border-gray-300 rounded p-1.5">
                    <Totals bold />
                </div>
                {cfg.show_payment_details && <div className="mt-1.5"><PaymentInfo /></div>}
                {cfg.show_referrer_details && <div className="mt-1.5"><ReferrerInfo /></div>}
                <div className="mt-2" />
                <FooterBlock />
                <BarcodeBlock />
                <QRBlock />
            </div>
        </div>
    );

    // ── Template 7: Elegant (Serif Luxury) ──
    if (tid === 7) return (
        <div className="p-4 text-gray-900" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            <div className="text-center mb-2">
                <div className="flex justify-center mb-1"><Logo /></div>
                <CompanyName className="text-sm tracking-wider" />
                <CompanyDetails className="mt-0.5" />
                <TaxNumber className="mt-0.5" />
            </div>
            <p className="text-center text-[9px] font-bold tracking-[0.2em] uppercase mb-1" style={{ color: accent }}>Official Receipt</p>
            <div className="flex items-center gap-1.5 my-2"><div className="flex-1 border-t border-gray-300" /><div className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} /><div className="flex-1 border-t border-gray-300" /></div>
            <div className="space-y-0.5 mb-2">
                <InfoRow label="Receipt #" value={sale.receipt_number} />
                <InfoRow label="Date" value={sale.date} />
                {cfg.show_customer_details && <InfoRow label="Customer" value={sale.customer_name} />}
                <InfoRow label="Cashier" value={sale.cashier} />
            </div>
            <div className="flex items-center gap-1.5 my-2"><div className="flex-1 border-t border-gray-300" /><div className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} /><div className="flex-1 border-t border-gray-300" /></div>
            <ItemsTable />
            <div className="flex items-center gap-1.5 my-2"><div className="flex-1 border-t border-gray-300" /><div className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} /><div className="flex-1 border-t border-gray-300" /></div>
            <Totals bold />
            {cfg.show_payment_details && <><SolidLine /><PaymentInfo /></>}
            {cfg.show_referrer_details && <><SolidLine /><ReferrerInfo /></>}
            <div className="mt-2" />
            <FooterBlock />
            <BarcodeBlock />
            <QRBlock />
        </div>
    );

    // ── Template 8: Corporate (Formal Blue/Dark Header) ──
    if (tid === 8) return (
        <div className="text-gray-900">
            <div className="p-3 text-white relative" style={{ background: '#2c3e50' }}>
                <div className="flex items-center gap-2">
                    <Logo />
                    <div>
                        <CompanyName className="text-sm text-white" />
                        {cfg.show_company_details && <div className="text-[7px] text-gray-300">{cfg.company_address && <span>{cfg.company_address}</span>}{cfg.company_phone && <span> &bull; {cfg.company_phone}</span>}</div>}
                    </div>
                </div>
                <TaxNumber className="mt-1 !text-gray-300" />
            </div>
            <div className="h-1" style={{ background: accent }} />
            <div className="p-3">
                <div className="flex justify-between text-[8px] mb-2">
                    <div>
                        {cfg.show_customer_details && <><p className="text-gray-400 text-[6px] uppercase font-bold">Customer</p><p className="font-medium">{sale.customer_name}</p></>}
                    </div>
                    <div className="text-right">
                        <p className="font-bold" style={{ color: '#2c3e50' }}>{sale.receipt_number}</p>
                        <p className="text-gray-500">{sale.date}</p>
                        <p className="text-gray-500">Cashier: {sale.cashier}</p>
                    </div>
                </div>
                <ItemsTable showCode headerBg="#2c3e50" />
                <div className="mt-2" />
                <Totals bold />
                {cfg.show_payment_details && <><SolidLine /><PaymentInfo /></>}
                {cfg.show_referrer_details && <><SolidLine /><ReferrerInfo /></>}
                <div className="mt-2" />
                <FooterBlock />
                <BarcodeBlock />
                <QRBlock />
            </div>
        </div>
    );

    // Fallback to template 1
    return null;
};

const ReceiptToggle = ({ field, label, checked, onChange }) => (
    <label className="flex items-center justify-between p-2 sm:p-2.5 bg-theme-primary rounded-lg border border-theme cursor-pointer hover:border-accent-gold/30 transition-colors">
        <span className="text-[11px] sm:text-xs font-medium text-theme-secondary">{label}</span>
        <button type="button" role="switch" aria-checked={checked}
            onClick={() => onChange(field, !checked)}
            className={`relative w-9 h-5 rounded-full transition-colors ${checked ? 'bg-accent-gold' : 'bg-theme-tertiary'}`}>
            <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
        </button>
    </label>
);

const ReceiptSection = () => {
    const { symbol } = useCurrency();
    const { config: brandingConfig } = useBranding();
    const [cfg, setCfg] = useState({
        company_name: '', company_address: '', company_phone: '', company_email: '',
        company_website: '', company_logo_url: '', show_logo: true, show_tax_number: true,
        tax_number: '', tax_rate: 0, tax_label: 'VAT', template_id: 1, template_style: 'modern',
        show_company_details: true, show_tax_breakdown: false, show_payment_details: true,
        show_customer_details: true, show_referrer_details: true, show_barcode: true, show_qr_code: false,
        receipt_bg_color: '#ffffff', receipt_text_color: '#111827', receipt_accent_color: '',
        use_company_branding: false, use_company_info: false,
        footer_text: 'Thank you for your business!', terms_and_conditions: '',
        currency_symbol: '₦', currency_code: 'NGN', paper_size: 'A5', delivery_format: 'auto',
        email_enabled: false, email_subject_template: '', email_body_template: '',
        whatsapp_enabled: false, whatsapp_message_template: `Hello {customer_name},\n\nThank you for your purchase at {company_name}!\n\nReceipt Number: {receipt_number}\nTotal Amount: ₦{total_amount}\n\nFor any inquiries, please contact us.\n\nThank you for your business!\n\n- {company_name} Team`,
    });
    const [companySettings, setCompanySettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [expandedSections, setExpandedSections] = useState({ email: false, whatsapp: false });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [rcptRes, settingsRes] = await Promise.all([
                api.get('/settings/receipt-template').catch(() => ({ data: {} })),
                api.get('/settings/general').catch(() => ({ data: {} })),
            ]);
            setCfg(p => ({ ...p, ...rcptRes.data }));
            setCompanySettings(settingsRes.data?.settings || settingsRes.data || {});
            setHasChanges(false);
        } catch { toast.error('Failed to load receipt settings'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const set = (field, value) => {
        setCfg(p => {
            const next = { ...p, [field]: value };
            // Auto-adjust text color when background changes to maintain readability
            if (field === 'receipt_bg_color') {
                next.receipt_text_color = getContrastTextColor(value);
            }
            return next;
        });
        setHasChanges(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try { await api.put('/settings/receipt-template', cfg); toast.success('Receipt settings saved'); setHasChanges(false); }
        catch { toast.error('Failed to save receipt settings'); }
        finally { setSaving(false); }
    };

    const toggleSection = (section) => setExpandedSections(p => ({ ...p, [section]: !p[section] }));

    if (loading) return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">{Array(3).fill(0).map((_, i) => <div key={i} className="h-64 bg-theme-tertiary rounded-xl animate-pulse" />)}</div>;

    // Build effective config by overlaying branding/company info when toggled
    const eff = { ...cfg };
    if (cfg.use_company_info) {
        eff.company_name = companySettings.company_name || brandingConfig?.company_name || cfg.company_name;
        eff.company_address = companySettings.company_address || cfg.company_address;
        eff.company_phone = companySettings.company_phone || cfg.company_phone;
        eff.company_email = companySettings.company_email || cfg.company_email;
        eff.company_website = companySettings.company_website || cfg.company_website;
        eff.company_logo_url = brandingConfig?.logo_url || cfg.company_logo_url;
        eff.tax_number = companySettings.tax_number || cfg.tax_number;
    }
    if (cfg.use_company_branding) {
        eff.receipt_accent_color = brandingConfig?.accent_color || brandingConfig?.primary_color || cfg.receipt_accent_color;
        eff.receipt_bg_color = brandingConfig?.background_color || cfg.receipt_bg_color || '#ffffff';
    }
    // Auto-contrast: always compute text color from effective background for readability
    eff.receipt_text_color = getContrastTextColor(eff.receipt_bg_color || '#ffffff');

    const selectedTemplate = RECEIPT_TEMPLATES.find(t => t.id === (cfg.template_id || 1)) || RECEIPT_TEMPLATES[0];
    const cs = cfg.currency_symbol || symbol || '₦';

    return (
        <div>
            <SectionHeader title="Receipt Settings" subtitle="Configure receipt template, company details, and delivery preferences" />

            {/* ROW 1: Template Selection + Live Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 mb-4 sm:mb-6">
                {/* Template Selection */}
                <div className="lg:col-span-7">
                    <div className="bg-theme-secondary rounded-xl border border-theme shadow-theme-sm p-4 sm:p-5 h-full">
                        <h3 className="text-sm sm:text-base font-semibold text-theme-primary mb-4 flex items-center gap-2">
                            <Layout size={16} className="text-accent-gold" />
                            Template Design
                        </h3>
                        {/* Template Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-5">
                            {RECEIPT_TEMPLATES.map(template => {
                                const isSelected = (cfg.template_id || 1) === template.id;
                                return (
                                    <label key={template.id}
                                        className={`relative flex flex-col p-2 border-2 rounded-xl cursor-pointer transition-all hover:shadow-lg ${isSelected ? 'border-accent-gold bg-accent-gold/5 ring-1 ring-accent-gold/20 shadow-md' : 'border-theme hover:border-accent-gold/40 bg-theme-primary'}`}>
                                        <input type="radio" name="rcpt_template_id" value={template.id} checked={isSelected}
                                            onChange={() => set('template_id', template.id)} className="sr-only" />
                                        <MiniReceiptPreview template={template} isSelected={isSelected} />
                                        <div className="mt-1.5">
                                            <span className="font-semibold text-[10px] sm:text-xs text-theme-primary block">{template.name}</span>
                                            <span className="text-[9px] sm:text-[10px] text-theme-muted">{template.desc}</span>
                                        </div>
                                        {isSelected && (
                                            <div className="absolute top-1 right-1 w-4 h-4 sm:w-5 sm:h-5 bg-accent-gold rounded-full flex items-center justify-center shadow-sm">
                                                <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                                            </div>
                                        )}
                                    </label>
                                );
                            })}
                        </div>
                        {/* Paper Size & Delivery Format */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Paper Size</label>
                                <div className="flex bg-theme-primary p-1 rounded-lg border border-theme">
                                    {PAPER_SIZES.map(size => (
                                        <button key={size} type="button" onClick={() => set('paper_size', size)}
                                            className={`flex-1 py-1.5 sm:py-2 text-[10px] sm:text-xs font-medium rounded-md transition-all ${cfg.paper_size === size ? 'bg-accent-gold text-white shadow-sm' : 'text-theme-muted hover:text-theme-primary'}`}>
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Default Delivery Format</label>
                                <div className="flex bg-theme-primary p-1 rounded-lg border border-theme">
                                    {DELIVERY_FORMATS.map(fmt => (
                                        <button key={fmt.val} type="button" onClick={() => set('delivery_format', fmt.val)}
                                            className={`flex-1 py-1.5 sm:py-2 text-[10px] sm:text-xs font-medium rounded-md transition-all ${(cfg.delivery_format || 'auto') === fmt.val ? 'bg-accent-gold text-white shadow-sm' : 'text-theme-muted hover:text-theme-primary'}`}>
                                            {fmt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Live Preview */}
                <div className="lg:col-span-5">
                    <div className="bg-theme-secondary rounded-xl border border-theme shadow-theme-sm overflow-hidden h-full flex flex-col">
                        <div className="px-4 py-2.5 flex items-center justify-between border-b border-theme"
                            style={{ background: `linear-gradient(135deg, ${selectedTemplate.color} 0%, ${selectedTemplate.color}ee 100%)` }}>
                            <h3 className="font-semibold text-white flex items-center gap-2 text-xs sm:text-sm">
                                <Eye className="w-3.5 h-3.5" style={{ color: selectedTemplate.accent }} />
                                Live Preview
                            </h3>
                            <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                                {selectedTemplate.name} &bull; {cfg.paper_size}
                            </span>
                        </div>
                        <div className="flex-1 p-3 sm:p-4 bg-theme-primary overflow-auto">
                            <div className="rounded-lg border border-gray-200 max-w-[260px] mx-auto shadow-lg overflow-hidden"
                                style={{ backgroundColor: eff.receipt_bg_color || '#ffffff', color: eff.receipt_text_color || '#111827' }}>
                                <ReceiptLivePreview cfg={eff} template={selectedTemplate} cs={cs} />
                            </div>
                        </div>
                        <div className="px-3 py-1.5 border-t border-theme text-[9px] text-center text-theme-muted bg-theme-secondary">
                            Preview updates as you change settings
                        </div>
                    </div>
                </div>
            </div>

            {/* ROW 2: Company Info + Display Options + Footer */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                {/* Company Information */}
                <div className="bg-theme-secondary rounded-xl border border-theme shadow-theme-sm p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm sm:text-base font-semibold text-theme-primary flex items-center gap-2">
                            <Building2 size={16} className="text-accent-gold" />
                            Company Information
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] sm:text-[10px] text-theme-muted">Use General Settings</span>
                            <button type="button" role="switch" aria-checked={cfg.use_company_info}
                                onClick={() => set('use_company_info', !cfg.use_company_info)}
                                className={`relative w-9 h-5 rounded-full transition-colors ${cfg.use_company_info ? 'bg-accent-gold' : 'bg-theme-tertiary'}`}>
                                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${cfg.use_company_info ? 'translate-x-4' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>

                    {cfg.use_company_info && (
                        <div className="mb-4 p-2.5 rounded-lg border border-accent-gold/30 bg-accent-gold/5">
                            <p className="text-[10px] sm:text-xs text-accent-gold font-medium">Using company info from General Settings</p>
                            <p className="text-[9px] text-theme-muted mt-0.5">Name, address, phone, email, logo, and tax number are pulled from your company settings. Disable to set custom values for receipts.</p>
                        </div>
                    )}

                    <div className={`space-y-3 sm:space-y-4 ${cfg.use_company_info ? 'opacity-50 pointer-events-none' : ''}`}>
                        <div>
                            <label className={labelClass}>Company Name</label>
                            <input type="text" value={cfg.use_company_info ? (eff.company_name || '') : cfg.company_name} onChange={e => set('company_name', e.target.value)} className={inputClass} placeholder="Your Business Name" readOnly={cfg.use_company_info} />
                        </div>
                        <div>
                            <label className={labelClass}>Address</label>
                            <textarea value={cfg.use_company_info ? (eff.company_address || '') : cfg.company_address} onChange={e => set('company_address', e.target.value)} className={`${inputClass} resize-none`} rows={2} placeholder="Business address" readOnly={cfg.use_company_info} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelClass}>Phone</label>
                                <input type="text" value={cfg.use_company_info ? (eff.company_phone || '') : cfg.company_phone} onChange={e => set('company_phone', e.target.value)} className={inputClass} placeholder="+234 800 000 0000" readOnly={cfg.use_company_info} />
                            </div>
                            <div>
                                <label className={labelClass}>Email</label>
                                <input type="email" value={cfg.use_company_info ? (eff.company_email || '') : cfg.company_email} onChange={e => set('company_email', e.target.value)} className={inputClass} placeholder="info@company.com" readOnly={cfg.use_company_info} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelClass}>Website</label>
                                <input type="text" value={cfg.use_company_info ? (eff.company_website || '') : (cfg.company_website || '')} onChange={e => set('company_website', e.target.value)} className={inputClass} placeholder="www.company.com" readOnly={cfg.use_company_info} />
                            </div>
                            <div>
                                <label className={labelClass}>Tax / TIN Number</label>
                                <input type="text" value={cfg.use_company_info ? (eff.tax_number || '') : (cfg.tax_number || '')} onChange={e => set('tax_number', e.target.value)} className={inputClass} placeholder="Tax ID" readOnly={cfg.use_company_info} />
                            </div>
                        </div>
                        <CloudinaryUpload category="receipts" label="Receipt Logo" value={(cfg.use_company_info ? eff.company_logo_url : cfg.company_logo_url) || ''} onChange={url => set('company_logo_url', url)} />
                    </div>
                </div>

                {/* Display Options + Footer */}
                <div className="space-y-4 sm:space-y-6">
                    <div className="bg-theme-secondary rounded-xl border border-theme shadow-theme-sm p-4 sm:p-5">
                        <h3 className="text-sm sm:text-base font-semibold text-theme-primary mb-4 flex items-center gap-2">
                            <Eye size={16} className="text-accent-gold" />
                            Display Options
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {[
                                { field: 'show_logo', label: 'Show Company Logo' },
                                { field: 'show_company_details', label: 'Show Company Details' },
                                { field: 'show_tax_number', label: 'Show Tax Number' },
                                { field: 'show_tax_breakdown', label: 'Show Tax Breakdown' },
                                { field: 'show_payment_details', label: 'Show Payment Details' },
                                { field: 'show_customer_details', label: 'Show Customer Details' },
                                { field: 'show_referrer_details', label: 'Show Referrer Details' },
                                { field: 'show_barcode', label: 'Show Barcode' },
                                { field: 'show_qr_code', label: 'Show QR Code' },
                            ].map(({ field, label }) => (
                                <ReceiptToggle key={field} field={field} label={label} checked={cfg[field]} onChange={set} />
                            ))}
                        </div>
                        {/* Receipt Colors */}
                        <div className="mt-4 pt-4 border-t border-theme">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-[10px] sm:text-xs font-semibold text-theme-muted uppercase tracking-wider flex items-center gap-2">
                                    <Palette size={14} className="text-accent-gold" />
                                    Receipt Colors
                                </h4>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] sm:text-[10px] text-theme-muted">Use Branding</span>
                                    <button type="button" role="switch" aria-checked={cfg.use_company_branding}
                                        onClick={() => set('use_company_branding', !cfg.use_company_branding)}
                                        className={`relative w-9 h-5 rounded-full transition-colors ${cfg.use_company_branding ? 'bg-accent-gold' : 'bg-theme-tertiary'}`}>
                                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${cfg.use_company_branding ? 'translate-x-4' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            </div>

                            {cfg.use_company_branding && (
                                <div className="mb-3 p-2.5 rounded-lg border border-accent-gold/30 bg-accent-gold/5">
                                    <p className="text-[10px] sm:text-xs text-accent-gold font-medium">Using company branding colors</p>
                                    <p className="text-[9px] text-theme-muted mt-0.5">Accent color is pulled from your branding settings{brandingConfig?.primary_color ? ` (${brandingConfig.primary_color})` : ''}. Disable to set custom receipt colors.</p>
                                </div>
                            )}

                            <div className={`grid grid-cols-2 gap-3 ${cfg.use_company_branding ? 'opacity-50 pointer-events-none' : ''}`}>
                                {[
                                    { field: 'receipt_bg_color', label: 'Background', fallback: '#ffffff' },
                                    { field: 'receipt_accent_color', label: 'Accent', fallback: '' },
                                ].map(({ field, label, fallback }) => (
                                    <div key={field}>
                                        <label className={labelClass}>{label}</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                value={(cfg.use_company_branding ? eff[field] : cfg[field]) || fallback || '#000000'}
                                                onChange={e => set(field, e.target.value)}
                                                className="w-8 h-8 rounded-lg border border-theme cursor-pointer bg-transparent p-0.5"
                                            />
                                            <input
                                                type="text"
                                                value={(cfg.use_company_branding ? eff[field] : cfg[field]) || ''}
                                                onChange={e => set(field, e.target.value)}
                                                className={`${inputClass} flex-1 font-mono text-[10px] sm:text-xs`}
                                                placeholder={fallback || 'auto'}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="text-[9px] text-theme-muted mt-2">{cfg.use_company_branding ? 'Colors are synced from Branding settings.' : 'Text color adjusts automatically for readability. Leave accent empty to use template default.'}</p>
                        </div>
                    </div>
                    <div className="bg-theme-secondary rounded-xl border border-theme shadow-theme-sm p-4 sm:p-5">
                        <h3 className="text-sm sm:text-base font-semibold text-theme-primary mb-4 flex items-center gap-2">
                            <FileText size={16} className="text-accent-gold" />
                            Footer & Terms
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <label className={labelClass}>Footer Text</label>
                                <textarea value={cfg.footer_text} onChange={e => set('footer_text', e.target.value)} className={`${inputClass} resize-none`} rows={2} placeholder="Thank you for your business!" />
                            </div>
                            <div>
                                <label className={labelClass}>Terms & Conditions</label>
                                <textarea value={cfg.terms_and_conditions} onChange={e => set('terms_and_conditions', e.target.value)} className={`${inputClass} resize-none`} rows={3} placeholder="Return policy, warranty info…" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ROW 3: Currency & Tax + Email + WhatsApp */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Currency & Tax */}
                <div className="bg-theme-secondary rounded-xl border border-theme shadow-theme-sm p-4 sm:p-5">
                    <h3 className="text-sm sm:text-base font-semibold text-theme-primary mb-4 flex items-center gap-2">
                        <Hash size={16} className="text-accent-gold" />
                        Currency & Tax
                    </h3>
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelClass}>Currency Symbol</label>
                                <input type="text" value={cfg.currency_symbol || ''} onChange={e => set('currency_symbol', e.target.value)} className={inputClass} placeholder="₦" />
                            </div>
                            <div>
                                <label className={labelClass}>Currency Code</label>
                                <input type="text" value={cfg.currency_code || ''} onChange={e => set('currency_code', e.target.value)} className={inputClass} placeholder="NGN" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelClass}>Tax Rate (%)</label>
                                <input type="number" value={cfg.tax_rate || 0} onChange={e => set('tax_rate', parseFloat(e.target.value) || 0)} className={inputClass} placeholder="0" min="0" max="100" step="0.5" />
                            </div>
                            <div>
                                <label className={labelClass}>Tax Label</label>
                                <input type="text" value={cfg.tax_label || ''} onChange={e => set('tax_label', e.target.value)} className={inputClass} placeholder="VAT" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Email Settings */}
                <div className="bg-theme-secondary rounded-xl border border-theme shadow-theme-sm p-4 sm:p-5">
                    <button onClick={() => toggleSection('email')} className="flex items-center justify-between w-full mb-3">
                        <h3 className="text-sm sm:text-base font-semibold text-theme-primary flex items-center gap-2">
                            <Mail size={16} className="text-accent-gold" />
                            Email Settings
                        </h3>
                        <div className="flex items-center gap-2">
                            <button type="button" role="switch" aria-checked={cfg.email_enabled}
                                onClick={e => { e.stopPropagation(); set('email_enabled', !cfg.email_enabled); }}
                                className={`relative w-9 h-5 rounded-full transition-colors ${cfg.email_enabled ? 'bg-accent-gold' : 'bg-theme-tertiary'}`}>
                                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${cfg.email_enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                            </button>
                            {expandedSections.email ? <ChevronUp size={14} className="text-theme-muted" /> : <ChevronDown size={14} className="text-theme-muted" />}
                        </div>
                    </button>
                    {expandedSections.email && cfg.email_enabled ? (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div>
                                <label className={labelClass}>Subject Template</label>
                                <input type="text" value={cfg.email_subject_template || ''} onChange={e => set('email_subject_template', e.target.value)} className={inputClass} placeholder="Receipt #{receipt_number} - {company_name}" />
                            </div>
                            <div>
                                <label className={labelClass}>Body Template</label>
                                <textarea value={cfg.email_body_template || ''} onChange={e => set('email_body_template', e.target.value)} className={`${inputClass} resize-none`} rows={4} />
                                <p className="text-[9px] text-theme-muted mt-1">
                                    Placeholders: {'{receipt_number}'}, {'{customer_name}'}, {'{company_name}'}, {'{total_amount}'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-[10px] sm:text-xs text-theme-muted">
                            {cfg.email_enabled ? 'Email receipts enabled — click to expand' : 'Email receipts disabled'}
                        </p>
                    )}
                </div>

                {/* WhatsApp Template */}
                <div className="bg-theme-secondary rounded-xl border border-theme shadow-theme-sm p-4 sm:p-5">
                    <button onClick={() => toggleSection('whatsapp')} className="flex items-center justify-between w-full mb-3">
                        <h3 className="text-sm sm:text-base font-semibold text-theme-primary flex items-center gap-2">
                            <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2.546 20.2a1 1 0 001.254 1.254l3.032-.892A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 2a8 8 0 110 16 8 8 0 010-16z" />
                            </svg>
                            WhatsApp Template
                        </h3>
                        {expandedSections.whatsapp ? <ChevronUp size={14} className="text-theme-muted" /> : <ChevronDown size={14} className="text-theme-muted" />}
                    </button>
                    {expandedSections.whatsapp ? (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div>
                                <label className={labelClass}>Message Template</label>
                                <textarea value={cfg.whatsapp_message_template || ''} onChange={e => set('whatsapp_message_template', e.target.value)}
                                    rows={7} className={`${inputClass} resize-none font-mono text-[10px] sm:text-xs`} placeholder="Enter your WhatsApp message template..." />
                                <p className="text-[9px] text-theme-muted mt-1">
                                    Placeholders: {'{customer_name}'}, {'{receipt_number}'}, {'{total_amount}'}, {'{company_name}'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-[10px] sm:text-xs text-theme-muted">Customize WhatsApp message sent with receipts — click to expand</p>
                    )}
                </div>
            </div>

            <SaveBar onSave={handleSave} onReset={fetchData} saving={saving} hasChanges={hasChanges} />
        </div>
    );
};

// ════════════════════════════════════════════════════════════════════════════
// SECTION: Fiscal Periods  (modelled after Eldaved-BMS)
// ════════════════════════════════════════════════════════════════════════════
const PERIOD_TYPES = [
    { value: 'forever',     label: 'Forever (All Time)', description: 'No date filtering — show all historical data' },
    { value: 'daily',       label: 'Daily',              description: 'Reset every day at midnight' },
    { value: 'weekly',      label: 'Weekly',             description: 'Monday to Sunday each week' },
    { value: 'monthly',     label: 'Monthly',            description: 'First to last day of each month' },
    { value: 'quarterly',   label: 'Quarterly',          description: 'Jan-Mar, Apr-Jun, Jul-Sep, Oct-Dec' },
    { value: 'half_yearly', label: 'Half-Yearly',        description: 'Jan-Jun (H1) or Jul-Dec (H2)' },
    { value: 'yearly',      label: 'Yearly',             description: 'Full fiscal year based on start month' },
    { value: 'custom',      label: 'Custom',             description: 'Manually specify date range' },
];

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const statusCfg = {
    open:        { label: 'Open',        color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    active:      { label: 'Active',      color: 'bg-green-500/10 text-green-400 border-green-500/20' },
    closed:      { label: 'Closed',      color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
    locked:      { label: 'Locked',      color: 'bg-red-500/10 text-red-400 border-red-500/20' },
    not_started: { label: 'Not Started', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
};

const FiscalSection = () => {
    const [periods, setPeriods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [generateYear, setGenerateYear] = useState(new Date().getFullYear());
    const [generating, setGenerating] = useState(false);

    const [globalSettings, setGlobalSettings] = useState({
        period_type: 'forever',
        custom_start_date: '',
        custom_end_date: '',
        fiscal_year_start_month: 1,
        fiscal_year_start_day: 1,
        show_period_badge_on_dashboard: true,
        allow_users_to_override: true,
        auto_create_periods: false,
    });
    const [savingSettings, setSavingSettings] = useState(false);
    const [settingsChanged, setSettingsChanged] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [p, g] = await Promise.all([fiscalPeriodsAPI.getAll(), fiscalPeriodsAPI.getGlobalSettings()]);
            setPeriods(Array.isArray(p) ? p : []);
            if (g) setGlobalSettings(prev => ({
                ...prev,
                ...g,
                custom_start_date: g.custom_start_date?.split('T')[0] || '',
                custom_end_date: g.custom_end_date?.split('T')[0] || '',
            }));
        } catch { toast.error('Failed to load fiscal periods'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSettingsChange = (field, value) => {
        setGlobalSettings(prev => ({ ...prev, [field]: value }));
        setSettingsChanged(true);
    };

    const handleSaveGlobalSettings = async () => {
        if (globalSettings.period_type === 'custom') {
            if (!globalSettings.custom_start_date || !globalSettings.custom_end_date) {
                return toast.error('Please specify both start and end dates for custom period');
            }
            if (new Date(globalSettings.custom_start_date) > new Date(globalSettings.custom_end_date)) {
                return toast.error('Start date must be before end date');
            }
        }
        setSavingSettings(true);
        try {
            await fiscalPeriodsAPI.updateGlobalSettings(globalSettings);
            toast.success('Fiscal settings saved');
            setSettingsChanged(false);
        } catch { toast.error('Failed to save fiscal settings'); }
        finally { setSavingSettings(false); }
    };

    const handleGenerate = async () => {
        if (!generateYear) return toast.error('Please enter a year');
        setGenerating(true);
        try {
            await fiscalPeriodsAPI.create({ year: generateYear });
            toast.success(`Periods for ${generateYear} generated`);
            setShowGenerateModal(false);
            fetchData();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to generate periods'); }
        finally { setGenerating(false); }
    };

    const handleAction = async (action, id, label) => {
        try { await fiscalPeriodsAPI[action](id); toast.success(`Period ${label}`); fetchData(); }
        catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    if (loading) return <div className="space-y-4">{Array(3).fill(0).map((_, i) => <div key={i} className="h-24 bg-theme-tertiary rounded-xl animate-pulse" />)}</div>;

    // Find active period for the preview
    const activePeriod = periods.find(p => p.is_active);

    return (
        <div className="space-y-6">
            {/* ═══ Card 1: Global Period Settings ═══ */}
            <div className="bg-theme-primary rounded-xl border border-theme overflow-hidden">
                {/* Card header */}
                <div className="px-4 sm:px-5 py-4 border-b border-theme bg-theme-tertiary/50 flex items-center gap-3">
                    <Globe className="w-5 h-5 text-accent-gold flex-shrink-0" />
                    <div>
                        <h2 className="text-base font-semibold text-theme-primary">Period Settings</h2>
                        <p className="text-xs text-theme-muted mt-0.5">Configure how data is filtered across dashboards and reports</p>
                    </div>
                </div>

                <div className="p-4 sm:p-5 space-y-5">
                    {/* Current active period preview */}
                    <div className="p-4 bg-theme-tertiary/50 rounded-lg border border-theme">
                        <div className="flex items-center gap-2 mb-1.5">
                            <Clock className="w-4 h-4 text-accent-gold" />
                            <span className="text-xs font-medium text-theme-muted uppercase tracking-wider">Current Active Period</span>
                        </div>
                        <p className="text-xl font-bold text-accent-gold">
                            {activePeriod?.period_name || globalSettings.period_type === 'forever' ? 'All Time' : activePeriod?.period_name || 'None'}
                        </p>
                        {activePeriod && (
                            <p className="text-sm text-theme-muted mt-0.5">
                                {new Date(activePeriod.start_date).toLocaleDateString()} — {new Date(activePeriod.end_date).toLocaleDateString()}
                            </p>
                        )}
                    </div>

                    {/* Period type selection — responsive grid */}
                    <div>
                        <label className={labelClass}>Period Type</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mt-1.5">
                            {PERIOD_TYPES.map(t => (
                                <button
                                    key={t.value}
                                    type="button"
                                    onClick={() => handleSettingsChange('period_type', t.value)}
                                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                                        globalSettings.period_type === t.value
                                            ? 'border-accent-gold bg-accent-gold/10 ring-1 ring-accent-gold/20'
                                            : 'border-theme hover:border-accent-gold/30 bg-theme-secondary'
                                    }`}
                                >
                                    <p className={`text-sm font-semibold ${globalSettings.period_type === t.value ? 'text-accent-gold' : 'text-theme-primary'}`}>{t.label}</p>
                                    <p className="text-xs text-theme-muted mt-0.5">{t.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom date range (conditional) */}
                    {globalSettings.period_type === 'custom' && (
                        <div className="p-4 bg-theme-tertiary/50 rounded-lg border border-theme space-y-3">
                            <h3 className="text-sm font-semibold text-theme-primary">Custom Date Range</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Start Date</label>
                                    <input type="date" value={globalSettings.custom_start_date} onChange={e => handleSettingsChange('custom_start_date', e.target.value)} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>End Date</label>
                                    <input type="date" value={globalSettings.custom_end_date} onChange={e => handleSettingsChange('custom_end_date', e.target.value)} className={inputClass} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Fiscal year start (conditional) */}
                    {globalSettings.period_type === 'yearly' && (
                        <div className="p-4 bg-theme-tertiary/50 rounded-lg border border-theme space-y-3">
                            <h3 className="text-sm font-semibold text-theme-primary">Fiscal Year Start</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Start Month</label>
                                    <select value={globalSettings.fiscal_year_start_month} onChange={e => handleSettingsChange('fiscal_year_start_month', parseInt(e.target.value))} className={selectClass}>
                                        {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Start Day</label>
                                    <input type="number" min="1" max="31" value={globalSettings.fiscal_year_start_day} onChange={e => handleSettingsChange('fiscal_year_start_day', parseInt(e.target.value))} className={inputClass} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Display options */}
                    <div className="space-y-2.5">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked={globalSettings.show_period_badge_on_dashboard ?? true} onChange={e => handleSettingsChange('show_period_badge_on_dashboard', e.target.checked)} className="w-4 h-4 rounded border-theme text-accent-gold focus:ring-accent-gold/30" />
                            <span className="text-sm text-theme-primary">Show period badge on dashboard</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked={globalSettings.allow_users_to_override ?? true} onChange={e => handleSettingsChange('allow_users_to_override', e.target.checked)} className="w-4 h-4 rounded border-theme text-accent-gold focus:ring-accent-gold/30" />
                            <span className="text-sm text-theme-primary">Allow users to override period on individual reports</span>
                        </label>
                    </div>

                    {/* Save button */}
                    <div className="flex justify-end pt-4 border-t border-theme">
                        <button type="button" onClick={handleSaveGlobalSettings} disabled={savingSettings || !settingsChanged} className={btnPrimary}>
                            {savingSettings ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                            {savingSettings ? 'Saving…' : 'Save Settings'}
                        </button>
                    </div>
                </div>
            </div>

            {/* ═══ Card 2: Accounting Periods ═══ */}
            <div className="bg-theme-primary rounded-xl border border-theme overflow-hidden">
                {/* Card header */}
                <div className="px-4 sm:px-5 py-4 border-b border-theme bg-theme-tertiary/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-accent-gold flex-shrink-0" />
                            <div>
                                <h2 className="text-base font-semibold text-theme-primary">Accounting Periods</h2>
                                <p className="text-xs text-theme-muted mt-0.5">Monthly periods for journal entries and financial statements</p>
                            </div>
                        </div>
                        {!globalSettings.auto_create_periods && (
                            <div className="flex items-center gap-2 shrink-0">
                                <button type="button" onClick={fetchData} className="p-2 border border-theme rounded-lg hover:bg-theme-tertiary transition-colors" title="Refresh">
                                    <RefreshCw size={15} className="text-theme-secondary" />
                                </button>
                                <button type="button" onClick={() => setShowGenerateModal(true)} className={btnPrimary}>
                                    <Plus size={14} /> Generate Periods
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Auto/Manual toggle */}
                    <div className="mt-4 p-4 bg-theme-secondary rounded-lg border border-theme">
                        <div className="flex items-start gap-3">
                            <input
                                type="checkbox"
                                id="auto-manage-toggle"
                                checked={globalSettings.auto_create_periods || false}
                                onChange={e => handleSettingsChange('auto_create_periods', e.target.checked)}
                                className="mt-0.5 w-4 h-4 rounded border-theme text-accent-gold focus:ring-accent-gold/30"
                            />
                            <div className="flex-1">
                                <label htmlFor="auto-manage-toggle" className="text-sm font-semibold text-theme-primary cursor-pointer">
                                    Automatic Period Management
                                </label>
                                <p className="text-xs text-theme-muted mt-1">
                                    {globalSettings.auto_create_periods
                                        ? 'System automatically generates, opens, and closes periods based on current date.'
                                        : 'Periods are managed manually. You need to generate, open, and close periods yourself.'}
                                </p>
                            </div>
                        </div>

                        {globalSettings.auto_create_periods && (
                            <div className="mt-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                                <div className="flex items-start gap-2 text-sm text-green-400">
                                    <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-medium">Auto-management is active</p>
                                        <ul className="list-disc list-inside mt-1 space-y-0.5 text-xs text-green-400/80">
                                            <li>Automatically generate periods for current and next year</li>
                                            <li>Open the period matching today's date</li>
                                            <li>Close past periods automatically</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Periods table — only when manual management */}
                {!globalSettings.auto_create_periods && (
                    <>
                        {periods.length === 0 ? (
                            <div className="py-12 text-center">
                                <Calendar className="w-12 h-12 mx-auto mb-3 text-theme-muted/50" />
                                <p className="text-sm text-theme-muted mb-4">No fiscal periods found</p>
                                <button type="button" onClick={() => setShowGenerateModal(true)} className={btnPrimary}>
                                    <Plus size={14} /> Generate First Year
                                </button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-theme bg-theme-tertiary/30">
                                            <th className="px-5 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">Period</th>
                                            <th className="px-5 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">Dates</th>
                                            <th className="px-5 py-3 text-center text-xs font-medium text-theme-muted uppercase tracking-wider">Status</th>
                                            <th className="px-5 py-3 text-center text-xs font-medium text-theme-muted uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {periods.map(p => {
                                            const sc = statusCfg[p.status] || statusCfg.open;
                                            return (
                                                <tr key={p.id} className="border-b border-theme hover:bg-theme-tertiary/30 transition-colors">
                                                    <td className="px-5 py-4">
                                                        <p className="font-medium text-sm text-theme-primary">{p.period_name}</p>
                                                        {p.notes && <p className="text-xs text-theme-muted mt-0.5">{p.notes}</p>}
                                                    </td>
                                                    <td className="px-5 py-4 text-sm text-theme-secondary whitespace-nowrap">
                                                        {new Date(p.start_date).toLocaleDateString()} — {new Date(p.end_date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-5 py-4 text-center">
                                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${sc.color}`}>
                                                            {p.is_active && '● '}{sc.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center justify-center gap-1">
                                                            {(p.status === 'open' || p.status === 'not_started') && (
                                                                <button type="button" onClick={() => handleAction('activate', p.id, 'activated')} className="p-1.5 rounded text-accent-gold hover:bg-accent-gold/10 transition-colors flex items-center gap-1 text-xs font-medium" title="Open / Activate">
                                                                    <Unlock size={14} /> Open
                                                                </button>
                                                            )}
                                                            {(p.status === 'open' || p.status === 'active') && (
                                                                <button type="button" onClick={() => handleAction('close', p.id, 'closed')} className="p-1.5 rounded text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-1 text-xs font-medium" title="Close">
                                                                    <Lock size={14} /> Close
                                                                </button>
                                                            )}
                                                            {p.status === 'closed' && (
                                                                <span className="text-theme-muted flex items-center gap-1 text-xs">
                                                                    <Lock size={14} /> Closed
                                                                </span>
                                                            )}
                                                            {p.status === 'locked' && (
                                                                <button type="button" onClick={() => handleAction('unlock', p.id, 'unlocked')} className="p-1.5 rounded text-blue-400 hover:bg-blue-500/10 transition-colors flex items-center gap-1 text-xs font-medium" title="Unlock">
                                                                    <Unlock size={14} /> Unlock
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}

                {/* Auto-management enabled info */}
                {globalSettings.auto_create_periods && (
                    <div className="py-12 text-center">
                        <div className="inline-flex items-center justify-center w-14 h-14 bg-green-500/10 rounded-full mb-3">
                            <Clock className="w-7 h-7 text-green-400" />
                        </div>
                        <h3 className="text-base font-semibold text-theme-primary mb-1">Auto-Management Enabled</h3>
                        <p className="text-sm text-theme-muted max-w-md mx-auto">
                            Periods are being automatically managed by the system. Manual generation and controls are disabled.
                        </p>
                    </div>
                )}
            </div>

            {/* Generate periods modal */}
            {showGenerateModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowGenerateModal(false)}>
                    <div className="bg-theme-secondary rounded-xl border border-theme shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-theme">
                            <h3 className="text-lg font-semibold text-theme-primary">Generate Fiscal Periods</h3>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className={labelClass}>Fiscal Year</label>
                                <input type="number" min="2000" max="2100" value={generateYear} onChange={e => setGenerateYear(e.target.value)} className={inputClass} />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowGenerateModal(false)} className={`flex-1 ${btnSecondary} justify-center`}>Cancel</button>
                                <button type="button" onClick={handleGenerate} disabled={generating} className={`flex-1 ${btnPrimary} justify-center`}>
                                    {generating ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                                    {generating ? 'Generating…' : 'Generate'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ════════════════════════════════════════════════════════════════════════════
// SECTION: Payment
// ════════════════════════════════════════════════════════════════════════════
const PaymentSection = ({ shared, onChange, onSave, onReset, saving }) => {
    const p = shared.payment;
    return (
        <div>
            <SectionHeader title="Payment Methods" subtitle="Configure accepted payment methods at point of sale" />
            <div className="space-y-1 max-w-lg">
                <ToggleSetting label="Cash Payments" description="Accept cash payments at POS" checked={p.cash_enabled} onChange={v => onChange('payment', 'cash_enabled', v)} />
                <ToggleSetting label="Card Payments" description="Accept debit/credit card payments" checked={p.card_enabled} onChange={v => onChange('payment', 'card_enabled', v)} />
                <ToggleSetting label="Bank Transfer" description="Accept bank transfer payments" checked={p.bank_transfer_enabled} onChange={v => onChange('payment', 'bank_transfer_enabled', v)} />
                <ToggleSetting label="Mobile Money" description="Accept mobile money payments" checked={p.mobile_money_enabled} onChange={v => onChange('payment', 'mobile_money_enabled', v)} />
                <div className="pt-4">
                    <label className={labelClass}>Default Payment Method</label>
                    <select value={p.default_payment_method} onChange={e => onChange('payment', 'default_payment_method', e.target.value)} className={`${selectClass} max-w-xs`}>
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="mobile_money">Mobile Money</option>
                    </select>
                </div>
            </div>
            <SaveBar onSave={() => onSave('payment')} onReset={() => onReset('payment')} saving={saving} hasChanges={shared.hasChanges.payment} />
        </div>
    );
};

// ════════════════════════════════════════════════════════════════════════════
// SECTION: Notifications
// ════════════════════════════════════════════════════════════════════════════
const NotificationsSection = ({ shared, onChange, onSave, onReset, saving }) => {
    const n = shared.notifications;
    return (
        <div>
            <SectionHeader title="Notifications" subtitle="Control alerts and notification preferences" />
            <div className="space-y-1 max-w-lg">
                <ToggleSetting label="Email Notifications" description="Receive notifications via email" checked={n.email_notifications} onChange={v => onChange('notifications', 'email_notifications', v)} />
                <ToggleSetting label="Low Stock Alerts" description="Get notified when products are running low" checked={n.low_stock_alerts} onChange={v => onChange('notifications', 'low_stock_alerts', v)} />
                {n.low_stock_alerts && (
                    <div className="pl-8 py-3">
                        <label className={labelClass}>Low Stock Threshold</label>
                        <input type="number" value={n.low_stock_threshold} onChange={e => onChange('notifications', 'low_stock_threshold', parseInt(e.target.value))} className={`${inputClass} max-w-[120px]`} />
                    </div>
                )}
                <ToggleSetting label="Daily Summary" description="Receive daily sales summary reports" checked={n.daily_summary} onChange={v => onChange('notifications', 'daily_summary', v)} />
                <ToggleSetting label="Order Notifications" description="Get notified for new orders" checked={n.order_notifications} onChange={v => onChange('notifications', 'order_notifications', v)} />
            </div>
            <SaveBar onSave={() => onSave('notifications')} onReset={() => onReset('notifications')} saving={saving} hasChanges={shared.hasChanges.notifications} />
        </div>
    );
};

// ════════════════════════════════════════════════════════════════════════════
// SECTION: Security
// ════════════════════════════════════════════════════════════════════════════
const SecuritySection = ({ shared, onChange, onSave, onReset, saving }) => {
    const s = shared.security;
    return (
        <div>
            <SectionHeader title="Security" subtitle="Authentication and session policies" />
            <div className="space-y-1 max-w-lg">
                <div className="py-3 border-b border-theme">
                    <label className={labelClass}>Session Timeout (minutes)</label>
                    <input type="number" value={s.session_timeout} onChange={e => onChange('security', 'session_timeout', parseInt(e.target.value))} className={`${inputClass} max-w-[120px]`} />
                    <p className="text-xs text-theme-muted mt-1">Auto logout after inactivity</p>
                </div>
                <ToggleSetting label="Require Password Change" description="Force users to change password periodically" checked={s.require_password_change} onChange={v => onChange('security', 'require_password_change', v)} />
                {s.require_password_change && (
                    <div className="pl-8 py-3">
                        <label className={labelClass}>Password Expiry (days)</label>
                        <input type="number" value={s.password_expiry_days} onChange={e => onChange('security', 'password_expiry_days', parseInt(e.target.value))} className={`${inputClass} max-w-[120px]`} />
                    </div>
                )}
                <ToggleSetting label="Two-Factor Authentication" description="Require 2FA for all users" checked={s.two_factor_enabled} onChange={v => onChange('security', 'two_factor_enabled', v)} />
            </div>
            <SaveBar onSave={() => onSave('security')} onReset={() => onReset('security')} saving={saving} hasChanges={shared.hasChanges.security} />
        </div>
    );
};

// ════════════════════════════════════════════════════════════════════════════
// SECTION: Display
// ════════════════════════════════════════════════════════════════════════════
const DisplaySection = ({ shared, onChange, onSave, onReset, saving }) => {
    const d = shared.display;
    const { theme: activeTheme, persistTheme } = useTheme();

    const handleThemeChange = (value) => {
        onChange('display', 'theme', value);
        persistTheme(value);  // Apply + persist to backend immediately
    };

    return (
        <div>
            <SectionHeader title="Display" subtitle="Appearance and layout preferences" />
            <div className="space-y-1 max-w-lg">
                <div className="py-3 border-b border-theme">
                    <label className={labelClass}>Items Per Page</label>
                    <select value={d.items_per_page} onChange={e => onChange('display', 'items_per_page', parseInt(e.target.value))} className={`${selectClass} max-w-[120px]`}>
                        {[10,20,50,100].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                </div>
                <div className="py-3 border-b border-theme">
                    <label className={labelClass}>Default View Mode</label>
                    <select value={d.default_view_mode} onChange={e => onChange('display', 'default_view_mode', e.target.value)} className={`${selectClass} max-w-[160px]`}>
                        <option value="grid">Grid View</option>
                        <option value="list">List View</option>
                    </select>
                </div>
                <ToggleSetting label="Show Product Images" description="Display product images in lists" checked={d.show_product_images} onChange={v => onChange('display', 'show_product_images', v)} />
                <ToggleSetting label="Compact Mode" description="Use compact spacing for denser layouts" checked={d.compact_mode} onChange={v => onChange('display', 'compact_mode', v)} />
                <div className="py-3">
                    <label className={labelClass}>Theme</label>
                    <select value={activeTheme} onChange={e => handleThemeChange(e.target.value)} className={`${selectClass} max-w-[160px]`}>
                        {themeList.map(t => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
                    </select>
                </div>
            </div>
            <SaveBar onSave={() => onSave('display')} onReset={() => onReset('display')} saving={saving} hasChanges={shared.hasChanges.display} />
        </div>
    );
};

// ════════════════════════════════════════════════════════════════════════════
// SECTION: Demo Mode
// ════════════════════════════════════════════════════════════════════════════
const blurOptions = [
    { key: 'blur_financial_data',   label: 'Financial Data',       desc: 'Blur all monetary values and financial summaries' },
    { key: 'blur_customer_data',    label: 'Customer Information', desc: 'Blur customer names, phones, and emails' },
    { key: 'blur_supplier_data',    label: 'Supplier Information', desc: 'Blur supplier names and contact details' },
    { key: 'blur_sales_figures',    label: 'Sales Figures',        desc: 'Blur sales amounts, totals, and transaction values' },
    { key: 'blur_inventory_values', label: 'Inventory Values',     desc: 'Blur stock values and cost prices' },
    { key: 'blur_account_balances', label: 'Account Balances',     desc: 'Blur bank balances and payment totals' },
];

const DemoSection = () => {
    const [s, setS] = useState({ demo_mode_enabled: false, blur_financial_data: false, blur_customer_data: false, blur_supplier_data: false, blur_sales_figures: false, blur_inventory_values: false, blur_account_balances: false });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try { const r = await api.get('/demo'); setS(p => ({ ...p, ...r.data })); setHasChanges(false); }
        catch { toast.error('Failed to load demo settings'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const set = (field, value) => { setS(p => ({ ...p, [field]: value })); setHasChanges(true); };
    const toggleAll = (on) => { setS(p => { const n = { ...p }; blurOptions.forEach(o => { n[o.key] = on; }); return n; }); setHasChanges(true); };

    const handleSave = async () => {
        setSaving(true);
        try { await api.put('/demo', s); toast.success('Demo settings saved'); setHasChanges(false); }
        catch { toast.error('Failed to save demo settings'); }
        finally { setSaving(false); }
    };

    if (loading) return <div className="h-40 bg-theme-tertiary rounded-xl animate-pulse" />;

    return (
        <div>
            <SectionHeader title="Demo Mode" subtitle="Configure data visibility during presentations and demonstrations" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-theme-primary rounded-xl border border-theme p-5">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h3 className="text-sm font-semibold text-theme-primary flex items-center gap-2"><ShieldAlert size={15} className="text-accent-gold" /> Demo Mode</h3>
                            <p className="text-xs text-theme-muted mt-1">Enable to blur sensitive data during presentations.</p>
                        </div>
                        <button type="button" onClick={() => set('demo_mode_enabled', !s.demo_mode_enabled)}
                            className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${s.demo_mode_enabled ? 'bg-accent-gold' : 'bg-theme-tertiary'}`}>
                            <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ${s.demo_mode_enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>
                    {s.demo_mode_enabled && (
                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                            <p className="text-xs text-yellow-400 font-medium flex items-center gap-2"><EyeOff size={13} /> Demo mode is active — sensitive data will be blurred.</p>
                        </div>
                    )}
                </div>
                <div className="bg-theme-primary rounded-xl border border-theme p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-theme-primary">Data Visibility Controls</h3>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => toggleAll(true)} className="text-xs px-2.5 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">Blur All</button>
                            <button type="button" onClick={() => toggleAll(false)} className="text-xs px-2.5 py-1 rounded bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors">Show All</button>
                        </div>
                    </div>
                    <div className="space-y-1">
                        {blurOptions.map(({ key, label, desc }) => (
                            <div key={key} className="flex items-center justify-between py-2.5 border-b border-theme last:border-0">
                                <div>
                                    <p className="font-medium text-sm text-theme-primary">{label}</p>
                                    <p className="text-xs text-theme-muted mt-0.5">{desc}</p>
                                </div>
                                <button type="button" onClick={() => set(key, !s[key])}
                                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${s[key] ? 'bg-red-500' : 'bg-theme-tertiary'}`}>
                                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${s[key] ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <SaveBar onSave={handleSave} onReset={fetchData} saving={saving} hasChanges={hasChanges} />
        </div>
    );
};

// ════════════════════════════════════════════════════════════════════════════
// Nav config
// ════════════════════════════════════════════════════════════════════════════
const NAV = [
    { id: 'general',       label: 'General',        icon: Building2,  group: 'core' },
    { id: 'branding',      label: 'Branding',        icon: Palette,    group: 'core' },
    { id: 'tax',           label: 'Tax',             icon: Calculator, group: 'core' },
    { id: 'receipt',       label: 'Receipt',         icon: Receipt,    group: 'core' },
    { id: 'fiscal',        label: 'Fiscal Periods',  icon: Calendar,   group: 'core' },
    { id: 'payment',       label: 'Payment',         icon: CreditCard, group: 'ops' },
    { id: 'notifications', label: 'Notifications',   icon: Bell,       group: 'ops' },
    { id: 'security',      label: 'Security',        icon: Shield,     group: 'ops' },
    { id: 'display',       label: 'Display',         icon: Monitor,    group: 'ops' },
    { id: 'demo',          label: 'Demo Mode',       icon: Eye,        group: 'advanced' },
];

const NAV_GROUPS = [
    { key: 'core',     label: 'Core' },
    { key: 'ops',      label: 'Operations' },
    { key: 'advanced', label: 'Advanced' },
];

const SYSTEM_DEFAULTS = {
    general:       { company_name: '', company_email: '', company_phone: '', company_address: '', currency: 'USD', timezone: 'UTC', date_format: 'MM/DD/YYYY', fiscal_year_start: '01' },
    payment:       { cash_enabled: true, card_enabled: true, bank_transfer_enabled: true, mobile_money_enabled: false, default_payment_method: 'cash' },
    notifications: { email_notifications: true, low_stock_alerts: true, low_stock_threshold: 10, daily_summary: false, order_notifications: true },
    security:      { session_timeout: 30, require_password_change: false, password_expiry_days: 90, two_factor_enabled: false },
    display:       { items_per_page: 20, default_view_mode: 'grid', show_product_images: true, compact_mode: false, theme: 'light' },
};

// ════════════════════════════════════════════════════════════════════════════
// Main Settings Component
// ════════════════════════════════════════════════════════════════════════════
const Settings = () => {
    const { updateCompanyName } = useBranding();
    const { setCurrency } = useCurrency();
    const [active, setActive] = useState('general');
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    // Track which sections have been visited so we mount them lazily
    const [visited, setVisited] = useState(() => new Set(['general']));
    const [systemLoading, setSystemLoading] = useState(true);
    const [systemSaving, setSystemSaving] = useState(false);
    const [system, setSystem] = useState(SYSTEM_DEFAULTS);
    const [systemOriginal, setSystemOriginal] = useState(SYSTEM_DEFAULTS);
    const [hasChanges, setHasChanges] = useState({ general: false, payment: false, notifications: false, security: false, display: false });

    useEffect(() => {
        (async () => {
            setSystemLoading(true);
            try {
                const r = await settingsAPI.getSettings();
                const d = r.settings || r.data || r;
                const loaded = {
                    general:       { ...SYSTEM_DEFAULTS.general,       ...d.general },
                    payment:       { ...SYSTEM_DEFAULTS.payment,       ...d.payment },
                    notifications: { ...SYSTEM_DEFAULTS.notifications, ...d.notifications },
                    security:      { ...SYSTEM_DEFAULTS.security,      ...d.security },
                    display:       { ...SYSTEM_DEFAULTS.display,       ...d.display },
                };
                setSystem(loaded);
                setSystemOriginal(loaded);
            } catch { toast.error('Failed to load settings'); }
            finally { setSystemLoading(false); }
        })();
    }, []);

    const handleSystemChange = (category, field, value) => {
        setSystem(p => ({ ...p, [category]: { ...p[category], [field]: value } }));
        setHasChanges(p => ({ ...p, [category]: true }));
    };

    const handleSystemSave = async (category) => {
        setSystemSaving(true);
        try {
            await settingsAPI.updateSettings(system);
            setSystemOriginal(p => ({ ...p, [category]: system[category] }));
            setHasChanges(p => ({ ...p, [category]: false }));
            toast.success('Settings saved');
            if (category === 'general') {
                updateCompanyName(system.general.company_name);
                setCurrency(system.general.currency);
            }
        } catch { toast.error('Failed to save settings'); }
        finally { setSystemSaving(false); }
    };

    const handleSystemReset = (category) => {
        setSystem(p => ({ ...p, [category]: systemOriginal[category] }));
        setHasChanges(p => ({ ...p, [category]: false }));
    };

    const navigateTo = (id) => {
        setActive(id);
        setVisited(p => new Set([...p, id]));
        setMobileNavOpen(false);
    };

    const sharedProps = {
        shared: { ...system, hasChanges },
        onChange: handleSystemChange,
        onSave: handleSystemSave,
        onReset: handleSystemReset,
        saving: systemSaving,
    };

    const activeItem = NAV.find(n => n.id === active);
    const ActiveIcon = activeItem?.icon || SettingsIcon;

    const SYSTEM_SECTIONS = ['general', 'payment', 'notifications', 'security', 'display'];
    const isSystemSection = SYSTEM_SECTIONS.includes(active);

    if (systemLoading && isSystemSection) {
        return (
            <div className="space-y-4 sm:space-y-6 max-w-[1700px] mx-auto pb-10">
                <div className="animate-pulse"><div className="h-8 w-40 bg-theme-tertiary rounded mb-2" /><div className="h-4 w-64 bg-theme-tertiary rounded" /></div>
                <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
                    <div className="hidden lg:block w-52 flex-shrink-0 space-y-2">{Array(10).fill(0).map((_, i) => <div key={i} className="h-10 bg-theme-tertiary rounded-lg animate-pulse" />)}</div>
                    <div className="flex-1 bg-theme-secondary rounded-xl border border-theme p-4 sm:p-6 animate-pulse"><div className="h-64 bg-theme-tertiary rounded-lg" /></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6 max-w-[1700px] mx-auto pb-10">
            <PageHeader title="Settings" subtitle="All application settings in one place" icon={SettingsIcon} />

            {/* ── Mobile section selector ──────────────────────────── */}
            <div className="lg:hidden">
                <button
                    type="button"
                    onClick={() => setMobileNavOpen(v => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-theme-secondary rounded-xl border border-theme text-sm font-medium text-theme-primary"
                >
                    <span className="flex items-center gap-2.5">
                        <ActiveIcon className="w-4 h-4 text-accent-gold" />
                        {activeItem?.label || 'General'}
                    </span>
                    <ChevronRight className={`w-4 h-4 text-theme-muted transition-transform ${mobileNavOpen ? 'rotate-90' : ''}`} />
                </button>
                {mobileNavOpen && (
                    <div className="mt-2 bg-theme-secondary rounded-xl border border-theme p-2 shadow-lg">
                        {NAV_GROUPS.map((group, gi) => (
                            <div key={group.key}>
                                {gi > 0 && <div className="my-1.5 border-t border-theme" />}
                                <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-theme-muted uppercase tracking-widest">{group.label}</p>
                                {NAV.filter(n => n.group === group.key).map(item => {
                                    const Icon = item.icon;
                                    const isAct = active === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => navigateTo(item.id)}
                                            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-all mb-0.5 ${isAct ? 'bg-accent-gold/10 text-accent-gold font-semibold border border-accent-gold/20' : 'text-theme-secondary hover:bg-theme-tertiary border border-transparent'}`}
                                        >
                                            <Icon className="w-4 h-4 flex-shrink-0" />
                                            <span className="flex-1">{item.label}</span>
                                            {isAct && <ChevronRight className="w-3 h-3 opacity-50" />}
                                        </button>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-start">
                {/* ── Left navigation (desktop only) ──────────────────── */}
                <nav className="hidden lg:block w-52 flex-shrink-0 bg-theme-secondary rounded-xl border border-theme p-2">
                    {NAV_GROUPS.map((group, gi) => (
                        <div key={group.key}>
                            {gi > 0 && <div className="my-1.5 border-t border-theme" />}
                            <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-theme-muted uppercase tracking-widest">{group.label}</p>
                            {NAV.filter(n => n.group === group.key).map(item => {
                                const Icon = item.icon;
                                const isAct = active === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => navigateTo(item.id)}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-all mb-0.5 ${isAct ? 'bg-accent-gold/10 text-accent-gold font-semibold border border-accent-gold/20' : 'text-theme-secondary hover:bg-theme-tertiary border border-transparent'}`}
                                    >
                                        <Icon className="w-4 h-4 flex-shrink-0" />
                                        <span className="flex-1">{item.label}</span>
                                        {isAct && <ChevronRight className="w-3 h-3 opacity-50" />}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                {/* ── Content panel ────────────────────────────────────── */}
                <div className="flex-1 w-full bg-theme-secondary rounded-xl border border-theme shadow-theme-sm p-4 sm:p-6 min-h-[400px] lg:min-h-[500px]">
                    {/* System-shared sections — always mounted, hidden/shown with CSS */}
                    <div className={active === 'general'       ? '' : 'hidden'}>{!systemLoading && <GeneralSection       {...sharedProps} />}</div>
                    <div className={active === 'payment'       ? '' : 'hidden'}>{!systemLoading && <PaymentSection       {...sharedProps} />}</div>
                    <div className={active === 'notifications' ? '' : 'hidden'}>{!systemLoading && <NotificationsSection {...sharedProps} />}</div>
                    <div className={active === 'security'      ? '' : 'hidden'}>{!systemLoading && <SecuritySection      {...sharedProps} />}</div>
                    <div className={active === 'display'       ? '' : 'hidden'}>{!systemLoading && <DisplaySection       {...sharedProps} />}</div>

                    {/* Independent sections — lazily mounted on first visit */}
                    {visited.has('branding') && <div className={active === 'branding' ? '' : 'hidden'}><BrandingSection /></div>}
                    {visited.has('tax')      && <div className={active === 'tax'      ? '' : 'hidden'}><TaxSection /></div>}
                    {visited.has('receipt')  && <div className={active === 'receipt'  ? '' : 'hidden'}><ReceiptSection /></div>}
                    {visited.has('fiscal')   && <div className={active === 'fiscal'   ? '' : 'hidden'}><FiscalSection /></div>}
                    {visited.has('demo')     && <div className={active === 'demo'     ? '' : 'hidden'}><DemoSection /></div>}
                </div>
            </div>
        </div>
    );
};

export default Settings;
