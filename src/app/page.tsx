'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useState } from 'react';

import { Navbar } from '@/components/Navbar';
import { LoadingScreen } from '@/components/LoadingScreen';
import PageQuickLinksToolbar from '@/components/PageQuickLinksToolbar';
import PublicationsSection from '@/components/publications/PublicationsSection';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n/i18n-context';

const titleImages = {
  empires: '/brand-title/empires.webp',
  ampersand: '/brand-title/ampersand.webp',
  puzzles: '/brand-title/puzzles.webp',
};

const titleImageMeta = {
  empires: {
    height: 520,
    width: 1500,
  },
  ampersand: {
    height: 1200,
    width: 1250,
  },
  puzzles: {
    height: 365,
    width: 1500,
  },
};

export default function HomePage() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const { authenticated, loading } = useAuth();
  const { locale, messages } = useI18n();

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
                  href="/outfitter"
                  onClick={() => setSidebarOpen(false)}
                  className="block text-[var(--foreground-muted)] transition hover:text-[var(--foreground)]"
                >
                  {messages.home.navOutfitter}
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

      <main className="flex flex-1 flex-col items-center px-4 py-8 md:py-12">
        <div className="mb-10 text-center md:mb-16">
          <div className="mb-2 flex justify-center md:mb-4">
            <div className="hidden items-end justify-center gap-2 md:flex lg:gap-3">
              <Image
                src={titleImages.empires}
                alt="Empires"
                width={titleImageMeta.empires.width}
                height={titleImageMeta.empires.height}
                sizes="(max-width: 1279px) 34vw, 28vw"
                className="h-[clamp(3.4rem,6.8vw,7.2rem)] w-auto object-contain drop-shadow-[0_0_8px_rgba(184,134,11,0.55)]"
              />
              <Image
                src={titleImages.ampersand}
                alt="&"
                width={titleImageMeta.ampersand.width}
                height={titleImageMeta.ampersand.height}
                sizes="(max-width: 1279px) 7vw, 5vw"
                className="mb-[clamp(0.2rem,0.75vw,0.7rem)] h-[clamp(2.4rem,4.9vw,5.2rem)] w-auto object-contain drop-shadow-[0_0_8px_rgba(184,134,11,0.55)]"
              />
              <Image
                src={titleImages.puzzles}
                alt="Puzzles"
                width={titleImageMeta.puzzles.width}
                height={titleImageMeta.puzzles.height}
                sizes="(max-width: 1279px) 34vw, 28vw"
                className="h-[clamp(3.4rem,6.8vw,7.2rem)] w-auto object-contain drop-shadow-[0_0_8px_rgba(184,134,11,0.55)]"
              />
            </div>

            <div className="relative h-[clamp(6.5rem,31vw,8.8rem)] w-[min(92vw,21rem)] md:hidden">
              <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2">
                <Image
                  src={titleImages.empires}
                  alt="Empires"
                  width={titleImageMeta.empires.width}
                  height={titleImageMeta.empires.height}
                  sizes="92vw"
                  className="h-[clamp(2.5rem,12.5vw,4.1rem)] w-auto object-contain drop-shadow-[0_0_7px_rgba(184,134,11,0.52)]"
                />
              </div>

              <div className="absolute left-1/2 top-[clamp(2rem,9.5vw,3rem)] z-20 -translate-x-1/2">
                <Image
                  src={titleImages.ampersand}
                  alt="&"
                  width={titleImageMeta.ampersand.width}
                  height={titleImageMeta.ampersand.height}
                  sizes="20vw"
                  className="h-[clamp(1.24rem,6.4vw,2.16rem)] w-auto object-contain drop-shadow-[0_0_7px_rgba(184,134,11,0.52)]"
                />
              </div>

              <div className="absolute left-1/2 top-[clamp(2.85rem,13.9vw,4.45rem)] z-30 -translate-x-1/2">
                <Image
                  src={titleImages.puzzles}
                  alt="Puzzles"
                  width={titleImageMeta.puzzles.width}
                  height={titleImageMeta.puzzles.height}
                  sizes="92vw"
                  className="h-[clamp(2.5rem,12.5vw,4.1rem)] w-auto object-contain drop-shadow-[0_0_7px_rgba(184,134,11,0.52)]"
                />
              </div>
            </div>
          </div>

          <p className="text-lg font-light uppercase tracking-[0.24em] text-[var(--foreground-soft)] md:text-xl md:tracking-widest">
            {messages.home.heroSubtitle}
          </p>
        </div>

        <PageQuickLinksToolbar currentPath="/" />

        <div className="w-full">
          <PublicationsSection />
        </div>
      </main>
    </div>
  );
}
