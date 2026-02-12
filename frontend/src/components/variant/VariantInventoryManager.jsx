import React, { useState, useEffect } from 'react';
import { Warehouse, Plus, Edit, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, Badge, Button, Input, Modal, LoadingSpinner } from '../ui';

/**
 * VariantInventoryManager Component
 * Manages variant inventory across multiple branches
 */
const VariantInventoryManager = ({
  variantId,
  productName,
  variantName,
  className = '',
}) => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [adjustmentType, setAdjustmentType] = useState('add'); // add, remove, set
  const [adjustmentQuantity, setAdjustmentQuantity] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');

  // Fetch variant inventory across all branches
  useEffect(() => {
    if (variantId) {
      fetchInventory();
    }
  }, [variantId]);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/variants/${variantId}/inventory`);
      // const data = await response.json();

      // Mock data for now
      const mockData = [
        {
          branch_id: '1',
          branch_name: 'Main Store',
          quantity_on_hand: 45,
          reorder_level: 20,
          last_counted_at: '2026-01-25T10:30:00Z',
        },
        {
          branch_id: '2',
          branch_name: 'Warehouse',
          quantity_on_hand: 150,
          reorder_level: 50,
          last_counted_at: '2026-01-28T14:15:00Z',
        },
        {
          branch_id: '3',
          branch_name: 'Branch 2',
          quantity_on_hand: 8,
          reorder_level: 15,
          last_counted_at: '2026-01-30T09:00:00Z',
        },
      ];

      setInventory(mockData);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustment = async () => {
    if (!selectedBranch || !adjustmentQuantity || !adjustmentReason.trim()) {
      return;
    }

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/stock-adjustments`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     variant_id: variantId,
      //     branch_id: selectedBranch.branch_id,
      //     adjustment_type: adjustmentType,
      //     quantity: parseInt(adjustmentQuantity),
      //     reason: adjustmentReason,
      //   }),
      // });

      // Refresh inventory
      await fetchInventory();

      // Reset and close modal
      setShowAdjustModal(false);
      setSelectedBranch(null);
      setAdjustmentQuantity('');
      setAdjustmentReason('');
    } catch (error) {
      console.error('Error adjusting inventory:', error);
    }
  };

  const totalStock = inventory.reduce((sum, item) => sum + item.quantity_on_hand, 0);
  const lowStockBranches = inventory.filter(
    (item) => item.quantity_on_hand <= item.reorder_level
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{productName}</h3>
            <p className="text-sm text-gray-600">{variantName}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Total Stock</p>
            <p className="text-2xl font-bold text-gray-900">{totalStock} units</p>
          </div>
        </div>

        {lowStockBranches > 0 && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">
              {lowStockBranches} {lowStockBranches === 1 ? 'branch has' : 'branches have'} low stock
            </span>
          </div>
        )}
      </div>

      {/* Branch Inventory Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {inventory.map((item) => {
          const isLowStock = item.quantity_on_hand <= item.reorder_level;
          const stockPercentage = (item.quantity_on_hand / item.reorder_level) * 100;

          return (
            <Card
              key={item.branch_id}
              className={`${isLowStock ? 'border-yellow-300 bg-yellow-50' : ''}`.trim()}
            >
              <div className="space-y-4">
                {/* Branch Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Warehouse className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{item.branch_name}</h4>
                      <p className="text-xs text-gray-500">
                        Last counted: {new Date(item.last_counted_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    icon={Edit}
                    onClick={() => {
                      setSelectedBranch(item);
                      setShowAdjustModal(true);
                    }}
                    title="Adjust Stock"
                  />
                </div>

                {/* Stock Information */}
                <div>
                  <div className="flex items-end justify-between mb-2">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Stock on Hand</p>
                      <p className={`text-2xl font-bold ${isLowStock ? 'text-yellow-700' : 'text-gray-900'}`}>
                        {item.quantity_on_hand}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600 mb-1">Reorder Level</p>
                      <p className="text-lg font-semibold text-gray-700">{item.reorder_level}</p>
                    </div>
                  </div>

                  {/* Stock Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        stockPercentage >= 100
                          ? 'bg-green-500'
                          : stockPercentage >= 50
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                    />
                  </div>

                  {/* Status Badge */}
                  <div className="mt-2">
                    {isLowStock ? (
                      <Badge variant="warning" size="sm" icon={AlertCircle}>
                        Low Stock
                      </Badge>
                    ) : stockPercentage >= 200 ? (
                      <Badge variant="info" size="sm" icon={TrendingUp}>
                        Overstocked
                      </Badge>
                    ) : (
                      <Badge variant="success" size="sm">
                        Adequate Stock
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Adjustment Modal */}
      <Modal
        isOpen={showAdjustModal}
        onClose={() => {
          setShowAdjustModal(false);
          setSelectedBranch(null);
          setAdjustmentQuantity('');
          setAdjustmentReason('');
        }}
        title={`Adjust Stock - ${selectedBranch?.branch_name}`}
        size="md"
      >
        <div className="space-y-4">
          {/* Current Stock Info */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Current Stock</p>
            <p className="text-2xl font-bold text-gray-900">
              {selectedBranch?.quantity_on_hand} units
            </p>
          </div>

          {/* Adjustment Type */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Adjustment Type</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAdjustmentType('add')}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  adjustmentType === 'add'
                    ? 'border-green-600 bg-green-50 text-green-700 font-medium'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <TrendingUp className="w-4 h-4 mx-auto mb-1" />
                Add Stock
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType('remove')}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  adjustmentType === 'remove'
                    ? 'border-red-600 bg-red-50 text-red-700 font-medium'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <TrendingDown className="w-4 h-4 mx-auto mb-1" />
                Remove Stock
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType('set')}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  adjustmentType === 'set'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Edit className="w-4 h-4 mx-auto mb-1" />
                Set Stock
              </button>
            </div>
          </div>

          {/* Quantity */}
          <Input
            label="Quantity"
            type="number"
            min="1"
            value={adjustmentQuantity}
            onChange={(e) => setAdjustmentQuantity(e.target.value)}
            placeholder="Enter quantity"
            required
          />

          {/* Reason */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={adjustmentReason}
              onChange={(e) => setAdjustmentReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter reason for adjustment (e.g., stock count correction, damage, return)"
              required
            />
          </div>

          {/* Preview */}
          {adjustmentQuantity && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700 mb-1">New Stock Level</p>
              <p className="text-2xl font-bold text-blue-600">
                {adjustmentType === 'add'
                  ? selectedBranch?.quantity_on_hand + parseInt(adjustmentQuantity)
                  : adjustmentType === 'remove'
                  ? Math.max(0, selectedBranch?.quantity_on_hand - parseInt(adjustmentQuantity))
                  : parseInt(adjustmentQuantity)}{' '}
                units
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowAdjustModal(false);
                setSelectedBranch(null);
                setAdjustmentQuantity('');
                setAdjustmentReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdjustment}
              disabled={!adjustmentQuantity || !adjustmentReason.trim()}
            >
              Adjust Stock
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default VariantInventoryManager;
