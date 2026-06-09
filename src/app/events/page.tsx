'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import AppSidebarMenu, { type SidebarMenuItem } from '@/components/AppSidebarMenu';
import { Navbar } from '@/components/Navbar';
import PageQuickLinksToolbar from '@/components/PageQuickLinksToolbar';
import { useI18n } from '@/lib/i18n/i18n-context';
import { eventGuideItems } from '@/lib/static/events';

type RotatingPreviewState = {
  currentIndex: number;
  visibleIndex: number;
  incomingIndex: number | null;
  isIncomingVisible: boolean;
};

function useRotatingPreview(slug: string) {
  const [state, setState] = useState<RotatingPreviewState>({
    currentIndex: 0,
    visibleIndex: 0,
    incomingIndex: null,
    isIncomingVisible: false,
  });

  useEffect(() => {
    const eventItem = eventGuideItems.find((item) => item.slug === slug);
    const imageVariants = eventItem?.listPreviewImageRotationSrcs ?? [];
    if (imageVariants.length < 2) {
      return;
    }

    let animationFrameId: number | null = null;
    let timeoutId: number | null = null;

    const intervalId = window.setInterval(() => {
      setState((current) => {
        let next = current.currentIndex;
        while (next === current.currentIndex) {
          next = Math.floor(Math.random() * imageVariants.length);
        }

        if (animationFrameId !== null) {
          window.cancelAnimationFrame(animationFrameId);
        }
        if (timeoutId !== null) {
          window.clearTimeout(timeoutId);
        }

        animationFrameId = window.requestAnimationFrame(() => {
          setState((previewState) => ({
            ...previewState,
            isIncomingVisible: true,
          }));
        });

        timeoutId = window.setTimeout(() => {
          setState((previewState) => ({
            ...previewState,
            visibleIndex: next,
            incomingIndex: null,
            isIncomingVisible: false,
          }));
        }, 850);

        return {
          currentIndex: next,
          visibleIndex: current.visibleIndex,
          incomingIndex: next,
          isIncomingVisible: false,
        };
      });
    }, 7000);

    return () => {
      window.clearInterval(intervalId);
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [slug]);

  return state;
}

export default function EventsPage() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const ninjaTowerPreview = useRotatingPreview('ninja-tower');
  const windfallTemplePreview = useRotatingPreview('windfall-temple');
  const { locale, messages } = useI18n();
  const sidebarItems: SidebarMenuItem[] = [
    { key: 'home', href: '/', label: messages.home.menuPageOne },
    { key: 'heroes', href: '/heroes', label: messages.home.menuPageTwo },
    { key: 'hero-coach', href: '/hero-coach', label: messages.home.navHeroCoach },
    { key: 'outfitter', href: '/outfitter', label: messages.home.navOutfitter },
    { key: 'troops', href: '/troops', label: messages.home.navTroops },
  ];

  const pageTitle = locale === 'ru' ? 'События' : 'Events';
  const pageSubtitle =
    locale === 'ru'
      ? 'Подборка игровых событий.'
      : 'A collection of game events.';

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
        <PageQuickLinksToolbar currentPath="/events" />

        <section className="w-full max-w-7xl">
          <div className="mb-8 rounded-[2rem] border border-cyan-400/12 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.18),transparent_42%),linear-gradient(180deg,var(--surface-strong),var(--surface))] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.18)] md:p-8">
            <h1 className="text-3xl font-black tracking-tight text-[var(--foreground)] md:text-5xl">
              {pageTitle}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--foreground-soft)] md:text-base">
              {pageSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {eventGuideItems.map((item) => {
              const title = locale === 'ru' ? item.titleRu : item.titleEn;
              const isActive = item.isActive === true;
              const shouldKeepFullColorWhenInactive = item.keepFullColorWhenInactive === true;
              const currentPreviewSrc =
                item.slug === 'ninja-tower' && item.listPreviewImageRotationSrcs && item.listPreviewImageRotationSrcs.length > 0
                  ? item.listPreviewImageRotationSrcs[ninjaTowerPreview.visibleIndex % item.listPreviewImageRotationSrcs.length]
                  : item.slug === 'windfall-temple' && item.listPreviewImageRotationSrcs && item.listPreviewImageRotationSrcs.length > 0
                    ? item.listPreviewImageRotationSrcs[windfallTemplePreview.visibleIndex % item.listPreviewImageRotationSrcs.length]
                  : item.listPreviewImageSrc ?? item.previewImageSrc;
              const incomingPreviewSrc =
                item.slug === 'ninja-tower' &&
                ninjaTowerPreview.incomingIndex !== null &&
                item.listPreviewImageRotationSrcs &&
                item.listPreviewImageRotationSrcs.length > 0
                  ? item.listPreviewImageRotationSrcs[ninjaTowerPreview.incomingIndex % item.listPreviewImageRotationSrcs.length]
                  : item.slug === 'windfall-temple' &&
                    windfallTemplePreview.incomingIndex !== null &&
                    item.listPreviewImageRotationSrcs &&
                    item.listPreviewImageRotationSrcs.length > 0
                    ? item.listPreviewImageRotationSrcs[windfallTemplePreview.incomingIndex % item.listPreviewImageRotationSrcs.length]
                  : null;
              const isIncomingPreviewVisible =
                item.slug === 'ninja-tower'
                  ? ninjaTowerPreview.isIncomingVisible
                  : item.slug === 'windfall-temple'
                    ? windfallTemplePreview.isIncomingVisible
                    : false;
              const usesWidePreview = Boolean(item.listPreviewImageSrc);
              const cardContent = (
                <article
                  className={`flex h-full flex-col rounded-[calc(1rem-2px)] bg-[var(--surface)] p-4 transition ${
                    isActive || shouldKeepFullColorWhenInactive ? '' : 'opacity-70 saturate-0'
                  }`}
                >
                  <div className="mb-4 overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_56%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                    <div className="relative aspect-[3/4] w-full overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),transparent_58%)]" />
                      <Image
                        src={currentPreviewSrc}
                        alt={title}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        className={`relative z-10 transition-[opacity,transform] duration-700 ease-in-out ${
                          usesWidePreview ? 'object-cover object-center' : 'object-contain object-top p-4'
                        } ${
                          isActive ? 'scale-[0.96] group-hover:scale-100 group-active:scale-[0.93]' : 'scale-[0.94]'
                        }`}
                      />
                      {incomingPreviewSrc ? (
                        <Image
                          src={incomingPreviewSrc}
                          alt={title}
                          fill
                          sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                          className={`absolute inset-0 z-20 transition-opacity duration-700 ease-in-out ${
                            usesWidePreview ? 'object-cover object-center' : 'object-contain object-top p-4'
                          } ${
                            isActive ? 'scale-[0.96] group-hover:scale-100 group-active:scale-[0.93]' : 'scale-[0.94]'
                          }`}
                          style={{ opacity: isIncomingPreviewVisible ? 1 : 0 }}
                        />
                      ) : null}
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/18 to-transparent" />
                    </div>
                  </div>

                  <div className="mt-auto">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground-soft)]">
                      {locale === 'ru' ? 'Событие' : 'Event'}
                    </div>
                    <h2 className="mt-2 text-base font-bold leading-tight text-[var(--foreground)] md:text-lg">
                      {title}
                    </h2>
                  </div>
                </article>
              );

              if (isActive) {
                return (
                  <Link
                    key={item.slug}
                    href={`/events/${item.slug}`}
                    className={`group overflow-hidden rounded-2xl border p-[2px] transition duration-200 hover:-translate-y-1 hover:brightness-110 active:translate-y-[1px] active:scale-[0.985] ${item.accentClassName}`}
                  >
                    {cardContent}
                  </Link>
                );
              }

              return (
                <div
                  key={item.slug}
                  className={`overflow-hidden rounded-2xl border p-[2px] ${item.accentClassName} ${
                    shouldKeepFullColorWhenInactive ? '' : 'grayscale-[0.85]'
                  }`}
                >
                  {cardContent}
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

