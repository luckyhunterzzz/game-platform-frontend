'use client';

import Link from 'next/link';
import { useState } from 'react';

import JointPurchasesPageClient from '@/components/joint-purchases/JointPurchasesPageClient';
import PurchaseHelpBanner from '@/components/joint-purchases/PurchaseHelpBanner';
import { LoadingScreen } from '@/components/LoadingScreen';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n/i18n-context';

const SHOW_PURCHASE_HELP_BANNER = false;

export default function JointPurchasesPage() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { locale, messages } = useI18n();
  const { authenticated, loading, login } = useAuth();

  const navigateHome = () => {
    setSidebarOpen(false);
    window.location.assign('/');
  };

  if (loading) {
    return <LoadingScreen />;
  }

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
                  href="/joint-purchases"
                  onClick={() => setSidebarOpen(false)}
                  className="block text-[var(--foreground)] transition hover:text-cyan-300"
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
        {authenticated ? (
          <div className="flex w-full max-w-7xl flex-col gap-8">
            {SHOW_PURCHASE_HELP_BANNER ? <PurchaseHelpBanner /> : null}
            <JointPurchasesPageClient />
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
            <div className="mx-auto flex w-full max-w-3xl flex-1 items-center justify-center">
              <div className="w-full rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
                <h1 className="text-3xl font-black text-[var(--foreground)]">
                  {messages.jointPurchases.guestAccessTitle}
                </h1>
                <p className="mt-4 text-sm leading-7 text-[var(--foreground-soft)]">
                  {messages.jointPurchases.guestAccessDescription}
                </p>

                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={login}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                  >
                    {messages.navbar.login}
                  </button>
                  <button
                    type="button"
                    onClick={navigateHome}
                    className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-2 text-sm text-[var(--foreground)] transition hover:bg-[var(--surface-hover)]"
                  >
                    {messages.home.menuPageOne}
                  </button>
                </div>
              </div>
            </div>

            {SHOW_PURCHASE_HELP_BANNER ? <PurchaseHelpBanner /> : null}
          </div>
        )}
      </main>
    </div>
  );
}
