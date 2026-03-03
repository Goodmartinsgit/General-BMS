import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

// Theme definitions
export const themes = [
  { 
    id: 'light', 
    name: 'Light', 
    icon: '☀️',
    preview: { bg: '#F0F2F5', card: '#FFFFFF', accent: '#D4AF37' }
  },
  { 
    id: 'charcoal', 
    name: 'Charcoal', 
    icon: '🌑',
    preview: { bg: '#1F1F1F', card: '#2C2C2C', accent: '#D4AF37' }
  },
  { 
    id: 'midnight', 
    name: 'Midnight', 
    icon: '🌙',
    preview: { bg: '#0F172A', card: '#1E293B', accent: '#D4AF37' }
  },
  { 
    id: 'ocean', 
    name: 'Ocean', 
    icon: '🌊',
    preview: { bg: '#0C1929', card: '#162033', accent: '#D4AF37' }
  }
];

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Apply theme CSS classes to document root
const applyThemeClasses = (themeId) => {
  const root = document.documentElement;
  themes.forEach(t => root.classList.remove(`theme-${t.id}`));
  root.classList.add(`theme-${themeId}`);
  if (themeId !== 'light') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

export const ThemeProvider = ({ children }) => {
  const { auth, loading: authLoading } = useAuth();

  // Initialise from localStorage for instant render (no flash)
  const [theme, setThemeState] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('bms-theme') || 'light';
    }
    return 'light';
  });

  // Sync the persisted theme from the backend once the user is authenticated.
  // Skips the call entirely when not logged in, avoiding 401 console noise.
  const [synced, setSynced] = useState(false);

  // Re-sync when auth state changes (e.g. user logs in or out)
  useEffect(() => {
    setSynced(false);
  }, [auth?.accessToken]);

  useEffect(() => {
    if (synced) return;
    if (authLoading) return; // wait for auth to resolve
    if (!auth?.accessToken) {
      // Not logged in — nothing to sync, just use localStorage
      setSynced(true);
      return;
    }
    (async () => {
      try {
        const r = await api.get('/settings');
        const d = r.data?.settings || r.data?.data || r.data || {};
        const backendTheme = d.display?.theme;
        if (backendTheme && themes.some(t => t.id === backendTheme)) {
          setThemeState(backendTheme);
          localStorage.setItem('bms-theme', backendTheme);
          applyThemeClasses(backendTheme);
        }
      } catch {
        // Fallback to localStorage value
      } finally {
        setSynced(true);
      }
    })();
  }, [synced, authLoading, auth?.accessToken]);

  // Apply CSS classes whenever theme changes
  useEffect(() => {
    applyThemeClasses(theme);
  }, [theme]);

  // Set theme locally only (localStorage + CSS) — used internally
  const setTheme = useCallback((themeId) => {
    if (!themes.some(t => t.id === themeId)) return;
    localStorage.setItem('bms-theme', themeId);
    setThemeState(themeId);
  }, []);

  // Set theme AND persist to backend settings (display.theme)
  const persistTheme = useCallback(async (themeId) => {
    setTheme(themeId);
    try {
      // Fetch current settings, update display.theme, then save
      const r = await api.get('/settings');
      const current = r.data?.settings || r.data?.data || r.data || {};
      const updated = {
        ...current,
        display: { ...(current.display || {}), theme: themeId },
      };
      await api.put('/settings', updated);
    } catch {
      // Silently fail — the localStorage value ensures local persistence
    }
  }, [setTheme]);

  const currentTheme = themes.find(t => t.id === theme) || themes[0];

  return (
    <ThemeContext.Provider value={{ theme, setTheme, persistTheme, themes, currentTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
