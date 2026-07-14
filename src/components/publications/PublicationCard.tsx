'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '@/lib/i18n/i18n-context';
import SafeMarkdown from '@/components/markdown/SafeMarkdown';
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
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef({ x: 0, y: 0, active: false });
  const pinchStateRef = useRef<{ distance: number; scale: number } | null>(null);

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

  const viewerLabels =
    locale === 'ru'
      ? {
          openImage: 'Открыть изображение полностью',
          zoomIn: 'Увеличить',
          zoomOut: 'Уменьшить',
          reset: 'Сбросить',
          close: 'Закрыть',
        }
      : {
          openImage: 'Open full image',
          zoomIn: 'Zoom in',
          zoomOut: 'Zoom out',
          reset: 'Reset',
          close: 'Close',
        };

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

  const clampOffset = (nextOffset: { x: number; y: number }, nextScale: number) => {
    const viewport = viewportRef.current;
    if (!viewport || nextScale <= 1) {
      return { x: 0, y: 0 };
    }

    const maxX = ((nextScale - 1) * viewport.clientWidth) / 2;
    const maxY = ((nextScale - 1) * viewport.clientHeight) / 2;

    return {
      x: Math.max(-maxX, Math.min(maxX, nextOffset.x)),
      y: Math.max(-maxY, Math.min(maxY, nextOffset.y)),
    };
  };

  const applyScale = (updater: (prev: number) => number) => {
    setScale((prev) => {
      const next = updater(prev);
      setOffset((currentOffset) => clampOffset(currentOffset, next));
      return next;
    });
  };

  const zoomIn = () => applyScale((prev) => Math.min(prev + 0.25, 3));
  const zoomOut = () => applyScale((prev) => Math.max(prev - 0.25, 0.75));

  const resetView = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setIsDragging(false);
    dragStateRef.current = { x: 0, y: 0, active: false };
    pinchStateRef.current = null;
  };

  const closePreview = () => {
    setImagePreviewOpen(false);
    resetView();
  };

  const startDrag = (clientX: number, clientY: number) => {
    if (scale <= 1) {
      return;
    }

    dragStateRef.current = {
      x: clientX - offset.x,
      y: clientY - offset.y,
      active: true,
    };
    setIsDragging(true);
  };

  const moveDrag = (clientX: number, clientY: number) => {
    if (!dragStateRef.current.active || scale <= 1) {
      return;
    }

    setOffset(
      clampOffset(
        {
          x: clientX - dragStateRef.current.x,
          y: clientY - dragStateRef.current.y,
        },
        scale,
      ),
    );
  };

  const endDrag = () => {
    dragStateRef.current.active = false;
    setIsDragging(false);
  };

  const getTouchDistance = (
    touches: { item: (index: number) => { clientX: number; clientY: number } | null },
  ) => {
    const firstTouch = touches.item(0);
    const secondTouch = touches.item(1);

    if (!firstTouch || !secondTouch) {
      return 0;
    }

    const dx = firstTouch.clientX - secondTouch.clientX;
    const dy = firstTouch.clientY - secondTouch.clientY;
    return Math.hypot(dx, dy);
  };

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
              className="rounded-full border border-sky-400/40 bg-sky-400/10 px-3 py-1 text-xs font-semibold tracking-wide text-sky-300 transition hover:bg-sky-400/15"
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
            aria-label={viewerLabels.openImage}
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
            {<SafeMarkdown
              content={content}
              className={
                expanded || !isLongContent
                  ? ''
                  : '[display:-webkit-box] overflow-hidden [-webkit-box-orient:vertical] [-webkit-line-clamp:6]'
              }
              textClassName="text-sm leading-6 text-[var(--foreground-muted)]"
            />}

            {isLongContent && (
              <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                className="text-sm font-semibold text-cyan-300 transition hover:text-cyan-200"
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
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={closePreview}
        >
          <div
            className="relative max-h-[92vh] max-w-[92vw] overflow-auto rounded-[1.5rem] border border-white/10 bg-[var(--surface)] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={zoomOut}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-strong)] text-lg text-[var(--foreground)] transition hover:bg-[var(--surface-hover)]"
                aria-label={viewerLabels.zoomOut}
              >
                -
              </button>
              <button
                type="button"
                onClick={zoomIn}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-strong)] text-lg text-[var(--foreground)] transition hover:bg-[var(--surface-hover)]"
                aria-label={viewerLabels.zoomIn}
              >
                +
              </button>
              <button
                type="button"
                onClick={resetView}
                className="inline-flex h-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-hover)]"
              >
                {viewerLabels.reset}
              </button>
              <button
                type="button"
                onClick={closePreview}
                className="inline-flex h-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-hover)]"
              >
                {viewerLabels.close}
              </button>
            </div>

            <div
              ref={viewportRef}
              className="relative overflow-hidden"
              style={{ width: 'min(92vw, 960px)', height: 'min(78vh, 960px)' }}
            >
              <div
                className="relative h-full w-full origin-center select-none"
                style={{
                  transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                  transformOrigin: 'center center',
                  cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                  touchAction: 'none',
                  transition: isDragging ? 'none' : 'transform 120ms ease-out',
                }}
                onMouseDown={(event) => {
                  event.preventDefault();
                  startDrag(event.clientX, event.clientY);
                }}
                onMouseMove={(event) => moveDrag(event.clientX, event.clientY)}
                onMouseUp={endDrag}
                onMouseLeave={endDrag}
                onWheel={(event) => {
                  event.preventDefault();
                  applyScale((prev) => Math.max(0.75, Math.min(3, prev + (event.deltaY < 0 ? 0.15 : -0.15))));
                }}
                onTouchStart={(event) => {
                  if (event.touches.length === 2) {
                    pinchStateRef.current = {
                      distance: getTouchDistance(event.touches),
                      scale,
                    };
                    dragStateRef.current.active = false;
                    setIsDragging(false);
                    return;
                  }

                  if (event.touches.length === 1) {
                    const touch = event.touches.item(0);
                    if (touch) {
                      startDrag(touch.clientX, touch.clientY);
                    }
                  }
                }}
                onTouchMove={(event) => {
                  if (event.touches.length === 2 && pinchStateRef.current) {
                    event.preventDefault();
                    const distance = getTouchDistance(event.touches);
                    if (!distance || !pinchStateRef.current.distance) {
                      return;
                    }

                    const ratio = distance / pinchStateRef.current.distance;
                    const nextScale = Math.max(0.75, Math.min(3, pinchStateRef.current.scale * ratio));
                    setScale(nextScale);
                    setOffset((currentOffset) => clampOffset(currentOffset, nextScale));
                    return;
                  }

                  if (event.touches.length === 1) {
                    const touch = event.touches.item(0);
                    if (touch) {
                      moveDrag(touch.clientX, touch.clientY);
                    }
                  }
                }}
                onTouchEnd={() => {
                  pinchStateRef.current = null;
                  endDrag();
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={publication.imageUrl}
                  alt={publication.title}
                  className="h-full w-full rounded-xl object-contain"
                  draggable={false}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
