'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { Navbar } from '@/components/Navbar';
import { useI18n } from '@/lib/i18n/i18n-context';
import { chestColumns, chestRows } from '@/lib/static/guides/chest-table';

export default function ChestsPage() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { locale, messages } = useI18n();

  const t = useMemo(
    () =>
      locale === 'ru'
        ? {
            title: 'Сундуки',
            subtitle:
              'Таблица где быстрее всего закрывать сундуки в зависимости от цвета и активного сезона.',
            tableTitle: 'Таблица сундуков',
            tableSubtitle:
              'Сверху указаны сундуки, слева сезоны и истории. Внутри ячеек сохранены нужные значения.',
            season: 'Сезон',
            backHome: 'Главная',
            backHeroes: 'Герои',
            rows: {
              season1: 'Сезон 1',
              season2: 'Сезон 2',
              season3: 'Сезон 3',
              season4: 'Сезон 4',
              season5: 'Сезон 5',
              stories1: 'Истории 1',
              stories2: 'Истории 2',
            },
          }
        : {
            title: 'Chests',
            subtitle:
              'Table showing where chest progress is fastest depending on chest color and active season.',
            tableTitle: 'Chest table',
            tableSubtitle:
              'Chest types are shown above, seasons and stories are shown on the left, and values are kept inside the cells.',
            season: 'Season',
            backHome: 'Home',
            backHeroes: 'Heroes',
            rows: {
              season1: 'Season 1',
              season2: 'Season 2',
              season3: 'Season 3',
              season4: 'Season 4',
              season5: 'Season 5',
              stories1: 'Stories 1',
              stories2: 'Stories 2',
            },
          },
    [locale],
  );

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
                  {t.backHome}
                </Link>
              </li>
              <li>
                <Link
                  href="/heroes"
                  onClick={() => setSidebarOpen(false)}
                  className="block text-[var(--foreground-muted)] transition hover:text-[var(--foreground)]"
                >
                  {t.backHeroes}
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

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-10 md:px-6">
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_44%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(8,13,24,0.96))] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.28)] md:p-8">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">
              {t.title}
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">
              {t.tableTitle}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
              {t.subtitle}
            </p>
          </div>
        </section>

        <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)] md:p-6">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-[var(--foreground)] md:text-2xl">{t.tableTitle}</h2>
            <p className="mt-2 text-sm text-[var(--foreground-soft)]">{t.tableSubtitle}</p>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[820px]">
              <div className="grid grid-cols-[180px_repeat(6,minmax(106px,1fr))] gap-3">
                <div className="sticky left-0 z-10 flex items-end rounded-2xl border border-white/10 bg-slate-950 px-4 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">
                  {t.season}
                </div>

                {chestColumns.map((column) => (
                  <div
                    key={column.key}
                    className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/95 px-3 py-4 shadow-[0_14px_40px_rgba(0,0,0,0.26)]"
                  >
                    <Image
                      src={column.imageSrc}
                      alt={column.alt}
                      width={72}
                      height={72}
                      className="h-16 w-16 object-contain md:h-[72px] md:w-[72px]"
                    />
                  </div>
                ))}

                {chestRows.map((row) => (
                  <ChestTableRow
                    key={row.key}
                    rowKey={row.key}
                    label={t.rows[row.key]}
                    values={row.values}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function ChestTableRow({
  rowKey,
  label,
  values,
}: {
  rowKey: string;
  label: string;
  values: string[];
}) {
  return (
    <>
      <div className="sticky left-0 z-10 flex items-center rounded-2xl border border-white/10 bg-slate-950/95 px-4 py-4 text-sm font-semibold text-slate-100 shadow-[0_14px_40px_rgba(0,0,0,0.18)]">
        {label}
      </div>

      {values.map((value, index) => (
        <div
          key={`${rowKey}-${index}`}
          className="group flex items-center justify-center rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.98),rgba(15,23,42,0.98))] px-3 py-4 text-center shadow-[0_14px_40px_rgba(0,0,0,0.18)] transition hover:border-cyan-400/30 hover:bg-[linear-gradient(180deg,rgba(18,31,52,0.98),rgba(15,23,42,0.98))]"
        >
          <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-sm font-bold tracking-wide text-cyan-100 transition group-hover:border-cyan-300/30 group-hover:text-cyan-50">
            {value}
          </span>
        </div>
      ))}
    </>
  );
}
