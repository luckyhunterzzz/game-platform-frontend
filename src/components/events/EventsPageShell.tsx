'use client';

import { useRouter } from 'next/navigation';
import { type ReactNode } from 'react';

import { useAppSidebar } from '@/components/AppShell';
import AppSidebarMenu, { type SidebarMenuItem } from '@/components/AppSidebarMenu';
import PageQuickLinksToolbar from '@/components/PageQuickLinksToolbar';
import { useI18n } from '@/lib/i18n/i18n-context';

export default function EventsPageShell({
  children,
  currentPath = '/events',
}: {
  children: ReactNode;
  currentPath?: string;
}) {
  const [isSidebarOpen, setSidebarOpen] = useAppSidebar();
  const router = useRouter();
  const { messages } = useI18n();

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

  return (
    <div className="flex flex-1 flex-col bg-[var(--background)] font-sans text-[var(--foreground)]">
      <AppSidebarMenu
        isOpen={isSidebarOpen}
        items={sidebarItems}
        onClose={() => setSidebarOpen(false)}
        title={messages.home.menuTitle}
      />

      <main className="flex flex-1 flex-col items-center px-4 py-12">
        <PageQuickLinksToolbar currentPath={currentPath} />
        <section className="w-full max-w-7xl">{children}</section>
      </main>
    </div>
  );
}
