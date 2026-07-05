'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

export default function ZoomableEventImage({
  src,
  alt,
  locale,
}: {
  src: string;
  alt: string;
  locale: 'ru' | 'en';
}) {
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ active: false, x: 0, y: 0 });
  const viewportRef = useRef<HTMLDivElement | null>(null);

  const t = useMemo(() => {
    if (locale === 'ru') {
      return {
        zoomIn: 'Увеличить',
        zoomOut: 'Уменьшить',
        reset: 'Сбросить',
        close: 'Закрыть',
      };
    }

    return {
      zoomIn: 'Zoom in',
      zoomOut: 'Zoom out',
      reset: 'Reset',
      close: 'Close',
    };
  }, [locale]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeViewer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [open]);

  const clampOffset = (nextOffset: { x: number; y: number }, nextScale: number) => {
    const viewport = viewportRef.current;
    if (!viewport || nextScale <= 1) {
      return { x: 0, y: 0 };
    }

    const width = viewport.clientWidth;
    const height = viewport.clientHeight;
    const maxX = Math.max(0, ((width * nextScale) - width) / 2);
    const maxY = Math.max(0, ((height * nextScale) - height) / 2);

    return {
      x: Math.max(-maxX, Math.min(maxX, nextOffset.x)),
      y: Math.max(-maxY, Math.min(maxY, nextOffset.y)),
    };
  };

  const applyScale = (updater: (prev: number) => number) => {
    setScale((prev) => {
      const next = updater(prev);
      setOffset((current) => clampOffset(current, next));
      return next;
    });
  };

  const resetView = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
    dragRef.current = { active: false, x: 0, y: 0 };
    setDragging(false);
  };

  const closeViewer = () => {
    setOpen(false);
    resetView();
  };

  const startDrag = (clientX: number, clientY: number) => {
    if (scale <= 1) {
      return;
    }

    dragRef.current = {
      active: true,
      x: clientX - offset.x,
      y: clientY - offset.y,
    };
    setDragging(true);
  };

  const moveDrag = (clientX: number, clientY: number) => {
    if (!dragRef.current.active || scale <= 1) {
      return;
    }

    setOffset(clampOffset({ x: clientX - dragRef.current.x, y: clientY - dragRef.current.y }, scale));
  };

  const endDrag = () => {
    dragRef.current.active = false;
    setDragging(false);
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="block w-full transition hover:opacity-95">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="w-full rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] object-contain shadow-[0_18px_50px_rgba(0,0,0,0.16)]" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={closeViewer}>
          <div className="relative w-full max-w-6xl rounded-[1.5rem] border border-white/10 bg-[var(--surface)] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.55)]" onClick={(event) => event.stopPropagation()}>
            <div className="mb-3 flex items-center justify-end gap-2">
              <button type="button" onClick={() => applyScale((prev) => Math.max(prev - 0.25, 0.75))} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-strong)] text-lg text-[var(--foreground)] transition hover:bg-[var(--surface-hover)]" aria-label={t.zoomOut}>-</button>
              <button type="button" onClick={() => applyScale((prev) => Math.min(prev + 0.25, 3))} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-strong)] text-lg text-[var(--foreground)] transition hover:bg-[var(--surface-hover)]" aria-label={t.zoomIn}>+</button>
              <button type="button" onClick={resetView} className="inline-flex h-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-hover)]">{t.reset}</button>
              <button type="button" onClick={closeViewer} className="inline-flex h-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-hover)]">{t.close}</button>
            </div>

            <div ref={viewportRef} className="relative max-h-[78vh] overflow-hidden rounded-2xl bg-black/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={alt}
                className="max-h-[78vh] w-full select-none object-contain"
                style={{
                  transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                  transformOrigin: 'center center',
                  cursor: scale > 1 ? (dragging ? 'grabbing' : 'grab') : 'default',
                  transition: dragging ? 'none' : 'transform 120ms ease-out',
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
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
