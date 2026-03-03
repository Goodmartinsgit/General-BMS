import React, { useState, useEffect } from 'react';
import { RotateCcw, Search, AlertCircle, Package, DollarSign } from 'lucide-react';
import { Modal, Input, Button, Badge } from '../ui';
import { useCurrency } from '../../context/CurrencyContext';

/**
 * ReturnFormModal Component
 * Create return/exchange request for a sale
 */
const ReturnFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialSale = null,
  loading = false,
}) => {
  const { formatCurrency } = useCurrency();
  const [saleNumber, setSaleNumber] = useState('');
  const [sale, setSale] = useState(null);
  const [searchingSale, setSearchingsale] = useState(false);
  const [formData, setFormData] = useState({
    return_type: 'refund', // refund, exchange
    reason: '',
    notes: '',
    items: [], // { sale_item_id, product_name, quantity_returned, return_reason }
  });

  const [errors, setErrors] = useState({});

  // Load initial sale if provided
  useEffect(() => {
    if (initialSale) {
      setSale(initialSale);
      setSaleNumber(initialSale.sale_number);
      initializeItems(initialSale);
    }
  }, [initialSale]);

  const initializeItems = (saleData) => {
    const items = saleData.items.map((item) => ({
      sale_item_id: item.id,
      product_id: item.product_id,
      variant_id: item.variant_id,
      product_name: item.product_name,
      variant_name: item.variant_name,
      sold_quantity: item.quantity,
      unit_price: item.unit_price,
      quantity_returned: 0,
      return_reason: '',
      can_return: true,
    }));

    setFormData((prev) => ({ ...prev, items }));
  };

  const handleSearchSale = async () => {
    if (!saleNumber.trim()) return;

    setSearchingale(true);
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/sales?sale_number=${saleNumber}`);
      // const data = await response.json();

      // Mock data for now
      const mockSale = {
        id: '1',
        sale_number: saleNumber,
        customer_name: 'John Doe',
        sale_date: '2026-01-28',
        total: 150.00,
        items: [
          {
            id: '1',
            product_id: '1',
            product_name: 'Wireless Mouse',
            variant_id: null,
            variant_name: null,
            quantity: 2,
            unit_price: 29.99,
          },
          {
            id: '2',
            product_id: '2',
            product_name: 'USB-C Cable',
            variant_id: '1',
            variant_name: 'Red - 2m',
            quantity: 5,
            unit_price: 12.99,
          },
        ],
      };

      setSale(mockSale);
      initializeItems(mockSale);
      setErrors({});
    } catch (error) {
      setErrors({ saleNumber: 'Sale not found' });
      console.error('Error searching sale:', error);
    } finally {
      setSearchingale(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setFormData((prev) => ({ ...prev, items: updatedItems }));
  };

  const validate = () => {
    const newErrors = {};

    if (!sale) {
      newErrors.saleNumber = 'Please search and select a sale first';
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'Return reason is required';
    }

    const hasItemsToReturn = formData.items.some((item) => item.quantity_returned > 0);
    if (!hasItemsToReturn) {
      newErrors.items = 'At least one item must be returned';
    }

    // Validate each item
    formData.items.forEach((item, index) => {
      if (item.quantity_returned > 0) {
        if (item.quantity_returned > item.sold_quantity) {
          newErrors[`item_${index}`] = `Cannot return more than sold quantity (${item.sold_quantity})`;
        }
        if (!item.return_reason.trim()) {
          newErrors[`item_reason_${index}`] = 'Item return reason is required';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      const itemsToReturn = formData.items.filter((item) => item.quantity_returned > 0);

      onSubmit({
        sale_id: sale.id,
        return_type: formData.return_type,
        reason: formData.reason,
        notes: formData.notes,
        items: itemsToReturn.map((item) => ({
          sale_item_id: item.sale_item_id,
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity_returned,
          return_reason: item.return_reason,
        })),
      });
    }
  };

  const returnReasons = [
    'Defective/Damaged',
    'Wrong Item Received',
    'Changed Mind',
    'Better Price Elsewhere',
    'Not as Described',
    'Quality Issues',
    'Other',
  ];

  const totalReturnAmount = formData.items.reduce(
    (sum, item) => sum + (item.quantity_returned * item.unit_price),
    0
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Return Request"
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading} disabled={!sale}>
            Create Return Request
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Search Sale */}
        {!initialSale && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-theme-primary uppercase tracking-wide">
              Find Sale
            </h3>

            <div className="flex gap-2">
              <Input
                label="Sale Number"
                value={saleNumber}
                onChange={(e) => setSaleNumber(e.target.value)}
                error={errors.saleNumber}
                placeholder="Enter sale number (e.g., SAL-20260131-0001)"
                onKeyPress={(e) => e.key === 'Enter' && handleSearchSale()}
                className="flex-1"
              />
              <div className="flex items-end">
                <Button
                  onClick={handleSearchSale}
                  loading={searchingSale}
                  icon={Search}
                >
                  Search
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Sale Information */}
        {sale && (
          <>
            <div className="p-4 bg-accent-gold/10 border border-accent-gold/30 rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-theme-primary">Sale Information</p>
                  <p className="text-xs text-theme-muted">
                    {new Date(sale.sale_date).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="primary">{sale.sale_number}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-theme-muted">Customer:</span>
                  <span className="ml-2 font-medium text-theme-primary">
                    {sale.customer_name || 'Walk-in Customer'}
                  </span>
                </div>
                <div>
                  <span className="text-theme-muted">Total:</span>
                  <span className="ml-2 font-medium text-theme-primary">
                    {formatCurrency(sale.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Return Type */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-theme-primary uppercase tracking-wide">
                Return Type
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleChange('return_type', 'refund')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.return_type === 'refund'
                      ? 'border-accent-gold bg-accent-gold/10'
                      : 'border-theme hover:bg-theme-tertiary'
                  }`}
                >
                  <DollarSign className={`w-6 h-6 mx-auto mb-2 ${
                    formData.return_type === 'refund' ? 'text-accent-gold' : 'text-theme-muted'
                  }`} />
                  <p className={`font-medium ${
                    formData.return_type === 'refund' ? 'text-accent-gold' : 'text-theme-primary'
                  }`}>
                    Refund
                  </p>
                  <p className="text-xs text-theme-muted mt-1">Return money to customer</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleChange('return_type', 'exchange')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.return_type === 'exchange'
                      ? 'border-emerald-600 bg-emerald-50'
                      : 'border-theme hover:bg-theme-tertiary'
                  }`}
                >
                  <RotateCcw className={`w-6 h-6 mx-auto mb-2 ${
                    formData.return_type === 'exchange' ? 'text-emerald-600' : 'text-theme-muted'
                  }`} />
                  <p className={`font-medium ${
                    formData.return_type === 'exchange' ? 'text-emerald-900' : 'text-theme-primary'
                  }`}>
                    Exchange
                  </p>
                  <p className="text-xs text-theme-muted mt-1">Replace with other items</p>
                </button>
              </div>
            </div>

            {/* Return Reason */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-theme-primary uppercase tracking-wide">
                General Return Reason
              </h3>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-theme-primary">
                  Overall Reason <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.reason}
                  onChange={(e) => handleChange('reason', e.target.value)}
                  className={`w-full px-3 py-2.5 bg-theme-primary border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 transition-all text-sm text-theme-primary ${
                    errors.reason ? 'border-red-500' : 'border-theme'
                  }`}
                >
                  <option value="">Select reason...</option>
                  {returnReasons.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
                {errors.reason && (
                  <p className="text-xs text-red-600">{errors.reason}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-theme-primary">
                  Additional Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2.5 bg-theme-primary border border-theme rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 transition-all text-sm text-theme-primary placeholder-theme-muted"
                  placeholder="Optional details about the return..."
                />
              </div>
            </div>

            {/* Items to Return */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-theme-primary uppercase tracking-wide">
                Items to Return {errors.items && <span className="text-red-500 text-xs normal-case">({errors.items})</span>}
              </h3>

              <div className="border border-theme rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-theme-tertiary border-b border-theme">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-theme-primary uppercase">Product</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-theme-primary uppercase">Sold</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-theme-primary uppercase">Return Qty</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-theme-primary uppercase">Reason</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-theme-primary uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme">
                    {formData.items.map((item, index) => {
                      const returnAmount = item.quantity_returned * item.unit_price;

                      return (
                        <tr key={index} className="hover:bg-theme-tertiary">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-theme-primary">{item.product_name}</p>
                              {item.variant_name && (
                                <p className="text-xs text-theme-muted">{item.variant_name}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center font-medium text-theme-primary">
                            {item.sold_quantity}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="0"
                              max={item.sold_quantity}
                              value={item.quantity_returned}
                              onChange={(e) => handleItemChange(index, 'quantity_returned', parseInt(e.target.value) || 0)}
                              className={`w-20 px-2 py-1 text-center bg-theme-primary border rounded focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 text-theme-primary ${
                                errors[`item_${index}`] ? 'border-red-500' : 'border-theme'
                              }`}
                            />
                            {errors[`item_${index}`] && (
                              <p className="text-xs text-red-600 mt-1">{errors[`item_${index}`]}</p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={item.return_reason}
                              onChange={(e) => handleItemChange(index, 'return_reason', e.target.value)}
                              disabled={item.quantity_returned === 0}
                              className={`w-full px-2 py-1 text-sm bg-theme-primary border rounded focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 text-theme-primary ${
                                errors[`item_reason_${index}`] ? 'border-red-500' : 'border-theme'
                              }`}
                            >
                              <option value="">Select...</option>
                              {returnReasons.map((reason) => (
                                <option key={reason} value={reason}>
                                  {reason}
                                </option>
                              ))}
                            </select>
                            {errors[`item_reason_${index}`] && (
                              <p className="text-xs text-red-600 mt-1">{errors[`item_reason_${index}`]}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-theme-primary">
                            {formatCurrency(returnAmount)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-accent-gold/10 border-t-2 border-accent-gold/30">
                    <tr>
                      <td colSpan="4" className="px-4 py-3 text-right font-semibold text-theme-primary">
                        Total Return Amount:
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-accent-gold text-lg">
                        {formatCurrency(totalReturnAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Warning */}
            {formData.return_type === 'exchange' && (
              <div className="flex items-start gap-2 p-3 bg-accent-gold/10 border border-accent-gold/30 rounded-lg">
                <AlertCircle className="w-5 h-5 text-accent-gold flex-shrink-0 mt-0.5" />
                <p className="text-sm text-theme-primary">
                  Exchange items can be selected after the return request is approved.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default ReturnFormModal;
