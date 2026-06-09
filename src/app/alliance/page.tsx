'use client';

import { useState } from 'react';

import AppSidebarMenu, { type SidebarMenuItem } from '@/components/AppSidebarMenu';
import { Navbar } from '@/components/Navbar';
import PageQuickLinksToolbar from '@/components/PageQuickLinksToolbar';
import PublicationsSection from '@/components/publications/PublicationsSection';
import { useI18n } from '@/lib/i18n/i18n-context';

export default function AlliancePage() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { messages } = useI18n();
  const sidebarItems: SidebarMenuItem[] = [
    { key: 'home', href: '/', label: messages.home.menuPageOne },
    { key: 'heroes', href: '/heroes', label: messages.home.menuPageTwo },
    { key: 'hero-coach', href: '/hero-coach', label: messages.home.navHeroCoach },
    { key: 'outfitter', href: '/outfitter', label: messages.home.navOutfitter },
    { key: 'troops', href: '/troops', label: messages.home.navTroops },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)] font-sans text-[var(--foreground)]">
      <Navbar onMenuClick={() => setSidebarOpen((prev) => !prev)} />

      <AppSidebarMenu
        isOpen={isSidebarOpen}
        items={sidebarItems}
        onClose={() => setSidebarOpen(false)}
        title={messages.home.menuTitle}
      />

      <main className="flex flex-1 flex-col items-center px-4 py-12">
        <PageQuickLinksToolbar currentPath="/alliance" />

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
