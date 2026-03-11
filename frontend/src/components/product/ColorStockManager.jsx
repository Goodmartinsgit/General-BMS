import React, { useState, useEffect } from 'react';
import { Package, Plus, Minus, RefreshCw } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'react-toastify';

const ColorStockManager = ({ productId, branchId, onStockUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [colorInventory, setColorInventory] = useState([]);
  const [editMode, setEditMode] = useState({});

  useEffect(() => {
    if (productId) {
      fetchColorInventory();
    }
  }, [productId, branchId]);

  const fetchColorInventory = async () => {
    try {
      setLoading(true);
      const params = branchId ? `?branch_id=${branchId}` : '';
      const res = await api.get(`/products/${productId}/color-inventory${params}`);
      setColorInventory(res.data);
    } catch (error) {
      console.error('Error fetching color inventory:', error);
      toast.error('Failed to load color inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (inventoryId, colorId, newQuantity) => {
    setColorInventory(prev =>
      prev.map(item =>
        item.inventory_id === inventoryId && item.color_id === colorId
          ? { ...item, color_quantity: newQuantity }
          : item
      )
    );
  };

  const handleSaveQuantity = async (inventoryId, colorId, branchId) => {
    const item = colorInventory.find(
      i => i.inventory_id === inventoryId && i.color_id === colorId
    );

    if (!item) return;

    try {
      await api.post('/products/color-inventory', {
        product_id: productId,
        branch_id: branchId,
        color_id: colorId,
        quantity: parseInt(item.color_quantity) || 0,
      });

      toast.success('Color stock updated successfully');
      setEditMode({ ...editMode, [`${inventoryId}-${colorId}`]: false });
      fetchColorInventory();
      if (onStockUpdate) onStockUpdate();
    } catch (error) {
      console.error('Error updating color stock:', error);
      toast.error(error.response?.data?.message || 'Failed to update color stock');
    }
  };

  const toggleEditMode = (inventoryId, colorId) => {
    const key = `${inventoryId}-${colorId}`;
    setEditMode({ ...editMode, [key]: !editMode[key] });
  };

  const groupedByBranch = colorInventory.reduce((acc, item) => {
    if (!acc[item.branch_id]) {
      acc[item.branch_id] = {
        branch_name: item.branch_name,
        inventory_id: item.inventory_id,
        total_quantity: item.total_quantity,
        colors: [],
      };
    }
    if (item.color_id) {
      acc[item.branch_id].colors.push(item);
    }
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-6 h-6 animate-spin text-accent-gold" />
      </div>
    );
  }

  if (Object.keys(groupedByBranch).length === 0) {
    return (
      <div className="text-center py-8 text-theme-muted">
        <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No color inventory data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(groupedByBranch).map(([branchId, branchData]) => (
        <div
          key={branchId}
          className="bg-theme-secondary rounded-lg border border-theme p-4"
        >
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-theme">
            <div>
              <h4 className="font-semibold text-theme-primary">{branchData.branch_name}</h4>
              <p className="text-sm text-theme-muted">
                Total Stock: <span className="font-semibold text-accent-gold">{branchData.total_quantity}</span> units
              </p>
            </div>
          </div>

          {branchData.colors.length === 0 ? (
            <p className="text-sm text-theme-muted text-center py-4">
              No colors defined for this product
            </p>
          ) : (
            <div className="space-y-2">
              {branchData.colors.map((colorItem) => {
                const editKey = `${colorItem.inventory_id}-${colorItem.color_id}`;
                const isEditing = editMode[editKey];

                return (
                  <div
                    key={colorItem.color_id}
                    className="flex items-center gap-3 p-2 bg-theme-primary rounded border border-theme"
                  >
                    <div
                      className="w-6 h-6 rounded border-2 border-theme flex-shrink-0"
                      style={{ backgroundColor: colorItem.color_code }}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-theme-primary">
                        {colorItem.color_name}
                      </p>
                      <p className="text-xs text-theme-muted">
                        Available: {colorItem.color_available} | Reserved: {colorItem.color_reserved}
                      </p>
                    </div>

                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          value={colorItem.color_quantity}
                          onChange={(e) =>
                            handleQuantityChange(
                              colorItem.inventory_id,
                              colorItem.color_id,
                              e.target.value
                            )
                          }
                          className="w-20 px-2 py-1 text-sm bg-theme-secondary border border-theme rounded text-theme-primary"
                        />
                        <button
                          onClick={() =>
                            handleSaveQuantity(
                              colorItem.inventory_id,
                              colorItem.color_id,
                              colorItem.branch_id
                            )
                          }
                          className="px-2 py-1 text-xs font-medium bg-accent-gold text-white rounded hover:bg-accent-goldDark transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => toggleEditMode(colorItem.inventory_id, colorItem.color_id)}
                          className="px-2 py-1 text-xs font-medium bg-theme-tertiary text-theme-secondary rounded hover:bg-theme-primary transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-accent-gold min-w-[3rem] text-right">
                          {colorItem.color_quantity}
                        </span>
                        <button
                          onClick={() => toggleEditMode(colorItem.inventory_id, colorItem.color_id)}
                          className="px-2 py-1 text-xs font-medium bg-theme-tertiary text-theme-secondary rounded hover:bg-theme-primary transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ColorStockManager;
