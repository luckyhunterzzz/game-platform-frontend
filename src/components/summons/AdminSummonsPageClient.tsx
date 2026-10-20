'use client';

import Link from 'next/link';

import { useI18n } from '@/lib/i18n/i18n-context';

import SummonsWorkspace from './admin/SummonsWorkspace';

export default function AdminSummonsPageClient() {
  const { locale, messages } = useI18n();

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-10">
      <section className="w-full max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm backdrop-blur-sm md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[var(--foreground)]">
              {locale === 'ru' ? 'Призывы' : 'Summons'}
            </h1>
            <p className="mt-2 text-sm text-[var(--foreground-soft)]">
              {locale === 'ru'
                ? 'Управление основными и запланированными вариантами призывов.'
                : 'Manage default and scheduled summon variants.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-300">
              {messages.heroes.adminBadge}
            </span>
            <Link
              href="/summons"
              className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-300 transition hover:bg-emerald-400/15"
            >
              {messages.heroes.publicBadge}
            </Link>
          </div>
        </div>

        <SummonsWorkspace />
      </section>
    </main>
  );
}
