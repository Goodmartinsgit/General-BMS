/**
 * Receipt Image Cache
 * Simple in-memory cache for rendered receipt images to avoid re-rendering PDF.js
 */

const CACHE_MAX_SIZE = 20;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const cache = new Map();

/**
 * Get a cached receipt image URL
 * @param {string|number} saleId - Sale ID
 * @returns {string|null} Cached image URL or null
 */
export const getCachedReceiptImage = (saleId) => {
    const key = String(saleId);
    const entry = cache.get(key);

    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > CACHE_TTL) {
        // Revoke the blob URL and remove from cache
        if (entry.url && entry.url.startsWith('blob:')) {
            URL.revokeObjectURL(entry.url);
        }
        cache.delete(key);
        return null;
    }

    return entry.url;
};

/**
 * Cache a receipt image URL
 * @param {string|number} saleId - Sale ID
 * @param {string} imageUrl - Image URL (blob URL)
 */
export const cacheReceiptImage = (saleId, imageUrl) => {
    const key = String(saleId);

    // Evict oldest entries if cache is full
    if (cache.size >= CACHE_MAX_SIZE) {
        const oldestKey = cache.keys().next().value;
        const oldEntry = cache.get(oldestKey);
        if (oldEntry && oldEntry.url && oldEntry.url.startsWith('blob:')) {
            URL.revokeObjectURL(oldEntry.url);
        }
        cache.delete(oldestKey);
    }

    cache.set(key, {
        url: imageUrl,
        timestamp: Date.now()
    });
};

/**
 * Clear entire receipt cache
 */
export const clearReceiptCache = () => {
    for (const [, entry] of cache) {
        if (entry.url && entry.url.startsWith('blob:')) {
            URL.revokeObjectURL(entry.url);
        }
    }
    cache.clear();
};

export default {
    getCachedReceiptImage,
    cacheReceiptImage,
    clearReceiptCache
};
