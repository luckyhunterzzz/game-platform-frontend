'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { BadgeCheck, ExternalLink, Gem, MessageCircle, ShieldCheck, Sparkles, X } from 'lucide-react';

import { useI18n } from '@/lib/i18n/i18n-context';

const TELEGRAM_HANDLE = 'gameops_platform';
const TELEGRAM_APP_URL = `tg://resolve?domain=${TELEGRAM_HANDLE}`;
const TELEGRAM_WEB_URL = `https://t.me/${TELEGRAM_HANDLE}`;
const STORE_URL = 'https://www.empiresandpuzzles.com/ru#gempacks';

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

const copy = {
  pillTitle: '\u041f\u043e\u043c\u043e\u0449\u044c \u0441 \u0434\u043e\u043d\u0430\u0442\u043e\u043c \u0438 \u043f\u043e\u043a\u0443\u043f\u043a\u043e\u0439 \u0430\u043a\u0446\u0438\u0439',
  pillSubtitle: '\u0411\u0435\u0437 \u043f\u0435\u0440\u0435\u0434\u0430\u0447\u0438 \u0430\u043a\u043a\u0430\u0443\u043d\u0442\u0430, \u0441 \u0441\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u0438\u0435\u043c \u0431\u043e\u043d\u0443\u0441\u043e\u0432',
  modalTitle:
    '\u041f\u043e\u043c\u043e\u0449\u044c \u0441 \u043f\u043e\u043a\u0443\u043f\u043a\u043e\u0439 \u0430\u043a\u0446\u0438\u043e\u043d\u043d\u044b\u0445 \u043f\u0440\u0435\u0434\u043b\u043e\u0436\u0435\u043d\u0438\u0439 \u0431\u0435\u0437 \u043f\u0435\u0440\u0435\u0434\u0430\u0447\u0438 \u0430\u043a\u043a\u0430\u0443\u043d\u0442\u0430 \u0438 \u0441 \u043f\u043e\u043b\u0443\u0447\u0435\u043d\u0438\u0435\u043c \u0434\u043e\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u044c\u043d\u044b\u0445 \u0431\u043e\u043d\u0443\u0441\u043e\u0432',
  intro1:
    '\u041f\u043e\u043d\u0438\u043c\u0430\u044e, \u0447\u0442\u043e \u0441\u0435\u0439\u0447\u0430\u0441 \u0443 \u0447\u0430\u0441\u0442\u0438 \u0438\u0433\u0440\u043e\u043a\u043e\u0432 \u043c\u043e\u0433\u0443\u0442 \u0431\u044b\u0442\u044c \u0441\u043b\u043e\u0436\u043d\u043e\u0441\u0442\u0438 \u0441 \u043e\u043f\u043b\u0430\u0442\u043e\u0439 \u0430\u043a\u0446\u0438\u043e\u043d\u043d\u044b\u0445 \u043f\u0440\u0435\u0434\u043b\u043e\u0436\u0435\u043d\u0438\u0439.',
  intro2:
    '\u0415\u0441\u043b\u0438 \u0443 \u0432\u0430\u0441 \u043d\u0435 \u043f\u0440\u043e\u0445\u043e\u0434\u0438\u0442 \u043e\u043f\u043b\u0430\u0442\u0430 \u0438\u0437 \u0420\u043e\u0441\u0441\u0438\u0438, \u043c\u043e\u0436\u043d\u043e \u0441\u0432\u044f\u0437\u0430\u0442\u044c\u0441\u044f \u0441\u043e \u043c\u043d\u043e\u0439 \u0438 \u043e\u0431\u0441\u0443\u0434\u0438\u0442\u044c \u043f\u043e\u043c\u043e\u0449\u044c \u0441 \u043f\u0440\u043e\u0432\u0435\u0434\u0435\u043d\u0438\u0435\u043c \u043f\u043e\u043a\u0443\u043f\u043a\u0438.',
  intro3:
    '\u0421\u0446\u0435\u043d\u0430\u0440\u0438\u0439 \u043f\u0440\u043e\u0441\u0442\u043e\u0439: \u0432\u044b \u043e\u0442\u043a\u0440\u044b\u0432\u0430\u0435\u0442\u0435 \u043d\u0443\u0436\u043d\u043e\u0435 \u043f\u0440\u0435\u0434\u043b\u043e\u0436\u0435\u043d\u0438\u0435 \u0432 \u0438\u0433\u0440\u0435, \u043c\u044b \u0441\u043e\u0433\u043b\u0430\u0441\u0443\u0435\u043c \u0448\u0430\u0433\u0438, \u043f\u043e\u0441\u043b\u0435 \u0447\u0435\u0433\u043e \u043f\u0440\u043e\u0431\u0443\u0435\u043c \u043f\u0440\u043e\u0432\u0435\u0441\u0442\u0438 \u043e\u043f\u043b\u0430\u0442\u0443 \u0432 \u0431\u0435\u0437\u043e\u043f\u0430\u0441\u043d\u043e\u043c \u0444\u043e\u0440\u043c\u0430\u0442\u0435.',
  contact:
    '\u0415\u0441\u043b\u0438 \u0432\u0430\u043c \u043d\u0443\u0436\u043d\u0430 \u0442\u0430\u043a\u0430\u044f \u043f\u043e\u043c\u043e\u0449\u044c, \u0441\u0432\u044f\u0436\u0438\u0442\u0435\u0441\u044c \u0441\u043e \u043c\u043d\u043e\u0439 \u0443\u0434\u043e\u0431\u043d\u044b\u043c \u0441\u043f\u043e\u0441\u043e\u0431\u043e\u043c:',
  footer:
    '\u041d\u0438\u043a\u0430\u043a\u043e\u0439 \u043f\u0435\u0440\u0435\u0434\u0430\u0447\u0438 \u0430\u043a\u043a\u0430\u0443\u043d\u0442\u0430. \u0422\u0435 \u0436\u0435 \u0440\u0430\u0441\u0445\u043e\u0434\u044b, \u043d\u043e \u0441 \u0432\u043e\u0437\u043c\u043e\u0436\u043d\u043e\u0441\u0442\u044c\u044e \u043f\u043e\u043b\u0443\u0447\u0438\u0442\u044c \u0434\u043e\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u044c\u043d\u044b\u0435 \u0431\u043e\u043d\u0443\u0441\u044b \u043f\u043e \u0430\u043a\u0446\u0438\u0438.',
  vpnIntro: '\u0412\u043a\u043b\u044e\u0447\u0438\u0442\u0435 VPN, \u043f\u043e\u0442\u043e\u043c \u043e\u0442\u043a\u0440\u043e\u0439\u0442\u0435 \u0441\u0441\u044b\u043b\u043a\u0443 \u043d\u0430 \u043c\u0430\u0433\u0430\u0437\u0438\u043d:',
  storeLabel: '\u041c\u0430\u0433\u0430\u0437\u0438\u043d',
};

const purchaseHelpSteps: PurchaseHelpStep[] = [
  {
    title: '\u0428\u0430\u0433 1',
    description:
      '\u0412\u044b \u0432\u044b\u0431\u0438\u0440\u0430\u0435\u0442\u0435 \u043d\u0443\u0436\u043d\u0443\u044e \u0430\u043a\u0446\u0438\u044e. \u0412\u043e \u043c\u043d\u043e\u0433\u0438\u0445 \u043f\u0440\u0435\u0434\u043b\u043e\u0436\u0435\u043d\u0438\u044f\u0445 \u0442\u0430\u043a\u0438\u043c \u0441\u043f\u043e\u0441\u043e\u0431\u043e\u043c \u043c\u043e\u0436\u043d\u043e \u043f\u043e\u043b\u0443\u0447\u0438\u0442\u044c \u0434\u043e\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u044c\u043d\u044b\u0435 \u0431\u043e\u043d\u0443\u0441\u044b.',
    extraContent: 'store-link',
    images: [
      {
        src: '/joint-purchases/purchase-help/step-1-offer.png',
        alt: '\u041f\u0440\u0438\u043c\u0435\u0440 \u0430\u043a\u0446\u0438\u043e\u043d\u043d\u043e\u0433\u043e \u043f\u0440\u0435\u0434\u043b\u043e\u0436\u0435\u043d\u0438\u044f \u0432 \u0438\u0433\u0440\u0435',
        width: 1080,
        height: 760,
      },
    ],
  },
  {
    title: '\u0428\u0430\u0433 2',
    description:
      '\u042f\u0020\u043e\u0442\u043f\u0440\u0430\u0432\u043b\u044f\u044e\u0020\u0438\u043d\u0444\u043e\u0440\u043c\u0430\u0446\u0438\u044e\u002c\u0434\u043b\u044f\u0020\u0431\u0435\u0437\u043e\u043f\u0430\u0441\u043d\u043e\u0439\u0020\u043e\u043d\u043b\u0430\u0439\u043d\u0020\u043e\u043f\u043b\u0430\u0442\u044b',
    images: [],
  },
  {
    title: '\u0428\u0430\u0433 3',
    description:
      '\u0412\u044b \u043f\u0440\u043e\u0431\u0443\u0435\u0442\u0435 \u043f\u0440\u043e\u0432\u0435\u0441\u0442\u0438 \u043f\u043b\u0430\u0442\u0435\u0436. \u041f\u043e\u0441\u043b\u0435 \u044d\u0442\u043e\u0433\u043e \u044f \u0432\u0438\u0436\u0443, \u043a\u0430\u043a\u0430\u044f \u0441\u0443\u043c\u043c\u0430 \u0442\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044f \u0434\u043b\u044f \u0441\u043f\u0438\u0441\u0430\u043d\u0438\u044f.',
    images: [
      {
        src: '/joint-purchases/purchase-help/step-3-payment-declined.png',
        alt: '\u042d\u043a\u0440\u0430\u043d \u043e\u0442\u043a\u043b\u043e\u043d\u0435\u043d\u043d\u043e\u0433\u043e \u043f\u043b\u0430\u0442\u0435\u0436\u0430',
        width: 591,
        height: 1280,
      },
      {
        src: '/joint-purchases/purchase-help/step-3-bank-notification.png',
        alt: '\u0411\u0430\u043d\u043a\u043e\u0432\u0441\u043a\u043e\u0435 \u0443\u0432\u0435\u0434\u043e\u043c\u043b\u0435\u043d\u0438\u0435 \u043e \u043d\u0435\u0445\u0432\u0430\u0442\u043a\u0435 \u0441\u0440\u0435\u0434\u0441\u0442\u0432',
        width: 1212,
        height: 380,
      },
    ],
  },
  {
    title: '\u0428\u0430\u0433 4',
    description:
      '\u041f\u043e\u0441\u043b\u0435\u0020\u044d\u0442\u043e\u0433\u043e\u0020\u044f\u0020\u0441\u043e\u043e\u0431\u0449\u0430\u044e\u002c\u0020\u043a\u0430\u043a\u0430\u044f\u0020\u0441\u0442\u043e\u0438\u043c\u043e\u0441\u0442\u044c\u0020\u0432\u0020\u0440\u0443\u0431\u043b\u044f\u0445\u0020\u0431\u0443\u0434\u0435\u0442\u0020\u0443\u0020\u0434\u0430\u043d\u043d\u043e\u0439\u0020\u0430\u043a\u0446\u0438\u0438\u002c\u0020\u0438\u0020\u0432\u044b\u0020\u043f\u0435\u0440\u0435\u0432\u043e\u0434\u0438\u0442\u0435\u0020\u043d\u0443\u0436\u043d\u0443\u044e\u0020\u0441\u0443\u043c\u043c\u0443\u0020\u0432\u0020\u0440\u0443\u0431\u043b\u044f\u0445\u0020\u043d\u0430\u0020\u0443\u043a\u0430\u0437\u0430\u043d\u043d\u0443\u044e\u0020\u043c\u043d\u043e\u0439\u0020\u0440\u043e\u0441\u0441\u0438\u0439\u0441\u043a\u0443\u044e\u0020\u043a\u0430\u0440\u0442\u0443\u002e',
    images: [],
  },
  {
    title: '\u0428\u0430\u0433 5',
    description: '\u0412\u044b \u043f\u043e\u0432\u0442\u043e\u0440\u043d\u043e \u043f\u0440\u043e\u0432\u043e\u0434\u0438\u0442\u0435 \u043f\u043b\u0430\u0442\u0435\u0436 \u0438 \u0437\u0430\u0432\u0435\u0440\u0448\u0430\u0435\u0442\u0435 \u043f\u043e\u043a\u0443\u043f\u043a\u0443.',
    images: [
      {
        src: '/joint-purchases/purchase-help/step-5-payment-success-bank.png',
        alt: '\u0411\u0430\u043d\u043a\u043e\u0432\u0441\u043a\u043e\u0435 \u0443\u0432\u0435\u0434\u043e\u043c\u043b\u0435\u043d\u0438\u0435 \u043e\u0431 \u0443\u0441\u043f\u0435\u0448\u043d\u043e\u043c \u0441\u043f\u0438\u0441\u0430\u043d\u0438\u0438',
        width: 1125,
        height: 274,
      },
      {
        src: '/joint-purchases/purchase-help/step-5-payment-success-game.png',
        alt: '\u042d\u043a\u0440\u0430\u043d \u0443\u0441\u043f\u0435\u0448\u043d\u043e\u0439 \u043f\u043e\u043a\u0443\u043f\u043a\u0438 \u0432 \u0438\u0433\u0440\u0435',
        width: 591,
        height: 1280,
      },
    ],
  },
];

const purchaseHelpStepStyles = [
  {
    border: 'border-fuchsia-400/20',
    badge: 'border-fuchsia-300/30 bg-fuchsia-400/15 text-fuchsia-100',
    glow: 'bg-fuchsia-500/15',
  },
  {
    border: 'border-blue-400/20',
    badge: 'border-blue-300/30 bg-blue-400/15 text-blue-100',
    glow: 'bg-blue-500/15',
  },
  {
    border: 'border-violet-400/20',
    badge: 'border-violet-300/30 bg-violet-400/15 text-violet-100',
    glow: 'bg-violet-500/15',
  },
  {
    border: 'border-cyan-400/20',
    badge: 'border-cyan-300/30 bg-cyan-400/15 text-cyan-100',
    glow: 'bg-cyan-500/15',
  },
  {
    border: 'border-emerald-400/20',
    badge: 'border-emerald-300/30 bg-emerald-400/15 text-emerald-100',
    glow: 'bg-emerald-500/15',
  },
];

export default function PurchaseHelpNavbarNotice() {
  const { locale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

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

  if (locale !== 'ru') {
    return null;
  }

  const handleTelegramClick = () => {
    window.location.href = TELEGRAM_APP_URL;

    window.setTimeout(() => {
      window.open(TELEGRAM_WEB_URL, '_blank', 'noopener,noreferrer');
    }, 700);
  };

  const modal = isOpen
    ? createPortal(
        <div
          className="fixed inset-0 z-[140] overflow-y-auto bg-slate-950/85 p-2 backdrop-blur-md sm:p-5"
          onClick={() => setIsOpen(false)}
        >
          <div className="flex min-h-full items-start justify-center py-1 sm:py-3">
            <section
              className="relative flex max-h-[calc(100dvh-1rem)] min-h-0 w-full max-w-6xl flex-col overflow-hidden rounded-[1.75rem] border border-fuchsia-400/20 bg-[var(--surface-strong)] shadow-[0_32px_100px_rgba(0,0,0,0.55)] sm:max-h-[calc(100dvh-2rem)] sm:rounded-[2.25rem]"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Закрыть"
                className="absolute right-3 top-3 z-20 rounded-2xl border border-white/10 bg-slate-950/55 p-2.5 text-white/70 shadow-lg backdrop-blur-md transition hover:border-fuchsia-300/30 hover:bg-slate-900 hover:text-white sm:right-5 sm:top-5"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [webkit-overflow-scrolling:touch]">
                <header className="relative overflow-hidden border-b border-fuchsia-400/15 px-5 py-7 sm:px-8 sm:py-9 lg:px-10">
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(217,70,239,0.2),transparent_30%),radial-gradient(circle_at_86%_12%,rgba(59,130,246,0.18),transparent_33%),linear-gradient(135deg,rgba(15,23,42,0.74),rgba(24,24,47,0.34))]" />
                  <div className="pointer-events-none absolute -left-16 top-8 h-48 w-48 rounded-full bg-fuchsia-500/10 blur-3xl" />
                  <div className="pointer-events-none absolute -right-20 bottom-0 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl" />

                  <div className="relative grid gap-6 pr-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-8 lg:pr-0">
                    <div className="max-w-3xl">
                      <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-300/20 bg-fuchsia-400/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-fuchsia-100 sm:text-xs">
                        <Sparkles className="h-3.5 w-3.5" />
                        {copy.pillSubtitle}
                      </div>

                      <div className="mt-5 flex items-start gap-4">
                        <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-fuchsia-300/25 bg-[linear-gradient(145deg,rgba(217,70,239,0.24),rgba(59,130,246,0.18))] text-fuchsia-100 shadow-[0_16px_38px_rgba(168,85,247,0.2)] sm:flex">
                          <Gem className="h-5 w-5" />
                        </div>
                        <h3 className="text-2xl font-black leading-[1.15] tracking-[-0.025em] text-[var(--foreground)] sm:text-3xl lg:text-[2.15rem]">
                          {copy.modalTitle}
                        </h3>
                      </div>

                      <div className="mt-5 grid gap-3 text-sm leading-7 text-[var(--foreground-soft)] sm:grid-cols-2">
                        <p className="rounded-2xl border border-white/[0.07] bg-white/[0.035] px-4 py-3.5">
                          {copy.intro1}
                        </p>
                        <p className="rounded-2xl border border-white/[0.07] bg-white/[0.035] px-4 py-3.5">
                          {copy.intro2}
                        </p>
                      </div>
                    </div>

                    <aside className="rounded-[1.6rem] border border-cyan-300/20 bg-[linear-gradient(145deg,rgba(34,211,238,0.11),rgba(59,130,246,0.07))] p-4 shadow-[0_18px_50px_rgba(8,145,178,0.12)] sm:p-5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
                          <MessageCircle className="h-4 w-4" />
                        </div>
                        <p className="pt-0.5 text-sm leading-6 text-[var(--foreground)]">{copy.contact}</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleTelegramClick}
                        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-300/25 bg-cyan-300/15 px-4 py-3 text-sm font-black text-cyan-100 shadow-[0_12px_30px_rgba(6,182,212,0.12)] transition hover:-translate-y-0.5 hover:border-cyan-200/40 hover:bg-cyan-300/20"
                      >
                        @{TELEGRAM_HANDLE}
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </aside>
                  </div>
                </header>

                <div className="px-4 py-5 sm:px-8 sm:py-7 lg:px-10">
                  <div className="mb-5 flex items-start gap-3 rounded-[1.4rem] border border-violet-300/15 bg-violet-400/[0.07] px-4 py-3.5 sm:px-5">
                    <BadgeCheck className="mt-1 h-4 w-4 shrink-0 text-violet-200" />
                    <p className="text-sm leading-7 text-[var(--foreground-soft)]">{copy.intro3}</p>
                  </div>

                  <div className="space-y-4">
                    {purchaseHelpSteps.map((step, index) => {
                      const stepStyle = purchaseHelpStepStyles[index % purchaseHelpStepStyles.length];

                      return (
                        <section
                          key={step.title}
                          className={`group relative overflow-hidden rounded-[1.65rem] border bg-[var(--surface)] p-4 shadow-[0_16px_42px_rgba(0,0,0,0.12)] sm:p-5 lg:p-6 ${stepStyle.border}`}
                        >
                          <div
                            className={`pointer-events-none absolute -right-14 -top-16 h-40 w-40 rounded-full blur-3xl transition duration-500 group-hover:scale-110 ${stepStyle.glow}`}
                          />

                          <div
                            className={`relative grid gap-5 lg:items-start lg:gap-7 ${
                              step.images.length > 0
                                ? 'lg:grid-cols-[minmax(14rem,0.7fr)_minmax(0,1.3fr)]'
                                : ''
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-3">
                                <span
                                  className={`flex h-10 min-w-10 items-center justify-center rounded-2xl border px-3 text-sm font-black shadow-lg ${stepStyle.badge}`}
                                >
                                  {String(index + 1).padStart(2, '0')}
                                </span>
                                <h4 className="text-lg font-black tracking-[-0.01em] text-[var(--foreground)]">
                                  {step.title}
                                </h4>
                              </div>

                              <p className="mt-4 text-sm leading-7 text-[var(--foreground-soft)]">
                                {step.description}
                              </p>

                              {step.extraContent === 'store-link' ? (
                                <a
                                  href={STORE_URL}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-cyan-300/25 bg-cyan-300/10 px-4 py-2.5 text-sm font-black text-cyan-200 transition hover:-translate-y-0.5 hover:border-cyan-200/40 hover:bg-cyan-300/15"
                                >
                                  {copy.storeLabel}
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              ) : null}
                            </div>

                            {step.images.length > 0 ? (
                              <div className={`grid gap-3 ${step.images.length > 1 ? 'sm:grid-cols-2' : ''}`}>
                                {step.images.map((image) => (
                                  <a
                                    key={image.src}
                                    href={image.src}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="group/image relative flex min-h-48 items-center justify-center overflow-hidden rounded-[1.35rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_58%),rgba(2,6,23,0.32)] p-2 sm:min-h-56"
                                  >
                                    <Image
                                      src={image.src}
                                      alt={image.alt}
                                      width={image.width}
                                      height={image.height}
                                      className={`h-auto rounded-xl object-contain shadow-[0_16px_38px_rgba(0,0,0,0.28)] transition duration-500 group-hover/image:scale-[1.02] ${
                                        image.height > image.width ? 'max-h-[28rem] w-auto max-w-full' : 'max-h-72 w-full'
                                      }`}
                                    />
                                    <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-slate-950/65 text-white/70 opacity-0 shadow-lg backdrop-blur transition group-hover/image:opacity-100">
                                      <ExternalLink className="h-3.5 w-3.5" />
                                    </span>
                                  </a>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </section>
                      );
                    })}

                    <section className="relative overflow-hidden rounded-[1.75rem] border border-emerald-300/20 bg-[linear-gradient(135deg,rgba(16,185,129,0.13),rgba(6,182,212,0.07))] p-5 sm:p-6">
                      <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl" />
                      <div className="relative flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-200">
                          <ShieldCheck className="h-5 w-5" />
                        </div>
                        <p className="pt-0.5 text-sm font-semibold leading-7 text-[var(--foreground)]">
                          {copy.footer}
                        </p>
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-amber-400/30 bg-[linear-gradient(135deg,rgba(245,158,11,0.24),rgba(249,115,22,0.18)_45%,rgba(15,23,42,0.92))] p-0 text-left shadow-[0_14px_34px_rgba(0,0,0,0.18)] transition hover:border-amber-300/40 hover:bg-[linear-gradient(135deg,rgba(245,158,11,0.28),rgba(249,115,22,0.2)_45%,rgba(15,23,42,0.96))] sm:h-auto sm:w-auto sm:gap-2 sm:px-3 sm:py-2"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/10 text-amber-100">
          <MessageCircle className="h-3.5 w-3.5" />
        </div>
        <div className="hidden min-w-0 sm:block">
          <div className="truncate text-xs font-black leading-tight text-white lg:text-sm">{copy.pillTitle}</div>
          <div className="truncate text-[10px] leading-4 text-amber-50/85 lg:text-[11px]">{copy.pillSubtitle}</div>
        </div>
      </button>
      {modal}
    </>
  );
}
