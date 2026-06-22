'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink, MessageCircle, X } from 'lucide-react';

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
      '\u042f \u043e\u0442\u043f\u0440\u0430\u0432\u043b\u044f\u044e \u043e\u0434\u043d\u043e\u0440\u0430\u0437\u043e\u0432\u044b\u0435 \u0440\u0435\u043a\u0432\u0438\u0437\u0438\u0442\u044b \u0435\u0432\u0440\u043e\u043f\u0435\u0439\u0441\u043a\u043e\u0439 \u0431\u0430\u043d\u043a\u043e\u0432\u0441\u043a\u043e\u0439 \u043a\u0430\u0440\u0442\u044b \u0434\u043b\u044f \u0431\u0435\u0437\u043e\u043f\u0430\u0441\u043d\u043e\u0439 \u043e\u043d\u043b\u0430\u0439\u043d-\u043e\u043f\u043b\u0430\u0442\u044b.',
    images: [
      {
        src: '/joint-purchases/purchase-help/step-2-card-details.png',
        alt: '\u0421\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0435 \u0441 \u0440\u0435\u043a\u0432\u0438\u0437\u0438\u0442\u0430\u043c\u0438 \u043a\u0430\u0440\u0442\u044b',
        width: 209,
        height: 101,
      },
    ],
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
      '\u041f\u043e\u0441\u043b\u0435 \u044d\u0442\u043e\u0433\u043e \u044f \u0441\u043e\u043e\u0431\u0449\u0430\u044e, \u043a\u0430\u043a\u0430\u044f \u0441\u0442\u043e\u0438\u043c\u043e\u0441\u0442\u044c \u0432 \u0440\u0443\u0431\u043b\u044f\u0445 \u0431\u0443\u0434\u0435\u0442 \u0443 \u0434\u0430\u043d\u043d\u043e\u0439 \u0430\u043a\u0446\u0438\u0438, \u0438 \u0432\u044b \u043f\u0435\u0440\u0435\u0432\u043e\u0434\u0438\u0442\u0435 \u043d\u0443\u0436\u043d\u0443\u044e \u0441\u0443\u043c\u043c\u0443 \u0432 \u0440\u0443\u0431\u043b\u044f\u0445 \u043d\u0430 \u0443\u043a\u0430\u0437\u0430\u043d\u043d\u0443\u044e \u043c\u043d\u043e\u0439 \u0440\u043e\u0441\u0441\u0438\u0439\u0441\u043a\u0443\u044e \u043a\u0430\u0440\u0442\u0443, \u043f\u043e\u0441\u043b\u0435 \u0447\u0435\u0433\u043e \u044f \u043f\u043e\u043f\u043e\u043b\u043d\u044f\u044e \u043e\u0434\u043d\u043e\u0440\u0430\u0437\u043e\u0432\u0443\u044e \u043a\u0430\u0440\u0442\u0443.',
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
          className="fixed inset-0 z-[140] overflow-y-auto bg-black/80 p-4 backdrop-blur-sm"
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
                    {copy.modalTitle}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--foreground-soft)]">{copy.intro1}</p>
                  <p className="mt-3 text-sm leading-7 text-[var(--foreground-soft)]">{copy.intro2}</p>
                  <p className="mt-3 text-sm leading-7 text-[var(--foreground-soft)]">{copy.intro3}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-4">
                    <span className="text-sm text-[var(--foreground)]">{copy.contact}</span>
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
                  {/* Purchase steps 1-5 are hidden for now. The purchaseHelpSteps data stays in this file for quick restore later. */}
                  <section className="rounded-[1.75rem] border border-emerald-400/20 bg-emerald-400/10 p-4 sm:p-5">
                    <p className="text-sm font-semibold leading-7 text-[var(--foreground)]">{copy.footer}</p>
                  </section>
                </div>
              </div>
            </div>
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