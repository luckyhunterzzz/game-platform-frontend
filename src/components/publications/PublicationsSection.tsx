'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n/i18n-context';
import { ApiError, useApi } from '@/lib/use-api';
import type {
  PublicationAdminFeedResponse,
  PublicationAdminDetails,
  PublicationAdminSummary,
  PublicationFeedResponse,
  PublicationItem,
} from '@/lib/types/publication';
import { PublicationStatus, PublicationType } from '@/lib/types/publication';
import CreatePublicationModal from './CreatePublicationModal';
import PublicationCard from './PublicationCard';

const PAGE_SIZE = 10;
const SUCCESS_MESSAGE_TIMEOUT_MS = 4000;

function mapAppLocaleToPublicationLanguage(locale: 'ru' | 'en'): 'RU' | 'EN' {
  return locale === 'ru' ? 'RU' : 'EN';
}

function getPublicationPreviewText(value: string | null | undefined): string | null {
  const normalized = value?.trim() ?? '';
  return normalized ? normalized : null;
}

function mapAdminSummaryToCard(summary: PublicationAdminSummary, locale: 'ru' | 'en'): PublicationItem {
  const title = locale === 'ru' ? summary.titleJson.ru : summary.titleJson.en;
  const content = locale === 'ru' ? summary.contentJson.ru : summary.contentJson.en;

  return {
    id: summary.id,
    type: summary.type,
    status: summary.status,
    title: title.trim() || content.trim() || 'Untitled publication',
    content: getPublicationPreviewText(content),
    imageUrl: summary.imageUrl ?? null,
    publishedAt: summary.publishedAt ?? null,
    pinned: summary.pinned,
    showInNewsFeed: summary.showInNewsFeed,
  };
}

type PublicationsSectionProps = {
  publicView?: 'main' | 'alliances';
  title?: string;
  subtitle?: string;
  forcePublic?: boolean;
};

export default function PublicationsSection({
  publicView = 'main',
  title,
  subtitle,
  forcePublic = false,
}: PublicationsSectionProps) {
  const { apiJson } = useApi();
  const { roles, authenticated } = useAuth();
  const { locale, messages } = useI18n();

  const [items, setItems] = useState<PublicationItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPublication, setEditingPublication] =
    useState<PublicationAdminDetails | null>(null);
  const [activeAdminStatus, setActiveAdminStatus] = useState<PublicationStatus>(
    PublicationStatus.PUBLISHED,
  );
  const [activeAdminType, setActiveAdminType] = useState<PublicationType | 'ALL'>('ALL');
  const [activePublicType, setActivePublicType] = useState<PublicationType>(PublicationType.NEWS);

  const successTimerRef = useRef<number | null>(null);

  const isAdmin = useMemo(() => {
    return !forcePublic && (roles.includes('ROLE_admin') || roles.includes('ROLE_superadmin'));
  }, [forcePublic, roles]);

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

        const endpoint = isAdmin
          ? `/api/v1/admin/publications?status=${activeAdminStatus}&page=${targetPage}&size=${PAGE_SIZE}${activeAdminType === 'ALL' ? '' : `&type=${activeAdminType}`}`
          : publicView === 'alliances'
            ? `/api/v1/public/publications/alliances?page=${targetPage}&size=${PAGE_SIZE}&language=${mapAppLocaleToPublicationLanguage(locale)}`
            : `/api/v1/public/publications?page=${targetPage}&size=${PAGE_SIZE}&language=${mapAppLocaleToPublicationLanguage(locale)}&type=${activePublicType}`;

        if (isAdmin) {
          const response = await apiJson<PublicationAdminFeedResponse>(endpoint);
          const nextItems = response.items.map((item) => mapAdminSummaryToCard(item, locale));

          setItems((prev) => (append ? [...prev, ...nextItems] : nextItems));
          setPage(response.page);
          setHasNext(response.hasNext);
          return;
        }

        const response = await apiJson<PublicationFeedResponse>(endpoint);

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
    [activeAdminStatus, activeAdminType, activePublicType, apiJson, isAdmin, locale, messages.publications.loadError, publicView],
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

  const handleSaved = async (mode: 'create' | 'edit') => {
    await loadPage(0, false);
    showTemporarySuccess(
      mode === 'create'
        ? messages.publications.createSuccess
        : locale === 'ru'
          ? 'Публикация успешно обновлена.'
          : 'Publication updated successfully.',
    );
  };

  const handleOpenCreate = () => {
    setEditingPublication(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (publicationId: string) => {
    try {
      setErrorMessage(null);

      const publication = await apiJson<PublicationAdminDetails>(
        `/api/v1/admin/publications/${publicationId}`,
      );

      setEditingPublication(publication);
      setIsModalOpen(true);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(messages.publications.loadError);
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPublication(null);
  };

  const publicationTabs = [
    { status: PublicationStatus.PUBLISHED, label: messages.publications.publishedTab },
    { status: PublicationStatus.DRAFT, label: messages.publications.draftsTab },
    { status: PublicationStatus.SCHEDULED, label: messages.publications.scheduledTab },
  ];

  const adminTypeTabs: Array<{ type: PublicationType | 'ALL'; label: string }> = [
    { type: 'ALL', label: locale === 'ru' ? 'Все' : 'All' },
    { type: PublicationType.NEWS, label: messages.publicationType[PublicationType.NEWS] },
    { type: PublicationType.EVENT, label: messages.publicationType[PublicationType.EVENT] },
    { type: PublicationType.SCHEDULE, label: messages.publicationType[PublicationType.SCHEDULE] },
    { type: PublicationType.GUIDE, label: messages.publicationType[PublicationType.GUIDE] },
    { type: PublicationType.ALLIANCE, label: messages.publicationType[PublicationType.ALLIANCE] },
    { type: PublicationType.GIFTCODES, label: messages.publicationType[PublicationType.GIFTCODES] },
  ];

  const publicTypeTabs = [
    PublicationType.NEWS,
    PublicationType.EVENT,
    PublicationType.SCHEDULE,
    PublicationType.GUIDE,
    PublicationType.GIFTCODES,
  ];

  return (
    <section className="mx-auto mt-10 w-full max-w-5xl px-4">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-[var(--foreground)]">
            {title ?? messages.publications.title}
          </h2>
          <p className="mt-2 text-sm text-[var(--foreground-soft)]">
            {subtitle ?? messages.publications.subtitle}
          </p>
        </div>

        {authenticated && isAdmin && (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleOpenCreate}
              className="w-fit rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-2 text-sm font-semibold tracking-wide text-emerald-300 transition hover:bg-emerald-400/15"
            >
              {messages.publications.createButton}
            </button>

            <div className="flex flex-wrap gap-2">
              {publicationTabs.map((tab) => {
                const active = activeAdminStatus === tab.status;

                return (
                  <button
                    key={tab.status}
                    type="button"
                    onClick={() => {
                      setActiveAdminStatus(tab.status);
                      setPage(0);
                    }}
                    className={
                      active
                        ? 'rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-sm font-semibold tracking-wide text-cyan-300'
                        : 'rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--foreground-soft)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]'
                    }
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-2">
              {adminTypeTabs.map((tab) => {
                const active = activeAdminType === tab.type;

                return (
                  <button
                    key={tab.type}
                    type="button"
                    onClick={() => {
                      setActiveAdminType(tab.type);
                      setPage(0);
                    }}
                    className={
                      active
                        ? 'rounded-xl border border-violet-400/40 bg-violet-400/10 px-4 py-2 text-sm font-semibold tracking-wide text-violet-300'
                        : 'rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--foreground-soft)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]'
                    }
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {!isAdmin && publicView === 'main' && (
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
            {publicTypeTabs.map((type) => {
              const active = activePublicType === type;

              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setActivePublicType(type);
                    setPage(0);
                  }}
                  className={
                    active
                      ? 'min-h-11 rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-3 py-2 text-center text-xs font-semibold leading-tight text-cyan-300 sm:px-4 sm:text-sm sm:tracking-wide'
                      : 'min-h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-center text-xs font-medium leading-tight text-[var(--foreground-soft)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] sm:px-4 sm:text-sm'
                  }
                >
                  {messages.publicationType[type]}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {successMessage && (
        <div className="mb-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-300">
          {successMessage}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-sm text-[var(--foreground-muted)]">
          {messages.publications.loading}
        </div>
      ) : errorMessage ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-6 text-sm text-red-300">
          {messages.publications.loadError}: {errorMessage}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">
            {messages.publications.emptyTitle}
          </h3>
          <p className="mt-2 text-sm text-[var(--foreground-soft)]">
            {messages.publications.emptyDescription}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((publication) => (
            <PublicationCard
              key={publication.id}
              publication={publication}
              showStatus={isAdmin}
              canEdit={isAdmin}
              onEdit={isAdmin ? () => void handleOpenEdit(publication.id) : undefined}
            />
          ))}
        </div>
      )}

      {!loading && !errorMessage && hasNext && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingMore
              ? messages.publications.loadingMore
              : messages.publications.loadMore}
          </button>
        </div>
      )}

      <CreatePublicationModal
        open={isModalOpen}
        mode={editingPublication ? 'edit' : 'create'}
        initialPublication={editingPublication}
        onClose={handleCloseModal}
        onSaved={handleSaved}
      />
    </section>
  );
}
