'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import AppSidebarMenu, { type SidebarMenuItem } from '@/components/AppSidebarMenu';
import JointPurchasesPageClient from '@/components/joint-purchases/JointPurchasesPageClient';
import PurchaseHelpBanner from '@/components/joint-purchases/PurchaseHelpBanner';
import { LoadingScreen } from '@/components/LoadingScreen';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n/i18n-context';

const SHOW_PURCHASE_HELP_BANNER = false;

export default function JointPurchasesPage() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const { messages } = useI18n();
  const { authenticated, canResumeLogin, loading, login } = useAuth();
  const loginLabel = canResumeLogin ? messages.navbar.continueLogin : messages.navbar.login;

  const navigateHome = () => {
    setSidebarOpen(false);
    router.push('/');
  };

  const sidebarItems: SidebarMenuItem[] = [
    { key: 'home', label: messages.home.menuPageOne, onClick: navigateHome },
    { key: 'heroes', href: '/heroes', label: messages.home.menuPageTwo },
    { key: 'hero-coach', href: '/hero-coach', label: messages.home.navHeroCoach },
    { key: 'outfitter', href: '/outfitter', label: messages.home.navOutfitter },
    { key: 'troops', href: '/troops', label: messages.home.navTroops },
  ];

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)] font-sans text-[var(--foreground)]">
      <Navbar
        onMenuClick={() => setSidebarOpen((prev) => !prev)}
        onHomeClick={navigateHome}
      />

      <AppSidebarMenu
        isOpen={isSidebarOpen}
        items={sidebarItems}
        onClose={() => setSidebarOpen(false)}
        title={messages.home.menuTitle}
      />

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
                    {loginLabel}
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
