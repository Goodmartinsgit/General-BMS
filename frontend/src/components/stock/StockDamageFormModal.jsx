import React, { useState, useEffect } from 'react';
import { AlertTriangle, Package, Search, Plus, Minus } from 'lucide-react';
import { Modal, Button, Badge, SearchBar, LoadingSpinner, EmptyState } from '../ui';

/**
 * StockDamageFormModal Component
 * Record damaged stock items
 */
const StockDamageFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  branches = [],
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    branch_id: '',
    damage_reason: '',
    notes: '',
    items: [], // { product_id, variant_id, product_name, variant_name, quantity, available_stock }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [errors, setErrors] = useState({});

  // Fetch products based on search and selected branch
  useEffect(() => {
    if (searchQuery.length >= 2 && formData.branch_id) {
      fetchProducts();
    } else {
      setProducts([]);
    }
  }, [searchQuery, formData.branch_id]);

  const fetchProducts = async () => {
    setSearchingProducts(true);
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/products?search=${searchQuery}&branch_id=${formData.branch_id}&in_stock=true`);
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
        },
        {
          id: '2',
          product_code: 'ACC-001',
          product_name: 'Tile Adhesive',
          variant_id: '1',
          variant_name: 'White - 25kg',
          available_stock: 45,
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

    // Clear items if branch changes
    if (field === 'branch_id') {
      setFormData((prev) => ({ ...prev, items: [] }));
      setSearchQuery('');
    }
  };

  const handleAddItem = (product) => {
    const existingItemIndex = formData.items.findIndex(
      (item) =>
        item.product_id === product.id && item.variant_id === product.variant_id
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

  const damageReasons = [
    'Water Damage',
    'Physical Damage',
    'Manufacturing Defect',
    'Expired Product',
    'Theft/Vandalism',
    'Handling Error',
    'Storage Issue',
    'Other',
  ];

  const validate = () => {
    const newErrors = {};

    if (!formData.branch_id) {
      newErrors.branch_id = 'Please select a branch';
    }

    if (!formData.damage_reason) {
      newErrors.damage_reason = 'Damage reason is required';
    }

    if (formData.items.length === 0) {
      newErrors.items = 'At least one damaged item must be recorded';
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
        branch_id: formData.branch_id,
        damage_reason: formData.damage_reason,
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
      branch_id: '',
      damage_reason: '',
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

  const selectedBranch = branches.find((b) => b.id === formData.branch_id);
  const totalItems = formData.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Record Damaged Stock"
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            loading={loading}
            variant="danger"
            disabled={formData.items.length === 0}
          >
            Record Damage ({formData.items.length} products, {totalItems} units)
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Damage Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Damage Details
          </h3>

          {/* Branch Selection */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Branch <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.branch_id}
              onChange={(e) => handleChange('branch_id', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.branch_id ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select branch...</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.branch_name}
                  {branch.main_branch && ' (Main Branch)'}
                </option>
              ))}
            </select>
            {errors.branch_id && (
              <p className="text-xs text-red-600">{errors.branch_id}</p>
            )}
          </div>

          {/* Damage Reason */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Damage Reason <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.damage_reason}
              onChange={(e) => handleChange('damage_reason', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.damage_reason ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select reason...</option>
              {damageReasons.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
            {errors.damage_reason && (
              <p className="text-xs text-red-600">{errors.damage_reason}</p>
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
              placeholder="Describe the damage in detail..."
            />
          </div>
        </div>

        {/* Product Search */}
        {formData.branch_id && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Search Products from {selectedBranch?.branch_name}
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
                          <Badge variant="default" size="sm">
                            {product.product_code}
                          </Badge>
                        </div>
                        {product.variant_name && (
                          <p className="text-sm text-gray-600 mb-1">{product.variant_name}</p>
                        )}
                        <p
                          className={`text-sm ${
                            product.available_stock > 10
                              ? 'text-green-600'
                              : 'text-yellow-600'
                          }`}
                        >
                          Available: {product.available_stock} units
                        </p>
                      </div>

                      <Button
                        size="sm"
                        variant="danger"
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

        {/* Damaged Items */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Damaged Items ({formData.items.length})
            {errors.items && (
              <span className="text-red-500 text-xs normal-case ml-2">
                ({errors.items})
              </span>
            )}
          </h3>

          {formData.items.length === 0 ? (
            <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg">
              <EmptyState
                icon={AlertTriangle}
                title="No damaged items recorded"
                description={
                  formData.branch_id
                    ? 'Search and add damaged products'
                    : 'Select branch first'
                }
              />
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      Product
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">
                      Available
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">
                      Damaged Qty
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">
                      Action
                    </th>
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
                            onChange={(e) =>
                              handleUpdateQuantity(index, parseInt(e.target.value) || 1)
                            }
                            className={`w-16 px-2 py-1 text-center border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              errors[`item_${index}`]
                                ? 'border-red-500'
                                : 'border-gray-300'
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
                          <p className="text-xs text-red-600 text-center mt-1">
                            {errors[`item_${index}`]}
                          </p>
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
                <tfoot className="bg-red-50 border-t-2 border-red-300">
                  <tr>
                    <td colSpan="2" className="px-4 py-3 text-right font-semibold text-gray-900">
                      Total Damaged Units:
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-red-600 text-lg">
                      {totalItems}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Warning */}
        {formData.items.length > 0 && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">
              <p className="font-semibold mb-1">Recording this damage will:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  Reduce stock at <span className="font-bold">{selectedBranch?.branch_name}</span>{' '}
                  by {totalItems} units
                </li>
                <li>Mark these items as damaged in inventory records</li>
                <li>Update stock availability</li>
                <li>Create a damage report for auditing</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default StockDamageFormModal;
