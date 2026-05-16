'use client';

import Link from 'next/link';
import { useState } from 'react';

import { Navbar } from '@/components/Navbar';
import ProfilePageClient from '@/components/profile/ProfilePageClient';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n/i18n-context';

export default function ProfilePage() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { authenticated } = useAuth();
  const { locale, messages } = useI18n();

  const navigateHome = () => {
    setSidebarOpen(false);
    window.location.assign('/');
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)] font-sans text-[var(--foreground)]">
      <Navbar
        onMenuClick={() => setSidebarOpen((prev) => !prev)}
        onHomeClick={navigateHome}
      />

      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div className="w-64 border-r border-[var(--border)] bg-[var(--surface-strong)] p-6 shadow-2xl backdrop-blur">
            <h2 className="mb-6 text-xl font-bold text-cyan-400">{messages.home.menuTitle}</h2>

            <ul className="space-y-4">
              <li>
                <button
                  type="button"
                  onClick={navigateHome}
                  className="block text-[var(--foreground-muted)] transition hover:text-[var(--foreground)]"
                >
                  {messages.home.menuPageOne}
                </button>
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
                  href="/troops"
                  onClick={() => setSidebarOpen(false)}
                  className="block text-[var(--foreground-muted)] transition hover:text-[var(--foreground)]"
                >
                  {locale === 'ru' ? '\u041E\u0442\u0440\u044F\u0434\u044B' : 'Troops'}
                </Link>
              </li>
              <li>
                <Link
                  href="/profile"
                  onClick={() => setSidebarOpen(false)}
                  className="block text-[var(--foreground)] transition hover:text-cyan-300"
                >
                  {messages.navbar.profile}
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

      <main className="flex flex-1 flex-col items-center px-4 py-10">
        <ProfilePageClient />
      </main>
    </div>
  );
}
