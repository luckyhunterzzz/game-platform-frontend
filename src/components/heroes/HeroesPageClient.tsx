'use client';

import Link from 'next/link';
import { useMemo } from 'react';

import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n/i18n-context';
import HeroesWorkspace from './admin/HeroesWorkspace';

export default function HeroesPageClient({
  showCatalogHeader = true,
}: {
  showCatalogHeader?: boolean;
}) {
  const { roles, authenticated } = useAuth();
  const { messages } = useI18n();

  const isAdmin = useMemo(() => {
    return roles.includes('ROLE_admin') || roles.includes('ROLE_superadmin');
  }, [roles]);

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-10">
      <section className="w-full max-w-7xl">
        {showCatalogHeader ? (
          <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm backdrop-blur-sm md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[var(--foreground)]">
                {messages.heroes.pageTitle}
              </h1>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-300">
                {messages.heroes.publicBadge}
              </span>
              {authenticated && isAdmin ? (
                <Link
                  href="/admin/heroes"
                  className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-300 transition hover:bg-amber-400/15"
                >
                  {messages.heroes.adminBadge}
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}

        <HeroesWorkspace />
      </section>
    </main>
  );
}
