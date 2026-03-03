import React, { useState, useEffect } from 'react';
import { Eye, Save, RefreshCw, EyeOff, ShieldAlert } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import { toast } from 'react-toastify';
import api from '../api/axios';

const blurOptions = [
    { key: 'blur_financial_data', label: 'Financial Data', desc: 'Blur all monetary values and financial summaries' },
    { key: 'blur_customer_data', label: 'Customer Information', desc: 'Blur customer names, phone numbers, and emails' },
    { key: 'blur_supplier_data', label: 'Supplier Information', desc: 'Blur supplier names and contact details' },
    { key: 'blur_sales_figures', label: 'Sales Figures', desc: 'Blur sales amounts, totals, and transaction values' },
    { key: 'blur_inventory_values', label: 'Inventory Values', desc: 'Blur stock values and cost prices' },
    { key: 'blur_account_balances', label: 'Account Balances', desc: 'Blur bank balances and payment totals' },
];

const DemoSettingsPage = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        demo_mode_enabled: false,
        blur_financial_data: false,
        blur_customer_data: false,
        blur_supplier_data: false,
        blur_sales_figures: false,
        blur_inventory_values: false,
        blur_account_balances: false
    });

    useEffect(() => { fetchSettings(); }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await api.get('/demo');
            setSettings(prev => ({ ...prev, ...res.data }));
        } catch (err) {
            toast.error('Failed to load demo settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put('/demo', settings);
            toast.success('Demo settings saved');
        } catch (err) {
            toast.error('Failed to save demo settings');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field, value) => setSettings(prev => ({ ...prev, [field]: value }));

    const toggleAll = (enabled) => {
        const updated = { ...settings };
        blurOptions.forEach(o => { updated[o.key] = enabled; });
        setSettings(updated);
    };

    const actions = (
        <div className="flex items-center gap-3">
            <button onClick={fetchSettings} className="px-4 py-2.5 text-sm font-medium text-theme-secondary bg-theme-tertiary hover:bg-theme-primary border border-theme rounded-lg transition-colors flex items-center gap-2">
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
                <div className="animate-pulse"><div className="h-8 w-40 bg-theme-tertiary rounded mb-2"></div></div>
                <div className="h-64 bg-theme-tertiary rounded-xl animate-pulse"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-[1700px] mx-auto pb-10">
            <PageHeader title="Demo Settings" subtitle="Configure demonstration mode and data visibility" icon={Eye} actions={actions} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Demo Mode Toggle */}
                <div className="bg-theme-secondary rounded-xl border border-theme shadow-theme-sm p-6">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-theme-primary flex items-center gap-2">
                                <ShieldAlert size={18} className="text-accent-gold" /> Demo Mode
                            </h3>
                            <p className="text-sm text-theme-muted mt-1">Enable demo mode to blur sensitive data during presentations and demonstrations.</p>
                        </div>
                        <button onClick={() => handleChange('demo_mode_enabled', !settings.demo_mode_enabled)}
                            className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${settings.demo_mode_enabled ? 'bg-accent-gold' : 'bg-theme-tertiary'}`}>
                            <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ${settings.demo_mode_enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    {settings.demo_mode_enabled && (
                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                            <p className="text-sm text-yellow-400 font-medium flex items-center gap-2">
                                <EyeOff size={16} /> Demo mode is active
                            </p>
                            <p className="text-xs text-yellow-400/70 mt-1">Sensitive data will be blurred according to the settings below.</p>
                        </div>
                    )}
                </div>

                {/* Blur Controls */}
                <div className="bg-theme-secondary rounded-xl border border-theme shadow-theme-sm p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-lg font-semibold text-theme-primary">Data Visibility Controls</h3>
                        <div className="flex gap-2">
                            <button onClick={() => toggleAll(true)} className="text-xs px-2.5 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">Blur All</button>
                            <button onClick={() => toggleAll(false)} className="text-xs px-2.5 py-1 rounded bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors">Show All</button>
                        </div>
                    </div>
                    <div className="space-y-1">
                        {blurOptions.map(({ key, label, desc }) => (
                            <div key={key} className="flex items-center justify-between py-3 border-b border-theme last:border-0">
                                <div>
                                    <p className="font-medium text-sm text-theme-primary">{label}</p>
                                    <p className="text-xs text-theme-muted mt-0.5">{desc}</p>
                                </div>
                                <button onClick={() => handleChange(key, !settings[key])}
                                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${settings[key] ? 'bg-red-500' : 'bg-theme-tertiary'}`}>
                                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${settings[key] ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DemoSettingsPage;
