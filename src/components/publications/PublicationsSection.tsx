'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n/i18n-context';
import { ApiError, useApi } from '@/lib/use-api';
import type { PublicationFeedResponse, PublicationItem } from '@/lib/types/publication';
import CreatePublicationModal from './CreatePublicationModal';
import PublicationCard from './PublicationCard';

const PAGE_SIZE = 10;
const SUCCESS_MESSAGE_TIMEOUT_MS = 4000;

export default function PublicationsSection() {
  const { apiJson } = useApi();
  const { roles, authenticated } = useAuth();
  const { messages } = useI18n();

  const [items, setItems] = useState<PublicationItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const successTimerRef = useRef<number | null>(null);

  const isAdmin = useMemo(() => {
    return roles.includes('ROLE_admin') || roles.includes('ROLE_superadmin');
  }, [roles]);

  const showTemporarySuccess = useCallback((message: string) => {
    setSuccessMessage(message);

    if (successTimerRef.current) {
      window.clearTimeout(successTimerRef.current);
    }

    successTimerRef.current = window.setTimeout(() => {
      setSuccessMessage(null);
      successTimerRef.current = null;
    }, SUCCESS_MESSAGE_TIMEOUT_MS);
  }, []);

  const loadPage = useCallback(
    async (targetPage: number, append: boolean) => {
      try {
        setErrorMessage(null);

        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        const response = await apiJson<PublicationFeedResponse>(
          `/api/v1/public/publications?page=${targetPage}&size=${PAGE_SIZE}`,
        );

        setItems((prev) => (append ? [...prev, ...response.items] : response.items));
        setPage(response.page);
        setHasNext(response.hasNext);
      } catch (error) {
        if (error instanceof ApiError) {
          setErrorMessage(error.message);
        } else if (error instanceof Error) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage(messages.publications.loadError);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [apiJson, messages.publications.loadError],
  );

  useEffect(() => {
    void loadPage(0, false);

    return () => {
      if (successTimerRef.current) {
        window.clearTimeout(successTimerRef.current);
      }
    };
  }, [loadPage]);

  const handleLoadMore = async () => {
    await loadPage(page + 1, true);
  };

  const handleCreated = async () => {
    await loadPage(0, false);
    showTemporarySuccess(messages.publications.createSuccess);
  };

  return (
    <section className="mx-auto mt-10 w-full max-w-5xl px-4">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">
            {messages.publications.title}
          </h2>
          <p className="mt-2 text-sm text-white/60">
            {messages.publications.subtitle}
          </p>
        </div>

        {authenticated && isAdmin && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-200"
            >
              {messages.publications.publishedTab}
            </button>

            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/40"
            >
              {messages.publications.draftsTab}
            </button>

            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/40"
            >
              {messages.publications.scheduledTab}
            </button>

            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-400/15"
            >
              {messages.publications.createButton}
            </button>
          </div>
        )}
      </div>

      {successMessage && (
        <div className="mb-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-200">
          {successMessage}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
          {messages.publications.loading}
        </div>
      ) : errorMessage ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-6 text-sm text-red-200">
          {messages.publications.loadError}: {errorMessage}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
          <h3 className="text-lg font-semibold text-white">
            {messages.publications.emptyTitle}
          </h3>
          <p className="mt-2 text-sm text-white/60">
            {messages.publications.emptyDescription}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((publication) => (
            <PublicationCard key={publication.id} publication={publication} />
          ))}
        </div>
      )}

      {!loading && !errorMessage && hasNext && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingMore
              ? messages.publications.loadingMore
              : messages.publications.loadMore}
          </button>
        </div>
      )}

      <CreatePublicationModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={handleCreated}
      />
    </section>
  );
}