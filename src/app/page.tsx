'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useMemo, useState } from 'react';

import { Navbar } from '@/components/Navbar';
import { LoadingScreen } from '@/components/LoadingScreen';
import PublicationsSection from '@/components/publications/PublicationsSection';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n/i18n-context';

type QuickLinkItem = {
  label: string;
  href?: string;
  imageSrc?: string;
  authHint?: string;
};

export default function HomePage() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const { authenticated, loading } = useAuth();
  const { locale, messages } = useI18n();

  const quickLinks = useMemo<QuickLinkItem[]>(
    () => [
      { label: messages.home.navHeroes, href: '/heroes', imageSrc: '/home-quick-links/heroes.png' },
      { label: locale === 'ru' ? '\u041E\u0442\u0440\u044F\u0434\u044B' : 'Troops', href: '/troops', imageSrc: '/heroes/troops/legendary/red_legendary_master_assassin.webp' },
      { label: locale === 'ru' ? '\u0421\u0443\u043D\u0434\u0443\u043A\u0438' : 'Chests', href: '/chests', imageSrc: '/home-quick-links/guides.png' },
      { label: messages.home.navEvents, href: '/events', imageSrc: '/home-quick-links/events.png' },
      { label: messages.home.navHeroCoach, href: '/hero-coach', imageSrc: '/heroes/activity-icons/hero-coach.png' },
      { label: messages.home.navAlliances, href: '/alliance', imageSrc: '/home-quick-links/alliances.png' },
      {
        label: messages.home.navJointPurchases,
        href: '/joint-purchases',
        imageSrc: '/home-quick-links/joint-purchases.webp',
        authHint: authenticated ? undefined : messages.home.navJointPurchasesAuthHint,
      },
    ],
    [
      locale,
      messages.home.navHeroes,
      messages.home.navHeroCoach,
      messages.home.navEvents,
      messages.home.navAlliances,
      messages.home.navJointPurchases,
      messages.home.navJointPurchasesAuthHint,
      authenticated,
    ],
  );

  if (loading) {
    return <LoadingScreen />;
  }

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
                  href="/hero-coach"
                  onClick={() => setSidebarOpen(false)}
                  className="block text-[var(--foreground-muted)] transition hover:text-[var(--foreground)]"
                >
                  {messages.home.navHeroCoach}
                </Link>
              </li>
              <li>
                <Link
                  href="/troops"
                  onClick={() => setSidebarOpen(false)}
                  className="block text-[var(--foreground-muted)] transition hover:text-[var(--foreground)]"
                >
                  {locale === 'ru' ? '\u041E\u0442\u0440\u044F\u0434\u044B' : 'Troops'}
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

          <div className="flex-1 bg-black/40 backdrop-blur-[1px]" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      <main className="flex flex-1 flex-col items-center px-4 py-12">
        <div className="mb-16 text-center">
          <h1 className="mb-4 bg-gradient-to-r from-blue-400 via-purple-500 to-amber-400 bg-clip-text text-5xl font-black text-transparent md:text-7xl">
            EMPIRES & PUZZLES
          </h1>

          <p className="text-xl font-light uppercase tracking-widest text-[var(--foreground-soft)]">
            {messages.home.heroSubtitle}
          </p>
        </div>

        <div className="mb-12 flex flex-wrap justify-center gap-4">
          {quickLinks.map((item) => {
            const content = (
              <>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] shadow-[0_12px_30px_rgba(0,0,0,0.14)] transition-transform group-hover:scale-105 sm:mb-3 sm:h-16 sm:w-16">
                  <Image
                    src={item.imageSrc ?? '/brand-dragon.png'}
                    alt={item.label}
                    width={64}
                    height={64}
                    className="h-9 w-9 object-contain sm:h-12 sm:w-12"
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
              </>
            );

            if (item.href) {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="group flex w-20 flex-col items-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2.5 shadow-lg transition-all hover:border-blue-500/40 hover:bg-[var(--surface-hover)] sm:w-32 sm:p-4"
                >
                  {content}
                </Link>
              );
            }

            return (
              <button
                key={item.label}
                type="button"
                className="group flex w-20 flex-col items-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2.5 shadow-lg transition-all hover:border-blue-500/40 hover:bg-[var(--surface-hover)] sm:w-32 sm:p-4"
              >
                {content}
              </button>
            );
          })}
        </div>

        <div className="w-full">
          <PublicationsSection />
        </div>
      </main>
    </div>
  );
}
