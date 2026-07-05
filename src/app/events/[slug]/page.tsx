'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import EventsAdminLinkBadge from '@/components/events/EventsAdminLinkBadge';
import EventRichText from '@/components/events/EventRichText';
import EventsPageShell from '@/components/events/EventsPageShell';
import ZoomableEventImage from '@/components/events/ZoomableEventImage';
import { useI18n } from '@/lib/i18n/i18n-context';
import type { PublicEventDetails } from '@/lib/types/event';
import { ApiError, useApi } from '@/lib/use-api';

export default function EventDetailsPage() {
  const params = useParams<{ slug: string }>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const { apiJson } = useApi();
  const { locale } = useI18n();
  const [event, setEvent] = useState<PublicEventDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const language = locale === 'ru' ? 'RU' : 'EN';

  const t = useMemo(
    () =>
      locale === 'ru'
        ? {
            publicBadge: 'Публичная страница',
            back: 'Все события',
            emptyBlocks: 'Для этого события пока не добавлены блоки.',
            loading: 'Загрузка события...',
            notFound: 'Событие не найдено.',
          }
        : {
            publicBadge: 'Public page',
            back: 'All events',
            emptyBlocks: 'No blocks were added to this event yet.',
            loading: 'Loading event...',
            notFound: 'Event not found.',
          },
    [locale],
  );

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setErrorMessage(null);
        const response = await apiJson<PublicEventDetails>(`/api/v1/public/events/${slug}?language=${language}`);
        if (!cancelled) {
          setEvent(response);
        }
      } catch (error) {
        if (!cancelled) {
          setEvent(null);
          setErrorMessage(error instanceof ApiError || error instanceof Error ? error.message : t.notFound);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    if (slug) {
      void load();
    }

    return () => {
      cancelled = true;
    };
  }, [apiJson, language, slug, t.notFound]);

  return (
    <EventsPageShell currentPath="/events">
      <div className="mb-6">
        <Link href="/events" className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--foreground-muted)] transition hover:border-cyan-400/20 hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]">{t.back}</Link>
      </div>

      {loading ? (
        <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-10 text-center text-[var(--foreground-soft)] shadow-sm">{t.loading}</div>
      ) : !event ? (
        <div className="rounded-[2rem] border border-red-400/20 bg-red-400/10 p-10 text-center text-red-300 shadow-sm">{errorMessage ?? t.notFound}</div>
      ) : (
        <>
          <section className="overflow-hidden rounded-[2rem] border border-cyan-400/16 bg-[linear-gradient(180deg,var(--surface-strong),var(--surface))] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.18)] md:p-8">
            <div className="flex flex-col gap-6">
              <div className="min-w-0 flex-1">
                <div className="mb-3 flex flex-wrap gap-2">
                  <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-300">{t.publicBadge}</span>
                  <EventsAdminLinkBadge />
                </div>
                <h1 className="text-3xl font-black tracking-tight text-[var(--foreground)] md:text-5xl">{event.name}</h1>
                <EventRichText text={event.description} className="mt-4 max-w-4xl space-y-4" />
              </div>
            </div>
          </section>

          <section className="mt-8 rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm md:p-8">
            {event.blocks.length === 0 ? (
              <p className="text-sm leading-7 text-[var(--foreground-soft)]">{t.emptyBlocks}</p>
            ) : (
              <div className="space-y-8">
                {event.blocks.map((block) => (
                  <article key={block.id} className="overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-[linear-gradient(180deg,var(--surface-strong),var(--surface))] p-5 md:p-6">
                    <div className="space-y-5">
                      <div>
                        <h3 className="text-xl font-bold text-[var(--foreground)]">{block.name}</h3>
                        <EventRichText text={block.description} className="mt-4 space-y-4" />
                      </div>

                      {block.imageUrl ? (
                        <div className="pt-2">
                          <ZoomableEventImage src={block.imageUrl} alt={block.name} locale={locale} />
                        </div>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </EventsPageShell>
  );
}
