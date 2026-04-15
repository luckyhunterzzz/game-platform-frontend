'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type HeroInfoPopoverProps = {
  label: string;
  content: string;
};

function formatPopoverContent(content: string) {
  return content
    .replace(/\r\n/g, '\n')
    .replace(/:\s+-\s+/g, ':\n- ')
    .replace(/\.\s+-\s+/g, '.\n- ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export default function HeroInfoPopover({ label, content }: HeroInfoPopoverProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const formattedContent = formatPopoverContent(content);
  const hasContent = formattedContent.length > 0;

  useEffect(() => {
    if (!hasContent || !open || !triggerRef.current) {
      return;
    }

    const rect = triggerRef.current.getBoundingClientRect();
    const width = 288;
    const margin = 16;
    const left = Math.min(Math.max(margin, rect.left), window.innerWidth - width - margin);
    const preferredTop = rect.bottom + 8;
    const estimatedHeight = 220;
    const top =
      preferredTop + estimatedHeight > window.innerHeight - margin
        ? Math.max(margin, rect.top - estimatedHeight - 8)
        : preferredTop;

    setPosition({ top, left });
  }, [hasContent, open]);

  useEffect(() => {
    if (!hasContent || !open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || popoverRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };

    const closePopover = () => setOpen(false);

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closePopover();
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);
    window.addEventListener('resize', closePopover);
    window.addEventListener('scroll', closePopover, true);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
      window.removeEventListener('resize', closePopover);
      window.removeEventListener('scroll', closePopover, true);
    };
  }, [hasContent, open]);

  if (!hasContent) {
    return null;
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="mt-0.5 inline-flex h-5 w-5 shrink-0 self-start items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/10 text-[11px] font-semibold text-cyan-200 transition hover:bg-cyan-400/15"
        aria-label={label}
      >
        ?
      </button>
      {open && position
        ? createPortal(
            <div
              ref={popoverRef}
              className="fixed z-[90] w-72 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4 text-left text-xs leading-5 text-[var(--foreground-soft)] shadow-2xl whitespace-pre-wrap"
              style={{ top: position.top, left: position.left }}
            >
              {formattedContent}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
