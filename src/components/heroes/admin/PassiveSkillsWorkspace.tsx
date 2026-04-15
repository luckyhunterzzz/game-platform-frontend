'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/lib/i18n/i18n-context';
import { ApiError, useApi } from '@/lib/use-api';
import {
  EMPTY_LOCALIZED_TEXT,
  getLocalizedText,
  type CreatePassiveSkillRequest,
  type HeroLocale,
  type LocalizedText,
  type PassiveSkillItem,
  type PassiveSkillResponseDto,
  type UpdatePassiveSkillRequest,
  validateLocalizedTextPair,
  mapPassiveSkillDto,
} from '@/lib/types/hero';
import DictionaryModal from './DictionaryModal';
import DictionaryCatalogListItem from './DictionaryCatalogListItem';
import DictionaryImageUploadField from './DictionaryImageUploadField';
import LocalizedTextFields from './LocalizedTextFields';
import LocalizedTextareaFields from './LocalizedTextareaFields';
import SearchField from './SearchField';

const API = '/api/v1/admin/heroes/passive-skills';
const CATALOG_API = '/api/v1/admin/heroes/passive-skills/catalog';

type CatalogResponseDto<T> = {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
};

type FormState = {
  name: LocalizedText;
  description: LocalizedText;
  imageBucket: string | null;
  imageObjectKey: string | null;
  imageUrl: string | null;
};

type DeleteUsageHero = {
  id: number;
  slug: string;
  nameJson: LocalizedText;
  status: string;
};

type DeleteUsageErrorPayload = {
  code?: string;
  message?: string;
  heroes?: DeleteUsageHero[];
};

const EMPTY_FORM: FormState = {
  name: { ...EMPTY_LOCALIZED_TEXT },
  description: { ...EMPTY_LOCALIZED_TEXT },
  imageBucket: null,
  imageObjectKey: null,
  imageUrl: null,
};

export default function PassiveSkillsWorkspace() {
  const { apiJson, apiPostJson, apiPutJson, apiDeleteVoid } = useApi();
  const { locale: appLocale } = useI18n();

  const locale: HeroLocale = appLocale === 'ru' ? 'RU' : 'EN';

  const t = useMemo(
    () =>
      locale === 'RU'
        ? {
            sectionTitle: '\u041f\u0430\u0441\u0441\u0438\u0432\u043d\u044b\u0435 \u043d\u0430\u0432\u044b\u043a\u0438',
            sectionSubtitle: '\u041f\u043e\u043b\u043d\u044b\u0439 CRUD \u0434\u043b\u044f \u043f\u0430\u0441\u0441\u0438\u0432\u043d\u044b\u0445 \u043d\u0430\u0432\u044b\u043a\u043e\u0432',
            create: '\u0421\u043e\u0437\u0434\u0430\u0442\u044c',
            createTitle: '\u0421\u043e\u0437\u0434\u0430\u0442\u044c \u043f\u0430\u0441\u0441\u0438\u0432\u043d\u044b\u0439 \u043d\u0430\u0432\u044b\u043a',
            editTitle: '\u0418\u0437\u043c\u0435\u043d\u0438\u0442\u044c \u043f\u0430\u0441\u0441\u0438\u0432\u043d\u044b\u0439 \u043d\u0430\u0432\u044b\u043a',
            detailsTitle: '\u0414\u0435\u0442\u0430\u043b\u0438 \u043f\u0430\u0441\u0441\u0438\u0432\u043d\u043e\u0433\u043e \u043d\u0430\u0432\u044b\u043a\u0430',
            detailsSubtitle: '\u041f\u0440\u043e\u0441\u043c\u043e\u0442\u0440, \u0438\u0437\u043c\u0435\u043d\u0435\u043d\u0438\u0435 \u0438 \u0443\u0434\u0430\u043b\u0435\u043d\u0438\u0435 \u0432\u044b\u0431\u0440\u0430\u043d\u043d\u043e\u0439 \u0437\u0430\u043f\u0438\u0441\u0438',
            edit: '\u0418\u0437\u043c\u0435\u043d\u0438\u0442\u044c',
            delete: '\u0423\u0434\u0430\u043b\u0438\u0442\u044c',
            cancel: '\u041e\u0442\u043c\u0435\u043d\u0430',
            save: '\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c',
            creating: '\u0421\u043e\u0437\u0434\u0430\u043d\u0438\u0435...',
            saving: '\u0421\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u0438\u0435...',
            loadingList: '\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u043f\u0430\u0441\u0441\u0438\u0432\u043d\u044b\u0445 \u043d\u0430\u0432\u044b\u043a\u043e\u0432...',
            loadingDetails: '\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u0434\u0435\u0442\u0430\u043b\u0435\u0439...',
            empty: '\u041f\u0430\u0441\u0441\u0438\u0432\u043d\u044b\u0445 \u043d\u0430\u0432\u044b\u043a\u043e\u0432 \u043f\u043e\u043a\u0430 \u043d\u0435\u0442',
            select: '\u0412\u044b\u0431\u0435\u0440\u0438 \u043f\u0430\u0441\u0441\u0438\u0432\u043d\u044b\u0439 \u043d\u0430\u0432\u044b\u043a \u0438\u0437 \u0441\u043f\u0438\u0441\u043a\u0430',
            close: '\u0417\u0430\u043a\u0440\u044b\u0442\u044c',
            name: '\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435',
            description: '\u041e\u043f\u0438\u0441\u0430\u043d\u0438\u0435',
            deleteConfirm: (item: PassiveSkillItem) =>
              `Удалить пассивный навык #${item.id} (${item.name.ru})?`,
          }
        : {
            sectionTitle: 'Passive skills',
            sectionSubtitle: 'Full CRUD for passive skills',
            create: 'Create',
            createTitle: 'Create passive skill',
            editTitle: 'Edit passive skill',
            detailsTitle: 'Passive skill details',
            detailsSubtitle: 'View, edit and delete selected item',
            edit: 'Edit',
            delete: 'Delete',
            cancel: 'Cancel',
            save: 'Save',
            creating: 'Creating...',
            saving: 'Saving...',
            loadingList: 'Loading passive skills...',
            loadingDetails: 'Loading details...',
            empty: 'No passive skills yet',
            select: 'Select a passive skill from the list',
            close: 'Close',
            name: 'Name',
            description: 'Description',
            deleteConfirm: (item: PassiveSkillItem) =>
              `Delete passive skill #${item.id} (${item.name.en})?`,
          },
    [locale],
  );

  const [items, setItems] = useState<PassiveSkillItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<PassiveSkillItem | null>(null);
  const [catalogPage, setCatalogPage] = useState<CatalogResponseDto<PassiveSkillResponseDto> | null>(null);

  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [listError, setListError] = useState<string | null>(null);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deleteUsageHeroes, setDeleteUsageHeroes] = useState<DeleteUsageHero[]>([]);
  const [createImageUploadError, setCreateImageUploadError] = useState<string | null>(null);
  const [editImageUploadError, setEditImageUploadError] = useState<string | null>(null);
  const [createUploadingImage, setCreateUploadingImage] = useState(false);
  const [editUploadingImage, setEditUploadingImage] = useState(false);

  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [createForm, setCreateForm] = useState<FormState>(EMPTY_FORM);
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM);

  const loadList = useCallback(async (searchValue: string) => {
    setLoadingList(true);
    setListError(null);

    try {
      const params = new URLSearchParams({ page: '0', size: '5' });
      if (searchValue.trim()) {
        params.set('search', searchValue.trim());
      }
      const response = await apiJson<CatalogResponseDto<PassiveSkillResponseDto>>(
        `${CATALOG_API}?${params.toString()}`,
      );
      const mapped = response.items.map(mapPassiveSkillDto);
      setItems(mapped);
      setCatalogPage(response);

      if (mapped.length > 0) {
        setSelectedId((prev) => prev ?? mapped[0].id);
      } else {
        setSelectedId(null);
        setSelectedItem(null);
      }
    } catch (error) {
      setListError(
        error instanceof Error ? error.message : 'Failed to load passive skills',
      );
    } finally {
      setLoadingList(false);
    }
  }, [apiJson]);

  const handleLoadMore = async () => {
    if (!catalogPage?.hasNext || loadingMore) {
      return;
    }

    setLoadingMore(true);
    setListError(null);

    try {
      const response = await apiJson<CatalogResponseDto<PassiveSkillResponseDto>>(
        `${CATALOG_API}?page=${catalogPage.page + 1}&size=${catalogPage.size}${searchQuery.trim() ? `&search=${encodeURIComponent(searchQuery.trim())}` : ''}`,
      );
      setItems((prev) => [...prev, ...response.items.map(mapPassiveSkillDto)]);
      setCatalogPage(response);
    } catch (error) {
      setListError(error instanceof Error ? error.message : 'Failed to load more passive skills');
    } finally {
      setLoadingMore(false);
    }
  };

  const loadDetails = useCallback(
    async (id: number) => {
      setLoadingDetails(true);
      setDetailsError(null);

      try {
        const response = await apiJson<PassiveSkillResponseDto>(`${API}/${id}`);
        setSelectedItem(mapPassiveSkillDto(response));
      } catch (error) {
        setDetailsError(
          error instanceof Error ? error.message : 'Failed to load passive skill',
        );
      } finally {
        setLoadingDetails(false);
      }
    },
    [apiJson],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadList(searchQuery);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [loadList, searchQuery]);

  useEffect(() => {
    if (selectedId !== null) {
      void loadDetails(selectedId);
    }
  }, [selectedId, loadDetails]);

  useEffect(() => {
    if (items.length === 0) {
      setSelectedId(null);
      setSelectedItem(null);
      return;
    }

    if (selectedId === null || !items.some((item) => item.id === selectedId)) {
      setSelectedId(items[0].id);
    }
  }, [items, selectedId]);

  const validateForm = (form: FormState): string | null => {
    return (
      validateLocalizedTextPair(form.name, 'Название RU', 'Name EN') ||
      validateLocalizedTextPair(form.description, 'Описание RU', 'Description EN')
    );
  };

  const resetCreateForm = () => {
    setCreateForm({
      name: { ...EMPTY_LOCALIZED_TEXT },
      description: { ...EMPTY_LOCALIZED_TEXT },
      imageBucket: null,
      imageObjectKey: null,
      imageUrl: null,
    });
    setSubmitError(null);
    setDeleteUsageHeroes([]);
    setCreateImageUploadError(null);
  };

  const resetEditForm = (item: PassiveSkillItem) => {
    setEditForm({
      name: { ...item.name },
      description: { ...item.description },
      imageBucket: item.imageBucket ?? null,
      imageObjectKey: item.imageObjectKey ?? null,
      imageUrl: item.imageUrl ?? null,
    });
    setSubmitError(null);
    setDeleteUsageHeroes([]);
    setEditImageUploadError(null);
  };

  const buildPayload = (form: FormState): CreatePassiveSkillRequest => ({
    nameJson: {
      ru: form.name.ru.trim(),
      en: form.name.en.trim(),
    },
    descriptionJson: {
      ru: form.description.ru.trim(),
      en: form.description.en.trim(),
    },
    imageBucket: form.imageBucket,
    imageObjectKey: form.imageObjectKey,
  });

  const handleCreate = async () => {
    if (createImageUploadError) {
      setSubmitError(createImageUploadError);
      return;
    }

    const validationError = validateForm(createForm);
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setDeleteUsageHeroes([]);

    try {
      const created = await apiPostJson<CreatePassiveSkillRequest, PassiveSkillResponseDto>(
        API,
        buildPayload(createForm),
      );

      const mapped = mapPassiveSkillDto(created);
      setItems((prev) => [...prev, mapped].sort((a, b) => a.id - b.id));
      setSelectedId(mapped.id);
      setSelectedItem(mapped);
      setCreateOpen(false);
      resetCreateForm();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Failed to create passive skill',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = () => {
    if (!selectedItem) return;
    resetEditForm(selectedItem);
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedItem) return;

    if (editImageUploadError) {
      setSubmitError(editImageUploadError);
      return;
    }

    const validationError = validateForm(editForm);
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setDeleteUsageHeroes([]);

    try {
      const updated = await apiPutJson<UpdatePassiveSkillRequest, PassiveSkillResponseDto>(
        `${API}/${selectedItem.id}`,
        buildPayload(editForm),
      );

      const mapped = mapPassiveSkillDto(updated);
      setItems((prev) => prev.map((item) => (item.id === mapped.id ? mapped : item)));
      setSelectedItem(mapped);
      setEditOpen(false);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Failed to update passive skill',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    if (!window.confirm(t.deleteConfirm(selectedItem))) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setDeleteUsageHeroes([]);

    try {
      await apiDeleteVoid(`${API}/${selectedItem.id}`);

      const nextItems = items.filter((item) => item.id !== selectedItem.id);
      setItems(nextItems);

      if (nextItems.length > 0) {
        setSelectedId(nextItems[0].id);
      } else {
        setSelectedId(null);
        setSelectedItem(null);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        const payload = error.payload as DeleteUsageErrorPayload | undefined;
        if (payload?.code === 'ENTITY_IN_USE' && Array.isArray(payload.heroes)) {
          setDeleteUsageHeroes(payload.heroes);
        }
      }

      const message =
        error instanceof ApiError || error instanceof Error
          ? error.message
          : 'Failed to delete passive skill';
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-[var(--foreground)]">
                {t.sectionTitle}
              </h3>
              <p className="text-sm text-[var(--foreground-soft)]">{t.sectionSubtitle}</p>
            </div>

            <button
              type="button"
              onClick={() => {
                resetCreateForm();
                setCreateOpen(true);
              }}
              className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-400/15"
            >
              {t.create}
            </button>
          </div>

          {listError && (
            <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {listError}
            </div>
          )}

          <SearchField
            className="mb-4 block"
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={locale === 'RU' ? '\u041f\u043e\u0438\u0441\u043a \u043f\u0430\u0441\u0441\u0438\u0432\u043d\u044b\u0445 \u043d\u0430\u0432\u044b\u043a\u043e\u0432' : 'Search passive skills'}
            ariaLabel={locale === 'RU' ? '\u041f\u043e\u0438\u0441\u043a \u043f\u0430\u0441\u0441\u0438\u0432\u043d\u044b\u0445 \u043d\u0430\u0432\u044b\u043a\u043e\u0432' : 'Search passive skills'}
            clearLabel={locale === 'RU' ? '\u041e\u0447\u0438\u0441\u0442\u0438\u0442\u044c \u043f\u043e\u0438\u0441\u043a' : 'Clear search'}
          />

          {loadingList ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--foreground-soft)]">
              {t.loadingList}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--foreground-soft)]">
              {searchQuery.trim()
                ? locale === 'RU'
                  ? 'Ничего не найдено'
                  : 'Nothing found'
                : t.empty}
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => {
                const isActive = item.id === selectedId;

                return (
                  <DictionaryCatalogListItem
                    key={item.id}
                    active={isActive}
                    onClick={() => setSelectedId(item.id)}
                    title={getLocalizedText(item.name, locale)}
                    description={getLocalizedText(item.description, locale)}
                    id={item.id}
                    imageUrl={item.imageUrl}
                  />
                );
              })}
              {catalogPage?.hasNext ? (
                <button
                  type="button"
                  onClick={() => void handleLoadMore()}
                  disabled={loadingMore}
                  className="w-full rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loadingMore ? t.loadingList : locale === 'RU' ? 'Показать еще' : 'Load more'}
                </button>
              ) : null}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-[var(--foreground)]">
                {t.detailsTitle}
              </h3>
              <p className="text-sm text-[var(--foreground-soft)]">{t.detailsSubtitle}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!selectedItem || loadingDetails}
                onClick={handleOpenEdit}
                className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm font-medium text-amber-300 transition hover:bg-amber-400/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t.edit}
              </button>

              <button
                type="button"
                disabled={!selectedItem || submitting || loadingDetails}
                onClick={handleDelete}
                className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-400/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t.delete}
              </button>
            </div>
          </div>

          {submitError && (
            <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <div>{submitError}</div>
              {deleteUsageHeroes.length > 0 ? (
                <div className="mt-3 space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-red-200/90">
                    {locale === 'RU'
                      ? 'Сначала уберите этот навык у следующих героев:'
                      : 'Remove this skill from these heroes first:'}
                  </div>
                  <div className="space-y-2">
                    {deleteUsageHeroes.map((hero) => (
                      <div
                        key={hero.id}
                        className="rounded-lg border border-red-400/20 bg-black/10 px-3 py-2 text-xs text-red-100"
                      >
                        <div className="font-medium">
                          {getLocalizedText(hero.nameJson, locale)} ({hero.slug})
                        </div>
                        <div className="mt-1 text-[11px] uppercase tracking-wide text-red-200/80">
                          {hero.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {detailsError && (
            <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {detailsError}
            </div>
          )}

          {loadingDetails ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-sm text-[var(--foreground-soft)]">
              {t.loadingDetails}
            </div>
          ) : !selectedItem ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-sm text-[var(--foreground-soft)]">
              {t.select}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="mb-2 text-xs uppercase tracking-wide text-[var(--foreground-muted)]">
                  ID
                </div>
                <div className="text-sm font-semibold text-[var(--foreground)]">
                  {selectedItem.id}
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="mb-2 text-xs uppercase tracking-wide text-[var(--foreground-muted)]">
                  {t.name}
                </div>
                <div className="text-sm font-semibold text-[var(--foreground)]">
                  {getLocalizedText(selectedItem.name, locale)}
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="mb-2 text-xs uppercase tracking-wide text-[var(--foreground-muted)]">
                  {t.description}
                </div>
                <div className="text-sm text-[var(--foreground)]">
                  {getLocalizedText(selectedItem.description, locale)}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      <DictionaryModal
        open={isCreateOpen}
        title={t.createTitle}
        closeLabel={t.close}
        onClose={() => !submitting && setCreateOpen(false)}
      >
        <div className="space-y-6">
          {submitError && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {submitError}
            </div>
          )}

          <LocalizedTextFields
            value={createForm.name}
            onChange={(value) => setCreateForm((prev) => ({ ...prev, name: value }))}
            ruLabel="Название RU"
            enLabel="Name EN"
          />

          <LocalizedTextareaFields
            value={createForm.description}
            onChange={(value) =>
              setCreateForm((prev) => ({ ...prev, description: value }))
            }
            ruLabel="Описание RU"
            enLabel="Description EN"
          />

          <DictionaryImageUploadField
            locale={locale}
            value={createForm}
            onChange={(value) => setCreateForm((prev) => ({ ...prev, ...value }))}
            onUploadingChange={setCreateUploadingImage}
            onErrorChange={setCreateImageUploadError}
            disabled={submitting}
          />

          <div className="flex justify-end gap-3">
            <button
              type="button"
              disabled={submitting || createUploadingImage}
              onClick={() => setCreateOpen(false)}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-2 text-sm text-[var(--foreground-soft)] transition hover:bg-[var(--surface-hover)]"
            >
              {t.cancel}
            </button>

            <button
              type="button"
              disabled={submitting || createUploadingImage}
              onClick={handleCreate}
              className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-400/15"
            >
              {submitting ? t.creating : t.create}
            </button>
          </div>
        </div>
      </DictionaryModal>

      <DictionaryModal
        open={isEditOpen}
        title={t.editTitle}
        closeLabel={t.close}
        onClose={() => !submitting && setEditOpen(false)}
      >
        <div className="space-y-6">
          {submitError && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {submitError}
            </div>
          )}

          <LocalizedTextFields
            value={editForm.name}
            onChange={(value) => setEditForm((prev) => ({ ...prev, name: value }))}
            ruLabel="Название RU"
            enLabel="Name EN"
          />

          <LocalizedTextareaFields
            value={editForm.description}
            onChange={(value) =>
              setEditForm((prev) => ({ ...prev, description: value }))
            }
            ruLabel="Описание RU"
            enLabel="Description EN"
          />

          <DictionaryImageUploadField
            locale={locale}
            value={editForm}
            onChange={(value) => setEditForm((prev) => ({ ...prev, ...value }))}
            onUploadingChange={setEditUploadingImage}
            onErrorChange={setEditImageUploadError}
            disabled={submitting}
          />

          <div className="flex justify-end gap-3">
            <button
              type="button"
              disabled={submitting || editUploadingImage}
              onClick={() => setEditOpen(false)}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-2 text-sm text-[var(--foreground-soft)] transition hover:bg-[var(--surface-hover)]"
            >
              {t.cancel}
            </button>

            <button
              type="button"
              disabled={submitting || editUploadingImage}
              onClick={handleUpdate}
              className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm font-medium text-amber-300 transition hover:bg-amber-400/15"
            >
              {submitting ? t.saving : t.save}
            </button>
          </div>
        </div>
      </DictionaryModal>
    </>
  );
}


