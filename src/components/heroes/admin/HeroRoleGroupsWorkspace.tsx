'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { useI18n } from '@/lib/i18n/i18n-context';
import { ApiError, useApi } from '@/lib/use-api';
import {
  EMPTY_LOCALIZED_TEXT,
  getLocalizedText,
  mapHeroRoleGroupDto,
  mapHeroTagDto,
  type CreateHeroRoleGroupRequest,
  type HeroLocale,
  type HeroRoleGroupItem,
  type HeroRoleGroupResponseDto,
  type HeroTagItem,
  type HeroTagResponseDto,
  type LocalizedText,
  type UpdateHeroRoleGroupRequest,
  validateLocalizedTextPair,
} from '@/lib/types/hero';
import DictionaryCatalogListItem from './DictionaryCatalogListItem';
import DictionaryModal from './DictionaryModal';
import LocalizedTextFields from './LocalizedTextFields';
import LocalizedTextareaFields from './LocalizedTextareaFields';
import SearchField from './SearchField';

const API = '/api/v1/admin/heroes/role-groups';
const CATALOG_API = '/api/v1/admin/heroes/role-groups/catalog';
const TAGS_API = '/api/v1/admin/heroes/tags';

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
  tagIds: number[];
};

const EMPTY_FORM: FormState = {
  name: { ...EMPTY_LOCALIZED_TEXT },
  description: { ...EMPTY_LOCALIZED_TEXT },
  tagIds: [],
};

export default function HeroRoleGroupsWorkspace() {
  const { apiJson, apiPostJson, apiPutJson, apiDeleteVoid } = useApi();
  const { locale: appLocale } = useI18n();
  const locale: HeroLocale = appLocale === 'ru' ? 'RU' : 'EN';

  const t = useMemo(
    () =>
      locale === 'RU'
        ? {
            sectionTitle: '\u0422\u0438\u043f\u044b \u0433\u0435\u0440\u043e\u044f',
            sectionSubtitle: '\u041f\u043e\u043b\u043d\u044b\u0439 CRUD \u0434\u043b\u044f \u0442\u0438\u043f\u043e\u0432 \u0433\u0435\u0440\u043e\u044f',
            create: '\u0421\u043e\u0437\u0434\u0430\u0442\u044c',
            createTitle: '\u0421\u043e\u0437\u0434\u0430\u0442\u044c \u0442\u0438\u043f \u0433\u0435\u0440\u043e\u044f',
            editTitle: '\u0418\u0437\u043c\u0435\u043d\u0438\u0442\u044c \u0442\u0438\u043f \u0433\u0435\u0440\u043e\u044f',
            detailsTitle: '\u0414\u0435\u0442\u0430\u043b\u0438 \u0442\u0438\u043f\u0430 \u0433\u0435\u0440\u043e\u044f',
            detailsSubtitle: '\u041f\u0440\u043e\u0441\u043c\u043e\u0442\u0440, \u0438\u0437\u043c\u0435\u043d\u0435\u043d\u0438\u0435 \u0438 \u0443\u0434\u0430\u043b\u0435\u043d\u0438\u0435 \u0432\u044b\u0431\u0440\u0430\u043d\u043d\u043e\u0439 \u0437\u0430\u043f\u0438\u0441\u0438',
            edit: '\u0418\u0437\u043c\u0435\u043d\u0438\u0442\u044c',
            delete: '\u0423\u0434\u0430\u043b\u0438\u0442\u044c',
            cancel: '\u041e\u0442\u043c\u0435\u043d\u0430',
            save: '\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c',
            creating: '\u0421\u043e\u0437\u0434\u0430\u043d\u0438\u0435...',
            saving: '\u0421\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u0438\u0435...',
            loadingList: '\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u0442\u0438\u043f\u043e\u0432 \u0433\u0435\u0440\u043e\u044f...',
            loadingDetails: '\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u0434\u0435\u0442\u0430\u043b\u0435\u0439...',
            empty: '\u0422\u0438\u043f\u043e\u0432 \u0433\u0435\u0440\u043e\u044f \u043f\u043e\u043a\u0430 \u043d\u0435\u0442',
            select: '\u0412\u044b\u0431\u0435\u0440\u0438 \u0442\u0438\u043f \u0433\u0435\u0440\u043e\u044f \u0438\u0437 \u0441\u043f\u0438\u0441\u043a\u0430',
            close: '\u0417\u0430\u043a\u0440\u044b\u0442\u044c',
            name: '\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435',
            description: '\u041e\u043f\u0438\u0441\u0430\u043d\u0438\u0435',
            tags: '\u041f\u043e\u0434\u0442\u0438\u043f\u044b \u0433\u0435\u0440\u043e\u044f',
            noDescription: '\u0411\u0435\u0437 \u043e\u043f\u0438\u0441\u0430\u043d\u0438\u044f',
            noTags: '\u041f\u043e\u0434\u0442\u0438\u043f\u044b \u043d\u0435 \u043f\u0440\u0438\u0432\u044f\u0437\u0430\u043d\u044b',
            nothingFound: '\u041d\u0438\u0447\u0435\u0433\u043e \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u043e',
            loadMore: '\u041f\u043e\u043a\u0430\u0437\u0430\u0442\u044c \u0435\u0449\u0435',
            searchPlaceholder: '\u041f\u043e\u0438\u0441\u043a \u0442\u0438\u043f\u043e\u0432 \u0433\u0435\u0440\u043e\u044f',
            clearSearch: '\u041e\u0447\u0438\u0441\u0442\u0438\u0442\u044c \u043f\u043e\u0438\u0441\u043a',
            deleteConfirm: (item: HeroRoleGroupItem) =>
              `\u0423\u0434\u0430\u043b\u0438\u0442\u044c \u0442\u0438\u043f \u0433\u0435\u0440\u043e\u044f #${item.id} (${item.name.ru})?`,
            nameRu: '\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435 RU',
            nameEn: 'Name EN',
            descriptionRu: '\u041e\u043f\u0438\u0441\u0430\u043d\u0438\u0435 RU',
            descriptionEn: 'Description EN',
          }
        : {
            sectionTitle: 'Hero Types',
            sectionSubtitle: 'Full CRUD for hero types',
            create: 'Create',
            createTitle: 'Create hero type',
            editTitle: 'Edit hero type',
            detailsTitle: 'Hero type details',
            detailsSubtitle: 'View, edit and delete selected item',
            edit: 'Edit',
            delete: 'Delete',
            cancel: 'Cancel',
            save: 'Save',
            creating: 'Creating...',
            saving: 'Saving...',
            loadingList: 'Loading hero types...',
            loadingDetails: 'Loading details...',
            empty: 'No hero types yet',
            select: 'Select a hero type from the list',
            close: 'Close',
            name: 'Name',
            description: 'Description',
            tags: 'Hero subtypes',
            noDescription: 'No description',
            noTags: 'No linked subtypes',
            nothingFound: 'Nothing found',
            loadMore: 'Load more',
            searchPlaceholder: 'Search hero types',
            clearSearch: 'Clear search',
            deleteConfirm: (item: HeroRoleGroupItem) =>
              `Delete hero type #${item.id} (${item.name.en})?`,
            nameRu: 'Name RU',
            nameEn: 'Name EN',
            descriptionRu: 'Description RU',
            descriptionEn: 'Description EN',
          },
    [locale],
  );

  const [items, setItems] = useState<HeroRoleGroupItem[]>([]);
  const [tags, setTags] = useState<HeroTagItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<HeroRoleGroupItem | null>(null);
  const [catalogPage, setCatalogPage] = useState<CatalogResponseDto<HeroRoleGroupResponseDto> | null>(null);
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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [createForm, setCreateForm] = useState<FormState>(EMPTY_FORM);
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM);

  const loadTags = useCallback(async () => {
    const response = await apiJson<HeroTagResponseDto[]>(TAGS_API);
    setTags(response.map(mapHeroTagDto));
  }, [apiJson]);

  const loadList = useCallback(
    async (searchValue: string) => {
      setLoadingList(true);
      setListError(null);
      try {
        const params = new URLSearchParams({ page: '0', size: '5' });
        if (searchValue.trim()) params.set('search', searchValue.trim());
        const response = await apiJson<CatalogResponseDto<HeroRoleGroupResponseDto>>(
          `${CATALOG_API}?${params}`,
        );
        const mapped = response.items.map(mapHeroRoleGroupDto);
        setItems(mapped);
        setCatalogPage(response);
        if (mapped.length > 0) {
          setSelectedId((prev) => prev ?? mapped[0].id);
        } else {
          setSelectedId(null);
          setSelectedItem(null);
        }
      } catch (error) {
        setListError(error instanceof Error ? error.message : 'Failed to load hero types');
      } finally {
        setLoadingList(false);
      }
    },
    [apiJson],
  );

  const loadListRef = useRef(loadList);
  useEffect(() => {
    loadListRef.current = loadList;
  }, [loadList]);

  const loadDetails = useCallback(
    async (id: number) => {
      setLoadingDetails(true);
      setDetailsError(null);
      try {
        const response = await apiJson<HeroRoleGroupResponseDto>(`${API}/${id}`);
        setSelectedItem(mapHeroRoleGroupDto(response));
      } catch (error) {
        setDetailsError(error instanceof Error ? error.message : 'Failed to load hero type');
      } finally {
        setLoadingDetails(false);
      }
    },
    [apiJson],
  );

  useEffect(() => {
    void loadTags().catch(() => undefined);
    void loadList('');
  }, [loadTags, loadList]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadListRef.current(searchQuery);
    }, 250);
    return () => window.clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    if (selectedId !== null) {
      void loadDetails(selectedId);
    }
  }, [selectedId, loadDetails]);

  const validateForm = (form: FormState): string | null => {
    const nameError = validateLocalizedTextPair(form.name, t.nameRu, t.nameEn);
    if (nameError) return nameError;

    if (form.description.ru.trim() || form.description.en.trim()) {
      return validateLocalizedTextPair(form.description, t.descriptionRu, t.descriptionEn);
    }

    return null;
  };

  const buildPayload = (form: FormState): CreateHeroRoleGroupRequest => ({
    nameJson: { ru: form.name.ru.trim(), en: form.name.en.trim() },
    descriptionJson:
      form.description.ru.trim() || form.description.en.trim()
        ? { ru: form.description.ru.trim(), en: form.description.en.trim() }
        : null,
    tagIds: form.tagIds,
  });

  const resetCreateForm = () => {
    setCreateForm({
      name: { ...EMPTY_LOCALIZED_TEXT },
      description: { ...EMPTY_LOCALIZED_TEXT },
      tagIds: [],
    });
    setSubmitError(null);
  };

  const resetEditForm = (item: HeroRoleGroupItem) => {
    setEditForm({
      name: { ...item.name },
      description: item.description ? { ...item.description } : { ...EMPTY_LOCALIZED_TEXT },
      tagIds: item.tags.map((tag) => tag.id),
    });
    setSubmitError(null);
  };

  const handleLoadMore = async () => {
    if (!catalogPage?.hasNext || loadingMore) return;
    setLoadingMore(true);
    try {
      const response = await apiJson<CatalogResponseDto<HeroRoleGroupResponseDto>>(
        `${CATALOG_API}?page=${catalogPage.page + 1}&size=${catalogPage.size}${
          searchQuery.trim() ? `&search=${encodeURIComponent(searchQuery.trim())}` : ''
        }`,
      );
      setItems((prev) => [...prev, ...response.items.map(mapHeroRoleGroupDto)]);
      setCatalogPage(response);
    } catch (error) {
      setListError(error instanceof Error ? error.message : 'Failed to load more hero types');
    } finally {
      setLoadingMore(false);
    }
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
      const created = await apiPostJson<CreateHeroRoleGroupRequest, HeroRoleGroupResponseDto>(
        API,
        buildPayload(createForm),
      );
      const mapped = mapHeroRoleGroupDto(created);
      setItems((prev) => [...prev, mapped].sort((a, b) => a.id - b.id));
      setSelectedId(mapped.id);
      setSelectedItem(mapped);
      setCreateOpen(false);
      resetCreateForm();
      await loadTags();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to create hero type');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (editingId === null) return;

    const validationError = validateForm(editForm);
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const updated = await apiPutJson<UpdateHeroRoleGroupRequest, HeroRoleGroupResponseDto>(
        `${API}/${editingId}`,
        buildPayload(editForm),
      );
      const mapped = mapHeroRoleGroupDto(updated);
      setItems((prev) => prev.map((item) => (item.id === mapped.id ? mapped : item)));
      setSelectedId(mapped.id);
      setSelectedItem(mapped);
      setEditOpen(false);
      setEditingId(null);
      await loadTags();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to update hero type');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    if (!window.confirm(t.deleteConfirm(selectedItem))) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      await apiDeleteVoid(`${API}/${selectedItem.id}`);
      const nextItems = items.filter((item) => item.id !== selectedItem.id);
      setItems(nextItems);
      setSelectedId(nextItems[0]?.id ?? null);
      setSelectedItem(null);
      await loadTags();
    } catch (error) {
      const message =
        error instanceof ApiError || error instanceof Error
          ? error.message
          : 'Failed to delete hero type';
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderTagSelector = (
    form: FormState,
    setForm: Dispatch<SetStateAction<FormState>>,
  ) => (
    <div className="space-y-3">
      <div className="text-sm font-medium text-[var(--foreground-soft)]">{t.tags}</div>
      <div className="max-h-56 space-y-2 overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
        {tags.length === 0 ? (
          <div className="text-sm text-[var(--foreground-soft)]">{t.noTags}</div>
        ) : (
          tags.map((tag) => {
            const checked = form.tagIds.includes(tag.id);
            return (
              <label
                key={tag.id}
                className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2 text-sm text-[var(--foreground)]"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    setForm((prev) => ({
                      ...prev,
                      tagIds: checked
                        ? prev.tagIds.filter((id) => id !== tag.id)
                        : [...prev.tagIds, tag.id],
                    }))
                  }
                />
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{getLocalizedText(tag.name, locale)}</div>
                  {tag.groupName ? (
                    <div className="mt-1 text-xs text-[var(--foreground-soft)]">
                      {getLocalizedText(tag.groupName, locale)}
                    </div>
                  ) : null}
                </div>
              </label>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-[var(--foreground)]">{t.sectionTitle}</h3>
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

          {listError ? (
            <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {listError}
            </div>
          ) : null}

          <SearchField
            className="mb-4 block"
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={t.searchPlaceholder}
            ariaLabel={t.searchPlaceholder}
            clearLabel={t.clearSearch}
          />

          {loadingList ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--foreground-soft)]">
              {t.loadingList}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--foreground-soft)]">
              {searchQuery.trim() ? t.nothingFound : t.empty}
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <DictionaryCatalogListItem
                  key={item.id}
                  active={item.id === selectedId}
                  onClick={() => setSelectedId(item.id)}
                  title={getLocalizedText(item.name, locale)}
                  description={
                    item.description ? getLocalizedText(item.description, locale) : t.noDescription
                  }
                  id={item.id}
                />
              ))}
              {catalogPage?.hasNext ? (
                <button
                  type="button"
                  onClick={() => void handleLoadMore()}
                  disabled={loadingMore}
                  className="w-full rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loadingMore ? t.loadingList : t.loadMore}
                </button>
              ) : null}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-[var(--foreground)]">{t.detailsTitle}</h3>
              <p className="text-sm text-[var(--foreground-soft)]">{t.detailsSubtitle}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!selectedItem}
                onClick={() => {
                  if (!selectedItem) return;
                  resetEditForm(selectedItem);
                  setEditingId(selectedItem.id);
                  setEditOpen(true);
                }}
                className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm font-medium text-amber-300 transition hover:bg-amber-400/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t.edit}
              </button>
              <button
                type="button"
                disabled={!selectedItem || submitting}
                onClick={handleDelete}
                className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-400/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t.delete}
              </button>
            </div>
          </div>

          {submitError ? (
            <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {submitError}
            </div>
          ) : null}
          {detailsError ? (
            <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {detailsError}
            </div>
          ) : null}

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
                <div className="text-sm font-semibold text-[var(--foreground)]">{selectedItem.id}</div>
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
                  {selectedItem.description
                    ? getLocalizedText(selectedItem.description, locale)
                    : t.noDescription}
                </div>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="mb-2 text-xs uppercase tracking-wide text-[var(--foreground-muted)]">
                  {t.tags}
                </div>
                {selectedItem.tags.length === 0 ? (
                  <div className="text-sm text-[var(--foreground-soft)]">{t.noTags}</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-200"
                      >
                        #{getLocalizedText(tag.nameJson, locale)}
                      </span>
                    ))}
                  </div>
                )}
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
          {submitError ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {submitError}
            </div>
          ) : null}
          <LocalizedTextFields
            value={createForm.name}
            onChange={(value) => setCreateForm((prev) => ({ ...prev, name: value }))}
            ruLabel={t.nameRu}
            enLabel={t.nameEn}
          />
          <LocalizedTextareaFields
            value={createForm.description}
            onChange={(value) => setCreateForm((prev) => ({ ...prev, description: value }))}
            ruLabel={t.descriptionRu}
            enLabel={t.descriptionEn}
          />
          {renderTagSelector(createForm, setCreateForm)}
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
        onClose={() => !submitting && setEditOpen(false)}
      >
        <div className="space-y-6">
          {submitError ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {submitError}
            </div>
          ) : null}
          <LocalizedTextFields
            value={editForm.name}
            onChange={(value) => setEditForm((prev) => ({ ...prev, name: value }))}
            ruLabel={t.nameRu}
            enLabel={t.nameEn}
          />
          <LocalizedTextareaFields
            value={editForm.description}
            onChange={(value) => setEditForm((prev) => ({ ...prev, description: value }))}
            ruLabel={t.descriptionRu}
            enLabel={t.descriptionEn}
          />
          {renderTagSelector(editForm, setEditForm)}
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
