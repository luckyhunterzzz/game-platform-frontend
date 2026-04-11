'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { useI18n } from '@/lib/i18n/i18n-context';

export default function ScrollToTopButton() {
  const { locale } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 280);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const label = locale === 'ru' ? '\u041d\u0430\u0432\u0435\u0440\u0445' : 'Back to top';

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label={label}
      title={label}
      className={`fixed bottom-5 right-5 z-40 inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-3 text-sm font-semibold text-[var(--foreground)] shadow-[0_18px_40px_rgba(0,0,0,0.16)] transition-all hover:border-cyan-400/20 hover:bg-[var(--surface-hover)] ${
        visible
          ? 'pointer-events-auto translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-4 opacity-0'
      }`}
    >
      <ArrowUp size={16} />
      <span className="hidden md:inline">{label}</span>
    </button>
  );
}
