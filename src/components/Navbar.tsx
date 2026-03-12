'use client';

import { useEffect, useRef, useState } from 'react';
import { Moon, Globe, User, LogOut, Menu, Check } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n/i18n-context';
import type { Locale } from '@/lib/i18n/types';

export const Navbar = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const { authenticated, login, logout, userId } = useAuth();
  const { locale, setLocale, messages } = useI18n();

  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const languageMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        languageMenuRef.current &&
        !languageMenuRef.current.contains(event.target as Node)
      ) {
        setIsLanguageMenuOpen(false);
      }
    }

    if (isLanguageMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLanguageMenuOpen]);

  const handleLanguageSelect = (nextLocale: Locale) => {
    setLocale(nextLocale);
    setIsLanguageMenuOpen(false);
  };

  const currentLocaleLabel = locale.toUpperCase();

  return (
    <nav className="sticky top-0 z-50 flex w-full items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-3 text-white">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 transition-colors hover:bg-slate-800"
        >
          <Menu size={24} />
        </button>

        <span className="hidden text-xl font-bold text-blue-400 sm:inline-block">
          G-Portal
        </span>
      </div>

      <div className="flex items-center gap-3 sm:gap-6">
        <button
          className="rounded-full p-2 hover:bg-slate-800"
          title={messages.navbar.theme}
        >
          <Moon size={20} />
        </button>

        <div className="relative" ref={languageMenuRef}>
          <button
            type="button"
            onClick={() => setIsLanguageMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            title={messages.navbar.language}
            aria-haspopup="menu"
            aria-expanded={isLanguageMenuOpen}
          >
            <Globe size={18} />
            <span>{currentLocaleLabel}</span>
          </button>

          {isLanguageMenuOpen && (
            <div className="absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border border-white/10 bg-slate-900 shadow-2xl">
              <button
                type="button"
                onClick={() => handleLanguageSelect('ru')}
                className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition ${
                  locale === 'ru'
                    ? 'bg-cyan-400/10 text-cyan-200'
                    : 'text-white/80 hover:bg-white/5 hover:text-white'
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
                    ? 'bg-cyan-400/10 text-cyan-200'
                    : 'text-white/80 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span>{messages.common.languageEnglish}</span>
                {locale === 'en' && <Check size={16} />}
              </button>
            </div>
          )}
        </div>

        {authenticated ? (
          <div className="flex items-center gap-4 border-l border-slate-700 pl-4">
            <div className="hidden flex-col items-end md:flex">
              <span className="text-xs text-slate-400">
                {messages.navbar.userId}
              </span>
              <span className="text-sm font-medium">
                {userId?.slice(0, 8)}...
              </span>
            </div>

            <button
              onClick={logout}
              className="rounded-lg bg-slate-800 p-2 text-red-400 transition-colors hover:bg-red-900/40"
              title={messages.navbar.logout}
            >
              <LogOut size={20} />
            </button>
          </div>
        ) : (
          <button
            onClick={login}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium transition-colors hover:bg-blue-700"
          >
            <User size={18} />
            {messages.navbar.login}
          </button>
        )}
      </div>
    </nav>
  );
};