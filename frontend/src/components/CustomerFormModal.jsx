import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Globe } from 'lucide-react';
import useFormDraft from '../hooks/useFormDraft';
import DraftRecoveryBanner from './common/DraftRecoveryBanner';

const defaultCustomerData = {
    customer_number: '',
    customer_type: 'Retail',
    customer_name: '',
    contact_person: '',
    email: '',
    phone_number: '',
    alternative_phone: '',
    whatsapp_number: '',
    address: '',
    city: '',
    state: '',
    country: 'Nigeria',
    tax_id: '',
    price_tier_id: '',
    referred_by: '',
    credit_limit: 0,
    payment_terms_days: 0,
    is_active: true,
    source: 'shop',
    // Online store account fields
    create_store_account: false,
    password: '',
};

const CustomerFormModal = ({ isOpen, onClose, onSubmit, customer, priceTiers, referrers = [] }) => {
    const [formData, setFormData] = useState(defaultCustomerData);
    const [showPassword, setShowPassword] = useState(false);

    const isEditMode = !!customer;
    const draftKey = isEditMode ? `customer_edit_${customer?.id}` : 'customer_create';
    const { draftData, hasDraft, applyDraft, dismissDraft, saveDraft, clearDraft } = useFormDraft(draftKey, {
        label: isEditMode ? `Edit: ${customer?.customer_name || 'Customer'}` : 'New Customer',
        entityType: 'customer',
        initialData: defaultCustomerData,
        isOpen,
    });

    useEffect(() => { saveDraft(formData); }, [formData, saveDraft]);

    const handleRestoreDraft = () => {
        if (draftData) {
            setFormData(prev => ({ ...prev, ...draftData }));
            applyDraft();
        }
    };


    useEffect(() => {
        if (customer) {
            setFormData({
                customer_number: customer.customer_number || '',
                customer_type: customer.customer_type || 'Retail',
                customer_name: customer.customer_name || '',
                contact_person: customer.contact_person || '',
                email: customer.email || '',
                phone_number: customer.phone_number || '',
                alternative_phone: customer.alternative_phone || '',
                whatsapp_number: customer.whatsapp_number || '',
                address: customer.address || '',
                city: customer.city || '',
                state: customer.state || '',
                country: customer.country || 'Nigeria',
                tax_id: customer.tax_id || '',
                price_tier_id: customer.price_tier_id || '',
                referred_by: customer.referred_by || '',
                credit_limit: customer.credit_limit || 0,
                payment_terms_days: customer.payment_terms_days || 0,
                is_active: customer.is_active ?? true,
                source: customer.source || 'shop',
                create_store_account: false,
                password: '',
            });

        } else {
            setFormData({
                customer_number: `CUST-${Date.now().toString().slice(-6)}`,
                customer_type: 'Retail',
                customer_name: '',
                contact_person: '',
                email: '',
                phone_number: '',
                alternative_phone: '',
                whatsapp_number: '',
                address: '',
                city: '',
                state: '',
                country: 'Nigeria',
                tax_id: '',
                price_tier_id: '',
                referred_by: '',
                credit_limit: 0,
                payment_terms_days: 0,
                is_active: true,
                source: 'shop',
                create_store_account: false,
                password: '',
            });

        }
    }, [customer, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        clearDraft();
        onSubmit(formData);
    };

    const isOnlineSource = formData.source === 'online';
    const showStoreAccountSection = isOnlineSource && !isEditMode;
    // In edit mode, if customer is online source, show whether they have a store account
    const isExistingOnlineCustomer = isEditMode && customer?.source === 'online';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-10">
            <div className="bg-theme-secondary rounded-lg shadow-xl w-full max-w-4xl my-auto">
                <div className="flex justify-between items-center p-4 border-b border-theme">
                    <h2 className="text-xl font-semibold text-theme-primary">{customer ? 'Edit Customer' : 'Add New Customer'}</h2>
                    <button onClick={onClose} className="text-theme-muted hover:text-theme-primary transition">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6">
                    <DraftRecoveryBanner
                        visible={hasDraft}
                        label={isEditMode ? `Edit: ${customer?.customer_name}` : 'New Customer'}
                        updatedAt={draftData?._savedAt}
                        onRestore={handleRestoreDraft}
                        onDiscard={dismissDraft}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        <div className="col-span-1 lg:col-span-3 pb-2 border-b border-theme">
                            <h3 className="text-sm font-semibold text-accent-gold uppercase">Basic Information</h3>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Customer Number</label>
                            <input
                                type="text"
                                name="customer_number"
                                value={formData.customer_number}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none font-mono text-sm"
                                required
                                disabled={!!customer}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Customer Type</label>
                            <select
                                name="customer_type"
                                value={formData.customer_type}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                required
                            >
                                <option value="Retail">Retail</option>
                                <option value="Wholesale">Wholesale</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Source</label>
                            <select
                                name="source"
                                value={formData.source}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                disabled={isEditMode}
                            >
                                <option value="shop">Shop (In-Store)</option>
                                <option value="online">Online (Store)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Customer/Company Name</label>
                            <input
                                type="text"
                                name="customer_name"
                                value={formData.customer_name}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                required
                            />
                        </div>

                        <div className="col-span-1 lg:col-span-3 pb-2 border-b border-theme mt-4">
                            <h3 className="text-sm font-semibold text-accent-gold uppercase">Contact Details</h3>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Contact Person</label>
                            <input
                                type="text"
                                name="contact_person"
                                value={formData.contact_person}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Email Address {isOnlineSource && <span className="text-red-500">*</span>}</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                required={isOnlineSource}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Phone Number</label>
                            <input
                                type="text"
                                name="phone_number"
                                value={formData.phone_number}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Alternative Phone</label>
                            <input
                                type="text"
                                name="alternative_phone"
                                value={formData.alternative_phone}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">WhatsApp Number</label>
                            <input
                                type="text"
                                name="whatsapp_number"
                                value={formData.whatsapp_number}
                                onChange={handleChange}
                                placeholder="+234 800 000 0000"
                                className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                            />
                        </div>
                        <div className="md:col-span-2 lg:col-span-1">
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Address</label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">City</label>
                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">State</label>
                            <input
                                type="text"
                                name="state"
                                value={formData.state}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Country</label>
                            <input
                                type="text"
                                name="country"
                                value={formData.country}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                            />
                        </div>

                        {/* Store Account Section — only for new online customers */}
                        {showStoreAccountSection && (
                            <>
                                <div className="col-span-1 lg:col-span-3 pb-2 border-b border-theme mt-4">
                                    <h3 className="text-sm font-semibold text-accent-gold uppercase flex items-center gap-2">
                                        <Globe size={14} />
                                        Online Store Account
                                    </h3>
                                </div>

                                <div className="col-span-1 lg:col-span-3">
                                    <div className="flex items-center gap-2 mb-4">
                                        <input
                                            type="checkbox"
                                            name="create_store_account"
                                            id="create_store_account"
                                            checked={formData.create_store_account}
                                            onChange={handleChange}
                                            className="w-4 h-4 text-accent-gold border-theme rounded focus:ring-accent-gold"
                                        />
                                        <label htmlFor="create_store_account" className="text-sm font-medium text-theme-secondary">
                                            Create store login account for this customer
                                        </label>
                                    </div>
                                    {formData.create_store_account && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-theme-primary rounded-lg border border-theme">
                                            <div>
                                                <label className="block text-sm font-medium text-theme-secondary mb-1">
                                                    Password <span className="text-red-500">*</span>
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type={showPassword ? 'text' : 'password'}
                                                        name="password"
                                                        value={formData.password}
                                                        onChange={handleChange}
                                                        className="w-full px-3 py-2 pr-10 border border-theme bg-theme-secondary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                                        placeholder="Min. 8 characters"
                                                        required={formData.create_store_account}
                                                        minLength={8}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-primary transition"
                                                        tabIndex={-1}
                                                    >
                                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex items-end">
                                                <p className="text-xs text-theme-muted leading-relaxed">
                                                    This account will be immediately active and verified. The customer can log in to the store using their email (or WhatsApp number) and this password.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Existing online customer info */}
                        {isExistingOnlineCustomer && (
                            <>
                                <div className="col-span-1 lg:col-span-3 pb-2 border-b border-theme mt-4">
                                    <h3 className="text-sm font-semibold text-accent-gold uppercase flex items-center gap-2">
                                        <Globe size={14} />
                                        Online Store Account
                                    </h3>
                                </div>
                                <div className="col-span-1 lg:col-span-3">
                                    <div className="p-3 bg-theme-primary rounded-lg border border-theme text-sm text-theme-secondary">
                                        {customer.is_email_verified ? (
                                            <span className="text-green-600 dark:text-green-400 font-medium">Store account is active and verified</span>
                                        ) : (
                                            <span className="text-amber-600 dark:text-amber-400 font-medium">Store account is pending verification</span>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="col-span-1 lg:col-span-3 pb-2 border-b border-theme mt-4">
                            <h3 className="text-sm font-semibold text-accent-gold uppercase">Pricing & Credit</h3>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Price Tier</label>
                            <select
                                name="price_tier_id"
                                value={formData.price_tier_id}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                            >
                                <option value="">Standard Retail</option>
                                {priceTiers.map(tier => (
                                    <option key={tier.id} value={tier.id}>{tier.tier_name} ({tier.discount_percentage}%)</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Referrer / Agent</label>
                            <select
                                name="referred_by"
                                value={formData.referred_by}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                            >
                                <option value="">No Referrer</option>
                                {referrers.map(ref => (
                                    <option key={ref.id} value={ref.id}>{ref.full_name} ({ref.referrer_code})</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Credit Limit</label>
                            <input
                                type="number"
                                name="credit_limit"
                                value={formData.credit_limit}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Payment Terms (Days)</label>
                            <input
                                type="number"
                                name="payment_terms_days"
                                value={formData.payment_terms_days}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mb-6">
                        <input
                            type="checkbox"
                            name="is_active"
                            id="cust_active"
                            checked={formData.is_active}
                            onChange={handleChange}
                            className="w-4 h-4 text-accent-gold border-theme rounded focus:ring-accent-gold"
                        />
                        <label htmlFor="cust_active" className="text-sm font-medium text-theme-secondary">Active Account</label>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-theme font-semibold">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 text-theme-secondary bg-theme-primary hover:bg-theme-tertiary border border-theme rounded-lg transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-8 py-2 bg-accent-gold text-white rounded-lg hover:bg-accent-goldDark shadow-md transition"
                        >
                            {customer ? 'Update Customer' : 'Save Customer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CustomerFormModal;
