'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Moon,
  Sun,
  Globe,
  User,
  LogOut,
  Menu,
  Check,
  Monitor,
  Info,
  X,
} from 'lucide-react';

import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n/i18n-context';
import type { Locale } from '@/lib/i18n/types';
import { useTheme, type ThemeMode } from '@/lib/theme/theme-context';

export const Navbar = ({
  onMenuClick,
  onHomeClick,
}: {
  onMenuClick: () => void;
  onHomeClick?: () => void;
}) => {
  const { authenticated, login, logout, displayName } = useAuth();
  const { locale, setLocale, messages } = useI18n();
  const { theme, setTheme, resolvedTheme } = useTheme();

  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  const languageMenuRef = useRef<HTMLDivElement | null>(null);
  const themeMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        languageMenuRef.current &&
        !languageMenuRef.current.contains(event.target as Node)
      ) {
        setIsLanguageMenuOpen(false);
      }

      if (
        themeMenuRef.current &&
        !themeMenuRef.current.contains(event.target as Node)
      ) {
        setIsThemeMenuOpen(false);
      }
    }

    const shouldListen = isLanguageMenuOpen || isThemeMenuOpen;

    if (shouldListen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLanguageMenuOpen, isThemeMenuOpen]);

  useEffect(() => {
    if (!isAboutModalOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isAboutModalOpen]);

  const handleLanguageSelect = (nextLocale: Locale) => {
    setLocale(nextLocale);
    setIsLanguageMenuOpen(false);
  };

  const handleThemeSelect = (nextTheme: ThemeMode) => {
    setTheme(nextTheme);
    setIsThemeMenuOpen(false);
  };

  const currentLocaleLabel = locale.toUpperCase();

  const currentThemeLabel =
    theme === 'light'
      ? messages.navbar.themeLight
      : theme === 'dark'
        ? messages.navbar.themeDark
        : messages.navbar.themeSystem;

  const ThemeIcon =
    theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;

  const ResolvedThemeIcon = resolvedTheme === 'dark' ? Moon : Sun;

  const aboutProjectContent =
    locale === 'ru'
      ? {
          button: '\u041e \u043f\u0440\u043e\u0435\u043a\u0442\u0435',
          close: '\u0417\u0430\u043a\u0440\u044b\u0442\u044c',
          title: '\u041e \u043f\u0440\u043e\u0435\u043a\u0442\u0435',
          intro:
            'GameOps Platform \u2014 \u044d\u0442\u043e \u043d\u0435\u0437\u0430\u0432\u0438\u0441\u0438\u043c\u044b\u0439 \u043d\u0435\u043e\u0444\u0438\u0446\u0438\u0430\u043b\u044c\u043d\u044b\u0439 \u0444\u0430\u043d-\u043f\u0440\u043e\u0435\u043a\u0442 \u043f\u043e Empires & Puzzles, \u043a\u043e\u0442\u043e\u0440\u044b\u0439 \u0441\u043e\u0437\u0434\u0430\u0435\u0442\u0441\u044f \u0438 \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0442\u0441\u044f \u043e\u0434\u043d\u0438\u043c \u0447\u0435\u043b\u043e\u0432\u0435\u043a\u043e\u043c \u0432 \u0441\u0432\u043e\u0431\u043e\u0434\u043d\u043e\u0435 \u0432\u0440\u0435\u043c\u044f.',
          mission:
            '\u041f\u0440\u043e\u0435\u043a\u0442 \u0441\u0434\u0435\u043b\u0430\u043d \u0434\u043b\u044f \u0441\u043e\u043e\u0431\u0449\u0435\u0441\u0442\u0432\u0430: \u0447\u0442\u043e\u0431\u044b \u0441\u043e\u0431\u0438\u0440\u0430\u0442\u044c \u0432 \u043e\u0434\u043d\u043e\u043c \u043c\u0435\u0441\u0442\u0435 \u043f\u043e\u043b\u0435\u0437\u043d\u0443\u044e \u0438\u043d\u0444\u043e\u0440\u043c\u0430\u0446\u0438\u044e, \u0441\u043f\u0440\u0430\u0432\u043e\u0447\u043d\u0438\u043a\u0438, \u0433\u0430\u0439\u0434\u044b \u0438 \u043f\u0440\u043e\u0441\u0442\u044b\u0435 \u0438\u043d\u0441\u0442\u0440\u0443\u043c\u0435\u043d\u0442\u044b.',
          dataDisclaimer:
            '\u0427\u0430\u0441\u0442\u044c \u0434\u0430\u043d\u043d\u044b\u0445, \u0438\u0437\u043e\u0431\u0440\u0430\u0436\u0435\u043d\u0438\u0439 \u0438\u043b\u0438 \u043e\u043f\u0438\u0441\u0430\u043d\u0438\u0439 \u043c\u043e\u0436\u0435\u0442 \u0431\u044b\u0442\u044c \u043d\u0435\u043f\u043e\u043b\u043d\u043e\u0439, \u043d\u0435\u0442\u043e\u0447\u043d\u043e\u0439 \u0438\u043b\u0438 \u043e\u0431\u043d\u043e\u0432\u043b\u044f\u0442\u044c\u0441\u044f \u0441 \u0437\u0430\u0434\u0435\u0440\u0436\u043a\u043e\u0439. \u0412\u0441\u044f \u0438\u043d\u0444\u043e\u0440\u043c\u0430\u0446\u0438\u044f \u043f\u0440\u0435\u0434\u043e\u0441\u0442\u0430\u0432\u043b\u044f\u0435\u0442\u0441\u044f \u0432 \u0441\u043f\u0440\u0430\u0432\u043e\u0447\u043d\u044b\u0445 \u0446\u0435\u043b\u044f\u0445 \u0438 \u0434\u043e\u0441\u0442\u0443\u043f\u043d\u0430 \u201c\u043a\u0430\u043a \u0435\u0441\u0442\u044c\u201d.',
          rightsDisclaimer:
            '\u041f\u0440\u043e\u0435\u043a\u0442 \u043d\u0435 \u0441\u0432\u044f\u0437\u0430\u043d \u043e\u0444\u0438\u0446\u0438\u0430\u043b\u044c\u043d\u043e \u0441 Zynga, Small Giant Games \u0438 \u0434\u0440\u0443\u0433\u0438\u043c\u0438 \u043f\u0440\u0430\u0432\u043e\u043e\u0431\u043b\u0430\u0434\u0430\u0442\u0435\u043b\u044f\u043c\u0438. \u0412\u0441\u0435 \u0438\u0433\u0440\u043e\u0432\u044b\u0435 \u043d\u0430\u0437\u0432\u0430\u043d\u0438\u044f, \u0438\u0437\u043e\u0431\u0440\u0430\u0436\u0435\u043d\u0438\u044f, \u0442\u043e\u0432\u0430\u0440\u043d\u044b\u0435 \u0437\u043d\u0430\u043a\u0438 \u0438 \u0441\u0432\u044f\u0437\u0430\u043d\u043d\u044b\u0435 \u043c\u0430\u0442\u0435\u0440\u0438\u0430\u043b\u044b \u043f\u0440\u0438\u043d\u0430\u0434\u043b\u0435\u0436\u0430\u0442 \u0438\u0445 \u0432\u043b\u0430\u0434\u0435\u043b\u044c\u0446\u0430\u043c.',
          contactPrefix:
            '\u041f\u043e \u0432\u043e\u043f\u0440\u043e\u0441\u0430\u043c, \u0438\u0434\u0435\u044f\u043c, \u043f\u0440\u0435\u0434\u043b\u043e\u0436\u0435\u043d\u0438\u044f\u043c \u0438\u043b\u0438 \u043d\u0430\u0439\u0434\u0435\u043d\u043d\u044b\u043c \u043e\u0448\u0438\u0431\u043a\u0430\u043c \u043f\u0438\u0448\u0438\u0442\u0435 \u0432 Telegram:',
          contactHandle: '@gameops_platform',
          channelPrefix:
            '\u0410 \u044d\u0442\u043e \u043c\u043e\u0439 \u043a\u0430\u043d\u0430\u043b \u0432 \u0442\u0433, \u043c\u043e\u0436\u0435\u0442\u0435 \u0432\u0441\u0442\u0443\u043f\u0430\u0442\u044c, \u0431\u0443\u0434\u0443 \u043f\u0438\u0441\u0430\u0442\u044c \u0442\u0430\u043c \u0432\u0430\u0436\u043d\u044b\u0435 \u0430\u043d\u043e\u043d\u0441\u044b:',
          channelHandle: '@gameopsplatform',
        }
      : {
          button: 'About',
          close: 'Close',
          title: 'About the project',
          intro:
            'GameOps Platform is an independent unofficial fan project for Empires & Puzzles, created and maintained by one person in free time.',
          mission:
            'The project exists for the community: to collect useful information, dictionaries, guides and simple tools in one place.',
          dataDisclaimer:
            'Some data, images or descriptions may be incomplete, inaccurate or updated with delay. All information is provided for reference and is available as is.',
          rightsDisclaimer:
            'The project is not affiliated with Zynga, Small Giant Games or other rights holders. All game names, images, trademarks and related materials belong to their owners.',
          contactPrefix:
            'Questions, ideas, suggestions or bug reports: write to Telegram:',
          contactHandle: '@gameops_platform',
          channelPrefix:
            'This is also my Telegram channel. You can join it, I will post important announcements there:',
          channelHandle: '@gameopsplatform',
        };

  return (
    <>
      <nav className="sticky top-0 z-50 flex w-full items-center justify-between border-b border-[var(--border)] bg-[var(--surface-strong)] px-2 py-2 text-[var(--foreground)] backdrop-blur sm:px-4 sm:py-3">
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-4">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-1.5 transition-colors hover:bg-[var(--surface-hover)] sm:p-2"
        >
          <Menu size={18} className="sm:h-6 sm:w-6" />
        </button>

        <Link
          href="/"
          onClick={(event) => {
            if (!onHomeClick) {
              return;
            }

            event.preventDefault();
            onHomeClick();
          }}
          className="flex shrink-0 items-center rounded-xl transition hover:opacity-90"
          aria-label="GameOps home"
        >
          <Image
            src="/brand-dragon.png"
            alt="GameOps"
            width={64}
            height={64}
            priority
            className="h-8 w-8 shrink-0 object-contain sm:h-12 sm:w-12"
          />
        </Link>
      </div>

      <div className="flex min-w-0 items-center justify-end gap-1 sm:gap-3 md:gap-6">
        <button
          type="button"
          onClick={() => setIsAboutModalOpen(true)}
          className="flex shrink items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-xs font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-hover)] sm:gap-2 sm:px-3 sm:py-2 sm:text-sm"
          title={aboutProjectContent.button}
        >
          <Info size={15} className="sm:h-[18px] sm:w-[18px]" />
          <span className="hidden sm:inline">{aboutProjectContent.button}</span>
        </button>

        <div className="relative" ref={themeMenuRef}>
          <button
            type="button"
            onClick={() => setIsThemeMenuOpen((prev) => !prev)}
            className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-xs font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-hover)] sm:gap-2 sm:px-3 sm:py-2 sm:text-sm"
            title={messages.navbar.theme}
            aria-haspopup="menu"
            aria-expanded={isThemeMenuOpen}
          >
            <ThemeIcon size={15} className="sm:h-[18px] sm:w-[18px]" />
            <span className="hidden sm:inline">{currentThemeLabel}</span>
            <ResolvedThemeIcon size={12} className="opacity-60 sm:h-4 sm:w-4" />
          </button>

          {isThemeMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] shadow-2xl">
              <button
                type="button"
                onClick={() => handleThemeSelect('light')}
                className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition ${
                  theme === 'light'
                    ? 'bg-cyan-400/10 text-cyan-300'
                    : 'text-[var(--foreground-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Sun size={16} />
                  {messages.navbar.themeLight}
                </span>
                {theme === 'light' && <Check size={16} />}
              </button>

              <button
                type="button"
                onClick={() => handleThemeSelect('dark')}
                className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition ${
                  theme === 'dark'
                    ? 'bg-cyan-400/10 text-cyan-300'
                    : 'text-[var(--foreground-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Moon size={16} />
                  {messages.navbar.themeDark}
                </span>
                {theme === 'dark' && <Check size={16} />}
              </button>

              <button
                type="button"
                onClick={() => handleThemeSelect('system')}
                className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition ${
                  theme === 'system'
                    ? 'bg-cyan-400/10 text-cyan-300'
                    : 'text-[var(--foreground-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Monitor size={16} />
                  {messages.navbar.themeSystem}
                </span>
                {theme === 'system' && <Check size={16} />}
              </button>
            </div>
          )}
        </div>

        <div className="relative" ref={languageMenuRef}>
          <button
            type="button"
            onClick={() => setIsLanguageMenuOpen((prev) => !prev)}
            className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-xs font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-hover)] sm:gap-2 sm:px-3 sm:py-2 sm:text-sm"
            title={messages.navbar.language}
            aria-haspopup="menu"
            aria-expanded={isLanguageMenuOpen}
          >
            <Globe size={15} className="sm:h-[18px] sm:w-[18px]" />
            <span className="hidden sm:inline">{currentLocaleLabel}</span>
          </button>

          {isLanguageMenuOpen && (
            <div className="absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] shadow-2xl">
              <button
                type="button"
                onClick={() => handleLanguageSelect('ru')}
                className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition ${
                  locale === 'ru'
                    ? 'bg-cyan-400/10 text-cyan-300'
                    : 'text-[var(--foreground-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]'
                }`}
              >
                <span>{messages.common.languageRussian}</span>
                {locale === 'ru' && <Check size={16} />}
              </button>

              <button
                type="button"
                onClick={() => handleLanguageSelect('en')}
                className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition ${
                  locale === 'en'
                    ? 'bg-cyan-400/10 text-cyan-300'
                    : 'text-[var(--foreground-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]'
                }`}
              >
                <span>{messages.common.languageEnglish}</span>
                {locale === 'en' && <Check size={16} />}
              </button>
            </div>
          )}
        </div>

        {authenticated ? (
          <div className="flex items-center gap-2 border-l border-[var(--border)] pl-2 sm:gap-4 sm:pl-4">
            {displayName && (
              <div className="hidden max-w-[12rem] flex-col items-end md:flex">
                <span className="truncate text-sm font-medium">{displayName}</span>
              </div>
            )}

            <button
              onClick={logout}
              className="rounded-lg bg-[var(--surface)] p-1.5 text-red-400 transition-colors hover:bg-red-500/10 sm:p-2"
              title={messages.navbar.logout}
            >
              <LogOut size={16} className="sm:h-5 sm:w-5" />
            </button>
          </div>
        ) : (
          <button
            onClick={login}
            className="flex shrink-0 items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 sm:gap-2 sm:px-4 sm:py-2"
          >
            <User size={15} className="sm:h-[18px] sm:w-[18px]" />
            <span className="hidden md:inline">{messages.navbar.login}</span>
          </button>
        )}
      </div>

      </nav>

      {isAboutModalOpen && (
        <div
          className="fixed inset-0 z-[70] overflow-y-auto bg-black/65 p-4 backdrop-blur-sm"
          onClick={() => setIsAboutModalOpen(false)}
        >
          <div className="flex min-h-full items-center justify-center py-6">
            <div
              className="w-full max-w-2xl rounded-3xl border border-[var(--border)] bg-[var(--surface-strong)] p-6 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-[var(--foreground)]">
                    {aboutProjectContent.title}
                  </h2>
                  <p className="mt-2 text-sm text-[var(--foreground-soft)]">
                    <strong className="font-semibold text-[var(--foreground)]">
                      {locale === 'ru'
                        ? '\u041d\u0435\u0437\u0430\u0432\u0438\u0441\u0438\u043c\u044b\u0439 \u043d\u0435\u043e\u0444\u0438\u0446\u0438\u0430\u043b\u044c\u043d\u044b\u0439 \u0444\u0430\u043d-\u043f\u0440\u043e\u0435\u043a\u0442'
                        : 'Independent unofficial fan project'}
                    </strong>
                    {' '}
                    {aboutProjectContent.intro}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAboutModalOpen(false)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 text-[var(--foreground-soft)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
                  aria-label={aboutProjectContent.close}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4 text-sm leading-6 text-[var(--foreground-muted)]">
                <p>
                  <strong className="font-semibold text-[var(--foreground)]">
                    {locale === 'ru'
                      ? '\u041e\u0434\u0438\u043d \u0447\u0435\u043b\u043e\u0432\u0435\u043a, \u0441\u0432\u043e\u0431\u043e\u0434\u043d\u043e\u0435 \u0432\u0440\u0435\u043c\u044f.'
                      : 'One person, free time.'}
                  </strong>
                  {' '}
                  {aboutProjectContent.mission}
                </p>
                <p>
                  <strong className="font-semibold text-[var(--foreground)]">
                    {locale === 'ru'
                      ? '\u0418\u043d\u0444\u043e\u0440\u043c\u0430\u0446\u0438\u044f \u0434\u0430\u0435\u0442\u0441\u044f \u0432 \u0441\u043f\u0440\u0430\u0432\u043e\u0447\u043d\u044b\u0445 \u0446\u0435\u043b\u044f\u0445 \u0438 \u201c\u043a\u0430\u043a \u0435\u0441\u0442\u044c\u201d.'
                      : 'Information is for reference and provided as is.'}
                  </strong>
                  {' '}
                  {aboutProjectContent.dataDisclaimer}
                </p>
                <p>
                  <strong className="font-semibold text-[var(--foreground)]">
                    {locale === 'ru'
                      ? '\u041d\u0435\u0442 \u043e\u0444\u0438\u0446\u0438\u0430\u043b\u044c\u043d\u043e\u0439 \u0441\u0432\u044f\u0437\u0438 \u0441 \u043f\u0440\u0430\u0432\u043e\u043e\u0431\u043b\u0430\u0434\u0430\u0442\u0435\u043b\u044f\u043c\u0438.'
                      : 'No official affiliation with the rights holders.'}
                  </strong>
                  {' '}
                  {aboutProjectContent.rightsDisclaimer}
                </p>

                <div className="rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-4 text-[var(--foreground)]">
                  <p>
                    {aboutProjectContent.contactPrefix}
                    {' '}
                    <a
                      href="https://t.me/gameops_platform"
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-cyan-700 underline decoration-cyan-500/50 underline-offset-4 transition hover:text-cyan-600 dark:text-cyan-200 dark:decoration-cyan-300/50 dark:hover:text-cyan-300"
                    >
                      {aboutProjectContent.contactHandle}
                    </a>
                  </p>
                  <p className="mt-3">
                    {aboutProjectContent.channelPrefix}
                    {' '}
                    <a
                      href="https://t.me/gameopsplatform"
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-cyan-700 underline decoration-cyan-500/50 underline-offset-4 transition hover:text-cyan-600 dark:text-cyan-200 dark:decoration-cyan-300/50 dark:hover:text-cyan-300"
                    >
                      {aboutProjectContent.channelHandle}
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
