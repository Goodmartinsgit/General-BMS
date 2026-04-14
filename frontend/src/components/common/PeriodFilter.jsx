import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useFiscalPeriod } from '../../context/FiscalPeriodContext';
import { useTimezone } from '../../context/TimezoneContext';

const PERIOD_OPTIONS = [
  { value: 'global', label: 'Use Global Period', icon: '🌐' },
  { value: 'today', label: 'Today', icon: '📅' },
  { value: 'yesterday', label: 'Yesterday', icon: '⏪' },
  { value: 'this_week', label: 'This Week', icon: '📆' },
  { value: 'last_week', label: 'Last Week', icon: '📆' },
  { value: 'this_month', label: 'This Month', icon: '🗓️' },
  { value: 'last_month', label: 'Last Month', icon: '🗓️' },
  { value: 'this_quarter', label: 'This Quarter', icon: '📊' },
  { value: 'this_year', label: 'This Year', icon: '📈' },
  { value: 'all_time', label: 'All Time', icon: '♾️' },
  { value: 'custom', label: 'Custom Range', icon: '🔧' },
];

function calculateDateRange(option, fmt) {
  // fmt(date) → 'YYYY-MM-DD' in the company's configured timezone
  const today = new Date();

  switch (option) {
    case 'today':
      return { start_date: fmt(today), end_date: fmt(today), label: 'Today' };

    case 'yesterday': {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      return { start_date: fmt(y), end_date: fmt(y), label: 'Yesterday' };
    }

    case 'this_week': {
      const day = today.getDay();
      const mon = new Date(today);
      mon.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      return { start_date: fmt(mon), end_date: fmt(sun), label: 'This Week' };
    }

    case 'last_week': {
      const day = today.getDay();
      const mon = new Date(today);
      mon.setDate(today.getDate() - (day === 0 ? 6 : day - 1) - 7);
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      return { start_date: fmt(mon), end_date: fmt(sun), label: 'Last Week' };
    }

    case 'this_month': {
      const s = new Date(today.getFullYear(), today.getMonth(), 1);
      const e = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return {
        start_date: fmt(s), end_date: fmt(e),
        label: s.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      };
    }

    case 'last_month': {
      const s = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const e = new Date(today.getFullYear(), today.getMonth(), 0);
      return {
        start_date: fmt(s), end_date: fmt(e),
        label: s.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      };
    }

    case 'this_quarter': {
      const q = Math.floor(today.getMonth() / 3);
      const s = new Date(today.getFullYear(), q * 3, 1);
      const e = new Date(today.getFullYear(), (q + 1) * 3, 0);
      return { start_date: fmt(s), end_date: fmt(e), label: `Q${q + 1} ${today.getFullYear()}` };
    }

    case 'this_year': {
      const s = new Date(today.getFullYear(), 0, 1);
      const e = new Date(today.getFullYear(), 11, 31);
      return { start_date: fmt(s), end_date: fmt(e), label: `${today.getFullYear()}` };
    }

    case 'all_time':
      return { start_date: null, end_date: null, label: 'All Time' };

    default:
      return null;
  }
}

export default function PeriodFilter({ onChange, storageKey = 'periodFilter', className = '' }) {
  const { periodRange, settings } = useFiscalPeriod();
  const { fmt } = useTimezone();
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState('global');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showCustomModal, setShowCustomModal] = useState(false);
  const dropdownRef = useRef(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSelected(parsed.selected || 'global');
        if (parsed.customStart) setCustomStart(parsed.customStart);
        if (parsed.customEnd) setCustomEnd(parsed.customEnd);
      }
    } catch { /* ignore */ }
  }, [storageKey]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Compute active date range — always re-evaluated when timezone changes
  const activeDateRange = useMemo(() => {
    if (selected === 'global') {
      return {
        start_date: periodRange.start_date,
        end_date: periodRange.end_date,
        label: periodRange.period_label || 'All Time',
        isGlobal: true
      };
    }
    if (selected === 'custom') {
      const label = customStart && customEnd
        ? `${new Date(customStart).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} - ${new Date(customEnd).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`
        : 'Custom Range';
      return { start_date: customStart || null, end_date: customEnd || null, label, isGlobal: false };
    }
    const range = calculateDateRange(selected, fmt);
    return { ...range, isGlobal: false };
  }, [selected, customStart, customEnd, periodRange, fmt]);

  // Emit change
  useEffect(() => {
    if (onChange) onChange(activeDateRange);
  }, [activeDateRange]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        selected, customStart, customEnd
      }));
    } catch { /* ignore */ }
  }, [selected, customStart, customEnd, storageKey]);

  const handleSelect = (value) => {
    if (value === 'custom') {
      setShowCustomModal(true);
      setIsOpen(false);
      return;
    }
    setSelected(value);
    setIsOpen(false);
  };

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      setSelected('custom');
      setShowCustomModal(false);
    }
  };

  const currentOption = PERIOD_OPTIONS.find(o => o.value === selected);
  const displayLabel = selected === 'global'
    ? `🌐 Global: ${periodRange.period_label || 'All Time'}`
    : `${currentOption?.icon || ''} ${activeDateRange.label}`;

  const allowOverride = settings.allow_users_to_override !== false;

  return (
    <div ref={dropdownRef} className={`period-filter ${className}`} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="period-filter-trigger"
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '8px 14px', border: '1px solid var(--glass-border, #e2e8f0)',
          borderRadius: '10px', background: 'var(--card-bg, #fff)',
          color: 'var(--text-primary, #1a202c)', cursor: 'pointer',
          fontSize: '0.85rem', fontWeight: 500,
          transition: 'all 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          whiteSpace: 'nowrap',
        }}
      >
        <span>{displayLabel}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }}>
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 1000,
          minWidth: '220px', background: 'var(--card-bg, #fff)',
          border: '1px solid var(--glass-border, #e2e8f0)',
          borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
          padding: '6px', overflow: 'hidden',
          animation: 'fadeIn 0.15s ease-out'
        }}>
          {PERIOD_OPTIONS.map((option) => {
            if (option.value !== 'global' && !allowOverride) return null;
            const isActive = selected === option.value;
            return (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  width: '100%', padding: '9px 12px', border: 'none',
                  borderRadius: '8px', cursor: 'pointer', textAlign: 'left',
                  fontSize: '0.84rem', fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--color-accent, #6366f1)' : 'var(--text-primary, #334155)',
                  background: isActive ? 'var(--color-accent-bg, #eef2ff)' : 'transparent',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  if (!isActive) e.currentTarget.style.background = 'var(--hover-bg, #f8fafc)';
                }}
                onMouseLeave={e => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span style={{ fontSize: '1rem', width: '22px', textAlign: 'center' }}>{option.icon}</span>
                <span>{option.label}</span>
                {isActive && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginLeft: 'auto' }}>
                    <path d="M3 7L6 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Custom Date Modal */}
      {showCustomModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
        }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowCustomModal(false); }}
        >
          <div style={{
            background: 'var(--card-bg, #fff)', borderRadius: '16px',
            padding: '28px', width: '360px', maxWidth: '90vw',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary, #1a202c)' }}>
              Custom Date Range
            </h3>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '6px', color: 'var(--text-secondary, #64748b)' }}>
                Start Date
              </label>
              <input
                type="date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', border: '1px solid var(--glass-border, #e2e8f0)',
                  borderRadius: '10px', fontSize: '0.9rem', boxSizing: 'border-box',
                  background: 'var(--input-bg, #f8fafc)', color: 'var(--text-primary, #1a202c)',
                }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '6px', color: 'var(--text-secondary, #64748b)' }}>
                End Date
              </label>
              <input
                type="date"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', border: '1px solid var(--glass-border, #e2e8f0)',
                  borderRadius: '10px', fontSize: '0.9rem', boxSizing: 'border-box',
                  background: 'var(--input-bg, #f8fafc)', color: 'var(--text-primary, #1a202c)',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCustomModal(false)}
                style={{
                  padding: '9px 18px', border: '1px solid var(--glass-border, #e2e8f0)',
                  borderRadius: '10px', background: 'transparent', cursor: 'pointer',
                  fontSize: '0.85rem', color: 'var(--text-secondary, #64748b)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCustomApply}
                disabled={!customStart || !customEnd}
                style={{
                  padding: '9px 18px', border: 'none', borderRadius: '10px',
                  background: (!customStart || !customEnd) ? '#cbd5e1' : 'var(--color-accent, #6366f1)',
                  color: '#fff', cursor: (!customStart || !customEnd) ? 'not-allowed' : 'pointer',
                  fontSize: '0.85rem', fontWeight: 600,
                }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
