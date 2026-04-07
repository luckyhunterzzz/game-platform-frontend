'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/lib/i18n/i18n-context';
import { ApiError, useApi } from '@/lib/use-api';
import {
  EMPTY_LOCALIZED_TEXT,
  getLocalizedText,
  type CreateRarityRequest,
  type HeroLocale,
  type LocalizedText,
  type RarityItem,
  type RarityResponseDto,
  type UpdateRarityRequest,
  validateLocalizedTextPair,
  mapRarityDto,
} from '@/lib/types/hero';
import DictionaryModal from './DictionaryModal';
import LocalizedTextFields from './LocalizedTextFields';

const RARITIES_API = '/api/v1/admin/heroes/rarities';
const RARITIES_CATALOG_API = '/api/v1/admin/heroes/rarities/catalog';

type CatalogResponseDto<T> = {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
};

type RarityFormState = {
  name: LocalizedText;
  stars: string;
};

const EMPTY_FORM: RarityFormState = {
  name: { ...EMPTY_LOCALIZED_TEXT },
  stars: '',
};

export default function RaritiesWorkspace() {
  const { apiJson, apiPostJson, apiPutJson, apiDeleteVoid } = useApi();
  const { messages } = useI18n();

  const locale: HeroLocale =
    messages.common.languageRussian === 'Русский' ? 'RU' : 'EN';

  const t = useMemo(
    () =>
      locale === 'RU'
        ? {
            sectionTitle: 'Редкости',
            sectionSubtitle: 'Полный CRUD для редкостей',
            create: 'Создать',
            createTitle: 'Создать редкость',
            editTitle: 'Изменить редкость',
            detailsTitle: 'Детали редкости',
            detailsSubtitle: 'Просмотр, изменение и удаление выбранной записи',
            edit: 'Изменить',
            delete: 'Удалить',
            cancel: 'Отмена',
            save: 'Сохранить',
            creating: 'Создание...',
            saving: 'Сохранение...',
            loadingList: 'Загрузка редкостей...',
            loadingDetails: 'Загрузка деталей...',
            empty: 'Редкостей пока нет',
            select: 'Выбери редкость из списка',
            id: 'ID',
            name: 'Название',
            stars: 'Звезды',
            starsPlaceholder: 'Введите количество звезд',
            close: 'Закрыть',
            deleteConfirm: (item: RarityItem) =>
              `Удалить редкость #${item.id} (${item.name.ru}, ${item.stars}★)?`,
          }
        : {
            sectionTitle: 'Rarities',
            sectionSubtitle: 'Full CRUD for rarities',
            create: 'Create',
            createTitle: 'Create rarity',
            editTitle: 'Edit rarity',
            detailsTitle: 'Rarity details',
            detailsSubtitle: 'View, edit and delete selected item',
            edit: 'Edit',
            delete: 'Delete',
            cancel: 'Cancel',
            save: 'Save',
            creating: 'Creating...',
            saving: 'Saving...',
            loadingList: 'Loading rarities...',
            loadingDetails: 'Loading details...',
            empty: 'No rarities yet',
            select: 'Select a rarity from the list',
            id: 'ID',
            name: 'Name',
            stars: 'Stars',
            starsPlaceholder: 'Enter stars count',
            close: 'Close',
            deleteConfirm: (item: RarityItem) =>
              `Delete rarity #${item.id} (${item.name.en}, ${item.stars}★)?`,
          },
    [locale],
  );

  const [items, setItems] = useState<RarityItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<RarityItem | null>(null);
  const [catalogPage, setCatalogPage] = useState<CatalogResponseDto<RarityResponseDto> | null>(null);

  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [listError, setListError] = useState<string | null>(null);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [createForm, setCreateForm] = useState<RarityFormState>(EMPTY_FORM);
  const [editForm, setEditForm] = useState<RarityFormState>(EMPTY_FORM);

  const loadList = useCallback(async (searchValue: string) => {
    setLoadingList(true);
    setListError(null);

    try {
      const params = new URLSearchParams({ page: '0', size: '5' });
      if (searchValue.trim()) {
        params.set('search', searchValue.trim());
      }
      const response = await apiJson<CatalogResponseDto<RarityResponseDto>>(
        `${RARITIES_CATALOG_API}?${params.toString()}`,
      );
      const mapped = response.items.map(mapRarityDto);

      setItems(mapped);
      setCatalogPage(response);

      if (mapped.length > 0) {
        setSelectedId((prev) => prev ?? mapped[0].id);
      } else {
        setSelectedId(null);
        setSelectedItem(null);
      }
    } catch (error) {
      setListError(error instanceof Error ? error.message : 'Failed to load rarities');
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
      const response = await apiJson<CatalogResponseDto<RarityResponseDto>>(
        `${RARITIES_CATALOG_API}?page=${catalogPage.page + 1}&size=${catalogPage.size}${searchQuery.trim() ? `&search=${encodeURIComponent(searchQuery.trim())}` : ''}`,
      );
      setItems((prev) => [...prev, ...response.items.map(mapRarityDto)]);
      setCatalogPage(response);
    } catch (error) {
      setListError(error instanceof Error ? error.message : 'Failed to load more rarities');
    } finally {
      setLoadingMore(false);
    }
  };

  const loadDetails = useCallback(
    async (id: number) => {
      setLoadingDetails(true);
      setDetailsError(null);

      try {
        const response = await apiJson<RarityResponseDto>(`${RARITIES_API}/${id}`);
        setSelectedItem(mapRarityDto(response));
      } catch (error) {
        setDetailsError(error instanceof Error ? error.message : 'Failed to load rarity');
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

  const resetCreateForm = () => {
    setCreateForm({
      name: { ...EMPTY_LOCALIZED_TEXT },
      stars: '',
    });
    setSubmitError(null);
  };

  const resetEditForm = (item: RarityItem) => {
    setEditForm({
      name: { ...item.name },
      stars: String(item.stars),
    });
    setSubmitError(null);
  };

  const validateForm = (form: RarityFormState): string | null => {
    const nameError = validateLocalizedTextPair(form.name, 'Название RU', 'Name EN');
    if (nameError) {
      return nameError;
    }

    const starsNumber = Number(form.stars);

    if (!Number.isInteger(starsNumber)) {
      return locale === 'RU'
        ? 'Количество звезд должно быть целым числом'
        : 'Stars must be an integer';
    }

    if (starsNumber <= 0) {
      return locale === 'RU'
        ? 'Количество звезд должно быть больше 0'
        : 'Stars must be greater than 0';
    }

    if (starsNumber > 5) {
      return locale === 'RU'
        ? 'Количество звезд не может быть больше 5'
        : 'Stars cannot be greater than 5';
    }

    return null;
  };

  const buildPayload = (form: RarityFormState): CreateRarityRequest => {
    return {
      nameJson: {
        ru: form.name.ru.trim(),
        en: form.name.en.trim(),
      },
      stars: Number(form.stars),
    };
  };

  const handleCreate = async () => {
    const validationError = validateForm(createForm);
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const payload = buildPayload(createForm);

      const created = await apiPostJson<CreateRarityRequest, RarityResponseDto>(
        RARITIES_API,
        payload,
      );

      const mapped = mapRarityDto(created);

      setItems((prev) => [...prev, mapped].sort((a, b) => a.stars - b.stars));
      setSelectedId(mapped.id);
      setSelectedItem(mapped);
      setCreateOpen(false);
      resetCreateForm();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to create rarity');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = () => {
    if (!selectedItem) {
      return;
    }

    resetEditForm(selectedItem);
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedItem) {
      return;
    }

    const validationError = validateForm(editForm);
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const payload: UpdateRarityRequest = buildPayload(editForm);

      const updated = await apiPutJson<UpdateRarityRequest, RarityResponseDto>(
        `${RARITIES_API}/${selectedItem.id}`,
        payload,
      );

      const mapped = mapRarityDto(updated);

      setItems((prev) =>
        prev
          .map((item) => (item.id === mapped.id ? mapped : item))
          .sort((a, b) => a.stars - b.stars),
      );
      setSelectedItem(mapped);
      setEditOpen(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to update rarity');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) {
      return;
    }

    const confirmed = window.confirm(t.deleteConfirm(selectedItem));

    if (!confirmed) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      await apiDeleteVoid(`${RARITIES_API}/${selectedItem.id}`);

      const nextItems = items.filter((item) => item.id !== selectedItem.id);
      setItems(nextItems);

      if (nextItems.length > 0) {
        const nextSelected = nextItems[0];
        setSelectedId(nextSelected.id);
      } else {
        setSelectedId(null);
        setSelectedItem(null);
      }
    } catch (error) {
      const message =
        error instanceof ApiError || error instanceof Error
          ? error.message
          : 'Failed to delete rarity';

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

          <label className="mb-4 block">
            <span className="sr-only">{locale === 'RU' ? 'Поиск редкостей' : 'Search rarities'}</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={locale === 'RU' ? 'Поиск редкостей' : 'Search rarities'}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] outline-none"
            />
          </label>

          {loadingList ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--foreground-soft)]">
              {t.loadingList}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--foreground-soft)]">
              {searchQuery.trim()
                ? locale === 'RU'
                  ? '\u041d\u0438\u0447\u0435\u0433\u043e \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u043e'
                  : 'Nothing found'
                : t.empty}
            </div>
          ) : searchQuery.trim() ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--foreground-soft)]">
              {locale === 'RU' ? 'Ничего не найдено' : 'Nothing found'}
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => {
                const isActive = item.id === selectedId;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      isActive
                        ? 'border-cyan-400/40 bg-cyan-400/10'
                        : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-[var(--foreground)]">
                        {getLocalizedText(item.name, locale)}
                      </div>
                      <div className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-1 text-xs font-semibold text-amber-300">
                        {item.stars}★
                      </div>
                    </div>

                    <div className="mt-2 text-[11px] uppercase tracking-wide text-[var(--foreground-muted)]">
                      ID: {item.id}
                    </div>
                  </button>
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
              {submitError}
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
                  {t.id}
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
                  {t.stars}
                </div>
                <div className="text-sm font-semibold text-[var(--foreground)]">
                  {selectedItem.stars}
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
        onClose={() => {
          if (!submitting) {
            setCreateOpen(false);
          }
        }}
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

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[var(--foreground-soft)]">
              {t.stars}
            </span>
            <input
              type="number"
              min={1}
              max={5}
              step={1}
              value={createForm.stars}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, stars: e.target.value }))
              }
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-400/40"
              placeholder={t.starsPlaceholder}
            />
          </label>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              disabled={submitting}
              onClick={() => setCreateOpen(false)}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-2 text-sm text-[var(--foreground-soft)] transition hover:bg-[var(--surface-hover)]"
            >
              {t.cancel}
            </button>

            <button
              type="button"
              disabled={submitting}
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
        onClose={() => {
          if (!submitting) {
            setEditOpen(false);
          }
        }}
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

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[var(--foreground-soft)]">
              {t.stars}
            </span>
            <input
              type="number"
              min={1}
              max={5}
              step={1}
              value={editForm.stars}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, stars: e.target.value }))
              }
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-400/40"
              placeholder={t.starsPlaceholder}
            />
          </label>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              disabled={submitting}
              onClick={() => setEditOpen(false)}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-2 text-sm text-[var(--foreground-soft)] transition hover:bg-[var(--surface-hover)]"
            >
              {t.cancel}
            </button>

            <button
              type="button"
              disabled={submitting}
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
