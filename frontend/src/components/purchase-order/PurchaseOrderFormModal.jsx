import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Search, Package } from 'lucide-react';
import { Modal, Input, Button, Badge } from '../ui';
import { ProductSelector } from '../product';
import { VariantSelector } from '../variant';

/**
 * PurchaseOrderFormModal Component
 * Form modal for creating and editing purchase orders
 */
const PurchaseOrderFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  purchaseOrder = null,
  suppliers = [],
  branches = [],
  loading = false,
}) => {
  const isEditMode = !!purchaseOrder;

  const [formData, setFormData] = useState({
    supplier_id: '',
    branch_id: '',
    expected_delivery_date: '',
    notes: '',
    items: [], // { product_id, variant_id, quantity, unit_cost }
  });

  const [errors, setErrors] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [itemQuantity, setItemQuantity] = useState('');
  const [itemCost, setItemCost] = useState('');

  // Load purchase order data in edit mode
  useEffect(() => {
    if (purchaseOrder) {
      setFormData({
        supplier_id: purchaseOrder.supplier_id || '',
        branch_id: purchaseOrder.branch_id || '',
        expected_delivery_date: purchaseOrder.expected_delivery_date?.split('T')[0] || '',
        notes: purchaseOrder.notes || '',
        items: purchaseOrder.items || [],
      });
    }
  }, [purchaseOrder]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleAddItem = () => {
    if (!selectedProduct || !itemQuantity || !itemCost) {
      return;
    }

    const quantity = parseInt(itemQuantity);
    const cost = parseFloat(itemCost);

    if (quantity <= 0 || cost <= 0) {
      return;
    }

    const newItem = {
      product_id: selectedProduct.id,
      product_name: selectedProduct.product_name,
      variant_id: selectedVariant?.id || null,
      variant_name: selectedVariant?.variant_name || null,
      quantity,
      unit_cost: cost,
      total_cost: quantity * cost,
    };

    // Check if item already exists
    const existingIndex = formData.items.findIndex(
      (item) =>
        item.product_id === newItem.product_id &&
        item.variant_id === newItem.variant_id
    );

    if (existingIndex >= 0) {
      // Update existing item
      const updatedItems = [...formData.items];
      updatedItems[existingIndex] = {
        ...updatedItems[existingIndex],
        quantity: updatedItems[existingIndex].quantity + quantity,
        total_cost: (updatedItems[existingIndex].quantity + quantity) * cost,
      };
      setFormData((prev) => ({ ...prev, items: updatedItems }));
    } else {
      // Add new item
      setFormData((prev) => ({ ...prev, items: [...prev.items, newItem] }));
    }

    // Reset item form
    setSelectedProduct(null);
    setSelectedVariant(null);
    setItemQuantity('');
    setItemCost('');
  };

  const handleRemoveItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleUpdateItemQuantity = (index, newQuantity) => {
    const quantity = parseInt(newQuantity) || 0;
    if (quantity < 0) return;

    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      quantity,
      total_cost: quantity * updatedItems[index].unit_cost,
    };
    setFormData((prev) => ({ ...prev, items: updatedItems }));
  };

  const handleUpdateItemCost = (index, newCost) => {
    const cost = parseFloat(newCost) || 0;
    if (cost < 0) return;

    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      unit_cost: cost,
      total_cost: updatedItems[index].quantity * cost,
    };
    setFormData((prev) => ({ ...prev, items: updatedItems }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.supplier_id) {
      newErrors.supplier_id = 'Supplier is required';
    }

    if (!formData.branch_id) {
      newErrors.branch_id = 'Branch is required';
    }

    if (formData.items.length === 0) {
      newErrors.items = 'At least one item is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit(formData);
    }
  };

  // Calculate totals
  const subtotal = formData.items.reduce((sum, item) => sum + item.total_cost, 0);
  const totalItems = formData.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Purchase Order' : 'Create Purchase Order'}
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            {isEditMode ? 'Update Purchase Order' : 'Create Purchase Order'}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-theme-secondary uppercase tracking-wide">
            Basic Information
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {/* Supplier */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-theme-secondary">
                Supplier <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.supplier_id}
                onChange={(e) => handleChange('supplier_id', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-theme-primary text-theme-primary ${
                  errors.supplier_id ? 'border-red-500' : 'border-theme'
                }`}
              >
                <option value="">Select Supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.supplier_name}
                  </option>
                ))}
              </select>
              {errors.supplier_id && (
                <p className="text-xs text-red-600">{errors.supplier_id}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-theme-secondary">
                Destination Branch <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.branch_id}
                onChange={(e) => handleChange('branch_id', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-theme-primary text-theme-primary ${
                  errors.branch_id ? 'border-red-500' : 'border-theme'
                }`}
              >
                <option value="">Select Branch</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.branch_name}
                  </option>
                ))}
              </select>
              {errors.branch_id && (
                <p className="text-xs text-red-600">{errors.branch_id}</p>
              )}
            </div>
          </div>

          <Input
            label="Expected Delivery Date"
            type="date"
            value={formData.expected_delivery_date}
            onChange={(e) => handleChange('expected_delivery_date', e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-theme-secondary">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional notes about this purchase order"
            />
          </div>
        </div>

        {/* Add Items Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-theme-secondary uppercase tracking-wide">
            Add Items {errors.items && <span className="text-red-500 text-xs normal-case">({errors.items})</span>}
          </h3>

          <div className="p-4 bg-theme-secondary rounded-lg border border-theme space-y-3">
            {/* Product Selection */}
            <ProductSelector
              onSelect={(product) => {
                setSelectedProduct(product);
                setSelectedVariant(null);
                setItemCost(product.cost_price || '');
              }}
              selectedProducts={selectedProduct ? [selectedProduct] : []}
              placeholder="Search and select product..."
            />

            {/* Variant Selection (if product has variants) */}
            {selectedProduct?.has_variants && (
              <VariantSelector
                productId={selectedProduct.id}
                onSelect={(variant) => {
                  setSelectedVariant(variant);
                  setItemCost(variant.cost_price || '');
                }}
                selectedVariant={selectedVariant}
                placeholder="Select variant..."
                branchId={formData.branch_id}
              />
            )}

            {/* Quantity and Cost */}
            {selectedProduct && (
              <div className="grid grid-cols-3 gap-3">
                <Input
                  label="Quantity"
                  type="number"
                  min="1"
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(e.target.value)}
                  placeholder="0"
                />
                <Input
                  label="Unit Cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={itemCost}
                  onChange={(e) => setItemCost(e.target.value)}
                  placeholder="0.00"
                />
                <div className="flex items-end">
                  <Button
                    onClick={handleAddItem}
                    disabled={!selectedProduct || !itemQuantity || !itemCost}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Items List */}
        {formData.items.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-theme-secondary uppercase tracking-wide">
              Order Items ({formData.items.length})
            </h3>

            <div className="border border-theme rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-theme-tertiary border-b border-theme">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-secondary uppercase">Product</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-theme-secondary uppercase">Quantity</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-theme-secondary uppercase">Unit Cost</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-theme-secondary uppercase">Total</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-theme-secondary uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme">
                  {formData.items.map((item, index) => (
                    <tr key={index} className="hover:bg-theme-tertiary/50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-theme-primary">{item.product_name}</p>
                          {item.variant_name && (
                            <p className="text-xs text-theme-secondary">{item.variant_name}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItemQuantity(index, e.target.value)}
                          className="w-20 px-2 py-1 text-center border border-theme bg-theme-primary text-theme-primary rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unit_cost}
                          onChange={(e) => handleUpdateItemCost(index, e.target.value)}
                          className="w-24 px-2 py-1 text-center border border-theme bg-theme-primary text-theme-primary rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-theme-primary">
                        ${item.total_cost.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={Trash2}
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-theme-tertiary border-t-2 border-theme">
                  <tr>
                    <td className="px-4 py-3 font-semibold text-theme-primary">Totals</td>
                    <td className="px-4 py-3 text-center font-semibold text-theme-primary">{totalItems}</td>
                    <td className="px-4 py-3"></td>
                    <td className="px-4 py-3 text-right font-bold text-theme-primary text-lg">
                      ${subtotal.toFixed(2)}
                    </td>
                    <td className="px-4 py-3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default PurchaseOrderFormModal;
