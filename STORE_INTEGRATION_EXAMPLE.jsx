import React, { useState, useEffect } from 'react';
import { ShoppingCart, Heart, Share2, Check, X } from 'lucide-react';
import {
  getProductColors,
  getProductImages,
  getProductColorInventory,
  getPrimaryImageForColor,
  getColorStockAvailable,
} from '../api/productColors';

/**
 * Store Product Display Component
 * Demonstrates integration of color-specific images and stock
 * 
 * This is a SAMPLE component for the store frontend
 * Location: C:\Users\DELL XPS\Desktop\One Manager\platform\apps\store
 */
const StoreProductDisplay = ({ productId, branchId }) => {
  const [product, setProduct] = useState(null);
  const [colors, setColors] = useState([]);
  const [images, setImages] = useState([]);
  const [colorInventory, setColorInventory] = useState([]);
  const [selectedColorId, setSelectedColorId] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProductData();
  }, [productId, branchId]);

  const loadProductData = async () => {
    try {
      setLoading(true);
      
      // Fetch product details, colors, images, and inventory in parallel
      const [productRes, colorsData, imagesData, inventoryData] = await Promise.all([
        fetch(`/api/products/${productId}`).then(r => r.json()),
        getProductColors(productId),
        getProductImages(productId),
        getProductColorInventory(productId, branchId),
      ]);

      setProduct(productRes);
      setColors(colorsData.filter(c => c.is_active));
      setImages(imagesData);
      setColorInventory(inventoryData);

      // Auto-select first available color
      if (colorsData.length > 0) {
        const firstAvailable = colorsData.find(c => 
          c.is_active && getColorStockAvailable(inventoryData, c.id, branchId) > 0
        );
        setSelectedColorId(firstAvailable?.id || colorsData[0].id);
      }
    } catch (error) {
      console.error('Error loading product:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedColor = colors.find(c => c.id === selectedColorId);
  const displayImage = getPrimaryImageForColor(images, selectedColorId);
  const availableStock = selectedColorId 
    ? getColorStockAvailable(colorInventory, selectedColorId, branchId)
    : product?.total_stock || 0;
  const isInStock = availableStock > 0;
  const maxQuantity = Math.min(availableStock, 10); // Limit to 10 per order

  const handleAddToCart = () => {
    if (!isInStock) return;
    
    const cartItem = {
      product_id: productId,
      product_name: product.product_name,
      color_id: selectedColorId,
      color_name: selectedColor?.color_name,
      quantity: quantity,
      price: product.retail_price,
      image_url: displayImage?.image_url,
    };

    // Add to cart logic here
    console.log('Adding to cart:', cartItem);
    // Example: addToCart(cartItem);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-gold" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-gray-600">Product not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left: Product Images */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
            {displayImage ? (
              <img
                src={displayImage.image_url}
                alt={displayImage.alt_text || product.product_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No Image Available
              </div>
            )}
          </div>

          {/* Thumbnail Gallery */}
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images
                .filter(img => img.color_id === selectedColorId || img.color_id === null)
                .slice(0, 4)
                .map((img) => (
                  <button
                    key={img.id}
                    className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-transparent hover:border-accent-gold transition-colors"
                  >
                    <img
                      src={img.image_url}
                      alt={img.alt_text || ''}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* Right: Product Details */}
        <div className="space-y-6">
          {/* Product Name & Price */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {product.product_name}
            </h1>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-accent-gold">
                ${product.retail_price?.toFixed(2)}
              </span>
              {product.cost_price && (
                <span className="text-lg text-gray-500 line-through">
                  ${product.cost_price?.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          {/* Stock Status */}
          <div className="flex items-center gap-2">
            {isInStock ? (
              <>
                <Check className="w-5 h-5 text-green-600" />
                <span className="text-green-600 font-medium">
                  In Stock ({availableStock} available)
                </span>
              </>
            ) : (
              <>
                <X className="w-5 h-5 text-red-600" />
                <span className="text-red-600 font-medium">Out of Stock</span>
              </>
            )}
          </div>

          {/* Color Selector */}
          {colors.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Color: {selectedColor?.color_name}
              </label>
              <div className="flex flex-wrap gap-3">
                {colors.map((color) => {
                  const colorStock = getColorStockAvailable(colorInventory, color.id, branchId);
                  const isAvailable = colorStock > 0;
                  const isSelected = selectedColorId === color.id;

                  return (
                    <button
                      key={color.id}
                      onClick={() => isAvailable && setSelectedColorId(color.id)}
                      disabled={!isAvailable}
                      className={`relative w-12 h-12 rounded-full border-2 transition-all ${
                        isSelected
                          ? 'border-accent-gold ring-2 ring-accent-gold ring-offset-2'
                          : isAvailable
                          ? 'border-gray-300 hover:border-gray-400'
                          : 'border-gray-200 opacity-50 cursor-not-allowed'
                      }`}
                      style={{ backgroundColor: color.color_code }}
                      title={`${color.color_name}${!isAvailable ? ' (Out of Stock)' : ''}`}
                    >
                      {!isAvailable && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-full h-0.5 bg-red-500 rotate-45" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          {isInStock && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max={maxQuantity}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.min(maxQuantity, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-20 h-10 text-center border border-gray-300 rounded-lg"
                />
                <button
                  onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                  className="w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  +
                </button>
                <span className="text-sm text-gray-500">
                  Max: {maxQuantity}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleAddToCart}
              disabled={!isInStock}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-accent-gold text-white rounded-lg font-semibold hover:bg-accent-goldDark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-5 h-5" />
              Add to Cart
            </button>
            <button className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Heart className="w-5 h-5" />
            </button>
            <button className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          {/* Product Description */}
          {product.description && (
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                {product.description}
              </p>
            </div>
          )}

          {/* Product Details */}
          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold mb-3">Product Details</h3>
            <dl className="space-y-2">
              {product.product_code && (
                <div className="flex justify-between">
                  <dt className="text-gray-600">SKU:</dt>
                  <dd className="font-medium">{product.product_code}</dd>
                </div>
              )}
              {product.brand_name && (
                <div className="flex justify-between">
                  <dt className="text-gray-600">Brand:</dt>
                  <dd className="font-medium">{product.brand_name}</dd>
                </div>
              )}
              {product.category_name && (
                <div className="flex justify-between">
                  <dt className="text-gray-600">Category:</dt>
                  <dd className="font-medium">{product.category_name}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreProductDisplay;
