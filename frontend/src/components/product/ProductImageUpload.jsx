import React, { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { Button, LoadingSpinner } from '../ui';

/**
 * ProductImageUpload Component
 * Handles image upload to Cloudinary with preview and management
 */
const ProductImageUpload = ({
  images = [],
  onChange,
  maxImages = 5,
  maxSizeMB = 5,
  className = '',
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');

  // Validate file
  const validateFile = (file) => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return 'Please upload an image file';
    }

    // Check file size
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      return `Image size must be less than ${maxSizeMB}MB`;
    }

    return null;
  };

  // Handle file upload
  const handleUpload = async (files) => {
    setError('');

    // Check max images limit
    if (images.length + files.length > maxImages) {
      setError(`Maximum ${maxImages} images allowed`);
      return;
    }

    setUploading(true);

    try {
      const uploadedUrls = [];

      for (const file of files) {
        // Validate file
        const validationError = validateFile(file);
        if (validationError) {
          setError(validationError);
          continue;
        }

        // Create FormData
        const formData = new FormData();
        formData.append('image', file);

        // TODO: Replace with actual Cloudinary upload endpoint
        // const response = await fetch('/api/upload/image', {
        //   method: 'POST',
        //   body: formData,
        // });
        // const data = await response.json();
        // uploadedUrls.push(data.url);

        // Mock upload (simulate delay)
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Mock URL (replace with actual Cloudinary URL)
        const mockUrl = URL.createObjectURL(file);
        uploadedUrls.push(mockUrl);
      }

      // Update images array
      onChange([...images, ...uploadedUrls]);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload images. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Handle file input change
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleUpload(files);
    }
  };

  // Handle drag and drop
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const files = Array.from(e.dataTransfer.files || []);
      if (files.length > 0) {
        handleUpload(files);
      }
    },
    [images, onChange]
  );

  // Remove image
  const handleRemove = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  // Set as primary (move to first position)
  const setAsPrimary = (index) => {
    const newImages = [...images];
    const [primaryImage] = newImages.splice(index, 1);
    newImages.unshift(primaryImage);
    onChange(newImages);
  };

  const canUploadMore = images.length < maxImages;

  return (
    <div className={className}>
      {/* Image Previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
          {images.map((url, index) => (
            <div
              key={index}
              className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group"
            >
              <img
                src={url}
                alt={`Product ${index + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Primary Badge */}
              {index === 0 && (
                <div className="absolute top-2 left-2">
                  <span className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded">
                    Primary
                  </span>
                </div>
              )}

              {/* Actions Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {index !== 0 && (
                  <button
                    onClick={() => setAsPrimary(index)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                  >
                    Set Primary
                  </button>
                )}
                <button
                  onClick={() => handleRemove(index)}
                  className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {canUploadMore && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center transition-all
            ${dragActive
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
            }
            ${uploading ? 'opacity-50 pointer-events-none' : ''}
          `.trim()}
        >
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploading}
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <LoadingSpinner size="lg" />
              <p className="text-sm text-gray-600">Uploading images...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                {dragActive ? (
                  <Upload className="w-8 h-8 text-blue-600" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700">
                  {dragActive ? 'Drop images here' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG, GIF up to {maxSizeMB}MB ({images.length}/{maxImages} images)
                </p>
              </div>

              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Choose Files
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Helper Text */}
      {!error && images.length > 0 && (
        <p className="mt-3 text-xs text-gray-500">
          Tip: The first image will be used as the primary product image. Hover over images to reorder or remove.
        </p>
      )}
    </div>
  );
};

export default ProductImageUpload;
