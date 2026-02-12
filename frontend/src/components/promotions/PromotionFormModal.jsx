import React, { useState, useEffect } from 'react';
import { Tag, Percent, DollarSign, Gift, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { Modal, Input, Button, Badge } from '../ui';

/**
 * PromotionFormModal Component
 * Create and edit promotions with 4 discount types:
 * - Percentage discount (e.g., 20% off)
 * - Fixed amount (e.g., $10 off)
 * - BOGO (Buy X Get Y free)
 * - Bulk discount (e.g., 10% off when buying 5+)
 */
const PromotionFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  promotion = null,
  products = [],
  categories = [],
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
    applies_to: 'all', // all, products, categories
    product_ids: [],
    category_ids: [],
    coupon_code: '',
    usage_limit: '',
    usage_count: 0,
  });

  const [errors, setErrors] = useState({});

  // Load promotion data in edit mode
  useEffect(() => {
    if (promotion) {
      setFormData({
        promotion_name: promotion.promotion_name || '',
        promotion_type: promotion.promotion_type || 'percentage',
        description: promotion.description || '',
        discount_percentage: promotion.discount_percentage || '',
        discount_amount: promotion.discount_amount || '',
        buy_quantity: promotion.buy_quantity || '',
        get_quantity: promotion.get_quantity || '',
        min_purchase_amount: promotion.min_purchase_amount || '',
        min_quantity: promotion.min_quantity || '',
        max_discount_amount: promotion.max_discount_amount || '',
        start_date: promotion.start_date?.split('T')[0] || '',
        end_date: promotion.end_date?.split('T')[0] || '',
        is_active: promotion.is_active !== false,
        applies_to: promotion.applies_to || 'all',
        product_ids: promotion.product_ids || [],
        category_ids: promotion.category_ids || [],
        coupon_code: promotion.coupon_code || '',
        usage_limit: promotion.usage_limit || '',
        usage_count: promotion.usage_count || 0,
      });
    }
  }, [promotion]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.promotion_name.trim()) {
      newErrors.promotion_name = 'Promotion name is required';
    }

    // Validate based on promotion type
    switch (formData.promotion_type) {
      case 'percentage':
        if (!formData.discount_percentage || parseFloat(formData.discount_percentage) <= 0) {
          newErrors.discount_percentage = 'Valid discount percentage is required';
        }
        if (parseFloat(formData.discount_percentage) > 100) {
          newErrors.discount_percentage = 'Discount cannot exceed 100%';
        }
        break;

      case 'fixed_amount':
        if (!formData.discount_amount || parseFloat(formData.discount_amount) <= 0) {
          newErrors.discount_amount = 'Valid discount amount is required';
        }
        break;

      case 'bogo':
        if (!formData.buy_quantity || parseInt(formData.buy_quantity) <= 0) {
          newErrors.buy_quantity = 'Valid buy quantity is required';
        }
        if (!formData.get_quantity || parseInt(formData.get_quantity) <= 0) {
          newErrors.get_quantity = 'Valid get quantity is required';
        }
        break;

      case 'bulk_discount':
        if (!formData.min_quantity || parseInt(formData.min_quantity) <= 0) {
          newErrors.min_quantity = 'Valid minimum quantity is required';
        }
        if (!formData.discount_percentage || parseFloat(formData.discount_percentage) <= 0) {
          newErrors.discount_percentage = 'Valid discount percentage is required';
        }
        break;

      default:
        break;
    }

    // Validate date range
    if (formData.start_date && formData.end_date) {
      if (new Date(formData.start_date) > new Date(formData.end_date)) {
        newErrors.end_date = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit(formData);
    }
  };

  const promotionTypes = [
    {
      value: 'percentage',
      label: 'Percentage Discount',
      icon: Percent,
      description: 'e.g., 20% off entire purchase',
    },
    {
      value: 'fixed_amount',
      label: 'Fixed Amount Off',
      icon: DollarSign,
      description: 'e.g., $10 off purchase',
    },
    {
      value: 'bogo',
      label: 'BOGO (Buy X Get Y)',
      icon: Gift,
      description: 'e.g., Buy 2 Get 1 Free',
    },
    {
      value: 'bulk_discount',
      label: 'Bulk Discount',
      icon: TrendingUp,
      description: 'e.g., 10% off when buying 5+',
    },
  ];

  const selectedType = promotionTypes.find((t) => t.value === formData.promotion_type);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Promotion' : 'Create New Promotion'}
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            {isEditMode ? 'Update Promotion' : 'Create Promotion'}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Basic Information
          </h3>

          <Input
            label="Promotion Name"
            value={formData.promotion_name}
            onChange={(e) => handleChange('promotion_name', e.target.value)}
            error={errors.promotion_name}
            required
            placeholder="e.g., Summer Sale 2026"
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional description for customers"
            />
          </div>
        </div>

        {/* Promotion Type Selection */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Discount Type
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {promotionTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = formData.promotion_type === type.value;

              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleChange('promotion_type', type.value)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Icon
                      className={`w-6 h-6 flex-shrink-0 ${
                        isSelected ? 'text-blue-600' : 'text-gray-400'
                      }`}
                    />
                    <div className="flex-1">
                      <p
                        className={`font-medium mb-1 ${
                          isSelected ? 'text-blue-900' : 'text-gray-900'
                        }`}
                      >
                        {type.label}
                      </p>
                      <p className="text-xs text-gray-600">{type.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Type-Specific Fields */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            {selectedType.label} Settings
          </h3>

          {formData.promotion_type === 'percentage' && (
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Discount Percentage"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.discount_percentage}
                onChange={(e) => handleChange('discount_percentage', e.target.value)}
                error={errors.discount_percentage}
                required
                placeholder="e.g., 20"
                helperText="Percentage off (0-100%)"
              />
              <Input
                label="Max Discount Amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.max_discount_amount}
                onChange={(e) => handleChange('max_discount_amount', e.target.value)}
                placeholder="e.g., 50"
                helperText="Optional cap on discount"
              />
            </div>
          )}

          {formData.promotion_type === 'fixed_amount' && (
            <Input
              label="Discount Amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.discount_amount}
              onChange={(e) => handleChange('discount_amount', e.target.value)}
              error={errors.discount_amount}
              required
              placeholder="e.g., 10.00"
              helperText="Fixed dollar amount off"
            />
          )}

          {formData.promotion_type === 'bogo' && (
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Buy Quantity"
                type="number"
                min="1"
                value={formData.buy_quantity}
                onChange={(e) => handleChange('buy_quantity', e.target.value)}
                error={errors.buy_quantity}
                required
                placeholder="e.g., 2"
                helperText="Number to buy"
              />
              <Input
                label="Get Quantity (Free)"
                type="number"
                min="1"
                value={formData.get_quantity}
                onChange={(e) => handleChange('get_quantity', e.target.value)}
                error={errors.get_quantity}
                required
                placeholder="e.g., 1"
                helperText="Number free"
              />
            </div>
          )}

          {formData.promotion_type === 'bulk_discount' && (
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Minimum Quantity"
                type="number"
                min="1"
                value={formData.min_quantity}
                onChange={(e) => handleChange('min_quantity', e.target.value)}
                error={errors.min_quantity}
                required
                placeholder="e.g., 5"
                helperText="Min items to qualify"
              />
              <Input
                label="Discount Percentage"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.discount_percentage}
                onChange={(e) => handleChange('discount_percentage', e.target.value)}
                error={errors.discount_percentage}
                required
                placeholder="e.g., 10"
                helperText="% off when qualified"
              />
            </div>
          )}
        </div>

        {/* Conditions */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Conditions (Optional)
          </h3>

          <Input
            label="Minimum Purchase Amount"
            type="number"
            step="0.01"
            min="0"
            value={formData.min_purchase_amount}
            onChange={(e) => handleChange('min_purchase_amount', e.target.value)}
            placeholder="e.g., 50.00"
            helperText="Minimum cart total to qualify"
          />

          <Input
            label="Coupon Code"
            value={formData.coupon_code}
            onChange={(e) => handleChange('coupon_code', e.target.value.toUpperCase())}
            placeholder="e.g., SAVE20"
            helperText="Leave empty for auto-apply, or enter code for manual entry"
          />

          <Input
            label="Usage Limit"
            type="number"
            min="1"
            value={formData.usage_limit}
            onChange={(e) => handleChange('usage_limit', e.target.value)}
            placeholder="e.g., 100"
            helperText="Maximum number of times this promotion can be used"
          />

          {isEditMode && formData.usage_count > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Used {formData.usage_count} times</strong>
                {formData.usage_limit && ` out of ${formData.usage_limit} limit`}
              </p>
            </div>
          )}
        </div>

        {/* Date Range */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Schedule
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={formData.start_date}
              onChange={(e) => handleChange('start_date', e.target.value)}
              helperText="Leave empty to start immediately"
            />
            <Input
              label="End Date"
              type="date"
              value={formData.end_date}
              onChange={(e) => handleChange('end_date', e.target.value)}
              error={errors.end_date}
              min={formData.start_date}
              helperText="Leave empty for no end date"
            />
          </div>
        </div>

        {/* Applies To */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Applies To
          </h3>

          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="applies_to"
                value="all"
                checked={formData.applies_to === 'all'}
                onChange={(e) => handleChange('applies_to', e.target.value)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm font-medium text-gray-700">All Products</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="applies_to"
                value="products"
                checked={formData.applies_to === 'products'}
                onChange={(e) => handleChange('applies_to', e.target.value)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm font-medium text-gray-700">Specific Products</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="applies_to"
                value="categories"
                checked={formData.applies_to === 'categories'}
                onChange={(e) => handleChange('applies_to', e.target.value)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm font-medium text-gray-700">Specific Categories</span>
            </label>
          </div>

          {formData.applies_to === 'products' && (
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-2">
                Product selection will be available after creation
              </p>
              <p className="text-xs text-gray-500">
                You can select specific products to include in this promotion
              </p>
            </div>
          )}

          {formData.applies_to === 'categories' && (
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-2">
                Category selection will be available after creation
              </p>
              <p className="text-xs text-gray-500">
                You can select specific categories to include in this promotion
              </p>
            </div>
          )}
        </div>

        {/* Status */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Status
          </h3>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => handleChange('is_active', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Active Promotion</span>
          </label>

          {!formData.is_active && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800">
                This promotion is inactive and will not be applied at POS or shown to customers.
              </p>
            </div>
          )}
        </div>

        {/* Preview/Example */}
        {formData.promotion_name && (
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Tag className="w-4 h-4 text-blue-600" />
              Preview
            </h4>
            <div className="space-y-1">
              <p className="text-base font-bold text-gray-900">{formData.promotion_name}</p>
              {formData.description && (
                <p className="text-sm text-gray-700">{formData.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant="primary">{selectedType.label}</Badge>
                {formData.coupon_code && (
                  <Badge variant="warning">Code: {formData.coupon_code}</Badge>
                )}
                {formData.start_date && formData.end_date && (
                  <Badge variant="info">
                    {new Date(formData.start_date).toLocaleDateString()} -{' '}
                    {new Date(formData.end_date).toLocaleDateString()}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default PromotionFormModal;
