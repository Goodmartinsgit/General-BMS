import React, { useState, useEffect } from 'react';
import { Calculator, Save, RefreshCw } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import { toast } from 'react-toastify';
import api from '../api/axios';

const TaxSettingsPage = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        tax_enabled: true,
        standard_rate: 0,
        reduced_rate: 0,
        zero_rate: 0,
        tax_application_mode: 'exclusive',
        tax_number: '',
        effective_date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => { fetchSettings(); }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await api.get('/tax-settings');
            setSettings(prev => ({ ...prev, ...res.data }));
        } catch (err) {
            toast.error('Failed to load tax settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put('/tax-settings', settings);
            toast.success('Tax settings saved successfully');
        } catch (err) {
            toast.error('Failed to save tax settings');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field, value) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    const inputClass = "w-full px-3 py-2.5 bg-theme-primary border border-theme rounded-lg text-sm text-theme-primary placeholder-theme-muted focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all";

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
                <div className="bg-theme-secondary rounded-xl border border-theme p-6 animate-pulse space-y-4">
                    {Array(5).fill(0).map((_, i) => (<div key={i} className="h-12 bg-theme-tertiary rounded-lg"></div>))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-[1700px] mx-auto pb-10">
            <PageHeader title="Tax Settings" subtitle="Configure tax rates and application modes" icon={Calculator} actions={actions} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tax Configuration */}
                <div className="bg-theme-secondary rounded-xl border border-theme shadow-theme-sm p-6">
                    <h3 className="text-lg font-semibold text-theme-primary mb-5">Tax Configuration</h3>

                    <div className="space-y-5">
                        {/* Enable/Disable */}
                        <div className="flex items-center justify-between py-3 border-b border-theme">
                            <div>
                                <p className="font-medium text-sm text-theme-primary">Enable Tax</p>
                                <p className="text-xs text-theme-muted mt-0.5">Apply tax calculations to transactions</p>
                            </div>
                            <button onClick={() => handleChange('tax_enabled', !settings.tax_enabled)}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${settings.tax_enabled ? 'bg-accent-gold' : 'bg-theme-tertiary'}`}>
                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${settings.tax_enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        {settings.tax_enabled && (
                            <>
                                <div>
                                    <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">Standard Tax Rate (%)</label>
                                    <input type="number" step="0.01" min="0" max="100" value={settings.standard_rate} onChange={(e) => handleChange('standard_rate', parseFloat(e.target.value) || 0)} className={`${inputClass} max-w-[200px]`} />
                                    <p className="text-xs text-theme-muted mt-1">Applied to most goods and services</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">Reduced Tax Rate (%)</label>
                                    <input type="number" step="0.01" min="0" max="100" value={settings.reduced_rate} onChange={(e) => handleChange('reduced_rate', parseFloat(e.target.value) || 0)} className={`${inputClass} max-w-[200px]`} />
                                    <p className="text-xs text-theme-muted mt-1">For eligible items with lower tax rates</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">Zero-Rated (%)</label>
                                    <input type="number" step="0.01" value={settings.zero_rate} onChange={(e) => handleChange('zero_rate', parseFloat(e.target.value) || 0)} className={`${inputClass} max-w-[200px]`} disabled />
                                    <p className="text-xs text-theme-muted mt-1">Exempt items (always 0%)</p>
                                </div>

                                {/* Application Mode */}
                                <div className="pt-2">
                                    <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-3">Tax Application Mode</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { value: 'exclusive', label: 'Tax Exclusive', desc: 'Tax added on top of prices' },
                                            { value: 'inclusive', label: 'Tax Inclusive', desc: 'Prices already include tax' }
                                        ].map(option => (
                                            <button key={option.value} onClick={() => handleChange('tax_application_mode', option.value)}
                                                className={`p-4 rounded-lg border text-left transition-all ${settings.tax_application_mode === option.value ? 'border-accent-gold bg-accent-gold/10 ring-2 ring-accent-gold/20' : 'border-theme bg-theme-primary hover:border-accent-gold/30'}`}>
                                                <p className={`text-sm font-semibold ${settings.tax_application_mode === option.value ? 'text-accent-gold' : 'text-theme-primary'}`}>{option.label}</p>
                                                <p className="text-xs text-theme-muted mt-1">{option.desc}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Tax Registration */}
                <div className="bg-theme-secondary rounded-xl border border-theme shadow-theme-sm p-6">
                    <h3 className="text-lg font-semibold text-theme-primary mb-5">Tax Registration</h3>
                    <div className="space-y-5">
                        <div>
                            <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">Tax Identification Number (TIN)</label>
                            <input type="text" value={settings.tax_number} onChange={(e) => handleChange('tax_number', e.target.value)} placeholder="Enter your TIN" className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">Effective Date</label>
                            <input type="date" value={settings.effective_date?.split('T')[0] || ''} onChange={(e) => handleChange('effective_date', e.target.value)} className={inputClass} />
                            <p className="text-xs text-theme-muted mt-1">Date these tax rates take effect</p>
                        </div>

                        {/* Summary Card */}
                        {settings.tax_enabled && (
                            <div className="mt-6 p-4 bg-theme-primary rounded-lg border border-theme">
                                <h4 className="text-sm font-semibold text-theme-primary mb-3">Current Tax Summary</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between"><span className="text-theme-muted">Standard Rate</span><span className="text-theme-primary font-medium">{settings.standard_rate}%</span></div>
                                    <div className="flex justify-between"><span className="text-theme-muted">Reduced Rate</span><span className="text-theme-primary font-medium">{settings.reduced_rate}%</span></div>
                                    <div className="flex justify-between"><span className="text-theme-muted">Mode</span><span className="text-theme-primary font-medium capitalize">{settings.tax_application_mode}</span></div>
                                    <div className="flex justify-between"><span className="text-theme-muted">TIN</span><span className="text-theme-primary font-medium">{settings.tax_number || 'Not set'}</span></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaxSettingsPage;
