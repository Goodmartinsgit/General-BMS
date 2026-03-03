import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';
import { getCurrencySymbol, formatCurrency as formatCurrencyUtil } from '../utils/currency';

const CurrencyContext = createContext();

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrencyState] = useState('USD');
  const { auth, loading } = useAuth();

  useEffect(() => {
    if (loading || !auth?.accessToken) return;
    (async () => {
      try {
        const res = await api.get('/settings');
        const d = res.data?.settings || res.data || {};
        const code = d.general?.currency || 'USD';
        setCurrencyState(code);
      } catch {
        // keep default
      }
    })();
  }, [loading, auth?.accessToken]);

  const setCurrency = useCallback((code) => {
    setCurrencyState(code);
  }, []);

  const symbol = getCurrencySymbol(currency);

  const formatCurrency = useCallback((amount) => {
    return formatCurrencyUtil(amount, currency);
  }, [currency]);

  return (
    <CurrencyContext.Provider value={{ currency, symbol, setCurrency, formatCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export default CurrencyContext;
