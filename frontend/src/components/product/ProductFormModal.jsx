import React, { useState, useEffect } from 'react';
import { X, Upload, Trash2 } from 'lucide-react';
import { Modal, Input, Button, Badge, Tabs } from '../ui';

/**
 * ProductFormModal Component
 * Form modal for creating and editing products
 */
const ProductFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  product = null,
  brands = [],
  categories = [],
  loading = false,
}) => {
  const isEditMode = !!product;

  const [formData, setFormData] = useState({
    product_name: '',
    product_code: '',
    product_type: 'physical',
    description: '',
    brand_id: '',
    category_id: '',
    selling_price: '',
    cost_price: '',
    reorder_level: '10',
    track_inventory: true,
    has_variants: false,
    track_serial_numbers: false,
    track_batches: false,
    is_active: true,
    is_featured: false,
    image_url: '',
    tags: [],
  });

  const [errors, setErrors] = useState({});
  const [newTag, setNewTag] = useState('');

  // Load product data in edit mode
  useEffect(() => {
    if (product) {
      setFormData({
        product_name: product.product_name || '',
        product_code: product.product_code || '',
        product_type: product.product_type || 'physical',
        description: product.description || '',
        brand_id: product.brand_id || '',
        category_id: product.category_id || '',
        selling_price: product.selling_price || '',
        cost_price: product.cost_price || '',
        reorder_level: product.reorder_level || '10',
        track_inventory: product.track_inventory !== false,
        has_variants: product.has_variants || false,
        track_serial_numbers: product.track_serial_numbers || false,
        track_batches: product.track_batches || false,
        is_active: product.is_active !== false,
        is_featured: product.is_featured || false,
        image_url: product.image_url || '',
        tags: product.tags || [],
      });
    }
  }, [product]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.product_name.trim()) {
      newErrors.product_name = 'Product name is required';
    }

    if (!formData.selling_price || parseFloat(formData.selling_price) <= 0) {
      newErrors.selling_price = 'Valid selling price is required';
    }

    if (formData.cost_price && parseFloat(formData.cost_price) < 0) {
      newErrors.cost_price = 'Cost price cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit(formData);
    }
  };

  const productTypes = [
    { value: 'physical', label: 'Physical Product' },
    { value: 'service', label: 'Service' },
    { value: 'digital', label: 'Digital Product' },
    { value: 'bundle', label: 'Bundle' },
  ];

  const tabs = [
    {
      label: 'Basic Info',
      content: (
        <div className="space-y-4">
          <Input
            label="Product Name"
            value={formData.product_name}
            onChange={(e) => handleChange('product_name', e.target.value)}
            error={errors.product_name}
            required
            placeholder="Enter product name"
          />

          <Input
            label="Product Code"
            value={formData.product_code}
            onChange={(e) => handleChange('product_code', e.target.value)}
            error={errors.product_code}
            placeholder="Auto-generated if left empty"
            helperText="Leave empty to auto-generate"
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Product Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {productTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleChange('product_type', type.value)}
                  className={`
                    px-4 py-2 rounded-lg border-2 transition-all
                    ${formData.product_type === type.value
                      ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `.trim()}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter product description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Brand</label>
              <select
                value={formData.brand_id}
                onChange={(e) => handleChange('brand_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Brand</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.brand_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select
                value={formData.category_id}
                onChange={(e) => handleChange('category_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.category_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ),
    },
    {
      label: 'Pricing',
      content: (
        <div className="space-y-4">
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

          {formData.selling_price && formData.cost_price && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700 mb-1">Profit Margin</p>
              <p className="text-2xl font-bold text-blue-600">
                {(((parseFloat(formData.selling_price) - parseFloat(formData.cost_price)) / parseFloat(formData.selling_price)) * 100).toFixed(1)}%
              </p>
            </div>
          )}
        </div>
      ),
    },
    {
      label: 'Inventory',
      content: (
        <div className="space-y-4">
          <Input
            label="Reorder Level"
            type="number"
            value={formData.reorder_level}
            onChange={(e) => handleChange('reorder_level', e.target.value)}
            placeholder="10"
            helperText="Alert when stock falls below this level"
          />

          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.track_inventory}
                onChange={(e) => handleChange('track_inventory', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Track Inventory</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.has_variants}
                onChange={(e) => handleChange('has_variants', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Has Variants (Size, Color, etc.)</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.track_serial_numbers}
                onChange={(e) => handleChange('track_serial_numbers', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Track Serial Numbers</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.track_batches}
                onChange={(e) => handleChange('track_batches', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Track Batches/Lots</span>
            </label>
          </div>
        </div>
      ),
    },
    {
      label: 'Additional',
      content: (
        <div className="space-y-4">
          <Input
            label="Image URL"
            value={formData.image_url}
            onChange={(e) => handleChange('image_url', e.target.value)}
            placeholder="https://example.com/image.jpg"
            helperText="Or use the upload button"
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Tags</label>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Add a tag"
                className="flex-1"
              />
              <Button onClick={handleAddTag} variant="outline">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.map((tag) => (
                <Badge key={tag} variant="default" className="flex items-center gap-1">
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => handleChange('is_active', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Active Product</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_featured}
                onChange={(e) => handleChange('is_featured', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Featured Product</span>
            </label>
          </div>
        </div>
      ),
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Product' : 'Create New Product'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            {isEditMode ? 'Update Product' : 'Create Product'}
          </Button>
        </>
      }
    >
      <Tabs tabs={tabs} />
    </Modal>
  );
};

export default ProductFormModal;
