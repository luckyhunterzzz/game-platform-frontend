'use client';

import Link from 'next/link';
import React, { useMemo, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { LoadingScreen } from '@/components/LoadingScreen';
import PublicationsSection from '@/components/publications/PublicationsSection';

import { useApi } from '@/lib/use-api';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n/i18n-context';

type QuickLinkItem = {
  label: string;
  href?: string;
};

export default function HomePage() {
  const [log, setLog] = useState<unknown>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const { apiFetch } = useApi();
  const { roles, authenticated, loading } = useAuth();
  const { messages } = useI18n();

  const quickLinks = useMemo<QuickLinkItem[]>(
    () => [
      { label: messages.home.navHeroes, href: '/heroes' },
      { label: messages.home.navEvents },
      { label: messages.home.navGuides },
      { label: messages.home.navAlliances },
    ],
    [
      messages.home.navHeroes,
      messages.home.navEvents,
      messages.home.navGuides,
      messages.home.navAlliances,
    ],
  );

  const handleTest = async (path: string) => {
    try {
      const data = await apiFetch(path);
      setLog(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : messages.home.diagnosticsUnknownError;

      setLog({ error: errorMessage });
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col font-sans">
      <Navbar onMenuClick={() => setSidebarOpen((prev) => !prev)} />

      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div className="w-64 border-r border-[var(--border)] bg-[var(--surface-strong)] p-6 shadow-2xl backdrop-blur">
            <h2 className="mb-6 text-xl font-bold text-cyan-400">
              {messages.home.menuTitle}
            </h2>

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
            </ul>
          </div>

          <div
            className="flex-1 bg-black/40 backdrop-blur-[1px]"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}

      <main className="flex flex-1 flex-col items-center px-4 py-12">
        <div className="mb-16 text-center">
          <h1 className="mb-4 bg-gradient-to-r from-blue-400 via-purple-500 to-amber-400 bg-clip-text text-5xl font-black text-transparent md:text-7xl">
            EMPIRES & PUZZLES
          </h1>

          <p className="text-xl font-light uppercase tracking-widest text-[var(--foreground-soft)]">
            {messages.home.heroSubtitle}
          </p>
        </div>

        <div className="mb-12 flex flex-wrap justify-center gap-4">
          {quickLinks.map((item) => {
            const content = (
              <>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--surface-hover)] transition-transform group-hover:scale-110">
                  <div className="h-6 w-6 rounded-full border border-blue-500/40 bg-blue-500/20" />
                </div>

                <span className="text-xs font-semibold text-[var(--foreground-muted)] transition group-hover:text-blue-400">
                  {item.label}
                </span>
              </>
            );

            if (item.href) {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="group flex w-28 flex-col items-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-lg transition-all hover:border-blue-500/40 hover:bg-[var(--surface-hover)]"
                >
                  {content}
                </Link>
              );
            }

            return (
              <button
                key={item.label}
                type="button"
                className="group flex w-28 flex-col items-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-lg transition-all hover:border-blue-500/40 hover:bg-[var(--surface-hover)]"
              >
                {content}
              </button>
            );
          })}
        </div>

        <div className="w-full">
          <PublicationsSection />
        </div>

        <div className="mt-12 w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm backdrop-blur-sm">
          <h3 className="mb-6 flex items-center gap-2 text-lg font-semibold text-[var(--foreground)]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
            {messages.home.diagnosticsTitle}
          </h3>

          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              onClick={() => handleTest('/api/v1/public/test')}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] p-4 text-[var(--foreground)] transition-all hover:bg-[var(--surface-hover)]"
            >
              {messages.home.diagnosticsPublicTest}
            </button>

            <button
              onClick={() => handleTest('/api/v1/admin/test')}
              disabled={!authenticated}
              className={`rounded-xl border p-4 transition-all ${
                authenticated
                  ? 'border-amber-500/30 bg-amber-400/10 text-amber-500 hover:bg-amber-400/15'
                  : 'cursor-not-allowed border-[var(--border)] bg-[var(--surface-strong)] text-[var(--foreground-soft)]'
              }`}
              title={!authenticated ? messages.home.diagnosticsNoAccess : undefined}
            >
              {messages.home.diagnosticsAdminTest}
            </button>
          </div>

          {log !== null && log !== undefined && (
            <div className="mt-6 max-h-64 overflow-auto rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] p-4">
              <pre className="text-xs font-mono text-emerald-400">
                {JSON.stringify(log, null, 2)}
              </pre>
            </div>
          )}

          {roles.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {roles.map((role) => (
                <span
                  key={role}
                  className="rounded border border-blue-500/20 bg-blue-500/10 px-2 py-1 text-[10px] uppercase tracking-wider text-blue-400"
                >
                  {role}
                </span>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
