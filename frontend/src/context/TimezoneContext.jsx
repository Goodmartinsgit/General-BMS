import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const TimezoneContext = createContext();

// Sensible defaults matching Nigeria (WAT = Africa/Lagos = UTC+1)
const DEFAULT_TIMEZONE = 'Africa/Lagos';
const DEFAULT_DATE_FORMAT = 'DD/MM/YYYY';

const CACHE_KEY = 'bms-timezone-cache';

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function saveCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

/**
 * formatLocalDate(date, timezone)
 *
 * Returns a YYYY-MM-DD string representing the given date in the specified
 * IANA timezone (e.g. 'Africa/Lagos').  Uses the Intl API so it correctly
 * handles UTC-offset differences — no more "yesterday" on UTC+1 at midnight.
 *
 * Falls back to local-time parts if the timezone is unsupported.
 */
export function formatLocalDate(date, timezone) {
  const d = date instanceof Date ? date : new Date(date);
  try {
    // en-CA locale produces the YYYY-MM-DD ordering we need
    const formatter = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: timezone || DEFAULT_TIMEZONE,
    });
    // Returns e.g. "2026-04-14"
    return formatter.format(d);
  } catch {
    // Unsupported timezone IANA key — fall back to local parts
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}

export const useTimezone = () => {
  const ctx = useContext(TimezoneContext);
  if (!ctx) throw new Error('useTimezone must be used within a TimezoneProvider');
  return ctx;
};

export const TimezoneProvider = ({ children }) => {
  const cached = loadCache();
  const [timezone, setTimezone] = useState(cached?.timezone || DEFAULT_TIMEZONE);
  const [dateFormat, setDateFormat] = useState(cached?.date_format || DEFAULT_DATE_FORMAT);

  const fetchSettings = useCallback(async () => {
    try {
      // /api/settings/company is a public endpoint — no auth needed
      const res = await api.get('/settings/company');
      const data = res.data || {};
      const tz = data.timezone || DEFAULT_TIMEZONE;
      const df = data.date_format || DEFAULT_DATE_FORMAT;
      setTimezone(tz);
      setDateFormat(df);
      saveCache({ timezone: tz, date_format: df });
    } catch (err) {
      // Non-critical — keep defaults or last cached value
      console.warn('TimezoneContext: could not load company timezone settings:', err?.message);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  /**
   * fmt(date) → "YYYY-MM-DD" string in the company's configured timezone.
   * Drop-in replacement for d.toISOString().split('T')[0].
   */
  const fmt = useCallback(
    (date) => formatLocalDate(date, timezone),
    [timezone]
  );

  return (
    <TimezoneContext.Provider value={{ timezone, dateFormat, fmt, refreshTimezone: fetchSettings }}>
      {children}
    </TimezoneContext.Provider>
  );
};

export default TimezoneContext;
