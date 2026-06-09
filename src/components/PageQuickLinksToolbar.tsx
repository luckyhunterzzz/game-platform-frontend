'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';

import { useI18n } from '@/lib/i18n/i18n-context';

type QuickLinkItem = {
  label: string;
  href: string;
  imageSrc: string;
  authHint?: string;
};

type PageQuickLinksToolbarProps = {
  className?: string;
  currentPath?: string;
};

export default function PageQuickLinksToolbar({
  className,
  currentPath,
}: PageQuickLinksToolbarProps) {
  const { locale, messages } = useI18n();

  const quickLinks = useMemo<QuickLinkItem[]>(
    () => [
      { label: messages.home.navHeroes, href: '/heroes', imageSrc: '/home-quick-links/heroes.png' },
      {
        label: locale === 'ru' ? 'Отряды' : 'Troops',
        href: '/troops',
        imageSrc: '/heroes/troops/legendary/red_legendary_master_assassin.webp',
      },
      {
        label: locale === 'ru' ? 'Сундуки' : 'Chests',
        href: '/chests',
        imageSrc: '/home-quick-links/guides.png',
      },
      { label: messages.home.navEvents, href: '/events', imageSrc: '/home-quick-links/events.png' },
      {
        label: messages.home.navHeroCoach,
        href: '/hero-coach',
        imageSrc: '/heroes/activity-icons/hero-coach.png',
      },
      {
        label: messages.home.navOutfitter,
        href: '/outfitter',
        imageSrc: '/heroes/activity-icons/visiting-outfitter.png',
      },
      {
        label: messages.home.navAlliances,
        href: '/alliance',
        imageSrc: '/home-quick-links/alliances.png',
      },
    ],
    [
      locale,
      messages.home.navAlliances,
      messages.home.navEvents,
      messages.home.navHeroes,
      messages.home.navHeroCoach,
      messages.home.navOutfitter,
    ],
  );

  return (
    <div className={className ?? 'mb-12 flex flex-wrap justify-center gap-4'}>
      {quickLinks.map((item) => {
        const isCurrent = currentPath === item.href;

        return (
          <Link
            key={item.label}
            href={item.href}
            className={`group flex w-20 flex-col items-center rounded-2xl border bg-[var(--surface)] p-2.5 shadow-lg transition-all sm:w-32 sm:p-4 ${
              isCurrent
                ? 'border-cyan-400/40 bg-[var(--surface-hover)]'
                : 'border-[var(--border)] hover:border-blue-500/40 hover:bg-[var(--surface-hover)]'
            }`}
          >
            <div
              className={`mb-2 flex h-12 w-12 items-center justify-center rounded-2xl border bg-[var(--surface-strong)] shadow-[0_12px_30px_rgba(0,0,0,0.14)] transition-transform sm:mb-3 sm:h-16 sm:w-16 ${
                isCurrent
                  ? 'border-cyan-400/25'
                  : 'border-[var(--border)] group-hover:scale-105'
              }`}
            >
              <Image
                src={item.imageSrc}
                alt={item.label}
                width={64}
                height={64}
                className="h-9 w-9 object-contain sm:h-12 sm:w-12"
              />
            </div>

            <span
              className={`text-center text-[11px] font-semibold transition sm:text-xs ${
                isCurrent
                  ? 'text-cyan-300'
                  : 'text-[var(--foreground-muted)] group-hover:text-blue-300'
              }`}
            >
              {item.label}
            </span>
            {item.authHint ? (
              <span className="mt-1 text-center text-[10px] font-medium text-[var(--foreground-soft)] sm:text-[11px]">
                {item.authHint}
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
