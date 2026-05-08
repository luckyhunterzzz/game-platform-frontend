'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n/i18n-context';
import { eventGuideItems } from '@/lib/static/events';

type QuickLinkItem = {
  label: string;
  href: string;
  imageSrc: string;
  imageClassName?: string;
  authHint?: string;
};

export default function EventsPage() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { authenticated } = useAuth();
  const { locale, messages } = useI18n();

  const quickLinks = useMemo<QuickLinkItem[]>(
    () => [
      { label: messages.home.navHeroes, href: '/heroes', imageSrc: '/home-quick-links/heroes.png' },
      { label: locale === 'ru' ? 'Сундуки' : 'Chests', href: '/chests', imageSrc: '/home-quick-links/guides.png' },
      { label: messages.home.navAlliances, href: '/alliance', imageSrc: '/home-quick-links/alliances.png' },
      {
        label: messages.home.navJointPurchases,
        href: '/joint-purchases',
        imageSrc: '/home-quick-links/joint-purchases.webp',
        authHint: authenticated ? undefined : messages.home.navJointPurchasesAuthHint,
      },
    ],
    [
      authenticated,
      locale,
      messages.home.navAlliances,
      messages.home.navHeroes,
      messages.home.navJointPurchases,
      messages.home.navJointPurchasesAuthHint,
    ],
  );

  const pageTitle = locale === 'ru' ? 'События' : 'Events';
  const pageSubtitle =
    locale === 'ru'
      ? 'Подборка игровых событий.'
      : 'A collection of game events.';

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)] font-sans text-[var(--foreground)]">
      <Navbar onMenuClick={() => setSidebarOpen((prev) => !prev)} />

      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div className="w-64 border-r border-[var(--border)] bg-[var(--surface-strong)] p-6 shadow-2xl backdrop-blur">
            <h2 className="mb-6 text-xl font-bold text-cyan-400">{messages.home.menuTitle}</h2>

            <ul className="space-y-4">
              <li>
                <Link
                  href="/"
                  onClick={() => setSidebarOpen(false)}
                  className="block text-[var(--foreground-muted)] transition hover:text-[var(--foreground)]"
                >
                  {messages.home.menuPageOne}
                </Link>
              </li>
              <li>
                <Link
                  href="/heroes"
                  onClick={() => setSidebarOpen(false)}
                  className="block text-[var(--foreground-muted)] transition hover:text-[var(--foreground)]"
                >
                  {messages.home.menuPageTwo}
                </Link>
              </li>
              <li>
                <Link
                  href="/joint-purchases"
                  onClick={() => setSidebarOpen(false)}
                  className="block text-[var(--foreground-muted)] transition hover:text-[var(--foreground)]"
                >
                  <span className="block">{messages.home.navJointPurchases}</span>
                  {!authenticated ? (
                    <span className="mt-1 block text-xs text-[var(--foreground-soft)]">
                      {messages.home.navJointPurchasesAuthHint}
                    </span>
                  ) : null}
                </Link>
              </li>
            </ul>
          </div>

          <div
            className="flex-1 bg-black/40 backdrop-blur-[1px]"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}

      <main className="flex flex-1 flex-col items-center px-4 py-12">
        <div className="mb-12 flex flex-wrap justify-center gap-4">
          {quickLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="group flex w-20 flex-col items-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2.5 shadow-lg transition-all hover:border-blue-500/40 hover:bg-[var(--surface-hover)] sm:w-32 sm:p-4"
            >
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] shadow-[0_12px_30px_rgba(0,0,0,0.14)] transition-transform group-hover:scale-105 sm:mb-3 sm:h-16 sm:w-16">
                <Image
                  src={item.imageSrc}
                  alt={item.label}
                  width={64}
                  height={64}
                  className={item.imageClassName ?? 'h-9 w-9 object-contain sm:h-12 sm:w-12'}
                />
              </div>

              <span className="text-center text-[11px] font-semibold text-[var(--foreground-muted)] transition group-hover:text-blue-300 sm:text-xs">
                {item.label}
              </span>
              {item.authHint ? (
                <span className="mt-1 text-center text-[10px] font-medium text-[var(--foreground-soft)] sm:text-[11px]">
                  {item.authHint}
                </span>
              ) : null}
            </Link>
          ))}
        </div>

        <section className="w-full max-w-7xl">
          <div className="mb-8 rounded-[2rem] border border-cyan-400/12 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.18),transparent_42%),linear-gradient(180deg,var(--surface-strong),var(--surface))] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.18)] md:p-8">
            <h1 className="text-3xl font-black tracking-tight text-[var(--foreground)] md:text-5xl">
              {pageTitle}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--foreground-soft)] md:text-base">
              {pageSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {eventGuideItems.map((item) => {
              const title = locale === 'ru' ? item.titleRu : item.titleEn;
              const isActive = item.slug === 'the-brave-and-the-beautiful';
              const cardContent = (
                <article className="flex h-full flex-col rounded-[calc(1rem-2px)] bg-[var(--surface)] p-4">
                  <div className="mb-4 overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_56%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                    <div className="relative aspect-[3/4] w-full overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),transparent_58%)]" />
                      <Image
                        src={item.previewImageSrc}
                        alt={title}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        className={`relative z-10 object-contain object-top p-4 transition duration-200 ${
                          isActive ? 'scale-[0.96] group-hover:scale-100 group-active:scale-[0.93]' : 'scale-[0.94]'
                        }`}
                      />
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/18 to-transparent" />
                    </div>
                  </div>

                  <div className="mt-auto">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground-soft)]">
                      {locale === 'ru' ? 'Событие' : 'Event'}
                    </div>
                    <h2 className="mt-2 text-base font-bold leading-tight text-[var(--foreground)] md:text-lg">
                      {title}
                    </h2>
                  </div>
                </article>
              );

              if (isActive) {
                return (
                  <Link
                    key={item.slug}
                    href={`/events/${item.slug}`}
                    className={`group overflow-hidden rounded-2xl border p-[2px] transition duration-200 hover:-translate-y-1 hover:brightness-110 active:translate-y-[1px] active:scale-[0.985] ${item.accentClassName}`}
                  >
                    {cardContent}
                  </Link>
                );
              }

              return (
                <div
                  key={item.slug}
                  className={`overflow-hidden rounded-2xl border p-[2px] ${item.accentClassName}`}
                >
                  {cardContent}
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
