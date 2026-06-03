'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Navbar } from '@/components/Navbar';
import PageQuickLinksToolbar from '@/components/PageQuickLinksToolbar';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n/i18n-context';
import { eventGuideItems } from '@/lib/static/events';

export default function EventsPage() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [ninjaTowerImageIndex, setNinjaTowerImageIndex] = useState(0);
  const [ninjaTowerVisibleImageIndex, setNinjaTowerVisibleImageIndex] = useState(0);
  const [ninjaTowerIncomingImageIndex, setNinjaTowerIncomingImageIndex] = useState<number | null>(null);
  const [isNinjaTowerIncomingImageVisible, setIsNinjaTowerIncomingImageVisible] = useState(false);
  const [windfallTempleImageIndex, setWindfallTempleImageIndex] = useState(0);
  const [windfallTempleVisibleImageIndex, setWindfallTempleVisibleImageIndex] = useState(0);
  const [windfallTempleIncomingImageIndex, setWindfallTempleIncomingImageIndex] = useState<number | null>(null);
  const [isWindfallTempleIncomingImageVisible, setIsWindfallTempleIncomingImageVisible] = useState(false);
  const { authenticated } = useAuth();
  const { locale, messages } = useI18n();

  useEffect(() => {
    const ninjaTowerItem = eventGuideItems.find((item) => item.slug === 'ninja-tower');
    const imageVariants = ninjaTowerItem?.listPreviewImageRotationSrcs ?? [];
    if (imageVariants.length < 2) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setNinjaTowerImageIndex((current) => {
        let next = current;
        while (next === current) {
          next = Math.floor(Math.random() * imageVariants.length);
        }
        return next;
      });
    }, 7000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (ninjaTowerImageIndex === ninjaTowerVisibleImageIndex) {
      return;
    }

    setNinjaTowerIncomingImageIndex(ninjaTowerImageIndex);
    setIsNinjaTowerIncomingImageVisible(false);

    const animationFrameId = window.requestAnimationFrame(() => {
      setIsNinjaTowerIncomingImageVisible(true);
    });

    const timeoutId = window.setTimeout(() => {
      setNinjaTowerVisibleImageIndex(ninjaTowerImageIndex);
      setNinjaTowerIncomingImageIndex(null);
      setIsNinjaTowerIncomingImageVisible(false);
    }, 850);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.clearTimeout(timeoutId);
    };
  }, [ninjaTowerImageIndex, ninjaTowerVisibleImageIndex]);

  useEffect(() => {
    const windfallTempleItem = eventGuideItems.find((item) => item.slug === 'windfall-temple');
    const imageVariants = windfallTempleItem?.listPreviewImageRotationSrcs ?? [];
    if (imageVariants.length < 2) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setWindfallTempleImageIndex((current) => {
        let next = current;
        while (next === current) {
          next = Math.floor(Math.random() * imageVariants.length);
        }
        return next;
      });
    }, 7000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (windfallTempleImageIndex === windfallTempleVisibleImageIndex) {
      return;
    }

    setWindfallTempleIncomingImageIndex(windfallTempleImageIndex);
    setIsWindfallTempleIncomingImageVisible(false);

    const animationFrameId = window.requestAnimationFrame(() => {
      setIsWindfallTempleIncomingImageVisible(true);
    });

    const timeoutId = window.setTimeout(() => {
      setWindfallTempleVisibleImageIndex(windfallTempleImageIndex);
      setWindfallTempleIncomingImageIndex(null);
      setIsWindfallTempleIncomingImageVisible(false);
    }, 850);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.clearTimeout(timeoutId);
    };
  }, [windfallTempleImageIndex, windfallTempleVisibleImageIndex]);

  const pageTitle = locale === 'ru' ? 'События' : 'Events';
  const pageSubtitle =
    locale === 'ru'
      ? 'Подборка игровых событий.'
      : 'A collection of game events.';

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
                  {messages.home.menuPageOne}
                </Link>
              </li>
              <li>
                <Link
                  href="/heroes"
                  onClick={() => setSidebarOpen(false)}
                  className="block text-[var(--foreground-muted)] transition hover:text-[var(--foreground)]"
                >
                  {messages.home.menuPageTwo}
                </Link>
              </li>
              <li>
                <Link
                  href="/hero-coach"
                  onClick={() => setSidebarOpen(false)}
                  className="block text-[var(--foreground-muted)] transition hover:text-[var(--foreground)]"
                >
                  {messages.home.navHeroCoach}
                </Link>
              </li>
              <li>
                <Link
                  href="/outfitter"
                  onClick={() => setSidebarOpen(false)}
                  className="block text-[var(--foreground-muted)] transition hover:text-[var(--foreground)]"
                >
                  {messages.home.navOutfitter}
                </Link>
              </li>
              <li>
                <Link
                  href="/troops"
                  onClick={() => setSidebarOpen(false)}
                  className="block text-[var(--foreground-muted)] transition hover:text-[var(--foreground)]"
                >
                  {locale === 'ru' ? '\u041E\u0442\u0440\u044F\u0434\u044B' : 'Troops'}
                </Link>
              </li>
              <li>
                <Link
                  href="/joint-purchases"
                  onClick={() => setSidebarOpen(false)}
                  className="block text-[var(--foreground-muted)] transition hover:text-[var(--foreground)]"
                >
                  <span className="block">{messages.home.navJointPurchases}</span>
                  {!authenticated ? (
                    <span className="mt-1 block text-xs text-[var(--foreground-soft)]">
                      {messages.home.navJointPurchasesAuthHint}
                    </span>
                  ) : null}
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
                  ? item.listPreviewImageRotationSrcs[ninjaTowerVisibleImageIndex % item.listPreviewImageRotationSrcs.length]
                  : item.slug === 'windfall-temple' && item.listPreviewImageRotationSrcs && item.listPreviewImageRotationSrcs.length > 0
                    ? item.listPreviewImageRotationSrcs[windfallTempleVisibleImageIndex % item.listPreviewImageRotationSrcs.length]
                  : item.listPreviewImageSrc ?? item.previewImageSrc;
              const incomingPreviewSrc =
                item.slug === 'ninja-tower' &&
                ninjaTowerIncomingImageIndex !== null &&
                item.listPreviewImageRotationSrcs &&
                item.listPreviewImageRotationSrcs.length > 0
                  ? item.listPreviewImageRotationSrcs[ninjaTowerIncomingImageIndex % item.listPreviewImageRotationSrcs.length]
                  : item.slug === 'windfall-temple' &&
                    windfallTempleIncomingImageIndex !== null &&
                    item.listPreviewImageRotationSrcs &&
                    item.listPreviewImageRotationSrcs.length > 0
                    ? item.listPreviewImageRotationSrcs[windfallTempleIncomingImageIndex % item.listPreviewImageRotationSrcs.length]
                  : null;
              const isIncomingPreviewVisible =
                item.slug === 'ninja-tower'
                  ? isNinjaTowerIncomingImageVisible
                  : item.slug === 'windfall-temple'
                    ? isWindfallTempleIncomingImageVisible
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

