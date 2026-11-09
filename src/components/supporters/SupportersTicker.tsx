'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';

import { useI18n } from '@/lib/i18n/i18n-context';
import type { Supporter, SupporterFontStyle } from '@/lib/types/supporter';
import { useApi } from '@/lib/use-api';

const PUBLIC_SUPPORTERS_API = '/api/v1/public/supporters';
const TICKER_SPEED_PX_PER_SECOND = 20;

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
  const [motion, setMotion] = useState<{ startPx: number; durationSeconds: number } | null>(null);
  const tickerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

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

  const gratitude = locale === 'ru' ? 'Спасибо за вашу поддержку!' : 'Thank you for your support!';

  useEffect(() => {
    const ticker = tickerRef.current;
    const track = trackRef.current;

    if (!ticker || !track) {
      return;
    }

    const updateMotion = () => {
      const startPx = ticker.clientWidth;
      const trackWidth = track.scrollWidth;

      if (startPx <= 0 || trackWidth <= 0) {
        return;
      }

      const durationSeconds = (startPx + trackWidth) / TICKER_SPEED_PX_PER_SECOND;
      setMotion((current) => {
        if (
          current &&
          current.startPx === startPx &&
          Math.abs(current.durationSeconds - durationSeconds) < 0.05
        ) {
          return current;
        }

        return { startPx, durationSeconds };
      });
    };

    const animationFrame = window.requestAnimationFrame(updateMotion);
    const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updateMotion);
    resizeObserver?.observe(ticker);
    resizeObserver?.observe(track);
    window.addEventListener('resize', updateMotion);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updateMotion);
    };
  }, [gratitude, supporters]);

  const trackStyle = motion
    ? ({
        '--supporters-ticker-start': `${motion.startPx}px`,
        '--supporters-ticker-duration': `${motion.durationSeconds}s`,
      } as CSSProperties)
    : undefined;

  if (supporters.length === 0) {
    return null;
  }

  const renderSequence = () => (
    <span className="inline-flex shrink-0 items-center gap-5">
      <span aria-hidden="true" className="text-amber-400/70">✦</span>
      <span className="font-medium text-[var(--foreground-soft)]">{gratitude}</span>
      {supporters.map((supporter) => (
        <span key={supporter.id} className="inline-flex items-center gap-5">
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
      ref={tickerRef}
      className="supporters-ticker border-t border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_92%,transparent)] py-1.5 text-sm"
      aria-label={gratitude}
    >
      <div
        ref={trackRef}
        className={`supporters-ticker-track${motion ? ' supporters-ticker-track--ready' : ''}`}
        style={trackStyle}
      >
        {renderSequence()}
      </div>
    </div>
  );
}
