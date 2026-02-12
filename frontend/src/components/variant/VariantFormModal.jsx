import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Modal, Input, Button, Badge } from '../ui';

/**
 * VariantFormModal Component
 * Form modal for creating and editing product variants
 */
const VariantFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  variant = null,
  productId,
  loading = false,
}) => {
  const isEditMode = !!variant;

  const [formData, setFormData] = useState({
    variant_name: '',
    sku: '',
    barcode: '',
    cost_price: '',
    selling_price: '',
    is_active: true,
    attributes: [], // { name: 'Color', value: 'Red' }
  });

  const [errors, setErrors] = useState({});
  const [newAttribute, setNewAttribute] = useState({ name: '', value: '' });

  // Load variant data in edit mode
  useEffect(() => {
    if (variant) {
      setFormData({
        variant_name: variant.variant_name || '',
        sku: variant.sku || '',
        barcode: variant.barcode || '',
        cost_price: variant.cost_price || '',
        selling_price: variant.selling_price || '',
        is_active: variant.is_active !== false,
        attributes: variant.attributes || [],
      });
    }
  }, [variant]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleAddAttribute = () => {
    if (newAttribute.name.trim() && newAttribute.value.trim()) {
      setFormData((prev) => ({
        ...prev,
        attributes: [...prev.attributes, { ...newAttribute }],
      }));
      setNewAttribute({ name: '', value: '' });
    }
  };

  const handleRemoveAttribute = (index) => {
    setFormData((prev) => ({
      ...prev,
      attributes: prev.attributes.filter((_, i) => i !== index),
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.variant_name.trim()) {
      newErrors.variant_name = 'Variant name is required';
    }

    if (!formData.selling_price || parseFloat(formData.selling_price) <= 0) {
      newErrors.selling_price = 'Valid selling price is required';
    }

    if (formData.cost_price && parseFloat(formData.cost_price) < 0) {
      newErrors.cost_price = 'Cost price cannot be negative';
    }

    if (formData.attributes.length === 0) {
      newErrors.attributes = 'At least one attribute is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit({ ...formData, product_id: productId });
    }
  };

  // Calculate profit margin
  const profitMargin = formData.selling_price && formData.cost_price
    ? (((parseFloat(formData.selling_price) - parseFloat(formData.cost_price)) / parseFloat(formData.selling_price)) * 100).toFixed(1)
    : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Variant' : 'Create New Variant'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            {isEditMode ? 'Update Variant' : 'Create Variant'}
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
            label="Variant Name"
            value={formData.variant_name}
            onChange={(e) => handleChange('variant_name', e.target.value)}
            error={errors.variant_name}
            required
            placeholder="e.g., Red - Large, 500ml Bottle"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="SKU"
              value={formData.sku}
              onChange={(e) => handleChange('sku', e.target.value)}
              error={errors.sku}
              placeholder="Auto-generated if empty"
              helperText="Leave empty to auto-generate"
            />

            <Input
              label="Barcode"
              value={formData.barcode}
              onChange={(e) => handleChange('barcode', e.target.value)}
              error={errors.barcode}
              placeholder="Optional"
            />
          </div>
        </div>

        {/* Variant Attributes */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Variant Attributes {errors.attributes && <span className="text-red-500 text-xs normal-case">({errors.attributes})</span>}
          </h3>

          {/* Existing Attributes */}
          {formData.attributes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.attributes.map((attr, index) => (
                <Badge key={index} variant="primary" className="flex items-center gap-2">
                  <span className="font-medium">{attr.name}:</span>
                  <span>{attr.value}</span>
                  <button
                    onClick={() => handleRemoveAttribute(index)}
                    className="ml-1 hover:text-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Add Attribute Form */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-3">Add Attribute</p>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Attribute Name"
                value={newAttribute.name}
                onChange={(e) => setNewAttribute({ ...newAttribute, name: e.target.value })}
                placeholder="e.g., Color, Size, Volume"
                size="sm"
              />
              <Input
                label="Attribute Value"
                value={newAttribute.value}
                onChange={(e) => setNewAttribute({ ...newAttribute, value: e.target.value })}
                placeholder="e.g., Red, Large, 500ml"
                size="sm"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddAttribute}
              disabled={!newAttribute.name.trim() || !newAttribute.value.trim()}
              className="mt-3"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Attribute
            </Button>
          </div>

          <p className="text-xs text-gray-500">
            Examples: Color = Red, Size = Large, Material = Cotton, Volume = 500ml
          </p>
        </div>

        {/* Pricing */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Pricing
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Selling Price"
              type="number"
              step="0.01"
              value={formData.selling_price}
              onChange={(e) => handleChange('selling_price', e.target.value)}
              error={errors.selling_price}
              required
              placeholder="0.00"
            />

            <Input
              label="Cost Price"
              type="number"
              step="0.01"
              value={formData.cost_price}
              onChange={(e) => handleChange('cost_price', e.target.value)}
              error={errors.cost_price}
              placeholder="0.00"
              helperText="Used for profit calculation"
            />
          </div>

          {profitMargin && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700 mb-1">Profit Margin</p>
              <p className="text-2xl font-bold text-blue-600">{profitMargin}%</p>
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
            <span className="text-sm font-medium text-gray-700">Active Variant</span>
          </label>
        </div>
      </div>
    </Modal>
  );
};

export default VariantFormModal;
