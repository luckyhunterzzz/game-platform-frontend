'use client';

import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/lib/i18n/i18n-context';
import type {
  PublicationItem,
  PublicationStatus,
  PublicationType,
} from '@/lib/types/publication';

type PublicationCardProps = {
  publication: PublicationItem;
  showStatus?: boolean;
  canEdit?: boolean;
  onEdit?: () => void;
};

const PREVIEW_LENGTH = 260;

function mapLocaleToDateLocale(locale: 'ru' | 'en'): string {
  return locale === 'ru' ? 'ru-RU' : 'en-GB';
}

function formatPublishedAt(
  value: string | null | undefined,
  locale: 'ru' | 'en',
  labels: {
    notPublishedYet: string;
    invalidDate: string;
  },
): string {
  if (!value) {
    return labels.notPublishedYet;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return labels.invalidDate;
  }

  return date.toLocaleString(mapLocaleToDateLocale(locale), {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function PublicationCard({
  publication,
  showStatus = false,
  canEdit = false,
  onEdit,
}: PublicationCardProps) {
  const { locale, messages } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);

  const content = publication.content?.trim() ?? '';
  const isLongContent = content.length > PREVIEW_LENGTH;

  const displayedContent = useMemo(() => {
    if (!content) return '';
    if (expanded || !isLongContent) return content;
    return `${content.slice(0, PREVIEW_LENGTH)}...`;
  }, [content, expanded, isLongContent]);

  const formattedPublishedAt = formatPublishedAt(publication.publishedAt, locale, {
    notPublishedYet: messages.publications.notPublishedYet,
    invalidDate: messages.publications.invalidDate,
  });

  const publicationTypeLabel =
    messages.publicationType[publication.type as PublicationType];

  const publicationStatusLabel = publication.status
    ? messages.publicationStatus[publication.status as PublicationStatus]
    : null;

  useEffect(() => {
    if (!imagePreviewOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [imagePreviewOpen]);

  return (
    <>
      <article className="min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm backdrop-blur-sm">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">
            {publicationTypeLabel}
          </span>

          {publication.pinned && (
            <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-300">
              {messages.publications.pinned}
            </span>
          )}

          {showStatus && publicationStatusLabel && (
            <span className="rounded-full border border-[var(--border)] bg-[var(--surface-hover)] px-3 py-1 text-xs font-semibold text-[var(--foreground-muted)]">
              {publicationStatusLabel}
            </span>
          )}

          {canEdit && onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="rounded-full border border-sky-400/40 bg-sky-400/10 px-3 py-1 text-xs font-semibold text-sky-300 transition hover:bg-sky-400/15"
            >
              {locale === 'ru' ? 'Редактировать' : 'Edit'}
            </button>
          )}
        </div>

        <h3 className="mb-3 break-words text-xl font-semibold text-[var(--foreground)]">
          {publication.title}
        </h3>

        {publication.imageUrl && (
          <button
            type="button"
            onClick={() => setImagePreviewOpen(true)}
            className="mb-4 block w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] transition hover:opacity-95"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={publication.imageUrl}
              alt={publication.title}
              className="max-h-[32rem] w-full object-contain"
            />
          </button>
        )}

        {content ? (
          <div className="min-w-0 space-y-2">
            <p className="whitespace-pre-wrap break-words text-sm leading-6 text-[var(--foreground-muted)] [overflow-wrap:anywhere]">
              {displayedContent}
            </p>

            {isLongContent && (
              <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                className="text-sm font-medium text-cyan-300 transition hover:text-cyan-200"
              >
                {expanded
                  ? messages.publications.showLess
                  : messages.publications.showMore}
              </button>
            )}
          </div>
        ) : (
          <p className="text-sm italic text-[var(--foreground-soft)]">
            {messages.publications.noDescription}
          </p>
        )}

        <div className="mt-4 text-xs text-[var(--foreground-soft)]">
          {messages.publications.publishedAt}: {formattedPublishedAt}
        </div>
      </article>

      {imagePreviewOpen && publication.imageUrl && (
        <div
          className="fixed inset-0 z-[60] bg-black/85 p-4"
          onClick={() => setImagePreviewOpen(false)}
        >
          <div className="flex h-full w-full items-center justify-center">
            <div className="relative max-h-full max-w-6xl">
              <button
                type="button"
                onClick={() => setImagePreviewOpen(false)}
                className="absolute right-2 top-2 z-10 rounded-lg border border-white/20 bg-black/50 px-3 py-1 text-sm text-white transition hover:bg-black/70"
              >
                X
              </button>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={publication.imageUrl}
                alt={publication.title}
                className="max-h-[90vh] max-w-full rounded-xl object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
