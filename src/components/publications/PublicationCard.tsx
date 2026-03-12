'use client';

import { useMemo, useState } from 'react';
import type { PublicationItem } from '@/lib/types/publication';

type PublicationCardProps = {
  publication: PublicationItem;
  showStatus?: boolean;
};

const PREVIEW_LENGTH = 260;

function formatPublishedAt(value?: string | null): string {
  if (!value) {
    return 'Еще не опубликовано';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Некорректная дата';
  }

  return date.toLocaleString('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function PublicationCard({
  publication,
  showStatus = false,
}: PublicationCardProps) {
  const [expanded, setExpanded] = useState(false);

  const content = publication.content?.trim() ?? '';
  const isLongContent = content.length > PREVIEW_LENGTH;

  const displayedContent = useMemo(() => {
    if (!content) return '';
    if (expanded || !isLongContent) return content;
    return `${content.slice(0, PREVIEW_LENGTH)}...`;
  }, [content, expanded, isLongContent]);

  const formattedPublishedAt = formatPublishedAt(publication.publishedAt);

  return (
    <article className="min-w-0 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-sm backdrop-blur-sm">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-200">
          {publication.type}
        </span>

        {publication.pinned && (
          <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-200">
            PINNED
          </span>
        )}

        {showStatus && (
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
            {publication.status}
          </span>
        )}
      </div>

      <h3 className="mb-3 break-words text-xl font-semibold text-white">
        {publication.title}
      </h3>

      {content ? (
        <div className="min-w-0 space-y-2">
          <p className="whitespace-pre-wrap break-words text-sm leading-6 text-white/80 [overflow-wrap:anywhere]">
            {displayedContent}
          </p>

          {isLongContent && (
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className="text-sm font-medium text-cyan-300 transition hover:text-cyan-200"
            >
              {expanded ? 'Свернуть' : 'Показать все'}
            </button>
          )}
        </div>
      ) : (
        <p className="text-sm italic text-white/50">Без описания</p>
      )}

      <div className="mt-4 text-xs text-white/50">
        Дата публикации: {formattedPublishedAt}
      </div>
    </article>
  );
}