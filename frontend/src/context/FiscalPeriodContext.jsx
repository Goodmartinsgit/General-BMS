import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { fiscalPeriodsAPI } from '../api/fiscalPeriods';

const FiscalPeriodContext = createContext(null);

const DEFAULT_SETTINGS = {
  period_type: 'forever',
  custom_start_date: null,
  custom_end_date: null,
  fiscal_year_start_month: 1,
  fiscal_year_start_day: 1,
  auto_create_periods: false,
  show_period_badge_on_dashboard: true,
  allow_users_to_override: true
};

const DEFAULT_RANGE = {
  start_date: null,
  end_date: null,
  period_type: 'forever',
  period_label: 'All Time'
};

export function FiscalPeriodProvider({ children }) {
  const { auth } = useAuth();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [periodRange, setPeriodRange] = useState(DEFAULT_RANGE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    if (!auth?.accessToken) return;
    try {
      setLoading(true);
      setError(null);

      const [settingsRes, rangeRes] = await Promise.all([
        fiscalPeriodsAPI.getGlobalSettings(),
        fiscalPeriodsAPI.getCurrentRange()
      ]);

      setSettings(settingsRes?.data || DEFAULT_SETTINGS);
      setPeriodRange(rangeRes?.data || DEFAULT_RANGE);
    } catch (err) {
      console.error('Error loading fiscal settings:', err);
      setError(err.message);
      setSettings(DEFAULT_SETTINGS);
      setPeriodRange(DEFAULT_RANGE);
    } finally {
      setLoading(false);
    }
  }, [auth?.accessToken]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const updateSettings = useCallback(async (newSettings) => {
    try {
      const res = await fiscalPeriodsAPI.updateGlobalSettings(newSettings);
      if (res?.data) setSettings(res.data);
      // Refresh the range after settings change
      const rangeRes = await fiscalPeriodsAPI.getCurrentRange();
      if (rangeRes?.data) setPeriodRange(rangeRes.data);
      return res;
    } catch (err) {
      console.error('Error updating fiscal settings:', err);
      throw err;
    }
  }, []);

  /**
   * Get date range query params for API calls.
   * If a local override is provided, use that instead of global range.
   */
  const getDateRangeParams = useCallback((localOverride = null) => {
    const range = localOverride || periodRange;
    if (!range.start_date && !range.end_date) return {};
    const params = {};
    if (range.start_date) params.start_date = range.start_date;
    if (range.end_date) params.end_date = range.end_date;
    return params;
  }, [periodRange]);

  const value = {
    settings,
    periodRange,
    loading,
    error,
    refresh: fetchAll,
    updateSettings,
    getDateRangeParams
  };

  return (
    <FiscalPeriodContext.Provider value={value}>
      {children}
    </FiscalPeriodContext.Provider>
  );
}

export function useFiscalPeriod() {
  const context = useContext(FiscalPeriodContext);
  if (!context) {
    // Return safe defaults if used outside provider (e.g. login page)
    return {
      settings: DEFAULT_SETTINGS,
      periodRange: DEFAULT_RANGE,
      loading: false,
      error: null,
      refresh: () => {},
      updateSettings: () => {},
      getDateRangeParams: () => ({})
    };
  }
  return context;
}

export default FiscalPeriodContext;
