/**
 * useFavicon – dynamically generates a circular favicon from a URL or accent colour.
 *
 * If a logoUrl is provided it is drawn (cropped to a circle) into an offscreen
 * canvas and set as the page favicon.  When no URL is available it falls back to
 * rendering the first letter of `fallbackText` on the accent colour.
 *
 * The hook is intentionally plain JS (no React state) so it can be called from
 * context providers without causing render loops.
 */

const FAVICON_SIZE = 64; // px – produces crisp 64 × 64 favicon

/**
 * Draw a circular canvas favicon and inject it into the document <head>.
 * @param {string|null} logoUrl   - Absolute URL of the logo image (may be null)
 * @param {string}      accent    - CSS hex colour used for the background fallback
 * @param {string}      text      - Fallback initial letter shown when no logo
 */
export function setFavicon(logoUrl, accent = '#D4AF37', text = 'B') {
  const canvas = document.createElement('canvas');
  canvas.width = FAVICON_SIZE;
  canvas.height = FAVICON_SIZE;
  const ctx = canvas.getContext('2d');

  const r = FAVICON_SIZE / 2;

  // Clip everything to a circle
  ctx.beginPath();
  ctx.arc(r, r, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  if (logoUrl) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Fill circle with white background first
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, FAVICON_SIZE, FAVICON_SIZE);

      // Cover-fit: scale image to fill the circle
      const scale = Math.max(FAVICON_SIZE / img.width, FAVICON_SIZE / img.height);
      const sw = img.width * scale;
      const sh = img.height * scale;
      const sx = (FAVICON_SIZE - sw) / 2;
      const sy = (FAVICON_SIZE - sh) / 2;

      ctx.drawImage(img, sx, sy, sw, sh);
      _applyCanvas(canvas);
    };
    img.onerror = () => {
      // Fall back to text favicon on load error
      _drawTextFavicon(ctx, r, accent, text);
      _applyCanvas(canvas);
    };
    img.src = logoUrl;
  } else {
    _drawTextFavicon(ctx, r, accent, text);
    _applyCanvas(canvas);
  }
}

function _drawTextFavicon(ctx, r, accent, text) {
  // Background fill
  ctx.fillStyle = accent || '#D4AF37';
  ctx.fillRect(0, 0, FAVICON_SIZE, FAVICON_SIZE);

  // Initial letter
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(r * 1.1)}px 'Inter', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText((text || 'B').charAt(0).toUpperCase(), r, r + 1);
}

function _applyCanvas(canvas) {
  const dataUrl = canvas.toDataURL('image/png');

  // Remove all existing favicon links
  const existing = document.querySelectorAll("link[rel~='icon']");
  existing.forEach(el => el.parentNode?.removeChild(el));

  // Insert new one
  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/png';
  link.href = dataUrl;
  document.head.appendChild(link);
}
