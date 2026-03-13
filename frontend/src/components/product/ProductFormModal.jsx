import { useState, useEffect } from 'react';
import { X, Package, Tag, DollarSign, Database, Plus, Check, RefreshCw, Globe, Layers, AlertCircle } from 'lucide-react';
import Modal from '../ui/Modal';
import CloudinaryUpload from '../common/CloudinaryUpload';
import DraftRecoveryBanner from '../common/DraftRecoveryBanner';
import ProductColorManager from './ProductColorManager';
import ProductImageManager from './ProductImageManager';
import CategoryStockAssigner from './CategoryStockAssigner';
import useFormDraft from '../../hooks/useFormDraft';
import { batchSaveColors, batchSaveImages } from '../../api/productColors';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import { useCurrency } from '../../context/CurrencyContext';

const inputClass =
  'w-full px-3 py-2.5 bg-theme-primary border border-theme rounded-lg text-sm text-theme-primary placeholder-theme-muted focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all';
const labelClass = 'block text-sm font-medium text-theme-secondary mb-1';
const sectionHeadClass =
  'text-xs font-semibold text-accent-gold uppercase tracking-wider pb-2 border-b border-theme';

const ProductFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  product = null,
  brands = [],
  categories = [],
  loading = false,
}) => {
  const { formatCurrency } = useCurrency();
  const isEditMode = !!product;
  const [editLoading, setEditLoading] = useState(false);

  const defaultFormData = {
    product_name: '',
    product_code: '',
    product_type: 'physical',
    description: '',
    brand_id: '',
    category_id: '',
    retail_price: '',
    cost_price: '',
    reorder_level: '10',
    track_inventory: true,
    has_variants: false,
    track_serial_numbers: false,
    track_batches: false,
    is_active: true,
    is_featured: false,
    image_url: '',
    tags: [],
    is_online_available: false,
    slug: '',
    short_description: '',
    has_colors: false,
    colors: [],
    images: [],
  };

  const [formData, setFormData] = useState(defaultFormData);

  // Draft auto-save
  const draftKey = isEditMode ? `product_edit_${product?.id}` : 'product_create';
  const { draftData, hasDraft, applyDraft, dismissDraft, saveDraft, clearDraft } = useFormDraft(draftKey, {
    label: isEditMode ? `Edit: ${product?.product_name || 'Product'}` : 'New Product',
    entityType: 'product',
    initialData: defaultFormData,
    isOpen,
  });

  // Auto-save form data on every change
  useEffect(() => {
    saveDraft(formData);
  }, [formData, saveDraft]);

  // Handle draft restoration
  const handleRestoreDraft = () => {
    if (draftData) {
      setFormData(prev => ({ ...prev, ...draftData }));
      applyDraft();
      toast.info('Draft restored successfully');
    }
  };

  const [errors, setErrors] = useState({});
  const [newTag, setNewTag] = useState('');

  const [allCategoriesList, setAllCategoriesList] = useState([]);
  const [listingCategories, setListingCategories] = useState([]);
  const [categoryAssignments, setCategoryAssignments] = useState([]);
  const [assignmentErrors, setAssignmentErrors] = useState({});
  const [listingLevelCats, setListingLevelCats] = useState([]);
  const [loadingListingLevel, setLoadingListingLevel] = useState(false);
  
  // Color inventory data
  const [colorInventory, setColorInventory] = useState([]);
  const [loadingColorInventory, setLoadingColorInventory] = useState(false);

  // Fetch all active categories
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const catsRes = await api.get('/categories');
        const allCats = Array.isArray(catsRes.data) ? catsRes.data : [];
        setAllCategoriesList(allCats.filter(c => c.is_active));
      } catch {
        setAllCategoriesList(categories.filter(c => c.is_active !== false));
      }
    };
    fetchCats();
  }, [categories]);

  
  // Fetch color inventory and existing colors/images when editing a product
  useEffect(() => {
    const fetchProductData = async () => {
      if (!product?.id || !isOpen) return;
      setLoadingColorInventory(true);
      try {
        const [inventoryRes, colorsRes, imagesRes] = await Promise.all([
          api.get(`/products/${product.id}/color-inventory`),
          api.get(`/products/${product.id}/colors`),
          api.get(`/products/${product.id}/images`),
        ]);
        
        setColorInventory(Array.isArray(inventoryRes.data) ? inventoryRes.data : []);
        
        // Load existing colors into form
        const existingColors = Array.isArray(colorsRes.data) ? colorsRes.data : [];
        if (existingColors.length > 0) {
          setFormData(prev => ({
            ...prev,
            colors: existingColors,
            has_colors: true,
          }));
        }
        
        // Load existing images into form
        const existingImages = Array.isArray(imagesRes.data) ? imagesRes.data : [];
        if (existingImages.length > 0) {
          setFormData(prev => ({
            ...prev,
            images: existingImages,
          }));
        }
      } catch (error) {
        console.error('Failed to load product data:', error);
        setColorInventory([]);
      } finally {
        setLoadingColorInventory(false);
      }
    };
    fetchProductData();
  }, [product?.id, isOpen]);

  useEffect(() => {
    if (product) {
      setFormData({
        product_name: product.product_name || '',
        product_code: product.product_code || '',
        product_type: product.product_type || 'physical',
        description: product.description || '',
        brand_id: product.brand_id || '',
        category_id: product.category_id || '',
        retail_price: product.retail_price || '',
        cost_price: product.cost_price || '',
        reorder_level: product.reorder_level || '10',
        track_inventory: product.track_inventory !== false,
        has_variants: product.has_variants || false,
        track_serial_numbers: product.track_serial_numbers || false,
        track_batches: product.track_batches || false,
        is_active: product.is_active !== false,
        is_featured: product.is_featured || false,
        image_url: product.image_url || '',
        tags: product.tags || [],
        is_online_available: product.is_online_available || false,
        slug: product.slug || '',
        short_description: product.short_description || '',
        has_colors: product.has_colors || false,
        colors: product.colors || [],
        images: product.images || [],
      });
    } else {
      setFormData({
        product_name: '',
        product_code: '',
        product_type: 'physical',
        description: '',
        brand_id: '',
        category_id: '',
        retail_price: '',
        cost_price: '',
        reorder_level: '10',
        track_inventory: true,
        has_variants: false,
        track_serial_numbers: false,
        track_batches: false,
        is_active: true,
        is_featured: false,
        image_url: '',
        tags: [],
        is_online_available: false,
        slug: '',
        short_description: '',
        has_colors: false,
        colors: [],
        images: [],
      });
    }
    setErrors({});
  }, [product, isOpen]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
      setNewTag('');
    }
  };

  const selectedCatObj = allCategoriesList.find(c => c.id === parseInt(formData.category_id));

  // Fetch listing-level categories within the selected root category's tree
  useEffect(() => {
    const fetchListingLevel = async () => {
      if (!formData.category_id) {
        setListingLevelCats([]);
        return;
      }
      setLoadingListingLevel(true);
      try {
        const res = await api.get(`/categories/${formData.category_id}/listing-level`);
        setListingLevelCats(Array.isArray(res.data) ? res.data : []);
      } catch {
        setListingLevelCats([]);
      } finally {
        setLoadingListingLevel(false);
      }
    };
    fetchListingLevel();
  }, [formData.category_id]);

  const isListingSelected = listingLevelCats.length > 0;
  // Check if the selected category has children (i.e. multi-level categorization)
  const categoryHasChildren = formData.category_id && allCategoriesList.some(
    c => c.parent_category_id === parseInt(formData.category_id)
  );
  const hasSubcategoryPricing = categoryAssignments.length > 0 && categoryAssignments.some(
    a => parseFloat(a.price_override) > 0 || parseFloat(a.cost_price_override) > 0
  );
  // Hide global pricing when category has subcategories AND any subcategory-level price is set
  const hideGlobalPricing = categoryHasChildren && hasSubcategoryPricing;

  // Root categories only (no parent) for the dropdown
  const rootCategories = allCategoriesList.filter(c => !c.parent_category_id);

  const validate = () => {
    const newErrors = {};
    if (!formData.product_name.trim()) newErrors.product_name = 'Product name is required';
    if (!formData.category_id) newErrors.category_id = 'Category is required';
    if (!formData.retail_price || parseFloat(formData.retail_price) <= 0) {
      if (!isListingSelected && !hideGlobalPricing) {
        newErrors.retail_price = 'Valid selling price is required';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      if (errors.retail_price && document.querySelector('.pricing-section')) {
        document.querySelector('.pricing-section').scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    // Block save if stock assignments are imbalanced
    if (Object.keys(assignmentErrors).length > 0) {
      toast.error('Stock allocation is imbalanced. Fix all levels before saving.');
      return;
    }
    
    setEditLoading(true);
    try {
      let mainRetailPrice = formData.retail_price;
      let mainCostPrice = formData.cost_price;

      if (hasSubcategoryPricing) {
        const firstPriced = categoryAssignments.find(a => parseFloat(a.price_override) > 0);
        const firstCost = categoryAssignments.find(a => parseFloat(a.cost_price_override) > 0);
        if (!mainRetailPrice && firstPriced) mainRetailPrice = firstPriced.price_override;
        if (!mainCostPrice && firstCost) mainCostPrice = firstCost.cost_price_override;
      }

      // Prepare payload with synced images and color flags
      const payload = {
        ...formData,
        retail_price: mainRetailPrice || 0,
        cost_price: mainCostPrice || 0,
        has_colors: formData.colors && formData.colors.length > 0,
        product_images: formData.images,
      };

      // Set primary image URL for backward compatibility
      if (formData.images && formData.images.length > 0) {
        const primaryImg = formData.images.find(img => img.is_primary) || formData.images[0];
        payload.image_url = primaryImg.image_url;
      }

      // First, submit the main product data
      const response = await onSubmit(payload);
      
      const isMultiple = response?.multiple;
      const createdProducts = isMultiple ? response.products : [product || response];
      
      for (let idx = 0; idx < createdProducts.length; idx++) {
        const p = createdProducts[idx];
        const productId = p?.id;
        if (!productId) continue;

        let updatedColorsMap = {};

        // For expanded products (idx > 0 during edit), the backend already copied
        // existing colors/images. We only need to save NEW colors/images for those.
        const isExpandedCopy = isMultiple && isEditMode && idx > 0;

        // Determine which colors to save for this product
        const colorsToSave = isExpandedCopy
          ? formData.colors.filter(c => c.isNew)
          : formData.colors;

        // Save colors if any
        if (colorsToSave && colorsToSave.length > 0) {
          try {
            const savedColors = await batchSaveColors(productId, colorsToSave);
            savedColors.forEach(sc => {
              if (sc._tempId) updatedColorsMap[sc._tempId] = sc.id;
            });
          } catch (error) {
            console.error('Error saving colors:', error);
            toast.error('Product saved but some colors failed to save');
          }
        }

        // Determine which images to save for this product
        const imagesToProcess = isExpandedCopy
          ? formData.images.filter(img => img.isNew)
          : formData.images;

        // Save images if any
        if (imagesToProcess && imagesToProcess.length > 0) {
          try {
            const imagesToSave = imagesToProcess.map(img => {
              let resolvedColorId = img.color_id;
              if (resolvedColorId && updatedColorsMap[resolvedColorId]) {
                resolvedColorId = updatedColorsMap[resolvedColorId];
              }
              if (typeof resolvedColorId === 'string' && resolvedColorId.startsWith('temp_')) {
                resolvedColorId = null;
              }
              return { ...img, color_id: resolvedColorId };
            });
            await batchSaveImages(productId, imagesToSave);
          } catch (error) {
            console.error('Error saving images:', error);
            toast.error('Product saved but some images failed to save');
          }
        }

        // Save category assignments (overwrite the auto-created ones with user data)
        if (categoryAssignments && categoryAssignments.length > 0) {
          try {
            const isDescendant = (childId, ancestorId, categoriesList) => {
              if (childId === ancestorId) return true;
              const child = categoriesList.find(c => c.id === childId);
              if (!child || !child.parent_category_id) return false;
              return isDescendant(child.parent_category_id, ancestorId, categoriesList);
            };

            let validAssignments = categoryAssignments;
            if (isMultiple) {
              validAssignments = categoryAssignments.filter(a =>
                isDescendant(a.category_id, p.category_id, allCategoriesList)
              );
            }
            if (validAssignments.length > 0) {
              await api.post(`/categories/assignments/${productId}`, {
                assignments: validAssignments,
              });
            }
          } catch (error) {
            console.error('Error saving category assignments:', error);
            toast.error(error.response?.data?.message || 'Failed to save product category assignments');
          }
        }
      }

      // Clear draft and close modal after all post-save work is complete
      clearDraft();
      onClose();
    } catch (error) {
      // Error already handled by onSubmit
    } finally {
      setEditLoading(false);
    }
  };

  const generateSlug = () => {
    const slug = formData.product_name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    handleChange('slug', slug);
  };

  const profitMargin =
    formData.retail_price && formData.cost_price && parseFloat(formData.retail_price) > 0
      ? (
          ((parseFloat(formData.retail_price) - parseFloat(formData.cost_price)) /
            parseFloat(formData.retail_price)) *
          100
        ).toFixed(1)
      : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Product' : 'Add New Product'}
      subtitle={isEditMode ? `Updating ${product.product_name}` : 'Fill in the details below'}
      size="lg"
      footer={
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading || editLoading}
            className="px-4 py-2 text-sm font-medium text-theme-secondary bg-theme-primary hover:bg-theme-tertiary border border-theme rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || editLoading}
            className="flex items-center gap-2 px-6 py-2 text-sm font-semibold bg-accent-gold text-white rounded-lg hover:bg-yellow-600 transition-colors shadow-sm disabled:opacity-60"
          >
            {(loading || editLoading) && <RefreshCw size={14} className="animate-spin" />}
            {isEditMode ? 'Save Changes' : 'Add Product'}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Draft Recovery Banner */}
        <DraftRecoveryBanner
          visible={hasDraft}
          label={isEditMode ? `Edit: ${product?.product_name}` : 'New Product'}
          updatedAt={draftData?._savedAt}
          onRestore={handleRestoreDraft}
          onDiscard={dismissDraft}
        />

        {/* Details Section */}
        <div className="space-y-4">
          <h3 className={sectionHeadClass}>Basic Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.product_name}
                onChange={(e) => handleChange('product_name', e.target.value)}
                placeholder="e.g. Premium Hardware X1"
                className={`${inputClass} ${errors.product_name ? 'border-red-500/60 focus:border-red-500' : ''}`}
              />
              {errors.product_name && (
                <p className="mt-1 text-xs text-red-500">{errors.product_name}</p>
              )}
            </div>
            <div>
              <label className={labelClass}>Product Code (SKU)</label>
              <input
                type="text"
                value={formData.product_code}
                onChange={(e) => handleChange('product_code', e.target.value)}
                placeholder="Auto-generated if empty"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Product Type</label>
            <select
              value={formData.product_type}
              onChange={(e) => handleChange('product_type', e.target.value)}
              className={inputClass}
            >
              <option value="physical">Physical</option>
              <option value="service">Service</option>
              <option value="digital">Digital</option>
              <option value="bundle">Bundle</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              placeholder="Enter product description..."
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Brand</label>
              <select
                value={formData.brand_id}
                onChange={(e) => handleChange('brand_id', e.target.value)}
                className={inputClass}
              >
                <option value="">Select Brand</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.brand_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>
                <span className="flex items-center gap-1">
                  <Layers size={12} />
                  Category <span className="text-red-500">*</span>
                </span>
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => handleChange('category_id', e.target.value)}
                className={`${inputClass} ${errors.category_id ? 'border-red-500/60 focus:border-red-500' : ''}`}
              >
                <option value="">Select Category</option>
                {rootCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.category_name}
                  </option>
                ))}
              </select>
              {errors.category_id && (
                <p className="mt-1 text-xs text-red-500">{errors.category_id}</p>
              )}
            </div>
          </div>

          {isListingSelected && (
            <div className="flex items-start gap-3 p-3 mt-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-semibold">
                  {isEditMode ? 'Product Expansion' : 'Multiple Products Generation'} ({listingLevelCats.length} products)
                </p>
                <p className="opacity-90 mt-0.5">
                  {isEditMode
                    ? 'This product will be expanded into separate products for each listing-level category. Colors, images, and settings will be copied to all:'
                    : 'The selected category tree has a listing level. When you submit, a separate product will be created for each listing-level category:'}
                </p>
                <ul className="mt-1.5 space-y-0.5 opacity-90">
                  {listingLevelCats.map(lc => {
                    const baseName = (formData.product_name || '').replace(/\s*\(.*\)\s*$/, '');
                    return (
                      <li key={lc.id} className="flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-blue-400 shrink-0" />
                        {baseName ? `${baseName} (${lc.category_name})` : lc.category_name}
                      </li>
                    );
                  })}
                </ul>
                <p className="opacity-75 mt-1.5 text-xs">
                  Each product will carry its respective selection categories for attributes.
                </p>
              </div>
            </div>
          )}
          {loadingListingLevel && formData.category_id && (
            <div className="flex items-center gap-2 p-3 mt-2 text-theme-muted text-sm">
              <RefreshCw size={14} className="animate-spin" />
              Checking category structure...
            </div>
          )}

          {/* Color Inventory Display (Read-only when editing) */}
          {isEditMode && colorInventory.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-accent-gold uppercase tracking-wider flex items-center gap-2">
                <Package size={12} />
                Current Stock by Color & Category
              </h4>
              <div className="border border-theme rounded-lg overflow-hidden">
                <div className="bg-theme-tertiary px-4 py-2 grid grid-cols-4 gap-2 text-xs font-semibold text-theme-muted uppercase">
                  <div>Color</div>
                  <div>Category</div>
                  <div className="text-right">Stock</div>
                  <div className="text-right">Price</div>
                </div>
                <div className="divide-y divide-theme max-h-64 overflow-y-auto">
                  {loadingColorInventory ? (
                    <div className="flex items-center justify-center py-8 gap-2 text-theme-muted">
                      <RefreshCw size={14} className="animate-spin" />
                      <span className="text-sm">Loading inventory...</span>
                    </div>
                  ) : (
                    colorInventory.map((item, idx) => (
                      <div key={idx} className="px-4 py-2.5 grid grid-cols-4 gap-2 text-sm hover:bg-theme-tertiary transition-colors">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded border border-theme flex-shrink-0"
                            style={{ backgroundColor: item.color_hex || '#ccc' }}
                            title={item.color_hex}
                          />
                          <span className="font-medium text-theme-primary truncate">{item.color_name || 'Default'}</span>
                        </div>
                        <div className="text-theme-secondary truncate" title={item.category_path}>
                          {item.category_name || '-'}
                        </div>
                        <div className="text-right font-semibold text-theme-primary">
                          {item.stock_allocated || 0}
                        </div>
                        <div className="text-right font-medium text-accent-gold">
                          {item.price_override ? formatCurrency(item.price_override) : '-'}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <p className="text-xs text-theme-muted italic">
                To modify stock allocation, use the Inventory Management page or Stock Movements.
              </p>
            </div>
          )}

          {/* Hierarchical Stock & Price Allocation */}
          {formData.category_id && (
            <CategoryStockAssigner
              categoryId={parseInt(formData.category_id)}
              productId={product?.id}
              totalStock={parseInt(formData.reorder_level) || 0}
              basePrice={parseFloat(formData.retail_price) || 0}
              onChange={(assignments, errors) => {
                setCategoryAssignments(assignments);
                setAssignmentErrors(errors);
              }}
            />
          )}
        </div>

        {/* Pricing Section — hidden when subcategory-level pricing is active */}
        {!hideGlobalPricing && (
          <div className="space-y-4 pricing-section">
            <h3 className={sectionHeadClass}>Pricing</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Selling Price <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.retail_price}
                onChange={(e) => handleChange('retail_price', e.target.value)}
                placeholder="0.00"
                className={`${inputClass} ${errors.retail_price ? 'border-red-500/60 focus:border-red-500' : ''}`}
              />
              {errors.retail_price && (
                <p className="mt-1 text-xs text-red-500">{errors.retail_price}</p>
              )}
            </div>
            <div>
              <label className={labelClass}>Cost Price</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.cost_price}
                onChange={(e) => handleChange('cost_price', e.target.value)}
                placeholder="0.00"
                className={inputClass}
              />
            </div>
          </div>

          {profitMargin !== null && (
            <div className="flex items-center justify-between px-4 py-3 bg-accent-gold/10 border border-accent-gold/30 rounded-lg">
              <span className="text-sm text-theme-secondary">Estimated Profit Margin</span>
              <span
                className={`text-sm font-semibold ${
                  parseFloat(profitMargin) >= 0 ? 'text-accent-gold' : 'text-red-500'
                }`}
              >
                {profitMargin}%
              </span>
            </div>
          )}
        </div>
        )}

        {/* Inventory Section */}
        <div className="space-y-4">
          <h3 className={sectionHeadClass}>Inventory Settings</h3>

          <div>
            <label className={labelClass}>Reorder Level</label>
            <input
              type="number"
              min="0"
              value={formData.reorder_level}
              onChange={(e) => handleChange('reorder_level', e.target.value)}
              placeholder="10"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { key: 'track_inventory', label: 'Track Inventory' },
              { key: 'has_variants', label: 'Has Variants' },
              { key: 'track_serial_numbers', label: 'Track Serial Numbers' },
              { key: 'track_batches', label: 'Track Batches' },
            ].map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => handleChange(opt.key, !formData[opt.key])}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all text-left ${
                  formData[opt.key]
                    ? 'bg-accent-gold/10 border-accent-gold/40'
                    : 'bg-theme-primary border-theme hover:border-accent-gold/20'
                }`}
              >
                <span
                  className={`text-sm font-medium ${
                    formData[opt.key] ? 'text-accent-gold' : 'text-theme-secondary'
                  }`}
                >
                  {opt.label}
                </span>
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all ${
                    formData[opt.key]
                      ? 'bg-accent-gold'
                      : 'border border-theme bg-theme-primary'
                  }`}
                >
                  {formData[opt.key] && (
                    <Check size={10} strokeWidth={3} className="text-white" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Online Store Section */}
        <div className="space-y-4">
          <h3 className={sectionHeadClass}>Online Store</h3>

          <button
            type="button"
            onClick={() => handleChange('is_online_available', !formData.is_online_available)}
            className={`flex items-center justify-between w-full p-3 rounded-lg border transition-all text-left ${
              formData.is_online_available
                ? 'bg-blue-500/10 border-blue-400/40'
                : 'bg-theme-primary border-theme hover:border-blue-400/20'
            }`}
          >
            <div className="flex items-center gap-2">
              <Globe size={15} className={formData.is_online_available ? 'text-blue-400' : 'text-theme-muted'} />
              <span className={`text-sm font-medium ${formData.is_online_available ? 'text-blue-400' : 'text-theme-secondary'}`}>
                Available in Online Store
              </span>
            </div>
            <div
              className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all ${
                formData.is_online_available ? 'bg-blue-500' : 'border border-theme bg-theme-primary'
              }`}
            >
              {formData.is_online_available && <Check size={10} strokeWidth={3} className="text-white" />}
            </div>
          </button>

          {formData.is_online_available && (
            <>
              <div>
                <label className={labelClass}>URL Slug</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => handleChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    placeholder="product-url-slug"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={generateSlug}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-theme-primary border border-theme rounded-lg hover:bg-theme-tertiary text-theme-secondary transition-colors whitespace-nowrap"
                  >
                    <RefreshCw size={13} />
                    Generate
                  </button>
                </div>
                <p className="mt-1 text-xs text-theme-muted">Used in the storefront URL, e.g. /products/product-url-slug</p>
              </div>

              <div>
                <label className={labelClass}>Short Description</label>
                <textarea
                  value={formData.short_description}
                  onChange={(e) => handleChange('short_description', e.target.value)}
                  rows={2}
                  placeholder="Brief summary shown on product cards in the store..."
                  className={`${inputClass} resize-none`}
                />
              </div>
            </>
          )}
        </div>

        {/* Media & Tags Section */}
        <div className="space-y-4">
          <h3 className={sectionHeadClass}>Media & Tags</h3>

          {/* Color Management */}
          <ProductColorManager
            productId={product?.id}
            colors={formData.colors}
            onColorsChange={(colors) => handleChange('colors', colors)}
            disabled={loading || editLoading}
          />

          {/* Image Management */}
          <ProductImageManager
            productId={product?.id}
            images={formData.images}
            colors={formData.colors}
            onImagesChange={(images) => handleChange('images', images)}
            disabled={loading || editLoading}
          />

          {/* Legacy single image upload (kept for backward compatibility) */}
          {formData.images.length === 0 && (
            <CloudinaryUpload
              category="products"
              label="Product Image (Legacy)"
              value={formData.image_url}
              onChange={(url) => handleChange('image_url', url)}
            />
          )}

          <div>
            <label className={labelClass}>Tags</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && (e.preventDefault(), handleAddTag())
                }
                placeholder="Type a tag and press Enter"
                className={inputClass}
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-theme-primary border border-theme rounded-lg hover:bg-theme-tertiary text-theme-secondary transition-colors whitespace-nowrap"
              >
                <Plus size={14} />
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mt-2 p-3 bg-theme-primary border border-theme rounded-lg min-h-14">
              {formData.tags.length === 0 ? (
                <span className="text-xs text-theme-muted self-center w-full text-center">
                  No tags added
                </span>
              ) : (
                formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 px-2.5 py-1 bg-accent-gold/10 border border-accent-gold/30 rounded-md text-xs font-medium text-accent-gold"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          tags: prev.tags.filter((t) => t !== tag),
                        }))
                      }
                      className="hover:text-red-500 transition-colors"
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ProductFormModal;
