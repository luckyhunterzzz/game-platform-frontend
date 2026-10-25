'use client';

import { CalendarDays, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { useMemo, useState } from 'react';

import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n/i18n-context';

import SummonsAdminLinkBadge from './SummonsAdminLinkBadge';
import SummonsCalendar from './SummonsCalendar';
import SummonsPageShell from './SummonsPageShell';
import SummonsSimulator from './SummonsSimulator';

type SummonsTab = 'calendar' | 'simulator';

export default function SummonsPageClient() {
  const { authenticated, loading: authLoading } = useAuth();
  const { locale } = useI18n();
  const [activeTab, setActiveTab] = useState<SummonsTab>('calendar');
  const [accessMessage, setAccessMessage] = useState<string | null>(null);

  const text = useMemo(
    () =>
      locale === 'ru'
        ? {
            title: 'Призывы',
            subtitle: 'Расписание будущих призывов и имитация выпадения героев.',
            publicBadge: 'Публичная страница',
            calendar: 'Календарь',
            simulator: 'Имитация призывов',
            emptyCalendarTitle: 'Нет информации о будущих призывах',
            emptyCalendarDescription:
              'Когда появятся известные даты и рекомендованные герои, они будут показаны здесь.',
            simulatorAuthRequired: 'Имитация призывов доступна только зарегистрированным пользователям.',
            checkingAuth: 'Проверяем авторизацию. Попробуйте ещё раз через несколько секунд.',
          }
        : {
            title: 'Summons',
            subtitle: 'Upcoming summon schedule and hero summon simulation.',
            publicBadge: 'Public page',
            calendar: 'Calendar',
            simulator: 'Summon simulator',
            emptyCalendarTitle: 'No upcoming summon information',
            emptyCalendarDescription:
              'Known dates and featured heroes will appear here when they are available.',
            simulatorAuthRequired: 'Summon simulation is available to registered users only.',
            checkingAuth: 'Checking your session. Please try again in a moment.',
          },
    [locale],
  );

  const tabs = [
    { id: 'calendar' as const, label: text.calendar, icon: CalendarDays },
    { id: 'simulator' as const, label: text.simulator, icon: Sparkles },
  ];

  const selectTab = (tab: SummonsTab) => {
    if (tab === 'simulator' && !authenticated) {
      setAccessMessage(authLoading ? text.checkingAuth : text.simulatorAuthRequired);
      return;
    }
    setAccessMessage(null);
    setActiveTab(tab);
  };
  const effectiveActiveTab = authenticated ? activeTab : 'calendar';
  const visibleAccessMessage = authenticated ? null : accessMessage;

  return (
    <SummonsPageShell>
      <div className="mb-8 overflow-hidden rounded-[2rem] border border-fuchsia-400/15 bg-[radial-gradient(circle_at_top_left,rgba(217,70,239,0.2),transparent_38%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_38%),linear-gradient(180deg,var(--surface-strong),var(--surface))] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.18)] md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-fuchsia-300">
                {text.publicBadge}
              </span>
              <SummonsAdminLinkBadge />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-[var(--foreground)] md:text-5xl">
              {text.title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--foreground-soft)] md:text-base">
              {text.subtitle}
            </p>
          </div>

          <div className="mx-auto shrink-0 md:mx-0">
            <div className="flex h-28 w-28 items-center justify-center rounded-[2rem] border border-fuchsia-300/20 bg-black/10 shadow-[0_0_50px_rgba(217,70,239,0.18)] md:h-36 md:w-36">
              <Image
                src="/home-quick-links/lottery.webp"
                alt=""
                width={128}
                height={128}
                className="h-24 w-24 object-contain md:h-32 md:w-32"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-sm">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = effectiveActiveTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => selectTab(tab.id)}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                active
                  ? 'bg-fuchsia-500/15 text-fuchsia-300 shadow-sm'
                  : 'text-[var(--foreground-soft)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]'
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {visibleAccessMessage ? (
        <div role="alert" className="mb-6 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm font-medium text-amber-200">
          {visibleAccessMessage}
        </div>
      ) : null}

      {effectiveActiveTab === 'calendar' ? (
        <SummonsCalendar />
      ) : (
        <SummonsSimulator />
      )}
    </SummonsPageShell>
  );
}
