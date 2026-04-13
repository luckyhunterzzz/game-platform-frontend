'use client';

import Image from 'next/image';
import { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import PublicationsSection from '@/components/publications/PublicationsSection';
import { useI18n } from '@/lib/i18n/i18n-context';

type QuickLinkItem = {
  label: string;
  href: string;
  imageSrc: string;
  imageClassName?: string;
};

export default function AlliancePage() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { locale, messages } = useI18n();

  const quickLinks: QuickLinkItem[] = [
    { label: messages.home.navHeroes, href: '/heroes', imageSrc: '/home-quick-links/heroes.png' },
    { label: messages.home.navEvents, href: '/', imageSrc: '/home-quick-links/events.png' },
    {
      label: locale === 'ru' ? 'Сундуки' : 'Chests',
      href: '/chests',
      imageSrc: '/home-quick-links/guides.png',
    },
    {
      label: locale === 'ru' ? 'Главная' : 'Home',
      href: '/',
      imageSrc: '/brand-dragon.png',
      imageClassName: 'h-11 w-11',
    },
  ];

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
              className="group flex w-28 flex-col items-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-lg transition-all hover:border-blue-500/40 hover:bg-[var(--surface-hover)] sm:w-32"
            >
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] shadow-[0_12px_30px_rgba(0,0,0,0.14)] transition-transform group-hover:scale-105">
                <Image
                  src={item.imageSrc}
                  alt={item.label}
                  width={64}
                  height={64}
                  className={item.imageClassName ?? 'h-12 w-12 object-contain'}
                />
              </div>

              <span className="text-center text-xs font-semibold text-[var(--foreground-muted)] transition group-hover:text-blue-300">
                {item.label}
              </span>
            </Link>
          ))}
        </div>

        <div className="w-full">
          <PublicationsSection
            publicView="alliances"
            title={messages.publications.alliancesTitle}
            subtitle={messages.publications.alliancesSubtitle}
            forcePublic
          />
        </div>
      </main>
    </div>
  );
}
