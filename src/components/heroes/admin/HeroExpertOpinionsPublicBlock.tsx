'use client';

import { useMemo, useState } from 'react';
import type { HeroLocale } from '@/lib/types/hero';
import type { HeroExpertOpinionPublicResponseDto } from '@/lib/types/hero-expert-opinion';
import DictionaryModal from './DictionaryModal';

type HeroExpertOpinionsPublicBlockProps = {
  locale: HeroLocale;
  items: HeroExpertOpinionPublicResponseDto[];
  loading?: boolean;
  error?: string | null;
};

function formatOpinionDate(value: string | null | undefined, locale: HeroLocale) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale === 'RU' ? 'ru-RU' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export default function HeroExpertOpinionsPublicBlock({
  locale,
  items,
  loading = false,
  error = null,
}: HeroExpertOpinionsPublicBlockProps) {
  const [selectedOpinionId, setSelectedOpinionId] = useState<number | null>(null);

  const t = useMemo(
    () =>
      locale === 'RU'
        ? {
            title: 'Мнения экспертов',
            empty: 'Пока нет опубликованных мнений по этому герою.',
            loading: 'Загружаем мнения...',
            modalTitle: 'Обзор игрока',
            author: 'Автор',
            source: 'Источник',
            close: 'Закрыть',
            openSource: 'Открыть источник',
            sourceMissing: 'Источник не указан',
            channelMissing: 'Канал не указан',
            errorFallback: 'Не удалось загрузить мнения',
          }
        : {
            title: 'Expert opinions',
            empty: 'No published opinions for this hero yet.',
            loading: 'Loading opinions...',
            modalTitle: 'Player opinion',
            author: 'Author',
            source: 'Source',
            close: 'Close',
            openSource: 'Open source',
            sourceMissing: 'Source is not set',
            channelMissing: 'Channel is not set',
            errorFallback: 'Failed to load opinions',
          },
    [locale],
  );

  const selectedOpinion = items.find((item) => item.id === selectedOpinionId) ?? null;

  return (
    <>
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <div className="mb-3 text-sm font-semibold text-[var(--foreground)]">{t.title}</div>

        {loading ? (
          <div className="text-sm text-[var(--foreground-soft)]">{t.loading}</div>
        ) : error ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error || t.errorFallback}
          </div>
        ) : items.length === 0 ? (
          <div className="text-sm text-[var(--foreground-soft)]">{t.empty}</div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const dateLabel = formatOpinionDate(item.publishedAt, locale);
              const channelLabel = item.sourceTitle?.trim() || t.channelMissing;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedOpinionId(item.id)}
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-left transition hover:border-cyan-400/30 hover:bg-[var(--surface-hover)]"
                >
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--foreground-muted)]">
                    {dateLabel ? <span>{dateLabel}</span> : null}
                    {dateLabel ? <span aria-hidden="true">•</span> : null}
                    <span className="font-semibold text-[var(--foreground)]">{item.authorName}</span>
                    <span aria-hidden="true">•</span>
                    <span>{channelLabel}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <DictionaryModal
        open={selectedOpinion != null}
        title={selectedOpinion?.sourceTitle?.trim() || t.modalTitle}
        closeLabel={t.close}
        onClose={() => setSelectedOpinionId(null)}
      >
        {selectedOpinion ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[var(--foreground-soft)]">
                {selectedOpinion.publishedAt ? (
                  <span>{formatOpinionDate(selectedOpinion.publishedAt, locale)}</span>
                ) : null}
                {selectedOpinion.publishedAt ? <span aria-hidden="true">•</span> : null}
                <span className="font-semibold text-[var(--foreground)]">
                  {t.author}: {selectedOpinion.authorName}
                </span>
                <span aria-hidden="true">•</span>
                <span>
                  {t.source}: {selectedOpinion.sourceTitle?.trim() || t.sourceMissing}
                </span>
              </div>

              {selectedOpinion.sourceUrl ? (
                <a
                  href={selectedOpinion.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-hover)]"
                >
                  {t.openSource}
                </a>
              ) : null}
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <div className="whitespace-pre-wrap text-sm leading-6 text-[var(--foreground-soft)]">
                {selectedOpinion.content?.trim() || t.empty}
              </div>
            </div>
          </div>
        ) : null}
      </DictionaryModal>
    </>
  );
}
