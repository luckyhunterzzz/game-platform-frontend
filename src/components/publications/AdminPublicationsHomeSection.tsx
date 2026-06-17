'use client';

import Link from 'next/link';
import { useI18n } from '@/lib/i18n/i18n-context';
import PublicationsSection from './PublicationsSection';

export default function AdminPublicationsHomeSection() {
  const { locale } = useI18n();

  const heroText =
    locale === 'ru'
      ? {
          title: 'Админская главная',
          description:
            'Рабочая область для управления публикациями: фильтруйте записи по статусу и типу, редактируйте материалы и создавайте новые публикации.',
          openPublicHome: 'Открыть публичную главную',
          sectionTitle: 'Управление публикациями',
          sectionSubtitle:
            'Полный список публикаций с фильтрами по статусу и типу. Здесь можно быстро переключаться между опубликованными, черновиками и запланированными материалами.',
        }
      : {
          title: 'Admin homepage',
          description:
            'Workspace for publication management: filter records by status and type, edit materials, and create new publications.',
          openPublicHome: 'Open public home',
          sectionTitle: 'Publication management',
          sectionSubtitle:
            'Full publication list with filters by status and type. Switch quickly between published, draft, and scheduled materials.',
        };

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-10">
      <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm backdrop-blur-sm">
          <h2 className="text-3xl font-bold text-[var(--foreground)]">{heroText.title}</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--foreground-soft)]">
            {heroText.description}
          </p>
        </div>

        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm backdrop-blur-sm">
          <div className="text-sm leading-7 text-[var(--foreground-soft)]">
            {locale === 'ru'
              ? 'Перейти на обычную главную страницу сайта.'
              : 'Go back to the regular public homepage.'}
          </div>
          <div className="mt-5">
            <Link
              href="/"
              className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-hover)]"
            >
              {heroText.openPublicHome}
            </Link>
          </div>
        </div>
      </div>

      <PublicationsSection
        title={heroText.sectionTitle}
        subtitle={heroText.sectionSubtitle}
      />
    </section>
  );
}
