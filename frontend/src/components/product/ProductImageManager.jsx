import React, { useState } from 'react';
import { Plus, X, Image as ImageIcon, Star } from 'lucide-react';
import CloudinaryUpload from '../common/CloudinaryUpload';

const ProductImageManager = ({ productId, images, colors, onImagesChange, disabled = false }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newImage, setNewImage] = useState({ image_url: '', color_id: null, alt_text: '' });

  const handleAddImage = () => {
    if (!newImage.image_url) return;

    const imageToAdd = {
      id: Date.now(),
      image_url: newImage.image_url,
      color_id: newImage.color_id || null,
      is_primary: images.length === 0,
      display_order: images.length,
      alt_text: newImage.alt_text || '',
      isNew: true
    };

    onImagesChange([...images, imageToAdd]);
    setNewImage({ image_url: '', color_id: null, alt_text: '' });
    setIsAdding(false);
  };

  const handleRemoveImage = (imageId) => {
    const updatedImages = images.filter(img => img.id !== imageId);
    // If removed image was primary and there are other images, make first one primary
    if (images.find(img => img.id === imageId)?.is_primary && updatedImages.length > 0) {
      updatedImages[0].is_primary = true;
    }
    onImagesChange(updatedImages);
  };

  const handleSetPrimary = (imageId) => {
    onImagesChange(images.map(img => ({
      ...img,
      is_primary: img.id === imageId
    })));
  };

  const handleImageChange = (imageId, field, value) => {
    onImagesChange(images.map(img =>
      img.id === imageId ? { ...img, [field]: value } : img
    ));
  };

  const getColorName = (colorId) => {
    if (!colorId) return 'All Colors';
    const color = colors.find(c => c.id === colorId);
    return color ? color.color_name : 'Unknown';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-theme-secondary">
          Product Images
        </label>
        {!isAdding && !disabled && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-accent-gold hover:text-accent-goldDark transition-colors"
          >
            <Plus size={14} />
            Add Image
          </button>
        )}
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {images.map((image) => (
          <div
            key={image.id}
            className={`relative group rounded-lg overflow-hidden border-2 ${
              image.is_primary ? 'border-accent-gold' : 'border-theme'
            }`}
          >
            <div className="aspect-square bg-theme-tertiary flex items-center justify-center">
              {image.image_url ? (
                <img
                  src={image.image_url}
                  alt={image.alt_text || 'Product'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon className="w-8 h-8 text-theme-muted" />
              )}
            </div>

            {/* Overlay Controls */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
              {!image.is_primary && !disabled && (
                <button
                  type="button"
                  onClick={() => handleSetPrimary(image.id)}
                  className="px-2 py-1 text-xs bg-accent-gold text-white rounded hover:bg-accent-goldDark transition-colors flex items-center gap-1"
                >
                  <Star size={12} />
                  Set Primary
                </button>
              )}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveImage(image.id)}
                  className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors flex items-center gap-1"
                >
                  <X size={12} />
                  Remove
                </button>
              )}
            </div>

            {/* Primary Badge */}
            {image.is_primary && (
              <div className="absolute top-2 left-2 px-2 py-0.5 bg-accent-gold text-white text-xs font-semibold rounded flex items-center gap-1">
                <Star size={10} fill="white" />
                Primary
              </div>
            )}

            {/* Color Tag */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
              <select
                value={image.color_id || ''}
                onChange={(e) => handleImageChange(image.id, 'color_id', e.target.value ? parseInt(e.target.value) : null)}
                disabled={disabled}
                className="w-full px-2 py-1 text-xs bg-theme-primary border border-theme rounded text-theme-primary disabled:opacity-60"
              >
                <option value="">All Colors</option>
                {colors.map(color => (
                  <option key={color.id} value={color.id}>
                    {color.color_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Image Form */}
      {isAdding && (
        <div className="p-4 bg-accent-gold/10 border border-accent-gold/30 rounded-lg space-y-3">
          <CloudinaryUpload
            category="products"
            label="Upload Image"
            value={newImage.image_url}
            onChange={(url) => setNewImage({ ...newImage, image_url: url })}
          />

          <div>
            <label className="block text-xs font-medium text-theme-secondary mb-1">
              Color (Optional)
            </label>
            <select
              value={newImage.color_id || ''}
              onChange={(e) => setNewImage({ ...newImage, color_id: e.target.value ? parseInt(e.target.value) : null })}
              className="w-full px-3 py-2 text-sm bg-theme-primary border border-theme rounded text-theme-primary"
            >
              <option value="">All Colors</option>
              {colors.map(color => (
                <option key={color.id} value={color.id}>
                  {color.color_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-theme-secondary mb-1">
              Alt Text (Optional)
            </label>
            <input
              type="text"
              value={newImage.alt_text}
              onChange={(e) => setNewImage({ ...newImage, alt_text: e.target.value })}
              placeholder="Image description for accessibility"
              className="w-full px-3 py-2 text-sm bg-theme-primary border border-theme rounded text-theme-primary"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAddImage}
              disabled={!newImage.image_url}
              className="flex-1 px-3 py-2 text-sm font-medium bg-accent-gold text-white rounded hover:bg-accent-goldDark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Image
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setNewImage({ image_url: '', color_id: null, alt_text: '' });
              }}
              className="px-3 py-2 text-sm font-medium bg-theme-primary border border-theme text-theme-secondary rounded hover:bg-theme-tertiary transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {images.length === 0 && !isAdding && (
        <div className="flex items-center justify-center gap-2 p-8 bg-theme-primary border border-theme rounded-lg text-theme-muted">
          <ImageIcon size={20} />
          <span className="text-sm">No images added</span>
        </div>
      )}
    </div>
  );
};

export default ProductImageManager;
