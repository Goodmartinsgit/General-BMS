import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Tag, Briefcase, Ruler, Package } from 'lucide-react';
import {
  Button,
  Tabs,
  DataTable,
  Modal,
  Input,
  ConfirmDialog,
  Badge,
  EmptyState,
  LoadingSpinner,
} from '../components/ui';

/**
 * CategoryManagement Page
 * Manage all product categorization: brands, categories, sizes, use cases, etc.
 */
const CategoryManagement = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);

  // Category types data
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [useCases, setUseCases] = useState([]);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentCategoryType, setCurrentCategoryType] = useState('brands');

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Fetch all categories on mount
  useEffect(() => {
    fetchAllCategories();
  }, []);

  const fetchAllCategories = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchBrands(),
        fetchCategories(),
        fetchSizes(),
        fetchUseCases(),
      ]);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBrands = async () => {
    // TODO: Replace with actual API call
    // const response = await fetch('/api/categories/brands');
    // const data = await response.json();
    setBrands([
      { id: '1', brand_name: 'Samsung', description: 'Electronics manufacturer', product_count: 45, is_active: true, created_at: '2026-01-15' },
      { id: '2', brand_name: 'Apple', description: 'Technology company', product_count: 32, is_active: true, created_at: '2026-01-16' },
      { id: '3', brand_name: 'Dell', description: 'Computer hardware', product_count: 28, is_active: true, created_at: '2026-01-17' },
    ]);
  };

  const fetchCategories = async () => {
    // TODO: Replace with actual API call
    setCategories([
      { id: '1', category_name: 'Electronics', description: 'Electronic devices and accessories', product_count: 78, is_active: true, created_at: '2026-01-10' },
      { id: '2', category_name: 'Furniture', description: 'Office and home furniture', product_count: 34, is_active: true, created_at: '2026-01-11' },
      { id: '3', category_name: 'Office Supplies', description: 'Stationery and supplies', product_count: 56, is_active: true, created_at: '2026-01-12' },
    ]);
  };

  const fetchSizes = async () => {
    // TODO: Replace with actual API call
    setSizes([
      { id: '1', size_name: 'Small', description: 'Small size products', product_count: 23, is_active: true, created_at: '2026-01-18' },
      { id: '2', size_name: 'Medium', description: 'Medium size products', product_count: 45, is_active: true, created_at: '2026-01-19' },
      { id: '3', size_name: 'Large', description: 'Large size products', product_count: 18, is_active: true, created_at: '2026-01-20' },
    ]);
  };

  const fetchUseCases = async () => {
    // TODO: Replace with actual API call
    setUseCases([
      { id: '1', use_case_name: 'Indoor', description: 'Indoor use products', product_count: 67, is_active: true, created_at: '2026-01-21' },
      { id: '2', use_case_name: 'Outdoor', description: 'Outdoor use products', product_count: 34, is_active: true, created_at: '2026-01-22' },
      { id: '3', use_case_name: 'Industrial', description: 'Industrial use products', product_count: 12, is_active: true, created_at: '2026-01-23' },
    ]);
  };

  const handleCreate = (categoryType) => {
    setCurrentCategoryType(categoryType);
    setSelectedItem(null);
    setShowModal(true);
  };

  const handleEdit = (item, categoryType) => {
    setCurrentCategoryType(categoryType);
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleDelete = (item, categoryType) => {
    setCurrentCategoryType(categoryType);
    setItemToDelete(item);
    setShowDeleteConfirm(true);
  };

  const handleSubmit = async (formData) => {
    try {
      if (selectedItem) {
        // Update
        // TODO: Replace with actual API call
        // await fetch(`/api/categories/${currentCategoryType}/${selectedItem.id}`, {
        //   method: 'PUT',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(formData),
        // });
      } else {
        // Create
        // TODO: Replace with actual API call
        // await fetch(`/api/categories/${currentCategoryType}`, {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(formData),
        // });
      }

      await fetchAllCategories();
      setShowModal(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const confirmDelete = async () => {
    try {
      // TODO: Replace with actual API call
      // await fetch(`/api/categories/${currentCategoryType}/${itemToDelete.id}`, {
      //   method: 'DELETE',
      // });

      await fetchAllCategories();
      setShowDeleteConfirm(false);
      setItemToDelete(null);
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  // Tab configuration
  const tabs = [
    {
      label: 'Brands',
      icon: Briefcase,
      content: (
        <CategorySection
          title="Brands"
          description="Manage product brands and manufacturers"
          data={brands}
          categoryType="brands"
          nameField="brand_name"
          onAdd={() => handleCreate('brands')}
          onEdit={(item) => handleEdit(item, 'brands')}
          onDelete={(item) => handleDelete(item, 'brands')}
          loading={loading}
        />
      ),
    },
    {
      label: 'Categories',
      icon: Tag,
      content: (
        <CategorySection
          title="Product Categories"
          description="Manage product categories and classifications"
          data={categories}
          categoryType="categories"
          nameField="category_name"
          onAdd={() => handleCreate('categories')}
          onEdit={(item) => handleEdit(item, 'categories')}
          onDelete={(item) => handleDelete(item, 'categories')}
          loading={loading}
        />
      ),
    },
    {
      label: 'Sizes',
      icon: Ruler,
      content: (
        <CategorySection
          title="Product Sizes"
          description="Manage product size classifications"
          data={sizes}
          categoryType="sizes"
          nameField="size_name"
          onAdd={() => handleCreate('sizes')}
          onEdit={(item) => handleEdit(item, 'sizes')}
          onDelete={(item) => handleDelete(item, 'sizes')}
          loading={loading}
        />
      ),
    },
    {
      label: 'Use Cases',
      icon: Package,
      content: (
        <CategorySection
          title="Product Use Cases"
          description="Manage product use case classifications"
          data={useCases}
          categoryType="use_cases"
          nameField="use_case_name"
          onAdd={() => handleCreate('use_cases')}
          onEdit={(item) => handleEdit(item, 'use_cases')}
          onDelete={(item) => handleDelete(item, 'use_cases')}
          loading={loading}
        />
      ),
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Category Management</h1>
        <p className="text-gray-600">Organize your products with brands, categories, and classifications</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <Tabs tabs={tabs} />
      </div>

      {/* Category Form Modal */}
      <CategoryFormModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedItem(null);
        }}
        onSubmit={handleSubmit}
        item={selectedItem}
        categoryType={currentCategoryType}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setItemToDelete(null);
        }}
        onConfirm={confirmDelete}
        title={`Delete ${currentCategoryType.slice(0, -1)}`}
        message={`Are you sure you want to delete this ${currentCategoryType.slice(0, -1)}? This may affect ${itemToDelete?.product_count || 0} products.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

// Category Section Component
const CategorySection = ({
  title,
  description,
  data,
  categoryType,
  nameField,
  onAdd,
  onEdit,
  onDelete,
  loading,
}) => {
  const columns = [
    {
      key: nameField,
      label: 'Name',
      render: (item) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{item[nameField]}</span>
          {!item.is_active && <Badge variant="default" size="sm">Inactive</Badge>}
        </div>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (item) => (
        <span className="text-sm text-gray-600">{item.description || '—'}</span>
      ),
    },
    {
      key: 'product_count',
      label: 'Products',
      render: (item) => (
        <Badge variant="primary">{item.product_count || 0}</Badge>
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (item) => (
        <span className="text-sm text-gray-600">
          {new Date(item.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            icon={Edit}
            onClick={() => onEdit(item)}
            title="Edit"
          />
          <Button
            size="sm"
            variant="ghost"
            icon={Trash2}
            onClick={() => onDelete(item)}
            className="text-red-600 hover:bg-red-50"
            title="Delete"
          />
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={onAdd}>
          Add {categoryType.slice(0, -1)}
        </Button>
      </div>

      {/* Data Table */}
      {data.length === 0 ? (
        <EmptyState
          icon={Tag}
          title={`No ${categoryType} found`}
          description={`Create your first ${categoryType.slice(0, -1)} to get started`}
          action={
            <Button variant="primary" icon={Plus} onClick={onAdd}>
              Add {categoryType.slice(0, -1)}
            </Button>
          }
        />
      ) : (
        <DataTable columns={columns} data={data} />
      )}
    </div>
  );
};

// Category Form Modal Component
const CategoryFormModal = ({ isOpen, onClose, onSubmit, item, categoryType }) => {
  const isEditMode = !!item;

  const getNameField = () => {
    const nameFields = {
      brands: 'brand_name',
      categories: 'category_name',
      sizes: 'size_name',
      use_cases: 'use_case_name',
    };
    return nameFields[categoryType] || 'name';
  };

  const nameField = getNameField();

  const [formData, setFormData] = useState({
    [nameField]: '',
    description: '',
    is_active: true,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (item) {
      setFormData({
        [nameField]: item[nameField] || '',
        description: item.description || '',
        is_active: item.is_active !== false,
      });
    } else {
      setFormData({
        [nameField]: '',
        description: '',
        is_active: true,
      });
    }
  }, [item, nameField]);

  const validate = () => {
    const newErrors = {};

    if (!formData[nameField]?.trim()) {
      newErrors[nameField] = 'Name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit(formData);
    }
  };

  const getTitle = () => {
    const singular = categoryType.slice(0, -1);
    return isEditMode ? `Edit ${singular}` : `Add New ${singular}`;
  };

  const getLabel = () => {
    const labels = {
      brand_name: 'Brand Name',
      category_name: 'Category Name',
      size_name: 'Size Name',
      use_case_name: 'Use Case Name',
    };
    return labels[nameField] || 'Name';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getTitle()}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {isEditMode ? 'Update' : 'Create'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label={getLabel()}
          value={formData[nameField]}
          onChange={(e) => setFormData({ ...formData, [nameField]: e.target.value })}
          error={errors[nameField]}
          required
          placeholder={`Enter ${getLabel().toLowerCase()}`}
        />

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Optional description"
          />
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">Active</span>
        </label>
      </div>
    </Modal>
  );
};

export default CategoryManagement;
