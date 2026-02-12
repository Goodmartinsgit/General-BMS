import React, { useState, useEffect } from 'react';
import { Search, Package, Plus, Minus, ShoppingCart, AlertCircle } from 'lucide-react';
import { Modal, Button, Badge, SearchBar, LoadingSpinner, EmptyState } from '../ui';

/**
 * ExchangeItemSelector Component
 * Select replacement items for exchange returns
 */
const ExchangeItemSelector = ({
  isOpen,
  onClose,
  onConfirm,
  returnData,
  loading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [errors, setErrors] = useState({});

  if (!returnData) return null;

  const { return_number, total_amount: returnAmount } = returnData;

  // Fetch products based on search
  useEffect(() => {
    if (searchQuery.length >= 2) {
      fetchProducts();
    } else {
      setProducts([]);
    }
  }, [searchQuery]);

  const fetchProducts = async () => {
    setSearchingProducts(true);
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/products?search=${searchQuery}&in_stock=true`);
      // const data = await response.json();

      // Mock data for now
      const mockProducts = [
        {
          id: '1',
          product_code: 'TILE-001',
          product_name: 'Premium Ceramic Tile',
          variant_id: null,
          variant_name: null,
          price: 29.99,
          stock_quantity: 50,
          image_url: null,
        },
        {
          id: '2',
          product_code: 'ACC-001',
          product_name: 'Tile Adhesive',
          variant_id: '1',
          variant_name: 'White - 25kg',
          price: 15.99,
          stock_quantity: 25,
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

  const handleAddItem = (product) => {
    const existingItemIndex = selectedItems.findIndex(
      (item) =>
        item.product_id === product.id &&
        item.variant_id === product.variant_id
    );

    if (existingItemIndex >= 0) {
      // Increment quantity
      const updatedItems = [...selectedItems];
      updatedItems[existingItemIndex].quantity += 1;
      setSelectedItems(updatedItems);
    } else {
      // Add new item
      const newItem = {
        product_id: product.id,
        variant_id: product.variant_id,
        product_code: product.product_code,
        product_name: product.product_name,
        variant_name: product.variant_name,
        unit_price: product.price,
        quantity: 1,
        max_quantity: product.stock_quantity,
      };
      setSelectedItems([...selectedItems, newItem]);
    }
  };

  const handleUpdateQuantity = (index, newQuantity) => {
    const updatedItems = [...selectedItems];
    const item = updatedItems[index];

    if (newQuantity <= 0) {
      // Remove item
      updatedItems.splice(index, 1);
    } else if (newQuantity <= item.max_quantity) {
      updatedItems[index].quantity = newQuantity;
    }

    setSelectedItems(updatedItems);
  };

  const handleRemoveItem = (index) => {
    const updatedItems = [...selectedItems];
    updatedItems.splice(index, 1);
    setSelectedItems(updatedItems);
  };

  const exchangeTotal = selectedItems.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0
  );

  const priceDifference = exchangeTotal - parseFloat(returnAmount || 0);

  const validate = () => {
    const newErrors = {};

    if (selectedItems.length === 0) {
      newErrors.items = 'Please select at least one replacement item';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = () => {
    if (!validate()) return;

    onConfirm({
      exchange_items: selectedItems,
      exchange_total: exchangeTotal,
      price_difference: priceDifference,
    });
  };

  const resetForm = () => {
    setSearchQuery('');
    setProducts([]);
    setSelectedItems([]);
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Select Exchange Items - ${return_number}`}
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            loading={loading}
            variant="primary"
            disabled={selectedItems.length === 0}
          >
            Confirm Exchange ({selectedItems.length} items)
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Exchange Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-gray-700 mb-1">Return Amount</p>
            <p className="text-2xl font-bold text-blue-600">
              ${parseFloat(returnAmount || 0).toFixed(2)}
            </p>
          </div>

          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-gray-700 mb-1">Exchange Total</p>
            <p className="text-2xl font-bold text-green-600">
              ${exchangeTotal.toFixed(2)}
            </p>
          </div>

          <div className={`p-4 border rounded-lg ${
            priceDifference > 0
              ? 'bg-yellow-50 border-yellow-200'
              : priceDifference < 0
              ? 'bg-purple-50 border-purple-200'
              : 'bg-gray-50 border-gray-200'
          }`}>
            <p className="text-sm text-gray-700 mb-1">Difference</p>
            <p className={`text-2xl font-bold ${
              priceDifference > 0
                ? 'text-yellow-600'
                : priceDifference < 0
                ? 'text-purple-600'
                : 'text-gray-600'
            }`}>
              {priceDifference > 0 ? '+' : ''}${priceDifference.toFixed(2)}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {priceDifference > 0
                ? 'Customer pays'
                : priceDifference < 0
                ? 'Refund to customer'
                : 'Even exchange'}
            </p>
          </div>
        </div>

        {/* Product Search */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Search Products
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
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-gray-600">
                          Price: <span className="font-semibold text-gray-900">${parseFloat(product.price).toFixed(2)}</span>
                        </span>
                        <span className={`${
                          product.stock_quantity > 10 ? 'text-green-600' : 'text-yellow-600'
                        }`}>
                          Stock: {product.stock_quantity}
                        </span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="primary"
                      icon={Plus}
                      onClick={() => handleAddItem(product)}
                      disabled={product.stock_quantity === 0}
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

        {/* Selected Items */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Selected Exchange Items ({selectedItems.length})
            {errors.items && <span className="text-red-500 text-xs normal-case ml-2">({errors.items})</span>}
          </h3>

          {selectedItems.length === 0 ? (
            <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg">
              <EmptyState
                icon={ShoppingCart}
                title="No items selected"
                description="Search and add products to exchange"
              />
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Product</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">Price</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">Quantity</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Total</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {selectedItems.map((item, index) => {
                    const itemTotal = item.unit_price * item.quantity;

                    return (
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
                          ${parseFloat(item.unit_price).toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleUpdateQuantity(index, item.quantity - 1)}
                              className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                            >
                              <Minus className="w-4 h-4 text-gray-600" />
                            </button>
                            <span className="w-12 text-center font-semibold text-gray-900">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleUpdateQuantity(index, item.quantity + 1)}
                              disabled={item.quantity >= item.max_quantity}
                              className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Plus className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 text-center mt-1">
                            Max: {item.max_quantity}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">
                          ${itemTotal.toFixed(2)}
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
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                  <tr>
                    <td colSpan="3" className="px-4 py-3 text-right font-semibold text-gray-900">
                      Exchange Total:
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900 text-lg">
                      ${exchangeTotal.toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Price Difference Info */}
        {selectedItems.length > 0 && priceDifference !== 0 && (
          <div className={`flex items-start gap-2 p-3 rounded-lg ${
            priceDifference > 0
              ? 'bg-yellow-50 border border-yellow-200'
              : 'bg-purple-50 border border-purple-200'
          }`}>
            <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
              priceDifference > 0 ? 'text-yellow-600' : 'text-purple-600'
            }`} />
            <p className={`text-sm ${
              priceDifference > 0 ? 'text-yellow-800' : 'text-purple-800'
            }`}>
              {priceDifference > 0 ? (
                <>
                  The customer needs to pay an additional <span className="font-bold">${priceDifference.toFixed(2)}</span> for this exchange.
                </>
              ) : (
                <>
                  A refund of <span className="font-bold">${Math.abs(priceDifference).toFixed(2)}</span> will be issued to the customer.
                </>
              )}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ExchangeItemSelector;
