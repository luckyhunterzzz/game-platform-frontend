'use client';

import { useEffect, useState } from 'react';

import { useI18n } from '@/lib/i18n/i18n-context';
import type { Supporter, SupporterFontStyle } from '@/lib/types/supporter';
import { useApi } from '@/lib/use-api';

const PUBLIC_SUPPORTERS_API = '/api/v1/public/supporters';

const FONT_CLASSES: Record<SupporterFontStyle, string> = {
  ELEGANT: 'font-serif italic tracking-wide',
  SCRIPT: 'font-[cursive] italic tracking-wide',
  CLASSIC: 'font-serif font-semibold',
  MODERN: 'font-sans font-semibold tracking-wider',
};

let cachedSupporters: Supporter[] | null = null;

export default function SupportersTicker() {
  const { apiJson } = useApi();
  const { locale } = useI18n();
  const [supporters, setSupporters] = useState<Supporter[]>(cachedSupporters ?? []);

  useEffect(() => {
    let cancelled = false;

    const refresh = () => {
      void apiJson<Supporter[]>(PUBLIC_SUPPORTERS_API)
        .then((response) => {
          cachedSupporters = response;
          if (!cancelled) {
            setSupporters(response);
          }
        })
        .catch(() => undefined);
    };

    refresh();
    window.addEventListener('supporters-updated', refresh);

    return () => {
      cancelled = true;
      window.removeEventListener('supporters-updated', refresh);
    };
  }, [apiJson]);

  if (supporters.length === 0) {
    return null;
  }

  const gratitude = locale === 'ru' ? 'Спасибо за вашу поддержку!' : 'Thank you for your support!';

  const renderSequence = (duplicate: boolean) => (
    <span className="inline-flex shrink-0 items-center gap-5 pr-5" aria-hidden={duplicate || undefined}>
      <span className="font-medium text-[var(--foreground-soft)]">{gratitude}</span>
      {supporters.map((supporter) => (
        <span key={`${duplicate ? 'duplicate' : 'primary'}-${supporter.id}`} className="inline-flex items-center gap-5">
          <span aria-hidden="true" className="text-amber-400/70">✦</span>
          <span
            className={`text-base drop-shadow-sm ${FONT_CLASSES[supporter.fontStyle]}`}
            style={{ color: supporter.color }}
          >
            {supporter.nickname}
          </span>
        </span>
      ))}
      <span aria-hidden="true" className="text-amber-400/70">✦</span>
    </span>
  );

  return (
    <div
      className="supporters-ticker border-t border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_92%,transparent)] py-1.5 text-sm"
      aria-label={gratitude}
    >
      <div className="supporters-ticker-track">
        {renderSequence(false)}
        {renderSequence(true)}
      </div>
    </div>
  );
}
