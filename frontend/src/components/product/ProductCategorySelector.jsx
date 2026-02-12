import React, { useState, useEffect } from 'react';
import { Plus, X, Tag, Search } from 'lucide-react';
import { Button, Badge, Input, Modal } from '../ui';

/**
 * ProductCategorySelector Component
 * Multi-category selector with quick-add functionality
 */
const ProductCategorySelector = ({
  categoryType,
  selectedCategories = [],
  onChange,
  label,
  placeholder = 'Select categories...',
  allowQuickAdd = true,
  multiple = true,
  required = false,
  className = '',
}) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Fetch categories
  useEffect(() => {
    fetchCategories();
  }, [categoryType]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/categories/${categoryType}`);
      // const data = await response.json();

      // Mock data for now
      const mockCategories = {
        brands: [
          { id: '1', brand_name: 'Samsung' },
          { id: '2', brand_name: 'Apple' },
          { id: '3', brand_name: 'Dell' },
        ],
        categories: [
          { id: '1', category_name: 'Electronics' },
          { id: '2', category_name: 'Clothing' },
          { id: '3', category_name: 'Home & Garden' },
        ],
        sizes: [
          { id: '1', size_name: 'Small' },
          { id: '2', size_name: 'Medium' },
          { id: '3', size_name: 'Large' },
        ],
        use_cases: [
          { id: '1', use_case_name: 'Indoor' },
          { id: '2', use_case_name: 'Outdoor' },
          { id: '3', use_case_name: 'Industrial' },
        ],
      };

      setCategories(mockCategories[categoryType] || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get category name field based on type
  const getNameField = () => {
    const nameFields = {
      brands: 'brand_name',
      categories: 'category_name',
      sizes: 'size_name',
      use_cases: 'use_case_name',
      tile_types: 'tile_type_name',
      optional_categories: 'category_name',
    };
    return nameFields[categoryType] || 'name';
  };

  const nameField = getNameField();

  // Filter categories by search
  const filteredCategories = categories.filter((cat) =>
    cat[nameField].toLowerCase().includes(search.toLowerCase())
  );

  // Handle category selection
  const handleSelect = (category) => {
    if (multiple) {
      // Check if already selected
      const isSelected = selectedCategories.some((c) => c.id === category.id);
      if (isSelected) {
        // Remove from selection
        onChange(selectedCategories.filter((c) => c.id !== category.id));
      } else {
        // Add to selection
        onChange([...selectedCategories, category]);
      }
    } else {
      // Single selection
      onChange([category]);
      setShowDropdown(false);
    }
  };

  // Handle quick add
  const handleQuickAdd = async () => {
    if (!newCategoryName.trim()) return;

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/categories/${categoryType}`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ [nameField]: newCategoryName }),
      // });
      // const newCategory = await response.json();

      // Mock new category
      const newCategory = {
        id: Date.now().toString(),
        [nameField]: newCategoryName,
      };

      // Add to categories list
      setCategories([...categories, newCategory]);

      // Auto-select new category
      if (multiple) {
        onChange([...selectedCategories, newCategory]);
      } else {
        onChange([newCategory]);
      }

      // Reset form
      setNewCategoryName('');
      setShowQuickAdd(false);
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  // Remove selected category
  const handleRemove = (categoryId) => {
    onChange(selectedCategories.filter((c) => c.id !== categoryId));
  };

  const isSelected = (categoryId) => {
    return selectedCategories.some((c) => c.id === categoryId);
  };

  return (
    <div className={className}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Selected Categories */}
      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedCategories.map((category) => (
            <Badge key={category.id} variant="primary" className="flex items-center gap-1">
              {category[nameField]}
              <button
                onClick={() => handleRemove(category.id)}
                className="ml-1 hover:text-red-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Selector */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white hover:border-gray-400"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">
              {selectedCategories.length === 0
                ? placeholder
                : multiple
                ? `${selectedCategories.length} selected`
                : selectedCategories[0][nameField]}
            </span>
            <Tag className="w-4 h-4 text-gray-400" />
          </div>
        </button>

        {/* Dropdown */}
        {showDropdown && (
          <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-80 overflow-hidden">
            {/* Search */}
            <div className="p-2 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Category List */}
            <div className="max-h-60 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
              ) : filteredCategories.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  No categories found
                  {search && ` for "${search}"`}
                </div>
              ) : (
                <div className="py-1">
                  {filteredCategories.map((category) => {
                    const selected = isSelected(category.id);
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => handleSelect(category)}
                        className={`
                          w-full px-4 py-2 text-left text-sm transition-colors
                          ${selected
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                          }
                        `.trim()}
                      >
                        <div className="flex items-center justify-between">
                          <span>{category[nameField]}</span>
                          {selected && multiple && (
                            <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Add Button */}
            {allowQuickAdd && (
              <div className="p-2 border-t border-gray-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowQuickAdd(true)}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add New {label || 'Category'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Add Modal */}
      <Modal
        isOpen={showQuickAdd}
        onClose={() => {
          setShowQuickAdd(false);
          setNewCategoryName('');
        }}
        title={`Add New ${label || 'Category'}`}
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder={`Enter ${label?.toLowerCase() || 'category'} name`}
            required
            autoFocus
          />

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowQuickAdd(false);
                setNewCategoryName('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleQuickAdd} disabled={!newCategoryName.trim()}>
              Add {label || 'Category'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};

export default ProductCategorySelector;
