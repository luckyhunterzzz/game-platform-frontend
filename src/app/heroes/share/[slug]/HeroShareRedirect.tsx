'use client';

import { useEffect } from 'react';

import { LOCALE_STORAGE_KEY } from '@/lib/i18n/i18n-context';

type HeroShareRedirectProps = {
  targetUrl: string;
  locale: 'ru' | 'en';
};

export default function HeroShareRedirect({ targetUrl, locale }: HeroShareRedirectProps) {
  useEffect(() => {
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
      // The redirect must still work when browser storage is unavailable.
    }
    window.location.replace(targetUrl);
  }, [locale, targetUrl]);

  return null;
}
