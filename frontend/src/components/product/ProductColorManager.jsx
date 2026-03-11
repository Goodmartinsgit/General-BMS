import React, { useState } from 'react';
import { Plus, X, Palette } from 'lucide-react';

const ProductColorManager = ({ productId, colors, onColorsChange, disabled = false }) => {
  const [newColor, setNewColor] = useState({ color_name: '', color_code: '#000000' });
  const [isAdding, setIsAdding] = useState(false);

  const handleAddColor = () => {
    if (!newColor.color_name.trim()) return;
    
    const colorToAdd = {
      id: 'temp_' + Date.now(), // Temporary ID for new colors (string to prevent DB overflow)
      color_name: newColor.color_name.trim(),
      color_code: newColor.color_code,
      display_order: colors.length,
      is_active: true,
      isNew: true
    };
    
    onColorsChange([...colors, colorToAdd]);
    setNewColor({ color_name: '', color_code: '#000000' });
    setIsAdding(false);
  };

  const handleRemoveColor = (colorId) => {
    onColorsChange(colors.filter(c => c.id !== colorId));
  };

  const handleColorChange = (colorId, field, value) => {
    onColorsChange(colors.map(c => 
      c.id === colorId ? { ...c, [field]: value } : c
    ));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-theme-secondary">
          Product Colors
        </label>
        {!isAdding && !disabled && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-accent-gold hover:text-accent-goldDark transition-colors"
          >
            <Plus size={14} />
            Add Color
          </button>
        )}
      </div>

      <div className="space-y-2">
        {colors.map((color) => (
          <div
            key={color.id}
            className="flex items-center gap-2 p-2 bg-theme-primary border border-theme rounded-lg"
          >
            <div
              className="w-8 h-8 rounded border-2 border-theme flex-shrink-0"
              style={{ backgroundColor: color.color_code }}
            />
            <input
              type="text"
              value={color.color_name}
              onChange={(e) => handleColorChange(color.id, 'color_name', e.target.value)}
              disabled={disabled}
              className="flex-1 px-2 py-1 text-sm bg-theme-secondary border border-theme rounded text-theme-primary disabled:opacity-60"
              placeholder="Color name"
            />
            <input
              type="color"
              value={color.color_code}
              onChange={(e) => handleColorChange(color.id, 'color_code', e.target.value)}
              disabled={disabled}
              className="w-10 h-8 rounded border border-theme cursor-pointer disabled:opacity-60"
            />
            {!disabled && (
              <button
                type="button"
                onClick={() => handleRemoveColor(color.id)}
                className="p-1 text-red-500 hover:text-red-700 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
        ))}

        {isAdding && (
          <div className="flex items-center gap-2 p-2 bg-accent-gold/10 border border-accent-gold/30 rounded-lg">
            <div
              className="w-8 h-8 rounded border-2 border-accent-gold flex-shrink-0"
              style={{ backgroundColor: newColor.color_code }}
            />
            <input
              type="text"
              value={newColor.color_name}
              onChange={(e) => setNewColor({ ...newColor, color_name: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleAddColor()}
              className="flex-1 px-2 py-1 text-sm bg-theme-primary border border-theme rounded text-theme-primary"
              placeholder="Color name"
              autoFocus
            />
            <input
              type="color"
              value={newColor.color_code}
              onChange={(e) => setNewColor({ ...newColor, color_code: e.target.value })}
              className="w-10 h-8 rounded border border-theme cursor-pointer"
            />
            <button
              type="button"
              onClick={handleAddColor}
              className="px-2 py-1 text-xs font-medium bg-accent-gold text-white rounded hover:bg-accent-goldDark transition-colors"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setNewColor({ color_name: '', color_code: '#000000' });
              }}
              className="p-1 text-theme-muted hover:text-theme-primary transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {colors.length === 0 && !isAdding && (
          <div className="flex items-center justify-center gap-2 p-4 bg-theme-primary border border-theme rounded-lg text-theme-muted">
            <Palette size={16} />
            <span className="text-sm">No colors added</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductColorManager;
