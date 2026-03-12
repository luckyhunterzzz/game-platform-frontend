'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Locale, Messages } from './types';
import { enMessages } from './messages/en';
import { ruMessages } from './messages/ru';

const LOCALE_STORAGE_KEY = 'game-platform-locale';

const messagesMap: Record<Locale, Messages> = {
  en: enMessages,
  ru: ruMessages,
};

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  messages: Messages;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function isLocale(value: string | null): value is Locale {
  return value === 'en' || value === 'ru';
}

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') {
    return 'ru';
  }

  const savedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  if (isLocale(savedLocale)) {
    return savedLocale;
  }

  return 'ru';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => getInitialLocale());

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (nextLocale: Locale) => {
    setLocaleState(nextLocale);
    window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
  };

  const value = useMemo<I18nContextValue>(() => {
    return {
      locale,
      setLocale,
      messages: messagesMap[locale],
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useI18n must be used inside I18nProvider');
  }

  return context;
}