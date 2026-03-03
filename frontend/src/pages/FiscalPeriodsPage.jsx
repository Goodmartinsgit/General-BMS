import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Lock, Unlock, CheckCircle, XCircle, Play, Trash2, Save, RefreshCw, Settings, Clock, Eye, Users } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import { toast } from 'react-toastify';
import { fiscalPeriodsAPI } from '../api/fiscalPeriods';
import { useFiscalPeriod } from '../context/FiscalPeriodContext';

const statusConfig = {
    open: { label: 'Open', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    active: { label: 'Active', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
    closed: { label: 'Closed', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
    locked: { label: 'Locked', color: 'bg-red-500/10 text-red-400 border-red-500/20' }
};

const PERIOD_TYPES = [
    { value: 'daily', label: 'Daily', desc: 'Reset every day', icon: '📅' },
    { value: 'weekly', label: 'Weekly', desc: 'Monday to Sunday', icon: '📆' },
    { value: 'monthly', label: 'Monthly', desc: 'Calendar month', icon: '🗓️' },
    { value: 'quarterly', label: 'Quarterly', desc: '3-month periods', icon: '📊' },
    { value: 'half_yearly', label: 'Half-Yearly', desc: '6-month periods', icon: '📈' },
    { value: 'yearly', label: 'Yearly', desc: 'Full fiscal year', icon: '🏢' },
    { value: 'forever', label: 'All Time', desc: 'No date filtering', icon: '♾️' },
    { value: 'custom', label: 'Custom', desc: 'Pick your own range', icon: '🔧' },
];

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const FiscalPeriodsPage = () => {
    const { periodRange, refresh: refreshGlobal, settings: ctxSettings } = useFiscalPeriod();
    const [periods, setPeriods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ period_name: '', start_date: '', end_date: '', notes: '' });
    const [globalSettings, setGlobalSettings] = useState({
        fiscal_year_start_month: 1, fiscal_year_start_day: 1,
        auto_create_periods: false, period_type: 'forever',
        custom_start_date: '', custom_end_date: '',
        show_period_badge_on_dashboard: true, allow_users_to_override: true
    });
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('settings'); // 'settings' or 'periods'

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [periodsData, settingsRes] = await Promise.all([
                fiscalPeriodsAPI.getAll(),
                fiscalPeriodsAPI.getGlobalSettings()
            ]);
            setPeriods(periodsData);
            const s = settingsRes?.data || settingsRes;
            if (s) setGlobalSettings(prev => ({
                ...prev,
                ...s,
                custom_start_date: s.custom_start_date ? s.custom_start_date.split('T')[0] : '',
                custom_end_date: s.custom_end_date ? s.custom_end_date.split('T')[0] : ''
            }));
        } catch (err) {
            toast.error('Failed to load fiscal periods');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!form.period_name || !form.start_date || !form.end_date) {
            return toast.error('Please fill in all required fields');
        }
        setSaving(true);
        try {
            await fiscalPeriodsAPI.create(form);
            toast.success('Fiscal period created');
            setShowCreate(false);
            setForm({ period_name: '', start_date: '', end_date: '', notes: '' });
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create period');
        } finally {
            setSaving(false);
        }
    };

    const handleAction = async (action, id, label) => {
        try {
            await fiscalPeriodsAPI[action](id);
            toast.success(`Period ${label} successfully`);
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || `Failed to ${label} period`);
        }
    };

    const handleSaveGlobalSettings = async () => {
        setSaving(true);
        try {
            await fiscalPeriodsAPI.updateGlobalSettings({
                ...globalSettings,
                custom_start_date: globalSettings.custom_start_date || null,
                custom_end_date: globalSettings.custom_end_date || null,
            });
            toast.success('Global fiscal settings saved');
            refreshGlobal();
        } catch (err) {
            toast.error('Failed to save global settings');
        } finally {
            setSaving(false);
        }
    };

    const inputClass = "w-full px-3 py-2.5 bg-theme-primary border border-theme rounded-lg text-sm text-theme-primary placeholder-theme-muted focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all";
    const selectClass = "w-full px-3 py-2.5 bg-theme-primary border border-theme rounded-lg text-sm text-theme-primary focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all appearance-none cursor-pointer";

    if (loading) {
        return (
            <div className="space-y-6 max-w-[1700px] mx-auto pb-10">
                <div className="animate-pulse"><div className="h-8 w-48 bg-theme-tertiary rounded mb-2"></div></div>
                <div className="space-y-3">{Array(4).fill(0).map((_, i) => (<div key={i} className="h-20 bg-theme-tertiary rounded-lg animate-pulse"></div>))}</div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-[1700px] mx-auto pb-10">
            <PageHeader title="Fiscal Periods" subtitle="Manage global date filtering and accounting periods" icon={Calendar} />

            {/* Current Active Period Banner */}
            <div className="bg-gradient-to-r from-accent-gold/10 via-accent-gold/5 to-transparent rounded-xl border border-accent-gold/20 p-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-accent-gold/15 rounded-xl flex items-center justify-center">
                            <Clock size={22} className="text-accent-gold" />
                        </div>
                        <div>
                            <p className="text-xs text-theme-muted uppercase tracking-wider font-medium mb-0.5">Current Active Period</p>
                            <p className="text-lg font-bold text-theme-primary">{periodRange.period_label || 'All Time'}</p>
                            {periodRange.start_date && (
                                <p className="text-xs text-theme-secondary mt-0.5">
                                    {new Date(periodRange.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    {' → '}
                                    {new Date(periodRange.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                            )}
                        </div>
                    </div>
                    <span className="px-3 py-1 bg-accent-gold/10 text-accent-gold rounded-full text-xs font-semibold border border-accent-gold/20">
                        {globalSettings.period_type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 bg-theme-tertiary/50 rounded-lg p-1 w-fit">
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'settings' ? 'bg-theme-secondary text-theme-primary shadow-sm' : 'text-theme-muted hover:text-theme-secondary'}`}
                >
                    <Settings size={14} className="inline mr-2 -mt-0.5" /> Global Settings
                </button>
                <button
                    onClick={() => setActiveTab('periods')}
                    className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'periods' ? 'bg-theme-secondary text-theme-primary shadow-sm' : 'text-theme-muted hover:text-theme-secondary'}`}
                >
                    <Calendar size={14} className="inline mr-2 -mt-0.5" /> Period Management
                </button>
            </div>

            {/* GLOBAL SETTINGS TAB */}
            {activeTab === 'settings' && (
                <div className="space-y-6">
                    {/* Period Type Selection */}
                    <div className="bg-theme-secondary rounded-xl border border-theme shadow-theme-sm p-6">
                        <h3 className="text-base font-semibold text-theme-primary mb-1">Period Type</h3>
                        <p className="text-xs text-theme-muted mb-4">Select how date filtering works across the application</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {PERIOD_TYPES.map(pt => {
                                const isActive = globalSettings.period_type === pt.value;
                                return (
                                    <button
                                        key={pt.value}
                                        onClick={() => setGlobalSettings(s => ({ ...s, period_type: pt.value }))}
                                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                                            isActive
                                                ? 'border-accent-gold bg-accent-gold/5 shadow-sm'
                                                : 'border-theme hover:border-accent-gold/30 bg-theme-primary/50'
                                        }`}
                                    >
                                        <span className="text-2xl">{pt.icon}</span>
                                        <p className={`text-sm font-semibold mt-2 ${isActive ? 'text-accent-gold' : 'text-theme-primary'}`}>{pt.label}</p>
                                        <p className="text-xs text-theme-muted mt-0.5">{pt.desc}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Custom Date Range (only when period_type === 'custom') */}
                    {globalSettings.period_type === 'custom' && (
                        <div className="bg-theme-secondary rounded-xl border border-theme shadow-theme-sm p-6">
                            <h3 className="text-base font-semibold text-theme-primary mb-4">Custom Date Range</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">Start Date</label>
                                    <input
                                        type="date"
                                        value={globalSettings.custom_start_date}
                                        onChange={(e) => setGlobalSettings(s => ({ ...s, custom_start_date: e.target.value }))}
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">End Date</label>
                                    <input
                                        type="date"
                                        value={globalSettings.custom_end_date}
                                        onChange={(e) => setGlobalSettings(s => ({ ...s, custom_end_date: e.target.value }))}
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Fiscal Year Start (only when period_type === 'yearly') */}
                    {globalSettings.period_type === 'yearly' && (
                        <div className="bg-theme-secondary rounded-xl border border-theme shadow-theme-sm p-6">
                            <h3 className="text-base font-semibold text-theme-primary mb-4">Fiscal Year Start</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">Start Month</label>
                                    <select
                                        value={globalSettings.fiscal_year_start_month}
                                        onChange={(e) => setGlobalSettings(s => ({ ...s, fiscal_year_start_month: parseInt(e.target.value) }))}
                                        className={selectClass}
                                    >
                                        {MONTHS.map((m, i) => (
                                            <option key={i} value={i + 1}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">Start Day</label>
                                    <input
                                        type="number" min="1" max="31"
                                        value={globalSettings.fiscal_year_start_day}
                                        onChange={(e) => setGlobalSettings(s => ({ ...s, fiscal_year_start_day: parseInt(e.target.value) || 1 }))}
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Display & Override Options */}
                    <div className="bg-theme-secondary rounded-xl border border-theme shadow-theme-sm p-6">
                        <h3 className="text-base font-semibold text-theme-primary mb-4">Display Options</h3>
                        <div className="space-y-4">
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={globalSettings.show_period_badge_on_dashboard}
                                    onChange={(e) => setGlobalSettings(s => ({ ...s, show_period_badge_on_dashboard: e.target.checked }))}
                                    className="rounded border-theme mt-0.5"
                                />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Eye size={14} className="text-theme-muted" />
                                        <span className="text-sm font-medium text-theme-primary group-hover:text-accent-gold transition-colors">Show period badge on dashboard</span>
                                    </div>
                                    <p className="text-xs text-theme-muted mt-0.5">Display the current active period as a badge on the main dashboard</p>
                                </div>
                            </label>
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={globalSettings.allow_users_to_override}
                                    onChange={(e) => setGlobalSettings(s => ({ ...s, allow_users_to_override: e.target.checked }))}
                                    className="rounded border-theme mt-0.5"
                                />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Users size={14} className="text-theme-muted" />
                                        <span className="text-sm font-medium text-theme-primary group-hover:text-accent-gold transition-colors">Allow users to override period on pages</span>
                                    </div>
                                    <p className="text-xs text-theme-muted mt-0.5">Let users choose a different period (Today, This Week, etc.) on individual pages</p>
                                </div>
                            </label>
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={globalSettings.auto_create_periods}
                                    onChange={(e) => setGlobalSettings(s => ({ ...s, auto_create_periods: e.target.checked }))}
                                    className="rounded border-theme mt-0.5"
                                />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <RefreshCw size={14} className="text-theme-muted" />
                                        <span className="text-sm font-medium text-theme-primary group-hover:text-accent-gold transition-colors">Auto-create periods when fiscal year starts</span>
                                    </div>
                                    <p className="text-xs text-theme-muted mt-0.5">Automatically generate accounting periods at the start of each fiscal year</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end">
                        <button
                            onClick={handleSaveGlobalSettings}
                            disabled={saving}
                            className="px-6 py-3 text-sm font-semibold bg-accent-gold text-white rounded-xl hover:bg-accent-goldDark transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
                        >
                            {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                            {saving ? 'Saving...' : 'Save Global Settings'}
                        </button>
                    </div>
                </div>
            )}

            {/* PERIOD MANAGEMENT TAB */}
            {activeTab === 'periods' && (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <button onClick={() => setShowCreate(true)} className="px-4 py-2.5 text-sm font-semibold bg-accent-gold text-white rounded-lg hover:bg-accent-goldDark transition-colors flex items-center gap-2">
                            <Plus size={16} /> New Period
                        </button>
                    </div>

                    {/* Create Period Modal */}
                    {showCreate && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
                            <div className="bg-theme-secondary rounded-xl border border-theme shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                                <h3 className="text-lg font-semibold text-theme-primary mb-4">Create Fiscal Period</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">Period Name *</label>
                                        <input type="text" value={form.period_name} onChange={(e) => setForm(f => ({ ...f, period_name: e.target.value }))} placeholder="e.g. FY 2026 Q1" className={inputClass} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">Start Date *</label>
                                            <input type="date" value={form.start_date} onChange={(e) => setForm(f => ({ ...f, start_date: e.target.value }))} className={inputClass} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">End Date *</label>
                                            <input type="date" value={form.end_date} onChange={(e) => setForm(f => ({ ...f, end_date: e.target.value }))} className={inputClass} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">Notes</label>
                                        <textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className={inputClass} placeholder="Optional notes" />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button onClick={() => setShowCreate(false)} className="px-4 py-2.5 text-sm font-medium text-theme-secondary bg-theme-tertiary rounded-lg border border-theme">Cancel</button>
                                    <button onClick={handleCreate} disabled={saving} className="px-4 py-2.5 text-sm font-semibold bg-accent-gold text-white rounded-lg hover:bg-accent-goldDark disabled:opacity-50 flex items-center gap-2">
                                        {saving ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />} Create
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Periods Table */}
                    <div className="bg-theme-secondary rounded-xl border border-theme shadow-theme-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-theme bg-theme-tertiary/50">
                                        <th className="text-left px-6 py-3 text-xs font-medium text-theme-muted uppercase tracking-wider">Period</th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-theme-muted uppercase tracking-wider">Start Date</th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-theme-muted uppercase tracking-wider">End Date</th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-theme-muted uppercase tracking-wider">Status</th>
                                        <th className="text-right px-6 py-3 text-xs font-medium text-theme-muted uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {periods.length === 0 ? (
                                        <tr><td colSpan={5} className="text-center py-12 text-theme-muted">No fiscal periods created yet. Click "New Period" to create one.</td></tr>
                                    ) : periods.map((period) => {
                                        const cfg = statusConfig[period.status] || statusConfig.open;
                                        return (
                                            <tr key={period.id} className="border-b border-theme hover:bg-theme-tertiary/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="font-medium text-sm text-theme-primary">{period.period_name}</p>
                                                    {period.notes && <p className="text-xs text-theme-muted mt-0.5">{period.notes}</p>}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-theme-secondary">{new Date(period.start_date).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 text-sm text-theme-secondary">{new Date(period.end_date).toLocaleDateString()}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.color}`}>
                                                        {period.is_active && '● '}{cfg.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {period.status === 'open' && (
                                                            <button onClick={() => handleAction('activate', period.id, 'activated')} className="p-1.5 rounded-lg text-green-400 hover:bg-green-500/10 transition-colors" title="Activate">
                                                                <Play size={15} />
                                                            </button>
                                                        )}
                                                        {(period.status === 'open' || period.status === 'active') && (
                                                            <button onClick={() => handleAction('close', period.id, 'closed')} className="p-1.5 rounded-lg text-yellow-400 hover:bg-yellow-500/10 transition-colors" title="Close">
                                                                <XCircle size={15} />
                                                            </button>
                                                        )}
                                                        {period.status === 'closed' && (
                                                            <button onClick={() => handleAction('lock', period.id, 'locked')} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors" title="Lock">
                                                                <Lock size={15} />
                                                            </button>
                                                        )}
                                                        {period.status === 'locked' && (
                                                            <button onClick={() => handleAction('unlock', period.id, 'unlocked')} className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10 transition-colors" title="Unlock">
                                                                <Unlock size={15} />
                                                            </button>
                                                        )}
                                                        {period.status !== 'locked' && (
                                                            <button onClick={() => handleAction('delete', period.id, 'deleted')} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors" title="Delete">
                                                                <Trash2 size={15} />
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
                    </div>
                </div>
            )}
        </div>
    );
};

export default FiscalPeriodsPage;
