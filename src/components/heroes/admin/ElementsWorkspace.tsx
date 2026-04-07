'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/lib/i18n/i18n-context';
import { ApiError, useApi } from '@/lib/use-api';
import {
  EMPTY_LOCALIZED_TEXT,
  getLocalizedText,
  type CreateElementRequest,
  type ElementItem,
  type ElementResponseDto,
  type HeroLocale,
  type LocalizedText,
  type UpdateElementRequest,
  validateLocalizedTextPair,
  mapElementDto,
} from '@/lib/types/hero';
import DictionaryModal from './DictionaryModal';
import LocalizedTextFields from './LocalizedTextFields';

const ELEMENTS_API = '/api/v1/admin/heroes/elements';
const ELEMENTS_CATALOG_API = '/api/v1/admin/heroes/elements/catalog';

type CatalogResponseDto<T> = {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
};

type ElementFormState = {
  name: LocalizedText;
};

const EMPTY_FORM: ElementFormState = {
  name: { ...EMPTY_LOCALIZED_TEXT },
};

export default function ElementsWorkspace() {
  const { apiJson, apiPostJson, apiPutJson, apiDeleteVoid } = useApi();
  const { messages } = useI18n();

  const locale: HeroLocale =
    messages.common.languageRussian === 'Русский' ? 'RU' : 'EN';

  const t = useMemo(
    () =>
      locale === 'RU'
        ? {
            sectionTitle: 'Элементы',
            sectionSubtitle: 'Полный CRUD для элементов',
            create: 'Создать',
            createTitle: 'Создать элемент',
            editTitle: 'Изменить элемент',
            detailsTitle: 'Детали элемента',
            detailsSubtitle: 'Просмотр, изменение и удаление выбранной записи',
            edit: 'Изменить',
            delete: 'Удалить',
            cancel: 'Отмена',
            save: 'Сохранить',
            creating: 'Создание...',
            saving: 'Сохранение...',
            loadingList: 'Загрузка элементов...',
            loadingDetails: 'Загрузка деталей...',
            empty: 'Элементов пока нет',
            noResults: 'Ничего не найдено',
            select: 'Выбери элемент из списка',
            searchPlaceholder: 'Поиск элементов',
            id: 'ID',
            name: 'Название',
            close: 'Закрыть',
            deleteConfirm: (item: ElementItem) =>
              `Удалить элемент #${item.id} (${item.name.ru})?`,
          }
        : {
            sectionTitle: 'Elements',
            sectionSubtitle: 'Full CRUD for elements',
            create: 'Create',
            createTitle: 'Create element',
            editTitle: 'Edit element',
            detailsTitle: 'Element details',
            detailsSubtitle: 'View, edit and delete selected item',
            edit: 'Edit',
            delete: 'Delete',
            cancel: 'Cancel',
            save: 'Save',
            creating: 'Creating...',
            saving: 'Saving...',
            loadingList: 'Loading elements...',
            loadingDetails: 'Loading details...',
            empty: 'No elements yet',
            noResults: 'Nothing found',
            select: 'Select an element from the list',
            searchPlaceholder: 'Search elements',
            id: 'ID',
            name: 'Name',
            close: 'Close',
            deleteConfirm: (item: ElementItem) =>
              `Delete element #${item.id} (${item.name.en})?`,
          },
    [locale],
  );

  const [items, setItems] = useState<ElementItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<ElementItem | null>(null);
  const [catalogPage, setCatalogPage] = useState<CatalogResponseDto<ElementResponseDto> | null>(null);

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

  const [createForm, setCreateForm] = useState<ElementFormState>(EMPTY_FORM);
  const [editForm, setEditForm] = useState<ElementFormState>(EMPTY_FORM);

  const filteredItems = useMemo(() => {
    const normalized = searchQuery.trim().toLocaleLowerCase(locale === 'RU' ? 'ru-RU' : 'en-US');
    if (!normalized) {
      return items;
    }

    return items.filter((item) =>
      [item.name.ru, item.name.en].some((value) =>
        value.toLocaleLowerCase(locale === 'RU' ? 'ru-RU' : 'en-US').includes(normalized),
      ),
    );
  }, [items, locale, searchQuery]);

  const loadList = useCallback(async () => {
    setLoadingList(true);
    setListError(null);

    try {
      const response = await apiJson<CatalogResponseDto<ElementResponseDto>>(
        `${ELEMENTS_CATALOG_API}?page=0&size=5`,
      );
      const mapped = response.items.map(mapElementDto);

      setItems(mapped);
      setCatalogPage(response);

      if (mapped.length > 0) {
        setSelectedId((prev) => prev ?? mapped[0].id);
      } else {
        setSelectedId(null);
        setSelectedItem(null);
      }
    } catch (error) {
      setListError(error instanceof Error ? error.message : 'Failed to load elements');
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
      const response = await apiJson<CatalogResponseDto<ElementResponseDto>>(
        `${ELEMENTS_CATALOG_API}?page=${catalogPage.page + 1}&size=${catalogPage.size}`,
      );
      setItems((prev) => [...prev, ...response.items.map(mapElementDto)]);
      setCatalogPage(response);
    } catch (error) {
      setListError(error instanceof Error ? error.message : 'Failed to load more elements');
    } finally {
      setLoadingMore(false);
    }
  };

  const loadDetails = useCallback(
    async (id: number) => {
      setLoadingDetails(true);
      setDetailsError(null);

      try {
        const response = await apiJson<ElementResponseDto>(`${ELEMENTS_API}/${id}`);
        setSelectedItem(mapElementDto(response));
      } catch (error) {
        setDetailsError(error instanceof Error ? error.message : 'Failed to load element');
      } finally {
        setLoadingDetails(false);
      }
    },
    [apiJson],
  );

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    if (selectedId !== null) {
      void loadDetails(selectedId);
    }
  }, [selectedId, loadDetails]);

  useEffect(() => {
    if (filteredItems.length === 0) {
      setSelectedId(null);
      setSelectedItem(null);
      return;
    }

    if (selectedId === null || !filteredItems.some((item) => item.id === selectedId)) {
      setSelectedId(filteredItems[0].id);
    }
  }, [filteredItems, selectedId]);

  const resetCreateForm = () => {
    setCreateForm({
      name: { ...EMPTY_LOCALIZED_TEXT },
    });
    setSubmitError(null);
  };

  const resetEditForm = (item: ElementItem) => {
    setEditForm({
      name: { ...item.name },
    });
    setSubmitError(null);
  };

  const validateForm = (form: ElementFormState): string | null => {
    return validateLocalizedTextPair(form.name, 'Название RU', 'Name EN');
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
      const payload: CreateElementRequest = {
        nameJson: {
          ru: createForm.name.ru.trim(),
          en: createForm.name.en.trim(),
        },
      };

      const created = await apiPostJson<CreateElementRequest, ElementResponseDto>(
        ELEMENTS_API,
        payload,
      );

      const mapped = mapElementDto(created);

      setItems((prev) => [...prev, mapped].sort((a, b) => a.id - b.id));
      setSelectedId(mapped.id);
      setSelectedItem(mapped);
      setCreateOpen(false);
      resetCreateForm();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to create element');
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
      const payload: UpdateElementRequest = {
        nameJson: {
          ru: editForm.name.ru.trim(),
          en: editForm.name.en.trim(),
        },
      };

      const updated = await apiPutJson<UpdateElementRequest, ElementResponseDto>(
        `${ELEMENTS_API}/${selectedItem.id}`,
        payload,
      );

      const mapped = mapElementDto(updated);

      setItems((prev) => prev.map((item) => (item.id === mapped.id ? mapped : item)));
      setSelectedItem(mapped);
      setEditOpen(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to update element');
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
      await apiDeleteVoid(`${ELEMENTS_API}/${selectedItem.id}`);

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
          : 'Failed to delete element';

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
            <span className="sr-only">{t.searchPlaceholder}</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] outline-none"
            />
          </label>

          {loadingList ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--foreground-soft)]">
              {t.loadingList}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--foreground-soft)]">
              {t.empty}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--foreground-soft)]">
              {t.noResults}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => {
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
                    <div className="text-sm font-semibold text-[var(--foreground)]">
                      {getLocalizedText(item.name, locale)}
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
