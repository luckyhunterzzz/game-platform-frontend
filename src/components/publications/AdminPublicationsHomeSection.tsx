'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ApiError, useApi } from '@/lib/use-api';
import { useI18n } from '@/lib/i18n/i18n-context';
import type {
  PublicationAdminDetails,
  PublicationAdminHomeResponse,
  PublicationAdminSummary,
  PublicationItem,
} from '@/lib/types/publication';
import CreatePublicationModal from './CreatePublicationModal';
import PublicationCard from './PublicationCard';

function mapAdminSummaryToCard(summary: PublicationAdminSummary, locale: 'ru' | 'en'): PublicationItem {
  const title = locale === 'ru' ? summary.titleJson.ru : summary.titleJson.en;
  const content = locale === 'ru' ? summary.contentJson.ru : summary.contentJson.en;

  return {
    id: summary.id,
    type: summary.type,
    status: summary.status,
    title: title.trim() || content.trim() || 'Untitled publication',
    content: content.trim() || null,
    imageUrl: summary.imageUrl ?? null,
    publishedAt: summary.publishedAt ?? null,
    pinned: summary.pinned,
    showInNewsFeed: summary.showInNewsFeed,
  };
}

type SectionItem = {
  key: 'published' | 'drafts' | 'scheduled' | 'alliances';
  title: string;
  description: string;
  items: PublicationItem[];
};

const SUCCESS_MESSAGE_TIMEOUT_MS = 4000;

export default function AdminPublicationsHomeSection() {
  const { apiJson } = useApi();
  const { locale, messages } = useI18n();

  const [data, setData] = useState<PublicationAdminHomeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPublication, setEditingPublication] =
    useState<PublicationAdminDetails | null>(null);
  const successTimerRef = useRef<number | null>(null);

  const loadOverview = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const response = await apiJson<PublicationAdminHomeResponse>(
        '/api/v1/admin/publications/home?size=5',
      );
      setData(response);
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
    }
  }, [apiJson, messages.publications.loadError]);

  useEffect(() => {
    void loadOverview();

    return () => {
      if (successTimerRef.current) {
        window.clearTimeout(successTimerRef.current);
      }
    };
  }, [loadOverview]);

  const sectionLabels = useMemo(() => {
    return locale === 'ru'
      ? {
          published: {
            title: 'Опубликованные',
            description: 'Свежие публикации, которые уже видят пользователи.',
          },
          drafts: {
            title: 'Черновики',
            description: 'Материалы в работе, которые еще не ушли в публичный раздел.',
          },
          scheduled: {
            title: 'Запланированные',
            description: 'Публикации с отложенным выпуском.',
          },
          alliances: {
            title: 'Альянсы',
            description: 'Опубликованные объявления альянсов.',
          },
          openPublicHome: 'Открыть публичную главную',
          createCardTitle: 'Быстрые действия',
          createCardDescription: 'Отсюда можно сразу начать новую публикацию или вернуться на обычную главную.',
        }
      : {
          published: {
            title: 'Published',
            description: 'Latest publications already visible to users.',
          },
          drafts: {
            title: 'Drafts',
            description: 'Work-in-progress materials not yet shown publicly.',
          },
          scheduled: {
            title: 'Scheduled',
            description: 'Publications queued for future release.',
          },
          alliances: {
            title: 'Alliances',
            description: 'Published alliance announcements.',
          },
          openPublicHome: 'Open public home',
          createCardTitle: 'Quick actions',
          createCardDescription: 'Start a new publication or jump back to the public homepage.',
        };
  }, [locale]);

  const sections = useMemo<SectionItem[]>(() => {
    if (!data) {
      return [];
    }

    return [
      {
        key: 'published',
        title: sectionLabels.published.title,
        description: sectionLabels.published.description,
        items: data.published.items.map((item) => mapAdminSummaryToCard(item, locale)),
      },
      {
        key: 'drafts',
        title: sectionLabels.drafts.title,
        description: sectionLabels.drafts.description,
        items: data.drafts.items.map((item) => mapAdminSummaryToCard(item, locale)),
      },
      {
        key: 'scheduled',
        title: sectionLabels.scheduled.title,
        description: sectionLabels.scheduled.description,
        items: data.scheduled.items.map((item) => mapAdminSummaryToCard(item, locale)),
      },
      {
        key: 'alliances',
        title: sectionLabels.alliances.title,
        description: sectionLabels.alliances.description,
        items: data.alliances.items.map((item) => mapAdminSummaryToCard(item, locale)),
      },
    ];
  }, [data, locale, sectionLabels]);

  const handleSaved = async (mode: 'create' | 'edit') => {
    await loadOverview();
    setSuccessMessage(
      mode === 'create'
        ? messages.publications.createSuccess
        : locale === 'ru'
          ? 'Публикация успешно обновлена.'
          : 'Publication updated successfully.',
    );

    if (successTimerRef.current) {
      window.clearTimeout(successTimerRef.current);
    }

    successTimerRef.current = window.setTimeout(() => {
      setSuccessMessage(null);
      successTimerRef.current = null;
    }, SUCCESS_MESSAGE_TIMEOUT_MS);
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

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-10">
      <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm backdrop-blur-sm">
          <h2 className="text-3xl font-bold text-[var(--foreground)]">
            {locale === 'ru' ? 'Админская главная' : 'Admin homepage'}
          </h2>
          <p className="mt-3 text-sm leading-7 text-[var(--foreground-soft)]">
            {locale === 'ru'
              ? 'Отдельная админская витрина для работы с публикациями без смешивания с обычной публичной главной.'
              : 'A separate admin-facing homepage for publication workflows without mixing them into the public homepage.'}
          </p>
        </div>

        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">
            {sectionLabels.createCardTitle}
          </h3>
          <p className="mt-3 text-sm leading-7 text-[var(--foreground-soft)]">
            {sectionLabels.createCardDescription}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setEditingPublication(null);
                setIsModalOpen(true);
              }}
              className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-2 text-sm font-semibold tracking-wide text-emerald-300 transition hover:bg-emerald-400/15"
            >
              {messages.publications.createButton}
            </button>
            <Link
              href="/"
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-hover)]"
            >
              {sectionLabels.openPublicHome}
            </Link>
          </div>
        </div>
      </div>

      {successMessage ? (
        <div className="mb-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-300">
          {successMessage}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-sm text-[var(--foreground-muted)]">
          {messages.publications.loading}
        </div>
      ) : errorMessage ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-6 text-sm text-red-300">
          {messages.publications.loadError}: {errorMessage}
        </div>
      ) : (
        <div className="space-y-6">
          {sections.map((section) => (
            <section
              key={section.key}
              className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm backdrop-blur-sm"
            >
              <div className="mb-5">
                <h3 className="text-2xl font-bold text-[var(--foreground)]">
                  {section.title}
                </h3>
                <p className="mt-2 text-sm text-[var(--foreground-soft)]">
                  {section.description}
                </p>
              </div>

              {section.items.length === 0 ? (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-5 text-sm text-[var(--foreground-soft)]">
                  {messages.publications.emptyDescription}
                </div>
              ) : (
                <div className="space-y-4">
                  {section.items.map((publication) => (
                    <PublicationCard
                      key={`${section.key}-${publication.id}`}
                      publication={publication}
                      showStatus
                      canEdit
                      onEdit={() => void handleOpenEdit(publication.id)}
                    />
                  ))}
                </div>
              )}
            </section>
          ))}
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
