'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import PublicationsSection from '@/components/publications/PublicationsSection';
import { useI18n } from '@/lib/i18n/i18n-context';

export default function AlliancePage() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { messages } = useI18n();

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
