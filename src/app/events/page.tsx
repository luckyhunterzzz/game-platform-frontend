'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import EventsAdminLinkBadge from '@/components/events/EventsAdminLinkBadge';
import EventsPageShell from '@/components/events/EventsPageShell';
import { useI18n } from '@/lib/i18n/i18n-context';
import type { PublicEventFeedResponse } from '@/lib/types/event';
import { ApiError, useApi } from '@/lib/use-api';

export default function EventsPage() {
  const { apiJson } = useApi();
  const { locale } = useI18n();
  const [feed, setFeed] = useState<PublicEventFeedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const language = locale === 'ru' ? 'RU' : 'EN';

  const t = useMemo(
    () =>
      locale === 'ru'
        ? {
            title: 'События',
            publicBadge: 'Публичный каталог',
            emptyTitle: 'Событий пока нет',
            emptyDescription: 'Когда администратор добавит события, они появятся здесь.',
            open: 'Открыть событие',
            event: 'Событие',
            loading: 'Загрузка событий...',
            loadError: 'Не удалось загрузить события.',
          }
        : {
            title: 'Events',
            publicBadge: 'Public catalog',
            emptyTitle: 'No events yet',
            emptyDescription: 'Events will appear here after an admin creates them.',
            open: 'Open event',
            event: 'Event',
            loading: 'Loading events...',
            loadError: 'Failed to load events.',
          },
    [locale],
  );

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setErrorMessage(null);
        const response = await apiJson<PublicEventFeedResponse>(`/api/v1/public/events?page=0&size=100&language=${language}`);
        if (!cancelled) {
          setFeed(response);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof ApiError || error instanceof Error ? error.message : t.loadError);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [apiJson, language, t.loadError]);

  return (
    <EventsPageShell currentPath="/events">
      <div className="mb-8 flex flex-col gap-4 rounded-[2rem] border border-cyan-400/12 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.18),transparent_42%),linear-gradient(180deg,var(--surface-strong),var(--surface))] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.18)] md:flex-row md:items-start md:justify-between md:p-8">
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-300">
              {t.publicBadge}
            </span>
            <EventsAdminLinkBadge />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-[var(--foreground)] md:text-5xl">{t.title}</h1>
        </div>
      </div>

      {loading ? (
        <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-10 text-center shadow-sm text-[var(--foreground-soft)]">{t.loading}</div>
      ) : errorMessage ? (
        <div className="rounded-[2rem] border border-red-400/20 bg-red-400/10 p-10 text-center text-red-300 shadow-sm">{errorMessage}</div>
      ) : !feed || feed.items.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-[var(--border)] bg-[var(--surface)] p-10 text-center shadow-sm">
          <h2 className="text-2xl font-bold text-[var(--foreground)]">{t.emptyTitle}</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--foreground-soft)]">{t.emptyDescription}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {feed.items.map((item) => (
            <Link key={item.id} href={`/events/${item.slug}`} className="group overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[linear-gradient(180deg,var(--surface-strong),var(--surface))] p-4 shadow-[0_20px_48px_rgba(0,0,0,0.14)] transition hover:-translate-y-1 hover:border-cyan-400/30 hover:shadow-[0_28px_70px_rgba(34,211,238,0.12)]">
              <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_56%)]">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt={item.name} className="aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
                ) : (
                  <div className="aspect-[4/3] w-full bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.16),transparent_60%),linear-gradient(180deg,rgba(15,23,42,0.14),rgba(15,23,42,0.04))]" />
                )}
              </div>

              <div className="mt-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground-soft)]">{t.event}</div>
                <h2 className="mt-2 text-xl font-bold text-[var(--foreground)]">{item.name}</h2>
                <p className="mt-3 line-clamp-4 text-sm leading-7 text-[var(--foreground-soft)]">{item.description}</p>
                <div className="mt-4 text-sm font-semibold text-cyan-300">{t.open}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </EventsPageShell>
  );
}