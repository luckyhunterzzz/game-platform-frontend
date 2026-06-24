'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react';

type HeroInfoPopoverProps = {
  label: string;
  content: string;
  trigger?: ReactNode;
  triggerClassName?: string;
};

type PopoverAnchor =
  | { type: 'pointer'; x: number; y: number }
  | { type: 'trigger' };

type PopoverPosition = {
  top: number;
  left: number;
};

const VIEWPORT_MARGIN = 16;
const POINTER_OFFSET = 14;
const TRIGGER_OFFSET = 8;
const HOVER_CLOSE_DELAY_MS = 90;

function clamp(value: number, min: number, max: number) {
  if (max < min) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

function resolvePopoverPosition(
  anchor: PopoverAnchor,
  dimensions: { width: number; height: number },
  triggerRect: DOMRect | null,
): PopoverPosition {
  const maxLeft = window.innerWidth - dimensions.width - VIEWPORT_MARGIN;
  const maxTop = window.innerHeight - dimensions.height - VIEWPORT_MARGIN;

  if (anchor.type === 'pointer') {
    const preferredRight = anchor.x + POINTER_OFFSET;
    const fallbackLeft = anchor.x - dimensions.width - POINTER_OFFSET;
    const rawLeft =
      preferredRight + dimensions.width <= window.innerWidth - VIEWPORT_MARGIN
        ? preferredRight
        : fallbackLeft;
    const rawTop =
      anchor.y - dimensions.height - POINTER_OFFSET >= VIEWPORT_MARGIN
        ? anchor.y - dimensions.height - POINTER_OFFSET
        : anchor.y + POINTER_OFFSET;

    return {
      top: clamp(rawTop, VIEWPORT_MARGIN, maxTop),
      left: clamp(rawLeft, VIEWPORT_MARGIN, maxLeft),
    };
  }

  if (!triggerRect) {
    return {
      top: VIEWPORT_MARGIN,
      left: VIEWPORT_MARGIN,
    };
  }

  const centeredLeft = triggerRect.left + triggerRect.width / 2 - dimensions.width / 2;
  const preferredTop = triggerRect.top - dimensions.height - TRIGGER_OFFSET;
  const fallbackTop = triggerRect.bottom + TRIGGER_OFFSET;
  const rawTop = preferredTop >= VIEWPORT_MARGIN ? preferredTop : fallbackTop;

  return {
    top: clamp(rawTop, VIEWPORT_MARGIN, maxTop),
    left: clamp(centeredLeft, VIEWPORT_MARGIN, maxLeft),
  };
}

function formatPopoverContent(content: string) {
  return content
    .replace(/\r\n/g, '\n')
    .replace(/:\s+-\s+/g, ':\n- ')
    .replace(/\.\s+-\s+/g, '.\n- ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export default function HeroInfoPopover({
  label,
  content,
  trigger = '?',
  triggerClassName = 'inline-flex h-5 w-5 shrink-0 self-center items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/10 text-[11px] font-semibold text-cyan-200 transition hover:bg-cyan-400/15',
}: HeroInfoPopoverProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);
  const [anchor, setAnchor] = useState<PopoverAnchor | null>(null);
  const [position, setPosition] = useState<PopoverPosition | null>(null);
  const formattedContent = formatPopoverContent(content);
  const hasContent = formattedContent.length > 0;

  const clearScheduledClose = useCallback(() => {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const closePopover = useCallback(() => {
    clearScheduledClose();
    setOpen(false);
    setAnchor(null);
    setPosition(null);
  }, [clearScheduledClose]);

  const scheduleClose = useCallback(() => {
    clearScheduledClose();
    closeTimeoutRef.current = window.setTimeout(() => {
      closePopover();
    }, HOVER_CLOSE_DELAY_MS);
  }, [clearScheduledClose, closePopover]);

  const openAtTrigger = useCallback(() => {
    clearScheduledClose();
    setAnchor({ type: 'trigger' });
    setPosition(null);
    setOpen(true);
  }, [clearScheduledClose]);

  const openAtPointer = useCallback(
    (event: ReactMouseEvent<HTMLButtonElement>) => {
      clearScheduledClose();
      setAnchor({ type: 'pointer', x: event.clientX, y: event.clientY });
      setPosition(null);
      setOpen(true);
    },
    [clearScheduledClose],
  );

  useLayoutEffect(() => {
    if (!hasContent || !open || !anchor || !popoverRef.current) {
      return;
    }

    const rect = triggerRef.current?.getBoundingClientRect() ?? null;
    const { width, height } = popoverRef.current.getBoundingClientRect();

    setPosition(resolvePopoverPosition(anchor, { width, height }, rect));
  }, [anchor, formattedContent, hasContent, open]);

  useEffect(() => {
    if (!hasContent || !open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || popoverRef.current?.contains(target)) {
        return;
      }
      closePopover();
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closePopover();
      }
    };

    const handleScroll = (event: Event) => {
      const target = event.target as Node | null;
      if (
        target &&
        (triggerRef.current?.contains(target) || popoverRef.current?.contains(target))
      ) {
        return;
      }

      closePopover();
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);
    window.addEventListener('resize', closePopover);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
      window.removeEventListener('resize', closePopover);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [closePopover, hasContent, open]);

  useEffect(
    () => () => {
      clearScheduledClose();
    },
    [clearScheduledClose],
  );

  if (!hasContent) {
    return null;
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onMouseEnter={openAtPointer}
        onMouseMove={openAtPointer}
        onMouseLeave={scheduleClose}
        onFocus={openAtTrigger}
        onBlur={closePopover}
        onClick={() => {
          if (open) {
            closePopover();
            return;
          }

          openAtTrigger();
        }}
        className={triggerClassName}
        aria-label={label}
        aria-expanded={open}
      >
        {trigger}
      </button>
      {open
        ? createPortal(
            <div
              ref={popoverRef}
              className="fixed z-[90] w-[min(18rem,calc(100vw-2rem))] max-h-[min(24rem,calc(100vh-2rem))] overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4 text-left text-xs leading-5 text-[var(--foreground-soft)] shadow-2xl whitespace-pre-wrap overscroll-contain"
              style={{
                top: position?.top ?? VIEWPORT_MARGIN,
                left: position?.left ?? VIEWPORT_MARGIN,
                visibility: position ? 'visible' : 'hidden',
              }}
              onMouseEnter={clearScheduledClose}
              onMouseLeave={scheduleClose}
            >
              {formattedContent}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
