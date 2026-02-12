import React, { useState, useEffect } from 'react';
import {
    Settings as SettingsIcon,
    Building2,
    CreditCard,
    Bell,
    Shield,
    Palette,
    Database,
    Globe,
    Save,
    RefreshCw,
    Check,
    X
} from 'lucide-react';
import { Button, LoadingSpinner, Input, Modal } from '../components/ui';
import { toast } from 'react-toastify';
import { settingsAPI } from '../api/settings';

/**
 * Settings Page
 * Comprehensive app configuration hub
 */
const Settings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    const [hasChanges, setHasChanges] = useState(false);

    // Settings state
    const [settings, setSettings] = useState({
        general: {
            company_name: '',
            company_email: '',
            company_phone: '',
            company_address: '',
            currency: 'USD',
            timezone: 'UTC',
            date_format: 'MM/DD/YYYY',
            fiscal_year_start: '01'
        },
        tax: {
            tax_enabled: true,
            default_tax_rate: 0,
            tax_inclusive: false,
            tax_number: ''
        },
        payment: {
            cash_enabled: true,
            card_enabled: true,
            bank_transfer_enabled: true,
            mobile_money_enabled: false,
            default_payment_method: 'cash'
        },
        notifications: {
            email_notifications: true,
            low_stock_alerts: true,
            low_stock_threshold: 10,
            daily_summary: false,
            order_notifications: true
        },
        security: {
            session_timeout: 30,
            require_password_change: false,
            password_expiry_days: 90,
            two_factor_enabled: false
        },
        display: {
            items_per_page: 20,
            default_view_mode: 'grid',
            show_product_images: true,
            compact_mode: false,
            theme: 'light'
        },
        receipt: {
            show_logo: true,
            header_text: '',
            footer_text: 'Thank you for your business!',
            show_tax_breakdown: true,
            auto_print: false
        }
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const response = await settingsAPI.getSettings();
            const data = response.settings || response.data || response;

            // Merge with defaults to ensure all keys exist
            setSettings({
                general: {
                    company_name: data.general?.company_name || '',
                    company_email: data.general?.company_email || '',
                    company_phone: data.general?.company_phone || '',
                    company_address: data.general?.company_address || '',
                    currency: data.general?.currency || 'USD',
                    timezone: data.general?.timezone || 'UTC',
                    date_format: data.general?.date_format || 'MM/DD/YYYY',
                    fiscal_year_start: data.general?.fiscal_year_start || '01'
                },
                tax: {
                    tax_enabled: data.tax?.tax_enabled ?? true,
                    default_tax_rate: data.tax?.default_tax_rate || 0,
                    tax_inclusive: data.tax?.tax_inclusive ?? false,
                    tax_number: data.tax?.tax_number || ''
                },
                payment: {
                    cash_enabled: data.payment?.cash_enabled ?? true,
                    card_enabled: data.payment?.card_enabled ?? true,
                    bank_transfer_enabled: data.payment?.bank_transfer_enabled ?? true,
                    mobile_money_enabled: data.payment?.mobile_money_enabled ?? false,
                    default_payment_method: data.payment?.default_payment_method || 'cash'
                },
                notifications: {
                    email_notifications: data.notifications?.email_notifications ?? true,
                    low_stock_alerts: data.notifications?.low_stock_alerts ?? true,
                    low_stock_threshold: data.notifications?.low_stock_threshold || 10,
                    daily_summary: data.notifications?.daily_summary ?? false,
                    order_notifications: data.notifications?.order_notifications ?? true
                },
                security: {
                    session_timeout: data.security?.session_timeout || 30,
                    require_password_change: data.security?.require_password_change ?? false,
                    password_expiry_days: data.security?.password_expiry_days || 90,
                    two_factor_enabled: data.security?.two_factor_enabled ?? false
                },
                display: {
                    items_per_page: data.display?.items_per_page || 20,
                    default_view_mode: data.display?.default_view_mode || 'grid',
                    show_product_images: data.display?.show_product_images ?? true,
                    compact_mode: data.display?.compact_mode ?? false,
                    theme: data.display?.theme || 'light'
                },
                receipt: {
                    show_logo: data.receipt?.show_logo ?? true,
                    header_text: data.receipt?.header_text || '',
                    footer_text: data.receipt?.footer_text || 'Thank you for your business!',
                    show_tax_breakdown: data.receipt?.show_tax_breakdown ?? true,
                    auto_print: data.receipt?.auto_print ?? false
                }
            });
        } catch (error) {
            console.error('Error fetching settings:', error);
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSettingChange = (category, key, value) => {
        setSettings(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [key]: value
            }
        }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await settingsAPI.updateSettings(settings);
            toast.success('Settings saved successfully');
            setHasChanges(false);
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error(error.response?.data?.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        fetchSettings();
        setHasChanges(false);
    };

    const tabs = [
        { id: 'general', label: 'General', icon: Building2 },
        { id: 'tax', label: 'Tax', icon: CreditCard },
        { id: 'payment', label: 'Payment', icon: CreditCard },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'display', label: 'Display', icon: Palette },
        { id: 'receipt', label: 'Receipt', icon: Database }
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-theme-primary">Settings</h1>
                    <p className="text-theme-secondary mt-1">Manage your application configuration</p>
                </div>
                <div className="flex items-center gap-3">
                    {hasChanges && (
                        <span className="text-sm text-orange-600 font-medium">Unsaved changes</span>
                    )}
                    <Button variant="outline" icon={RefreshCw} onClick={handleReset} disabled={saving} className="border-theme text-theme-primary hover:bg-theme-tertiary">
                        Reset
                    </Button>
                    <Button
                        variant="primary"
                        icon={Save}
                        onClick={handleSave}
                        disabled={!hasChanges || saving}
                        loading={saving}
                    >
                        Save Changes
                    </Button>
                </div>
            </div>

            <div className="flex gap-6">
                {/* Sidebar Tabs */}
                <div className="w-56 flex-shrink-0">
                    <nav className="space-y-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                                    activeTab === tab.id
                                        ? 'bg-blue-50 text-blue-700 font-medium dark:bg-blue-900/30 dark:text-blue-400'
                                        : 'text-theme-secondary hover:bg-theme-tertiary'
                                }`}
                            >
                                <tab.icon className="w-5 h-5" />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content */}
                <div className="flex-1 bg-theme-secondary rounded-xl border border-theme p-6">
                    {/* General Settings */}
                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-theme-primary mb-4">General Settings</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-theme-secondary mb-2">
                                        Company Name
                                    </label>
                                    <Input
                                        value={settings.general.company_name}
                                        onChange={(e) => handleSettingChange('general', 'company_name', e.target.value)}
                                        placeholder="Enter company name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-theme-secondary mb-2">
                                        Company Email
                                    </label>
                                    <Input
                                        type="email"
                                        value={settings.general.company_email}
                                        onChange={(e) => handleSettingChange('general', 'company_email', e.target.value)}
                                        placeholder="Enter company email"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-theme-secondary mb-2">
                                        Company Phone
                                    </label>
                                    <Input
                                        value={settings.general.company_phone}
                                        onChange={(e) => handleSettingChange('general', 'company_phone', e.target.value)}
                                        placeholder="Enter phone number"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-theme-secondary mb-2">
                                        Currency
                                    </label>
                                    <select
                                        value={settings.general.currency}
                                        onChange={(e) => handleSettingChange('general', 'currency', e.target.value)}
                                        className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="USD" className="bg-theme-secondary">USD - US Dollar</option>
                                        <option value="EUR" className="bg-theme-secondary">EUR - Euro</option>
                                        <option value="GBP" className="bg-theme-secondary">GBP - British Pound</option>
                                        <option value="NGN" className="bg-theme-secondary">NGN - Nigerian Naira</option>
                                        <option value="KES" className="bg-theme-secondary">KES - Kenyan Shilling</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-theme-secondary mb-2">
                                        Company Address
                                    </label>
                                    <textarea
                                        value={settings.general.company_address}
                                        onChange={(e) => handleSettingChange('general', 'company_address', e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-theme-muted"
                                        placeholder="Enter company address"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-theme-secondary mb-2">
                                        Timezone
                                    </label>
                                    <select
                                        value={settings.general.timezone}
                                        onChange={(e) => handleSettingChange('general', 'timezone', e.target.value)}
                                        className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="UTC" className="bg-theme-secondary">UTC</option>
                                        <option value="America/New_York" className="bg-theme-secondary">Eastern Time</option>
                                        <option value="America/Chicago" className="bg-theme-secondary">Central Time</option>
                                        <option value="America/Los_Angeles" className="bg-theme-secondary">Pacific Time</option>
                                        <option value="Europe/London" className="bg-theme-secondary">London</option>
                                        <option value="Africa/Lagos" className="bg-theme-secondary">Lagos</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-theme-secondary mb-2">
                                        Date Format
                                    </label>
                                    <select
                                        value={settings.general.date_format}
                                        onChange={(e) => handleSettingChange('general', 'date_format', e.target.value)}
                                        className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="MM/DD/YYYY" className="bg-theme-secondary">MM/DD/YYYY</option>
                                        <option value="DD/MM/YYYY" className="bg-theme-secondary">DD/MM/YYYY</option>
                                        <option value="YYYY-MM-DD" className="bg-theme-secondary">YYYY-MM-DD</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tax Settings */}
                    {activeTab === 'tax' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Tax Settings</h2>

                            <div className="space-y-4">
                                <ToggleSetting
                                    label="Enable Tax"
                                    description="Apply tax to sales transactions"
                                    checked={settings.tax.tax_enabled}
                                    onChange={(val) => handleSettingChange('tax', 'tax_enabled', val)}
                                />

                                {settings.tax.tax_enabled && (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Default Tax Rate (%)
                                                </label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={settings.tax.default_tax_rate}
                                                    onChange={(e) => handleSettingChange('tax', 'default_tax_rate', parseFloat(e.target.value))}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Tax Identification Number
                                                </label>
                                                <Input
                                                    value={settings.tax.tax_number}
                                                    onChange={(e) => handleSettingChange('tax', 'tax_number', e.target.value)}
                                                    placeholder="Enter tax ID"
                                                />
                                            </div>
                                        </div>

                                        <ToggleSetting
                                            label="Tax Inclusive Pricing"
                                            description="Product prices already include tax"
                                            checked={settings.tax.tax_inclusive}
                                            onChange={(val) => handleSettingChange('tax', 'tax_inclusive', val)}
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Payment Settings */}
                    {activeTab === 'payment' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-theme-primary mb-4">Payment Methods</h2>

                            <div className="space-y-4">
                                <ToggleSetting
                                    label="Cash Payments"
                                    description="Accept cash payments at POS"
                                    checked={settings.payment.cash_enabled}
                                    onChange={(val) => handleSettingChange('payment', 'cash_enabled', val)}
                                />
                                <ToggleSetting
                                    label="Card Payments"
                                    description="Accept debit/credit card payments"
                                    checked={settings.payment.card_enabled}
                                    onChange={(val) => handleSettingChange('payment', 'card_enabled', val)}
                                />
                                <ToggleSetting
                                    label="Bank Transfer"
                                    description="Accept bank transfer payments"
                                    checked={settings.payment.bank_transfer_enabled}
                                    onChange={(val) => handleSettingChange('payment', 'bank_transfer_enabled', val)}
                                />
                                <ToggleSetting
                                    label="Mobile Money"
                                    description="Accept mobile money payments"
                                    checked={settings.payment.mobile_money_enabled}
                                    onChange={(val) => handleSettingChange('payment', 'mobile_money_enabled', val)}
                                />

                                <div className="pt-4">
                                    <label className="block text-sm font-medium text-theme-secondary mb-2">
                                        Default Payment Method
                                    </label>
                                    <select
                                        value={settings.payment.default_payment_method}
                                        onChange={(e) => handleSettingChange('payment', 'default_payment_method', e.target.value)}
                                        className="w-full max-w-xs px-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="cash" className="bg-theme-secondary">Cash</option>
                                        <option value="card" className="bg-theme-secondary">Card</option>
                                        <option value="bank_transfer" className="bg-theme-secondary">Bank Transfer</option>
                                        <option value="mobile_money" className="bg-theme-secondary">Mobile Money</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notification Settings */}
                    {activeTab === 'notifications' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Notification Settings</h2>

                            <div className="space-y-4">
                                <ToggleSetting
                                    label="Email Notifications"
                                    description="Receive notifications via email"
                                    checked={settings.notifications.email_notifications}
                                    onChange={(val) => handleSettingChange('notifications', 'email_notifications', val)}
                                />
                                <ToggleSetting
                                    label="Low Stock Alerts"
                                    description="Get notified when products are running low"
                                    checked={settings.notifications.low_stock_alerts}
                                    onChange={(val) => handleSettingChange('notifications', 'low_stock_alerts', val)}
                                />

                                {settings.notifications.low_stock_alerts && (
                                    <div className="ml-8">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Low Stock Threshold
                                        </label>
                                        <Input
                                            type="number"
                                            value={settings.notifications.low_stock_threshold}
                                            onChange={(e) => handleSettingChange('notifications', 'low_stock_threshold', parseInt(e.target.value))}
                                            className="max-w-[120px]"
                                        />
                                    </div>
                                )}

                                <ToggleSetting
                                    label="Daily Summary"
                                    description="Receive daily sales summary reports"
                                    checked={settings.notifications.daily_summary}
                                    onChange={(val) => handleSettingChange('notifications', 'daily_summary', val)}
                                />
                                <ToggleSetting
                                    label="Order Notifications"
                                    description="Get notified for new orders"
                                    checked={settings.notifications.order_notifications}
                                    onChange={(val) => handleSettingChange('notifications', 'order_notifications', val)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Security Settings */}
                    {activeTab === 'security' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Security Settings</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Session Timeout (minutes)
                                    </label>
                                    <Input
                                        type="number"
                                        value={settings.security.session_timeout}
                                        onChange={(e) => handleSettingChange('security', 'session_timeout', parseInt(e.target.value))}
                                        className="max-w-[120px]"
                                    />
                                    <p className="text-sm text-gray-500 mt-1">Auto logout after inactivity</p>
                                </div>

                                <ToggleSetting
                                    label="Require Password Change"
                                    description="Force users to change password periodically"
                                    checked={settings.security.require_password_change}
                                    onChange={(val) => handleSettingChange('security', 'require_password_change', val)}
                                />

                                {settings.security.require_password_change && (
                                    <div className="ml-8">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Password Expiry (days)
                                        </label>
                                        <Input
                                            type="number"
                                            value={settings.security.password_expiry_days}
                                            onChange={(e) => handleSettingChange('security', 'password_expiry_days', parseInt(e.target.value))}
                                            className="max-w-[120px]"
                                        />
                                    </div>
                                )}

                                <ToggleSetting
                                    label="Two-Factor Authentication"
                                    description="Require 2FA for all users"
                                    checked={settings.security.two_factor_enabled}
                                    onChange={(val) => handleSettingChange('security', 'two_factor_enabled', val)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Display Settings */}
                    {activeTab === 'display' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-theme-primary mb-4">Display Settings</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-theme-secondary mb-2">
                                        Items Per Page
                                    </label>
                                    <select
                                        value={settings.display.items_per_page}
                                        onChange={(e) => handleSettingChange('display', 'items_per_page', parseInt(e.target.value))}
                                        className="w-full max-w-[120px] px-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value={10} className="bg-theme-secondary">10</option>
                                        <option value={20} className="bg-theme-secondary">20</option>
                                        <option value={50} className="bg-theme-secondary">50</option>
                                        <option value={100} className="bg-theme-secondary">100</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-theme-secondary mb-2">
                                        Default View Mode
                                    </label>
                                    <select
                                        value={settings.display.default_view_mode}
                                        onChange={(e) => handleSettingChange('display', 'default_view_mode', e.target.value)}
                                        className="w-full max-w-[150px] px-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="grid" className="bg-theme-secondary">Grid View</option>
                                        <option value="list" className="bg-theme-secondary">List View</option>
                                    </select>
                                </div>

                                <ToggleSetting
                                    label="Show Product Images"
                                    description="Display product images in lists"
                                    checked={settings.display.show_product_images}
                                    onChange={(val) => handleSettingChange('display', 'show_product_images', val)}
                                />
                                <ToggleSetting
                                    label="Compact Mode"
                                    description="Use compact spacing for denser layouts"
                                    checked={settings.display.compact_mode}
                                    onChange={(val) => handleSettingChange('display', 'compact_mode', val)}
                                />

                                <div>
                                    <label className="block text-sm font-medium text-theme-secondary mb-2">
                                        Theme
                                    </label>
                                    <select
                                        value={settings.display.theme}
                                        onChange={(e) => handleSettingChange('display', 'theme', e.target.value)}
                                        className="w-full max-w-[150px] px-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="light" className="bg-theme-secondary">Light</option>
                                        <option value="midnight" className="bg-theme-secondary">Midnight</option>
                                        <option value="charcoal" className="bg-theme-secondary">Charcoal</option>
                                        <option value="ocean" className="bg-theme-secondary">Ocean</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Receipt Settings */}
                    {activeTab === 'receipt' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Receipt Settings</h2>

                            <div className="space-y-4">
                                <ToggleSetting
                                    label="Show Logo"
                                    description="Display company logo on receipts"
                                    checked={settings.receipt.show_logo}
                                    onChange={(val) => handleSettingChange('receipt', 'show_logo', val)}
                                />

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Receipt Header Text
                                    </label>
                                    <Input
                                        value={settings.receipt.header_text}
                                        onChange={(e) => handleSettingChange('receipt', 'header_text', e.target.value)}
                                        placeholder="Welcome message or header text"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Receipt Footer Text
                                    </label>
                                    <Input
                                        value={settings.receipt.footer_text}
                                        onChange={(e) => handleSettingChange('receipt', 'footer_text', e.target.value)}
                                        placeholder="Thank you message or footer text"
                                    />
                                </div>

                                <ToggleSetting
                                    label="Show Tax Breakdown"
                                    description="Display detailed tax information on receipts"
                                    checked={settings.receipt.show_tax_breakdown}
                                    onChange={(val) => handleSettingChange('receipt', 'show_tax_breakdown', val)}
                                />
                                <ToggleSetting
                                    label="Auto Print"
                                    description="Automatically print receipt after sale"
                                    checked={settings.receipt.auto_print}
                                    onChange={(val) => handleSettingChange('receipt', 'auto_print', val)}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Toggle Setting Component
const ToggleSetting = ({ label, description, checked, onChange }) => (
    <div className="flex items-center justify-between py-3 border-b border-theme last:border-0">
        <div>
            <p className="font-medium text-theme-primary">{label}</p>
            <p className="text-sm text-theme-muted">{description}</p>
        </div>
        <button
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
            }`}
        >
            <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    checked ? 'translate-x-5' : 'translate-x-0'
                }`}
            />
        </button>
    </div>
);

export default Settings;
