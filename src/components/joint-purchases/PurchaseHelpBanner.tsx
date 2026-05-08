'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { ExternalLink, MessageCircle, X } from 'lucide-react';

import HeroInfoPopover from '@/components/heroes/admin/HeroInfoPopover';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n/i18n-context';

const TELEGRAM_HANDLE = 'gameops_platform';
const TELEGRAM_APP_URL = `tg://resolve?domain=${TELEGRAM_HANDLE}`;
const TELEGRAM_WEB_URL = `https://t.me/${TELEGRAM_HANDLE}`;
const STORE_URL = 'https://www.empiresandpuzzles.com/ru#gempacks';
const COLLAPSE_STORAGE_KEY = 'joint-purchase-help-banner-collapsed-until';
const COLLAPSE_DURATION_MS = 24 * 60 * 60 * 1000;

function getInitialCollapsedState(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const collapsedUntilRaw = window.localStorage.getItem(COLLAPSE_STORAGE_KEY);
  if (!collapsedUntilRaw) {
    return false;
  }

  const collapsedUntil = Number(collapsedUntilRaw);
  if (!Number.isFinite(collapsedUntil)) {
    window.localStorage.removeItem(COLLAPSE_STORAGE_KEY);
    return false;
  }

  if (collapsedUntil > Date.now()) {
    return true;
  }

  window.localStorage.removeItem(COLLAPSE_STORAGE_KEY);
  return false;
}

type PurchaseHelpImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

type PurchaseHelpStep = {
  title: string;
  description: string;
  images: PurchaseHelpImage[];
  extraContent?: 'store-link';
};

const purchaseHelpSteps: PurchaseHelpStep[] = [
  {
    title: 'Шаг 1',
    description:
      'Вы выбираете нужную акцию. Во многих предложениях таким способом можно получить дополнительные бонусы.',
    extraContent: 'store-link',
    images: [
      {
        src: '/joint-purchases/purchase-help/step-1-offer.png',
        alt: 'Пример акционного предложения в игре',
        width: 1080,
        height: 760,
      },
    ],
  },
  {
    title: 'Шаг 2',
    description:
      'Я отправляю одноразовые реквизиты европейской банковской карты для безопасной онлайн-оплаты.',
    images: [
      {
        src: '/joint-purchases/purchase-help/step-2-card-details.png',
        alt: 'Сообщение с реквизитами карты',
        width: 209,
        height: 101,
      },
    ],
  },
  {
    title: 'Шаг 3',
    description:
      'Вы пробуете провести платеж. После этого я вижу, какая сумма требуется для списания.',
    images: [
      {
        src: '/joint-purchases/purchase-help/step-3-payment-declined.png',
        alt: 'Экран отклоненного платежа',
        width: 591,
        height: 1280,
      },
      {
        src: '/joint-purchases/purchase-help/step-3-bank-notification.png',
        alt: 'Банковское уведомление о нехватке средств',
        width: 1212,
        height: 380,
      },
    ],
  },
  {
    title: 'Шаг 4',
    description:
      'После этого я сообщаю, какая стоимость в рублях будет у данной акции, и вы переводите нужную сумму в рублях на указанную мной российскую карту, после чего я пополняю одноразовую карту.',
    images: [],
  },
  {
    title: 'Шаг 5',
    description: 'Вы повторно проводите платеж и завершаете покупку.',
    images: [
      {
        src: '/joint-purchases/purchase-help/step-5-payment-success-bank.png',
        alt: 'Банковское уведомление об успешном списании',
        width: 1125,
        height: 274,
      },
      {
        src: '/joint-purchases/purchase-help/step-5-payment-success-game.png',
        alt: 'Экран успешной покупки в игре',
        width: 591,
        height: 1280,
      },
    ],
  },
];

export default function PurchaseHelpBanner() {
  const { locale } = useI18n();
  const { authenticated, roles } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isHiddenForScreenshots, setIsHiddenForScreenshots] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(getInitialCollapsedState);

  const isAdmin = roles.includes('ROLE_admin') || roles.includes('ROLE_superadmin');
  const canHideCompletely = isAdmin;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (locale !== 'ru' || isHiddenForScreenshots) {
    return null;
  }

  const handleTelegramClick = () => {
    window.location.href = TELEGRAM_APP_URL;

    window.setTimeout(() => {
      window.open(TELEGRAM_WEB_URL, '_blank', 'noopener,noreferrer');
    }, 700);
  };

  const handleOpenDetails = () => {
    if (!authenticated) {
      return;
    }

    setIsOpen(true);
  };

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const nextValue = !prev;

      if (typeof window !== 'undefined') {
        if (nextValue) {
          window.localStorage.setItem(
            COLLAPSE_STORAGE_KEY,
            String(Date.now() + COLLAPSE_DURATION_MS),
          );
        } else {
          window.localStorage.removeItem(COLLAPSE_STORAGE_KEY);
        }
      }

      return nextValue;
    });
  };

  return (
    <>
      <section className="mx-auto w-full max-w-7xl px-4 pt-6">
        <div className="overflow-hidden rounded-[1.5rem] border border-amber-400/30 bg-[linear-gradient(135deg,rgba(245,158,11,0.22),rgba(249,115,22,0.16)_45%,rgba(15,23,42,0.94))] shadow-[0_20px_56px_rgba(0,0,0,0.20)]">
          <button
            type="button"
            onClick={toggleCollapsed}
            className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition hover:bg-white/5 md:px-5"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/12 bg-white/10 text-amber-100">
              <MessageCircle className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[clamp(0.72rem,1.8vw,0.95rem)] font-black leading-tight text-white">
                Помощь с покупкой акционных предложений без передачи аккаунта и с получением
                дополнительных бонусов
              </div>
            </div>
            <div className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.1em] text-amber-100/85">
              {isCollapsed ? 'Развернуть' : 'Свернуть'}
            </div>
          </button>

          {!isCollapsed ? (
            <div className="px-4 py-4 md:px-5 md:py-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="max-w-4xl">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/8 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-amber-100/90">
                      <MessageCircle className="h-3 w-3" />
                      Новый способ покупки
                    </div>
                    {!authenticated ? (
                      <div className="inline-flex items-center rounded-full border border-white/12 bg-black/15 px-2 py-0.5 text-[9px] font-medium text-amber-50/80">
                        Доступно после входа
                      </div>
                    ) : null}
                    {canHideCompletely ? (
                      <button
                        type="button"
                        onClick={() => setIsHiddenForScreenshots(true)}
                        className="inline-flex items-center rounded-full border border-white/12 bg-black/15 px-2 py-0.5 text-[9px] font-medium text-amber-50/80 transition hover:bg-black/25"
                      >
                        Скрыть для скриншотов
                      </button>
                    ) : null}
                  </div>
                  <h2 className="mt-2 text-base font-black leading-tight text-white md:text-lg">
                    Помощь с покупкой акционных предложений без передачи аккаунта и с получением
                    дополнительных бонусов
                  </h2>
                  <p className="mt-1.5 max-w-3xl text-[10px] leading-4 text-amber-50/85 md:text-[11px]">
                    Нажмите, чтобы посмотреть пошаговый сценарий, примеры экранов и способ связи в
                    Telegram.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 self-start md:self-center">
                  <button
                    type="button"
                    onClick={handleOpenDetails}
                    disabled={!authenticated}
                    className="inline-flex items-center justify-center rounded-xl border border-white/12 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-white/14 disabled:cursor-not-allowed disabled:opacity-65 disabled:hover:bg-white/10"
                  >
                    Открыть подробности
                  </button>
                  {!authenticated ? (
                    <HeroInfoPopover
                      label="Почему недоступно"
                      content="Войдите в аккаунт, чтобы открыть инструкцию."
                    />
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {isOpen ? (
        <div
          className="fixed inset-0 z-[85] overflow-y-auto bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <div className="flex min-h-full items-start justify-center py-4">
            <div
              className="flex max-h-[calc(100dvh-2rem)] min-h-0 w-full max-w-5xl flex-col overflow-y-auto overscroll-contain rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] shadow-2xl [webkit-overflow-scrolling:touch]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-5 py-5 sm:px-6">
                <div className="max-w-3xl">
                  <h3 className="text-xl font-black leading-tight text-[var(--foreground)] sm:text-2xl">
                    Помощь с покупкой акционных предложений без передачи аккаунта и с получением
                    дополнительных бонусов
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--foreground-soft)]">
                    Понимаю, что сейчас у части игроков могут быть сложности с оплатой акционных
                    предложений.
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[var(--foreground-soft)]">
                    Если у вас не проходит оплата из России, можно связаться со мной и обсудить
                    помощь с проведением покупки.
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[var(--foreground-soft)]">
                    Сценарий простой: вы открываете нужное предложение в игре, мы согласуем шаги,
                    после чего пробуем провести оплату в безопасном формате.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-4">
                    <span className="text-sm text-[var(--foreground)]">
                      Если вам нужна такая помощь, свяжитесь со мной удобным способом:
                    </span>
                    <button
                      type="button"
                      onClick={handleTelegramClick}
                      className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/25 bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-[var(--surface-hover)]"
                    >
                      @{TELEGRAM_HANDLE}
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 text-[var(--foreground-soft)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="px-5 py-5 sm:px-6 sm:py-6">
                <div className="space-y-5">
                  {purchaseHelpSteps.map((step) => (
                    <section
                      key={step.title}
                      className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5"
                    >
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
                        {step.title}
                      </div>

                      {step.extraContent === 'store-link' ? (
                        <div className="mt-3 space-y-3 text-sm leading-7 text-[var(--foreground-soft)]">
                          <p>
                            Включите VPN (хотя он у вас уже должен быть включен, иначе как вы тут
                            оказались?:D), потом откройте ссылку на магазин:{' '}
                            <a
                              href={STORE_URL}
                              target="_blank"
                              rel="noreferrer"
                              className="font-medium text-cyan-300 underline decoration-cyan-400/40 underline-offset-4 transition hover:text-cyan-200"
                            >
                              Магазин
                            </a>
                          </p>
                          <p>{step.description}</p>
                        </div>
                      ) : (
                        <p className="mt-3 text-sm leading-7 text-[var(--foreground-soft)]">
                          {step.description}
                        </p>
                      )}

                      {step.images.length > 0 ? (
                        <div
                          className={`mt-4 grid gap-4 ${
                            step.images.length > 1 ? 'md:grid-cols-2' : ''
                          }`}
                        >
                          {step.images.map((image) => (
                            <div
                              key={image.src}
                              className="overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-slate-950/40"
                            >
                              <Image
                                src={image.src}
                                alt={image.alt}
                                width={image.width}
                                height={image.height}
                                className="h-auto w-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </section>
                  ))}

                  <section className="rounded-[1.75rem] border border-emerald-400/20 bg-emerald-400/10 p-4 sm:p-5">
                    <p className="text-sm font-semibold leading-7 text-[var(--foreground)]">
                      Никакой передачи аккаунта. Те же расходы, но с возможностью получить
                      дополнительные бонусы по акции.
                    </p>
                  </section>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
