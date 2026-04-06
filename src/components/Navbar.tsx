'use client';

import { useEffect, useRef, useState } from 'react';
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
} from 'lucide-react';

import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n/i18n-context';
import type { Locale } from '@/lib/i18n/types';
import { useTheme, type ThemeMode } from '@/lib/theme/theme-context';

export const Navbar = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const { authenticated, login, logout, displayName } = useAuth();
  const { locale, setLocale, messages } = useI18n();
  const { theme, setTheme, resolvedTheme } = useTheme();

  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

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

  return (
    <nav className="sticky top-0 z-50 flex w-full items-center justify-between border-b border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-[var(--foreground)] backdrop-blur">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 transition-colors hover:bg-[var(--surface-hover)]"
        >
          <Menu size={24} />
        </button>

        <Link
          href="/"
          className="hidden text-xl font-bold text-cyan-400 transition hover:text-cyan-300 sm:inline-block"
        >
          GameOps
        </Link>
      </div>

      <div className="flex items-center gap-3 sm:gap-6">
        <div className="relative" ref={themeMenuRef}>
          <button
            type="button"
            onClick={() => setIsThemeMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-hover)]"
            title={messages.navbar.theme}
            aria-haspopup="menu"
            aria-expanded={isThemeMenuOpen}
          >
            <ThemeIcon size={18} />
            <span className="hidden sm:inline">{currentThemeLabel}</span>
            <ResolvedThemeIcon size={16} className="opacity-60" />
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
            className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-hover)]"
            title={messages.navbar.language}
            aria-haspopup="menu"
            aria-expanded={isLanguageMenuOpen}
          >
            <Globe size={18} />
            <span>{currentLocaleLabel}</span>
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
          <div className="flex items-center gap-4 border-l border-[var(--border)] pl-4">
            {displayName && (
              <div className="hidden max-w-[12rem] flex-col items-end md:flex">
                <span className="truncate text-sm font-medium">{displayName}</span>
              </div>
            )}

            <button
              onClick={logout}
              className="rounded-lg bg-[var(--surface)] p-2 text-red-400 transition-colors hover:bg-red-500/10"
              title={messages.navbar.logout}
            >
              <LogOut size={20} />
            </button>
          </div>
        ) : (
          <button
            onClick={login}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
          >
            <User size={18} />
            {messages.navbar.login}
          </button>
        )}
      </div>
    </nav>
  );
};
