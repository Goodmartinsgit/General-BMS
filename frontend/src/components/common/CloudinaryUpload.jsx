import React, { useCallback, useRef, useState } from 'react';
import { Upload, X, ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import api from '../../api/axios';

/**
 * CloudinaryUpload
 *
 * Props:
 *   category   – Cloudinary folder category ('branding' | 'products' | 'receipts' |
 *                'staff' | 'suppliers' | 'categories' | 'promotions')
 *   value      – current image URL string (single mode) or URL[] (multi mode)
 *   onChange   – called with new URL string or URL[]
 *   multiple   – set true to allow multiple images (default false)
 *   maxImages  – max images allowed when multiple=true (default 5)
 *   maxSizeMB  – max file size in MB (default 5)
 *   label      – optional label text
 *   className  – extra wrapper class
 */
const CloudinaryUpload = ({
    category,
    value,
    onChange,
    multiple = false,
    maxImages = 5,
    maxSizeMB = 5,
    label,
    className = '',
}) => {
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState('');
    const inputRef = useRef(null);

    // Normalise value to always be an array internally
    const images = multiple
        ? Array.isArray(value) ? value : (value ? [value] : [])
        : (value ? [value] : []);

    const canUploadMore = multiple ? images.length < maxImages : images.length === 0;

    const validateFile = (file) => {
        if (!file.type.startsWith('image/')) return 'Only image files are allowed';
        if (file.size / 1024 / 1024 > maxSizeMB) return `File size must be under ${maxSizeMB} MB`;
        return null;
    };

    const handleFiles = async (files) => {
        setError('');
        const fileArr = Array.from(files);

        if (!multiple && fileArr.length > 1) {
            setError('Only one image allowed');
            return;
        }
        if (multiple && images.length + fileArr.length > maxImages) {
            setError(`Maximum ${maxImages} images allowed`);
            return;
        }

        for (const file of fileArr) {
            const err = validateFile(file);
            if (err) { setError(err); return; }
        }

        setUploading(true);
        try {
            const uploaded = [];
            for (const file of fileArr) {
                const formData = new FormData();
                formData.append('file', file);
                const res = await api.post(`/upload/${category}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                uploaded.push(res.data.url);
            }

            if (multiple) {
                onChange([...images, ...uploaded]);
            } else {
                onChange(uploaded[0]);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = (index) => {
        if (multiple) {
            const next = images.filter((_, i) => i !== index);
            onChange(next);
        } else {
            onChange('');
        }
    };

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(e.type === 'dragenter' || e.type === 'dragover');
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
    }, [images]);

    return (
        <div className={`space-y-3 ${className}`}>
            {label && (
                <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider">
                    {label}
                </label>
            )}

            {/* Image previews */}
            {images.length > 0 && (
                <div className={`flex flex-wrap gap-3`}>
                    {images.map((url, i) => (
                        <div
                            key={i}
                            className="relative group rounded-lg overflow-hidden border border-theme bg-theme-tertiary"
                            style={{ width: multiple ? 96 : 128, height: multiple ? 96 : 128 }}
                        >
                            <img
                                src={url}
                                alt={`upload-${i}`}
                                className="w-full h-full object-contain"
                            />
                            {/* Primary badge for multi */}
                            {multiple && i === 0 && (
                                <span className="absolute top-1 left-1 text-[10px] font-semibold bg-accent-gold text-white px-1.5 py-0.5 rounded">
                                    Primary
                                </span>
                            )}
                            {/* Remove button */}
                            <button
                                type="button"
                                onClick={() => handleRemove(i)}
                                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Drop zone */}
            {canUploadMore && (
                <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => !uploading && inputRef.current?.click()}
                    className={`
                        relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed
                        cursor-pointer transition-all select-none
                        ${dragActive
                            ? 'border-accent-gold bg-accent-gold/5'
                            : 'border-theme hover:border-accent-gold/40 bg-theme-primary/40'
                        }
                        ${uploading ? 'opacity-60 pointer-events-none' : ''}
                    `}
                    style={{ minHeight: 100 }}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/*"
                        multiple={multiple}
                        className="hidden"
                        onChange={(e) => e.target.files?.length && handleFiles(e.target.files)}
                        disabled={uploading}
                    />
                    {uploading ? (
                        <>
                            <Loader2 size={24} className="animate-spin text-accent-gold" />
                            <span className="text-xs text-theme-muted">Uploading…</span>
                        </>
                    ) : (
                        <>
                            <div className="w-10 h-10 rounded-full bg-theme-tertiary flex items-center justify-center">
                                {dragActive
                                    ? <Upload size={20} className="text-accent-gold" />
                                    : <ImageIcon size={20} className="text-theme-muted" />
                                }
                            </div>
                            <p className="text-sm font-medium text-theme-secondary">
                                {dragActive ? 'Drop to upload' : 'Click or drag & drop'}
                            </p>
                            <p className="text-xs text-theme-muted">
                                PNG, JPG, GIF, WebP — up to {maxSizeMB} MB
                                {multiple && ` · ${images.length}/${maxImages}`}
                            </p>
                        </>
                    )}
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span className="text-xs">{error}</span>
                </div>
            )}
        </div>
    );
};

export default CloudinaryUpload;
