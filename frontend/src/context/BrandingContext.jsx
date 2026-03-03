import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useTheme } from './ThemeContext';

const BrandingContext = createContext();

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
};

const BRANDING_CACHE_KEY = 'bms-branding-cache';

const defaultBranding = {
  company_name: 'General BMS',
  logo_url: null,
  logo_type: 'icon_text',
  logo_icon_text: 'BMS',
  sidebar_name_size: 'medium',
  accent_color: '#D4AF37',
  primary_color: '#D4AF37',
  secondary_color: '#1a1a2e',
  sidebar_bg_color: null,
  navbar_bg_color: null,
  button_color: null,
  background_color: null,
  font_family: 'Inter',
  hover_color: '#C5A353',
  active_text_color: '#000000',
};

// Read cached branding from localStorage (instant, no network)
const getCachedBranding = () => {
  try {
    const cached = localStorage.getItem(BRANDING_CACHE_KEY);
    if (cached) return { ...defaultBranding, ...JSON.parse(cached) };
  } catch { /* corrupt cache — ignore */ }
  return defaultBranding;
};

const saveBrandingCache = (config) => {
  try {
    localStorage.setItem(BRANDING_CACHE_KEY, JSON.stringify(config));
  } catch { /* storage full — ignore */ }
};

const applyBrandColors = (config, theme, currentTheme) => {
  const root = document.documentElement;

  const accent = config.accent_color || '#D4AF37';
  root.style.setProperty('--color-accent', accent);
  root.style.setProperty('--color-accent-light', '#FFD700');
  root.style.setProperty('--color-accent-dark', config.hover_color || '#C5A353');
  root.style.setProperty('--color-active-text', config.active_text_color || '#000000');

  const useDarkTheme = theme !== 'light' && currentTheme;
  if (useDarkTheme) {
    root.style.setProperty('--retail-primary', config.sidebar_bg_color || currentTheme.preview.bg);
    root.style.setProperty('--retail-accent', accent);
    root.style.setProperty('--retail-border', currentTheme.preview.card);
    root.style.setProperty('--retail-hover', currentTheme.preview.card);
    root.style.setProperty('--retail-text', '#E5E5E5');
  } else {
    root.style.setProperty('--retail-primary', config.sidebar_bg_color || '#FFFFFF');
    root.style.setProperty('--retail-accent', accent);
    root.style.setProperty('--retail-border', '#E5E7EB');
    root.style.setProperty('--retail-hover', '#F3F4F6');
    root.style.setProperty('--retail-text', '#1F2937');
  }

  if (config.font_family && config.font_family !== 'Inter') {
    document.body.style.fontFamily = `'${config.font_family}', sans-serif`;
  }
};

export const BrandingProvider = ({ children }) => {
  const { theme, currentTheme } = useTheme();
  // Initialise from localStorage cache for instant render (no branding flash)
  const [config, setConfig] = useState(getCachedBranding);
  const [loading, setLoading] = useState(true);

  // GET /api/branding is public — safe to call before login
  const fetchBranding = useCallback(async () => {
    try {
      const response = await api.get('/branding');
      const data = response.data || {};
      const merged = {
        ...defaultBranding,
        ...data,
        // Normalise nullish values
        logo_url: data.logo_url || null,
        logo_icon_text: data.logo_icon_text || defaultBranding.logo_icon_text,
        sidebar_bg_color: data.sidebar_bg_color || null,
        navbar_bg_color: data.navbar_bg_color || null,
        button_color: data.button_color || null,
        background_color: data.background_color || null,
        accent_color: data.accent_color || defaultBranding.accent_color,
      };
      setConfig(merged);
      saveBrandingCache(merged); // persist for instant load next time
    } catch (err) {
      console.warn('Could not fetch branding config:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Called by Settings after saving General — updates the name instantly without a round-trip
  const updateCompanyName = useCallback((name) => {
    setConfig(prev => {
      const updated = { ...prev, company_name: name };
      saveBrandingCache(updated);
      return updated;
    });
  }, []);

  // Called by Settings after saving Branding — pushes the saved config directly without a round-trip
  const setBrandingConfig = useCallback((incoming) => {
    setConfig(prev => {
      const updated = {
        ...prev,
        ...incoming,
        logo_url: incoming.logo_url || null,
        logo_icon_text: incoming.logo_icon_text || defaultBranding.logo_icon_text,
        accent_color: incoming.accent_color || defaultBranding.accent_color,
        hover_color: incoming.hover_color || defaultBranding.hover_color,
        active_text_color: incoming.active_text_color || defaultBranding.active_text_color,
      };
      saveBrandingCache(updated);
      return updated;
    });
  }, []);

  useEffect(() => {
    fetchBranding();
  }, [fetchBranding]);

  useEffect(() => {
    applyBrandColors(config, theme, currentTheme);
  }, [config, theme, currentTheme]);

  // Block rendering until branding is loaded from the database.
  // The localStorage cache makes subsequent loads near-instant.
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F0F2F5',
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: '3px solid #E5E7EB',
          borderTopColor: config.accent_color || '#D4AF37',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <BrandingContext.Provider value={{ config, loading, refreshBranding: fetchBranding, updateCompanyName, setBrandingConfig }}>
      {children}
    </BrandingContext.Provider>
  );
};

export default BrandingContext;
