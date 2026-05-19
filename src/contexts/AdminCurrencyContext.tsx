import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';

export type AdminCurrency = 'BRL' | 'USD' | 'EUR' | 'GBP';

export interface CurrencyRates {
  BRL: number; // sempre 1 (moeda base)
  USD: number; // quanto 1 BRL vale em USD
  EUR: number;
  GBP: number;
}

const DEFAULT_RATES: CurrencyRates = {
  BRL: 1,
  USD: 0.18,
  EUR: 0.17,
  GBP: 0.14,
};

const CURRENCY_META: Record<AdminCurrency, { locale: string; symbol: string; label: string }> = {
  BRL: { locale: 'pt-BR', symbol: 'R$', label: 'Real (R$)' },
  USD: { locale: 'en-US', symbol: 'US$', label: 'Dólar (US$)' },
  EUR: { locale: 'de-DE', symbol: '€', label: 'Euro (€)' },
  GBP: { locale: 'en-GB', symbol: '£', label: 'Libra (£)' },
};

const STORAGE_KEY_CURRENCY = 'admin_currency';
const STORAGE_KEY_RATES = 'admin_currency_rates';

interface AdminCurrencyContextValue {
  currency: AdminCurrency;
  setCurrency: (c: AdminCurrency) => void;
  rates: CurrencyRates;
  setRates: (r: CurrencyRates) => void;
  /** Converte e formata um valor que está em BRL para a moeda selecionada. */
  format: (brlValue: number, opts?: { maximumFractionDigits?: number; minimumFractionDigits?: number }) => string;
  /** Converte BRL → moeda selecionada (sem formatar). */
  convert: (brlValue: number) => number;
  meta: typeof CURRENCY_META;
}

const AdminCurrencyContext = createContext<AdminCurrencyContextValue | null>(null);

export function AdminCurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<AdminCurrency>(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY_CURRENCY);
      if (v && ['BRL', 'USD', 'EUR', 'GBP'].includes(v)) return v as AdminCurrency;
    } catch { /* noop */ }
    return 'BRL';
  });

  const [rates, setRatesState] = useState<CurrencyRates>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_RATES);
      if (raw) {
        const parsed = JSON.parse(raw);
        return { ...DEFAULT_RATES, ...parsed, BRL: 1 };
      }
    } catch { /* noop */ }
    return DEFAULT_RATES;
  });

  const setCurrency = (c: AdminCurrency) => {
    setCurrencyState(c);
    try { localStorage.setItem(STORAGE_KEY_CURRENCY, c); } catch { /* noop */ }
  };

  const setRates = (r: CurrencyRates) => {
    const safe = { ...r, BRL: 1 };
    setRatesState(safe);
    try { localStorage.setItem(STORAGE_KEY_RATES, JSON.stringify(safe)); } catch { /* noop */ }
  };

  useEffect(() => {
    // sincroniza entre abas
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_CURRENCY && e.newValue) {
        setCurrencyState(e.newValue as AdminCurrency);
      }
      if (e.key === STORAGE_KEY_RATES && e.newValue) {
        try { setRatesState({ ...DEFAULT_RATES, ...JSON.parse(e.newValue), BRL: 1 }); } catch { /* noop */ }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const value = useMemo<AdminCurrencyContextValue>(() => {
    const convert = (brlValue: number) => {
      const rate = rates[currency] ?? 1;
      return (Number.isFinite(brlValue) ? brlValue : 0) * rate;
    };
    const format = (
      brlValue: number,
      opts?: { maximumFractionDigits?: number; minimumFractionDigits?: number }
    ) => {
      const converted = convert(brlValue);
      const { locale } = CURRENCY_META[currency];
      try {
        return converted.toLocaleString(locale, {
          style: 'currency',
          currency,
          minimumFractionDigits: opts?.minimumFractionDigits ?? 2,
          maximumFractionDigits: opts?.maximumFractionDigits ?? 2,
        });
      } catch {
        return `${CURRENCY_META[currency].symbol} ${converted.toFixed(2)}`;
      }
    };
    return { currency, setCurrency, rates, setRates, format, convert, meta: CURRENCY_META };
  }, [currency, rates]);

  return <AdminCurrencyContext.Provider value={value}>{children}</AdminCurrencyContext.Provider>;
}

export function useAdminCurrency() {
  const ctx = useContext(AdminCurrencyContext);
  if (!ctx) {
    // Fallback seguro fora do provider — devolve BRL puro.
    const format = (v: number, opts?: { maximumFractionDigits?: number; minimumFractionDigits?: number }) =>
      (Number.isFinite(v) ? v : 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: opts?.minimumFractionDigits ?? 2,
        maximumFractionDigits: opts?.maximumFractionDigits ?? 2,
      });
    return {
      currency: 'BRL' as AdminCurrency,
      setCurrency: () => {},
      rates: DEFAULT_RATES,
      setRates: () => {},
      format,
      convert: (v: number) => v,
      meta: CURRENCY_META,
    };
  }
  return ctx;
}

export { DEFAULT_RATES, CURRENCY_META };
