import React, { useState, useEffect } from 'react';
import { TruckIcon, Warehouse, Package, Search, Plus, Minus, AlertCircle } from 'lucide-react';
import { Modal, Button, Badge, SearchBar, LoadingSpinner, EmptyState } from '../ui';

/**
 * StockTransferFormModal Component
 * Create stock transfer between branches
 */
const StockTransferFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  branches = [],
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    from_branch_id: '',
    to_branch_id: '',
    transfer_reason: '',
    notes: '',
    items: [], // { product_id, variant_id, product_name, variant_name, quantity, available_stock }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [errors, setErrors] = useState({});

  // Fetch products based on search and selected from_branch
  useEffect(() => {
    if (searchQuery.length >= 2 && formData.from_branch_id) {
      fetchProducts();
    } else {
      setProducts([]);
    }
  }, [searchQuery, formData.from_branch_id]);

  const fetchProducts = async () => {
    setSearchingProducts(true);
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/products?search=${searchQuery}&branch_id=${formData.from_branch_id}&in_stock=true`);
      // const data = await response.json();

      // Mock data for now
      const mockProducts = [
        {
          id: '1',
          product_code: 'TILE-001',
          product_name: 'Premium Ceramic Tile',
          variant_id: null,
          variant_name: null,
          available_stock: 150,
          image_url: null,
        },
        {
          id: '2',
          product_code: 'ACC-001',
          product_name: 'Tile Adhesive',
          variant_id: '1',
          variant_name: 'White - 25kg',
          available_stock: 45,
          image_url: null,
        },
        {
          id: '3',
          product_code: 'TILE-002',
          product_name: 'Porcelain Floor Tile',
          variant_id: '2',
          variant_name: 'Matte - 600x600mm',
          available_stock: 80,
          image_url: null,
        },
      ];

      setProducts(mockProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setSearchingProducts(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }

    // Clear items if from_branch changes
    if (field === 'from_branch_id') {
      setFormData((prev) => ({ ...prev, items: [] }));
      setSearchQuery('');
    }
  };

  const handleAddItem = (product) => {
    const existingItemIndex = formData.items.findIndex(
      (item) =>
        item.product_id === product.id &&
        item.variant_id === product.variant_id
    );

    if (existingItemIndex >= 0) {
      // Increment quantity
      const updatedItems = [...formData.items];
      updatedItems[existingItemIndex].quantity += 1;
      setFormData((prev) => ({ ...prev, items: updatedItems }));
    } else {
      // Add new item
      const newItem = {
        product_id: product.id,
        variant_id: product.variant_id,
        product_code: product.product_code,
        product_name: product.product_name,
        variant_name: product.variant_name,
        quantity: 1,
        available_stock: product.available_stock,
      };
      setFormData((prev) => ({ ...prev, items: [...prev.items, newItem] }));
    }
  };

  const handleUpdateQuantity = (index, newQuantity) => {
    const updatedItems = [...formData.items];
    const item = updatedItems[index];

    if (newQuantity <= 0) {
      // Remove item
      updatedItems.splice(index, 1);
    } else if (newQuantity <= item.available_stock) {
      updatedItems[index].quantity = newQuantity;
    }

    setFormData((prev) => ({ ...prev, items: updatedItems }));
  };

  const handleRemoveItem = (index) => {
    const updatedItems = [...formData.items];
    updatedItems.splice(index, 1);
    setFormData((prev) => ({ ...prev, items: updatedItems }));
  };

  const transferReasons = [
    'Stock Balancing',
    'Customer Request',
    'Emergency Stock',
    'Store Opening',
    'Store Closing',
    'Seasonal Adjustment',
    'Other',
  ];

  const validate = () => {
    const newErrors = {};

    if (!formData.from_branch_id) {
      newErrors.from_branch_id = 'Please select source branch';
    }

    if (!formData.to_branch_id) {
      newErrors.to_branch_id = 'Please select destination branch';
    }

    if (formData.from_branch_id === formData.to_branch_id) {
      newErrors.to_branch_id = 'Destination must be different from source';
    }

    if (!formData.transfer_reason) {
      newErrors.transfer_reason = 'Transfer reason is required';
    }

    if (formData.items.length === 0) {
      newErrors.items = 'At least one item must be transferred';
    }

    // Validate each item
    formData.items.forEach((item, index) => {
      if (item.quantity > item.available_stock) {
        newErrors[`item_${index}`] = `Only ${item.available_stock} available`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit({
        from_branch_id: formData.from_branch_id,
        to_branch_id: formData.to_branch_id,
        transfer_reason: formData.transfer_reason,
        notes: formData.notes,
        items: formData.items.map((item) => ({
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
        })),
      });
    }
  };

  const resetForm = () => {
    setFormData({
      from_branch_id: '',
      to_branch_id: '',
      transfer_reason: '',
      notes: '',
      items: [],
    });
    setSearchQuery('');
    setProducts([]);
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const fromBranch = branches.find((b) => b.id === formData.from_branch_id);
  const toBranch = branches.find((b) => b.id === formData.to_branch_id);
  const totalItems = formData.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Stock Transfer"
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            loading={loading}
            disabled={formData.items.length === 0}
          >
            Create Transfer ({formData.items.length} products, {totalItems} units)
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Branch Selection */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Transfer Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* From Branch */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                From Branch (Source) <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.from_branch_id}
                onChange={(e) => handleChange('from_branch_id', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.from_branch_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select source branch...</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.branch_name}
                    {branch.main_branch && ' (Main Branch)'}
                  </option>
                ))}
              </select>
              {errors.from_branch_id && (
                <p className="text-xs text-red-600">{errors.from_branch_id}</p>
              )}
            </div>

            {/* To Branch */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                To Branch (Destination) <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.to_branch_id}
                onChange={(e) => handleChange('to_branch_id', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.to_branch_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select destination branch...</option>
                {branches
                  .filter((b) => b.id !== formData.from_branch_id)
                  .map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.branch_name}
                      {branch.main_branch && ' (Main Branch)'}
                    </option>
                  ))}
              </select>
              {errors.to_branch_id && (
                <p className="text-xs text-red-600">{errors.to_branch_id}</p>
              )}
            </div>
          </div>

          {/* Visual Transfer Indicator */}
          {fromBranch && toBranch && (
            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex-1 text-center">
                <Warehouse className="w-6 h-6 mx-auto mb-1 text-blue-600" />
                <p className="font-semibold text-blue-900">{fromBranch.branch_name}</p>
                <p className="text-xs text-blue-700">Source</p>
              </div>
              <div className="flex-shrink-0">
                <TruckIcon className="w-8 h-8 text-blue-600" />
              </div>
              <div className="flex-1 text-center">
                <Warehouse className="w-6 h-6 mx-auto mb-1 text-green-600" />
                <p className="font-semibold text-green-900">{toBranch.branch_name}</p>
                <p className="text-xs text-green-700">Destination</p>
              </div>
            </div>
          )}

          {/* Transfer Reason */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Transfer Reason <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.transfer_reason}
              onChange={(e) => handleChange('transfer_reason', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.transfer_reason ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select reason...</option>
              {transferReasons.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
            {errors.transfer_reason && (
              <p className="text-xs text-red-600">{errors.transfer_reason}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Additional Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional details about the transfer..."
            />
          </div>
        </div>

        {/* Product Search */}
        {formData.from_branch_id && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Search Products from {fromBranch?.branch_name}
            </h3>
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search products by name or code..."
            />

            {/* Search Results */}
            {searchingProducts ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            ) : products.length > 0 ? (
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-60 overflow-y-auto">
                {products.map((product) => (
                  <div
                    key={`${product.id}-${product.variant_id || 'none'}`}
                    className="p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900">{product.product_name}</p>
                          <Badge variant="default" size="sm">{product.product_code}</Badge>
                        </div>
                        {product.variant_name && (
                          <p className="text-sm text-gray-600 mb-1">{product.variant_name}</p>
                        )}
                        <p className={`text-sm ${
                          product.available_stock > 10 ? 'text-green-600' : 'text-yellow-600'
                        }`}>
                          Available: {product.available_stock} units
                        </p>
                      </div>

                      <Button
                        size="sm"
                        variant="primary"
                        icon={Plus}
                        onClick={() => handleAddItem(product)}
                        disabled={product.available_stock === 0}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : searchQuery.length >= 2 ? (
              <div className="p-8">
                <EmptyState
                  variant="search"
                  title="No products found"
                  description={`No products match "${searchQuery}"`}
                />
              </div>
            ) : null}
          </div>
        )}

        {/* Selected Items */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Items to Transfer ({formData.items.length})
            {errors.items && <span className="text-red-500 text-xs normal-case ml-2">({errors.items})</span>}
          </h3>

          {formData.items.length === 0 ? (
            <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg">
              <EmptyState
                icon={Package}
                title="No items selected"
                description={formData.from_branch_id ? "Search and add products to transfer" : "Select source branch first"}
              />
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Product</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">Available</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">Transfer Qty</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {formData.items.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{item.product_name}</p>
                          {item.variant_name && (
                            <p className="text-xs text-gray-500">{item.variant_name}</p>
                          )}
                          <p className="text-xs text-gray-500">{item.product_code}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-medium text-gray-900">
                        {item.available_stock}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleUpdateQuantity(index, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                          >
                            <Minus className="w-4 h-4 text-gray-600" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            max={item.available_stock}
                            value={item.quantity}
                            onChange={(e) => handleUpdateQuantity(index, parseInt(e.target.value) || 1)}
                            className={`w-16 px-2 py-1 text-center border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              errors[`item_${index}`] ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          <button
                            onClick={() => handleUpdateQuantity(index, item.quantity + 1)}
                            disabled={item.quantity >= item.available_stock}
                            className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                        {errors[`item_${index}`] && (
                          <p className="text-xs text-red-600 text-center mt-1">{errors[`item_${index}`]}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-600 hover:text-red-800 font-medium text-sm"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                  <tr>
                    <td colSpan="2" className="px-4 py-3 text-right font-semibold text-gray-900">
                      Total Units:
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-gray-900 text-lg">
                      {totalItems}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Info */}
        {formData.items.length > 0 && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              Transfer will be created with <span className="font-bold">"Pending"</span> status.
              It must be approved before stock is moved between branches.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default StockTransferFormModal;
