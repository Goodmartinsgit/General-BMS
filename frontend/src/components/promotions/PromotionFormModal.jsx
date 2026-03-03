import React, { useState, useEffect } from 'react';
import { Tag, Percent, DollarSign, Gift, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import Modal from '../ui/Modal';

const inputClass = 'w-full px-3 py-2.5 bg-theme-primary border border-theme rounded-lg text-sm text-theme-primary placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 transition-all';
const labelClass = 'block text-sm font-medium text-theme-secondary mb-1';
const sectionHeadClass = 'text-xs font-semibold text-accent-gold uppercase tracking-wider pb-2 border-b border-theme';
const helperClass = 'mt-1 text-xs text-theme-muted';
const errorClass = 'mt-1 text-xs text-red-500';

const PromotionFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  promotion = null,
  loading = false,
}) => {
  const isEditMode = !!promotion;

  const [formData, setFormData] = useState({
    promotion_name: '',
    promotion_type: 'percentage',
    description: '',
    discount_percentage: '',
    discount_amount: '',
    buy_quantity: '',
    get_quantity: '',
    min_purchase_amount: '',
    min_quantity: '',
    max_discount_amount: '',
    start_date: '',
    end_date: '',
    is_active: true,
    applies_to: 'all',
    product_ids: [],
    category_ids: [],
    coupon_code: '',
    usage_limit: '',
    usage_count: 0,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (promotion) {
        setFormData({
          promotion_name:      promotion.promotion_name      || '',
          promotion_type:      promotion.promotion_type      || 'percentage',
          description:         promotion.description         || '',
          discount_percentage: promotion.discount_percentage || '',
          discount_amount:     promotion.discount_amount     || '',
          buy_quantity:        promotion.buy_quantity        || '',
          get_quantity:        promotion.get_quantity        || '',
          min_purchase_amount: promotion.min_purchase_amount || '',
          min_quantity:        promotion.min_quantity        || '',
          max_discount_amount: promotion.max_discount_amount || '',
          start_date:          promotion.start_date?.split('T')[0] || '',
          end_date:            promotion.end_date?.split('T')[0]   || '',
          is_active:           promotion.is_active !== false,
          applies_to:          promotion.applies_to  || 'all',
          product_ids:         promotion.product_ids  || [],
          category_ids:        promotion.category_ids || [],
          coupon_code:         promotion.coupon_code  || '',
          usage_limit:         promotion.usage_limit  || '',
          usage_count:         promotion.usage_count  || 0,
        });
      } else {
        setFormData({
          promotion_name: '', promotion_type: 'percentage', description: '',
          discount_percentage: '', discount_amount: '', buy_quantity: '', get_quantity: '',
          min_purchase_amount: '', min_quantity: '', max_discount_amount: '',
          start_date: '', end_date: '', is_active: true, applies_to: 'all',
          product_ids: [], category_ids: [], coupon_code: '', usage_limit: '', usage_count: 0,
        });
      }
      setErrors({});
    }
  }, [isOpen, promotion]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.promotion_name.trim()) errs.promotion_name = 'Promotion name is required';

    switch (formData.promotion_type) {
      case 'percentage':
        if (!formData.discount_percentage || parseFloat(formData.discount_percentage) <= 0)
          errs.discount_percentage = 'Valid discount percentage is required';
        if (parseFloat(formData.discount_percentage) > 100)
          errs.discount_percentage = 'Discount cannot exceed 100%';
        break;
      case 'fixed_amount':
        if (!formData.discount_amount || parseFloat(formData.discount_amount) <= 0)
          errs.discount_amount = 'Valid discount amount is required';
        break;
      case 'bogo':
        if (!formData.buy_quantity || parseInt(formData.buy_quantity) <= 0)
          errs.buy_quantity = 'Valid buy quantity is required';
        if (!formData.get_quantity || parseInt(formData.get_quantity) <= 0)
          errs.get_quantity = 'Valid get quantity is required';
        break;
      case 'bulk_discount':
        if (!formData.min_quantity || parseInt(formData.min_quantity) <= 0)
          errs.min_quantity = 'Valid minimum quantity is required';
        if (!formData.discount_percentage || parseFloat(formData.discount_percentage) <= 0)
          errs.discount_percentage = 'Valid discount percentage is required';
        break;
      default: break;
    }

    if (formData.start_date && formData.end_date && new Date(formData.start_date) > new Date(formData.end_date))
      errs.end_date = 'End date must be after start date';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => { if (validate()) onSubmit(formData); };

  const promotionTypes = [
    { value: 'percentage',    label: 'Percentage Discount',  icon: Percent,    description: 'e.g., 20% off entire purchase' },
    { value: 'fixed_amount',  label: 'Fixed Amount Off',     icon: DollarSign, description: 'e.g., $10 off purchase' },
    { value: 'bogo',          label: 'BOGO (Buy X Get Y)',   icon: Gift,       description: 'e.g., Buy 2 Get 1 Free' },
    { value: 'bulk_discount', label: 'Bulk Discount',        icon: TrendingUp, description: 'e.g., 10% off when buying 5+' },
  ];

  const selectedType = promotionTypes.find(t => t.value === formData.promotion_type);

  const Field = ({ label, error, helper, required: req, children }) => (
    <div>
      <label className={labelClass}>{label}{req && <span className="text-red-500 ml-1">*</span>}</label>
      {children}
      {error  && <p className={errorClass}>{error}</p>}
      {helper && !error && <p className={helperClass}>{helper}</p>}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Promotion' : 'Create New Promotion'}
      size="xl"
      footer={
        <div className="flex items-center gap-3">
          <button type="button" onClick={onClose} disabled={loading}
            className="px-4 py-2 text-sm font-medium text-theme-secondary bg-theme-primary hover:bg-theme-tertiary border border-theme rounded-lg transition-colors">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={loading}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-accent-gold rounded-lg hover:bg-accent-goldDark transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {loading && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            {isEditMode ? 'Update Promotion' : 'Create Promotion'}
          </button>
        </div>
      }
    >
      <div className="space-y-6">

        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className={sectionHeadClass}>Basic Information</h3>

          <Field label="Promotion Name" error={errors.promotion_name} required>
            <input
              type="text" value={formData.promotion_name}
              onChange={e => handleChange('promotion_name', e.target.value)}
              placeholder="e.g., Summer Sale 2026"
              className={`${inputClass} ${errors.promotion_name ? 'border-red-500/60' : ''}`}
            />
          </Field>

          <Field label="Description">
            <textarea
              value={formData.description}
              onChange={e => handleChange('description', e.target.value)}
              rows={2}
              placeholder="Optional description for customers"
              className={inputClass}
            />
          </Field>
        </div>

        {/* Promotion Type */}
        <div className="space-y-4">
          <h3 className={sectionHeadClass}>Discount Type</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {promotionTypes.map(type => {
              const Icon = type.icon;
              const selected = formData.promotion_type === type.value;
              return (
                <button
                  key={type.value} type="button"
                  onClick={() => handleChange('promotion_type', type.value)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${selected ? 'border-accent-gold bg-accent-gold/10' : 'border-theme hover:border-accent-gold/40 bg-theme-primary'}`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${selected ? 'text-accent-gold' : 'text-theme-muted'}`} />
                    <div>
                      <p className={`text-sm font-semibold mb-0.5 ${selected ? 'text-accent-gold' : 'text-theme-primary'}`}>{type.label}</p>
                      <p className="text-xs text-theme-muted">{type.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Type-Specific Fields */}
        <div className="space-y-4">
          <h3 className={sectionHeadClass}>{selectedType?.label} Settings</h3>

          {formData.promotion_type === 'percentage' && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Discount Percentage" error={errors.discount_percentage} helper="Percentage off (0–100%)" required>
                <input type="number" step="0.01" min="0" max="100" value={formData.discount_percentage}
                  onChange={e => handleChange('discount_percentage', e.target.value)}
                  placeholder="e.g., 20"
                  className={`${inputClass} ${errors.discount_percentage ? 'border-red-500/60' : ''}`}
                />
              </Field>
              <Field label="Max Discount Amount" helper="Optional cap on discount">
                <input type="number" step="0.01" min="0" value={formData.max_discount_amount}
                  onChange={e => handleChange('max_discount_amount', e.target.value)}
                  placeholder="e.g., 50" className={inputClass}
                />
              </Field>
            </div>
          )}

          {formData.promotion_type === 'fixed_amount' && (
            <Field label="Discount Amount" error={errors.discount_amount} helper="Fixed dollar amount off" required>
              <input type="number" step="0.01" min="0" value={formData.discount_amount}
                onChange={e => handleChange('discount_amount', e.target.value)}
                placeholder="e.g., 10.00"
                className={`${inputClass} ${errors.discount_amount ? 'border-red-500/60' : ''}`}
              />
            </Field>
          )}

          {formData.promotion_type === 'bogo' && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Buy Quantity" error={errors.buy_quantity} helper="Number to buy" required>
                <input type="number" min="1" value={formData.buy_quantity}
                  onChange={e => handleChange('buy_quantity', e.target.value)}
                  placeholder="e.g., 2"
                  className={`${inputClass} ${errors.buy_quantity ? 'border-red-500/60' : ''}`}
                />
              </Field>
              <Field label="Get Quantity (Free)" error={errors.get_quantity} helper="Number free" required>
                <input type="number" min="1" value={formData.get_quantity}
                  onChange={e => handleChange('get_quantity', e.target.value)}
                  placeholder="e.g., 1"
                  className={`${inputClass} ${errors.get_quantity ? 'border-red-500/60' : ''}`}
                />
              </Field>
            </div>
          )}

          {formData.promotion_type === 'bulk_discount' && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Minimum Quantity" error={errors.min_quantity} helper="Min items to qualify" required>
                <input type="number" min="1" value={formData.min_quantity}
                  onChange={e => handleChange('min_quantity', e.target.value)}
                  placeholder="e.g., 5"
                  className={`${inputClass} ${errors.min_quantity ? 'border-red-500/60' : ''}`}
                />
              </Field>
              <Field label="Discount Percentage" error={errors.discount_percentage} helper="% off when qualified" required>
                <input type="number" step="0.01" min="0" max="100" value={formData.discount_percentage}
                  onChange={e => handleChange('discount_percentage', e.target.value)}
                  placeholder="e.g., 10"
                  className={`${inputClass} ${errors.discount_percentage ? 'border-red-500/60' : ''}`}
                />
              </Field>
            </div>
          )}
        </div>

        {/* Conditions */}
        <div className="space-y-4">
          <h3 className={sectionHeadClass}>Conditions (Optional)</h3>

          <Field label="Minimum Purchase Amount" helper="Minimum cart total to qualify">
            <input type="number" step="0.01" min="0" value={formData.min_purchase_amount}
              onChange={e => handleChange('min_purchase_amount', e.target.value)}
              placeholder="e.g., 50.00" className={inputClass}
            />
          </Field>

          <Field label="Coupon Code" helper="Leave empty for auto-apply, or enter code for manual entry">
            <input type="text" value={formData.coupon_code}
              onChange={e => handleChange('coupon_code', e.target.value.toUpperCase())}
              placeholder="e.g., SAVE20" className={inputClass}
            />
          </Field>

          <Field label="Usage Limit" helper="Maximum number of times this promotion can be used">
            <input type="number" min="1" value={formData.usage_limit}
              onChange={e => handleChange('usage_limit', e.target.value)}
              placeholder="e.g., 100" className={inputClass}
            />
          </Field>

          {isEditMode && formData.usage_count > 0 && (
            <div className="px-3 py-2.5 bg-accent-gold/10 border border-accent-gold/20 rounded-lg">
              <p className="text-sm text-theme-primary">
                <strong>Used {formData.usage_count} times</strong>
                {formData.usage_limit && ` out of ${formData.usage_limit} limit`}
              </p>
            </div>
          )}
        </div>

        {/* Schedule */}
        <div className="space-y-4">
          <h3 className={`${sectionHeadClass} flex items-center gap-2`}>
            <Calendar className="w-4 h-4" /> Schedule
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start Date" helper="Leave empty to start immediately">
              <input type="date" value={formData.start_date}
                onChange={e => handleChange('start_date', e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="End Date" error={errors.end_date} helper="Leave empty for no end date">
              <input type="date" value={formData.end_date}
                min={formData.start_date}
                onChange={e => handleChange('end_date', e.target.value)}
                className={`${inputClass} ${errors.end_date ? 'border-red-500/60' : ''}`}
              />
            </Field>
          </div>
        </div>

        {/* Applies To */}
        <div className="space-y-4">
          <h3 className={sectionHeadClass}>Applies To</h3>
          <div className="space-y-3">
            {[
              { value: 'all',        label: 'All Products' },
              { value: 'products',   label: 'Specific Products' },
              { value: 'categories', label: 'Specific Categories' },
            ].map(opt => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio" name="applies_to" value={opt.value}
                  checked={formData.applies_to === opt.value}
                  onChange={e => handleChange('applies_to', e.target.value)}
                  className="w-4 h-4 accent-[var(--accent-gold,#d4a017)]"
                />
                <span className="text-sm font-medium text-theme-secondary">{opt.label}</span>
              </label>
            ))}
          </div>

          {(formData.applies_to === 'products' || formData.applies_to === 'categories') && (
            <div className="px-3 py-2.5 bg-theme-tertiary border border-theme rounded-lg">
              <p className="text-sm text-theme-secondary">
                {formData.applies_to === 'products' ? 'Product' : 'Category'} selection will be available after creation.
              </p>
              <p className="text-xs text-theme-muted mt-0.5">
                You can select specific {formData.applies_to} to include in this promotion.
              </p>
            </div>
          )}
        </div>

        {/* Status */}
        <div className="space-y-4">
          <h3 className={sectionHeadClass}>Status</h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox" checked={formData.is_active}
              onChange={e => handleChange('is_active', e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm font-medium text-theme-secondary">Active Promotion</span>
          </label>

          {!formData.is_active && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-600">
                This promotion is inactive and will not be applied at POS or shown to customers.
              </p>
            </div>
          )}
        </div>

        {/* Preview */}
        {formData.promotion_name && (
          <div className="px-4 py-3 bg-theme-tertiary border border-theme rounded-lg">
            <h4 className="text-xs font-semibold text-accent-gold uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" /> Preview
            </h4>
            <p className="text-sm font-bold text-theme-primary">{formData.promotion_name}</p>
            {formData.description && (
              <p className="text-xs text-theme-secondary mt-0.5">{formData.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="px-2 py-0.5 text-[10px] font-bold rounded border uppercase bg-accent-gold/10 text-accent-gold border-accent-gold/20">
                {selectedType?.label}
              </span>
              {formData.coupon_code && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded border uppercase bg-accent-gold/10 text-accent-gold border-accent-gold/20">
                  Code: {formData.coupon_code}
                </span>
              )}
              {formData.start_date && formData.end_date && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded border uppercase bg-blue-500/10 text-blue-500 border-blue-500/20">
                  {new Date(formData.start_date).toLocaleDateString()} – {new Date(formData.end_date).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default PromotionFormModal;
