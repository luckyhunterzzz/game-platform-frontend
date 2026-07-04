'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import DictionaryModal from '@/components/heroes/admin/DictionaryModal';
import LocalizedTextFields from '@/components/heroes/admin/LocalizedTextFields';
import LocalizedTextareaFields from '@/components/heroes/admin/LocalizedTextareaFields';
import { useI18n } from '@/lib/i18n/i18n-context';
import {
  EMPTY_LOCALIZED_TEXT,
  getLocalizedText,
  validateLocalizedTextPair,
  type HeroLocale,
  type LocalizedText,
} from '@/lib/types/hero';
import {
  EventStatus,
  type EventAdminCatalogResponse,
  type EventAdminDetails,
  type EventAdminSummary,
  type EventBlockAdminItem,
  type EventBlockReorderRequest,
  type EventBlockUpsertRequest,
  type EventUpsertRequest,
} from '@/lib/types/event';
import { ApiError, useApi } from '@/lib/use-api';

import EventImageUploadField from './EventImageUploadField';

const ADMIN_EVENTS_API = '/api/v1/admin/events';

type EventFormState = {
  slug: string;
  status: EventStatus;
  name: LocalizedText;
  description: LocalizedText;
  imageBucket?: string | null;
  imageObjectKey?: string | null;
  imageUrl?: string | null;
};

type BlockFormState = {
  name: LocalizedText;
  description: LocalizedText;
  imageBucket?: string | null;
  imageObjectKey?: string | null;
  imageUrl?: string | null;
  visible: boolean;
};

const EMPTY_EVENT_FORM: EventFormState = {
  slug: '',
  status: EventStatus.DRAFT,
  name: { ...EMPTY_LOCALIZED_TEXT },
  description: { ...EMPTY_LOCALIZED_TEXT },
  imageBucket: null,
  imageObjectKey: null,
  imageUrl: null,
};

const EMPTY_BLOCK_FORM: BlockFormState = {
  name: { ...EMPTY_LOCALIZED_TEXT },
  description: { ...EMPTY_LOCALIZED_TEXT },
  imageBucket: null,
  imageObjectKey: null,
  imageUrl: null,
  visible: true,
};

function mapEventToForm(event: EventAdminDetails): EventFormState {
  return {
    slug: event.slug,
    status: event.status,
    name: event.nameJson,
    description: event.descriptionJson,
    imageBucket: event.imageBucket ?? null,
    imageObjectKey: event.imageObjectKey ?? null,
    imageUrl: event.imageUrl ?? null,
  };
}

function mapBlockToForm(block: EventBlockAdminItem): BlockFormState {
  return {
    name: block.nameJson,
    description: block.descriptionJson,
    imageBucket: block.imageBucket ?? null,
    imageObjectKey: block.imageObjectKey ?? null,
    imageUrl: block.imageUrl ?? null,
    visible: block.visible,
  };
}

function normalizeSlug(value: string): string {
  return value.trim().toLowerCase();
}

function buildBlockPositionState(blocks: EventBlockAdminItem[]): Record<number, string> {
  return Object.fromEntries(blocks.map((block) => [block.id, String(block.position)]));
}

export default function EventsWorkspace() {
  const { apiJson, apiPostJson, apiPutJson, apiDeleteVoid } = useApi();
  const { locale } = useI18n();
  const heroLocale: HeroLocale = locale === 'ru' ? 'RU' : 'EN';

  const [items, setItems] = useState<EventAdminSummary[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<EventAdminDetails | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'ALL'>('ALL');
  const [eventForm, setEventForm] = useState<EventFormState>(EMPTY_EVENT_FORM);
  const [blockForm, setBlockForm] = useState<BlockFormState>(EMPTY_BLOCK_FORM);
  const [blockPositions, setBlockPositions] = useState<Record<number, string>>({});
  const [eventModalMode, setEventModalMode] = useState<'create' | 'edit' | null>(null);
  const [blockModalMode, setBlockModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingBlockId, setEditingBlockId] = useState<number | null>(null);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [savingEvent, setSavingEvent] = useState(false);
  const [savingBlock, setSavingBlock] = useState(false);
  const [savingPositions, setSavingPositions] = useState(false);
  const [eventUploading, setEventUploading] = useState(false);
  const [blockUploading, setBlockUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [blockImageError, setBlockImageError] = useState<string | null>(null);

  const t = useMemo(() => {
    if (locale === 'ru') {
      return {
        title: '\u0421\u043e\u0431\u044b\u0442\u0438\u044f',
        subtitle: 'CRUD \u043f\u043e \u0441\u043e\u0431\u044b\u0442\u0438\u044f\u043c \u0438 \u0438\u0445 \u0431\u043b\u043e\u043a\u0430\u043c.',
        createEvent: '\u0421\u043e\u0437\u0434\u0430\u0442\u044c \u0441\u043e\u0431\u044b\u0442\u0438\u0435',
        editEvent: '\u0420\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u0441\u043e\u0431\u044b\u0442\u0438\u0435',
        createBlock: '\u0421\u043e\u0437\u0434\u0430\u0442\u044c \u0431\u043b\u043e\u043a',
        editBlock: '\u0420\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u0431\u043b\u043e\u043a',
        savePositions: '\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c \u043f\u043e\u0437\u0438\u0446\u0438\u0438',
        position: '\u041f\u043e\u0437\u0438\u0446\u0438\u044f',
        invalidPositions: '\u041f\u043e\u0437\u0438\u0446\u0438\u0438 \u0434\u043e\u043b\u0436\u043d\u044b \u0431\u044b\u0442\u044c \u0443\u043d\u0438\u043a\u0430\u043b\u044c\u043d\u044b\u043c\u0438 \u0446\u0435\u043b\u044b\u043c\u0438 \u0447\u0438\u0441\u043b\u0430\u043c\u0438 \u043e\u0442 1 \u0434\u043e N.',
        filtersTitle: '\u0424\u0438\u043b\u044c\u0442\u0440\u044b',
        searchPlaceholder: '\u041f\u043e\u0438\u0441\u043a \u043f\u043e slug \u0438\u043b\u0438 \u043d\u0430\u0437\u0432\u0430\u043d\u0438\u044e',
        all: '\u0412\u0441\u0435',
        detailsTitle: '\u041a\u0430\u0440\u0442\u043e\u0447\u043a\u0430 \u0441\u043e\u0431\u044b\u0442\u0438\u044f',
        slug: 'Slug',
        status: '\u0421\u0442\u0430\u0442\u0443\u0441',
        save: '\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c',
        delete: '\u0423\u0434\u0430\u043b\u0438\u0442\u044c',
        close: '\u0417\u0430\u043a\u0440\u044b\u0442\u044c',
        cancel: '\u041e\u0442\u043c\u0435\u043d\u0430',
        publicLink: '\u041f\u0443\u0431\u043b\u0438\u0447\u043d\u0430\u044f \u0441\u0442\u0440\u0430\u043d\u0438\u0446\u0430',
        blocksTitle: '\u0411\u043b\u043e\u043a\u0438 \u0441\u043e\u0431\u044b\u0442\u0438\u044f',
        blockVisible: '\u041f\u043e\u043a\u0430\u0437\u044b\u0432\u0430\u0442\u044c \u0432 \u043f\u0443\u0431\u043b\u0438\u0447\u043d\u043e\u0439 \u0432\u0435\u0440\u0441\u0438\u0438',
        createEventFirst: '\u0421\u043d\u0430\u0447\u0430\u043b\u0430 \u0441\u043e\u0437\u0434\u0430\u0439 \u0438\u043b\u0438 \u0432\u044b\u0431\u0435\u0440\u0438 \u0441\u043e\u0431\u044b\u0442\u0438\u0435, \u0437\u0430\u0442\u0435\u043c \u043c\u043e\u0436\u043d\u043e \u0440\u0430\u0431\u043e\u0442\u0430\u0442\u044c \u0441 \u0431\u043b\u043e\u043a\u0430\u043c\u0438.',
        eventSaved: '\u0421\u043e\u0431\u044b\u0442\u0438\u0435 \u0441\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u043e.',
        blockSaved: '\u0411\u043b\u043e\u043a \u0441\u043e\u0445\u0440\u0430\u043d\u0451\u043d.',
        eventDeleted: '\u0421\u043e\u0431\u044b\u0442\u0438\u0435 \u0443\u0434\u0430\u043b\u0435\u043d\u043e.',
        blockDeleted: '\u0411\u043b\u043e\u043a \u0443\u0434\u0430\u043b\u0451\u043d.',
        reorderSaved: '\u041f\u043e\u0440\u044f\u0434\u043e\u043a \u0431\u043b\u043e\u043a\u043e\u0432 \u043e\u0431\u043d\u043e\u0432\u043b\u0451\u043d.',
        confirmDeleteEvent: '\u0423\u0434\u0430\u043b\u0438\u0442\u044c \u044d\u0442\u043e \u0441\u043e\u0431\u044b\u0442\u0438\u0435?',
        confirmDeleteBlock: '\u0423\u0434\u0430\u043b\u0438\u0442\u044c \u044d\u0442\u043e\u0442 \u0431\u043b\u043e\u043a?',
        loadError: '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u0434\u0430\u043d\u043d\u044b\u0435.',
        noEvents: '\u0421\u043e\u0431\u044b\u0442\u0438\u0439 \u043f\u043e\u043a\u0430 \u043d\u0435\u0442.',
        noSelection: '\u0412\u044b\u0431\u0435\u0440\u0438 \u0441\u043e\u0431\u044b\u0442\u0438\u0435 \u0441\u043b\u0435\u0432\u0430 \u0438\u043b\u0438 \u0441\u043e\u0437\u0434\u0430\u0439 \u043d\u043e\u0432\u043e\u0435.',
        blockEmpty: '\u0423 \u044d\u0442\u043e\u0433\u043e \u0441\u043e\u0431\u044b\u0442\u0438\u044f \u043f\u043e\u043a\u0430 \u043d\u0435\u0442 \u0431\u043b\u043e\u043a\u043e\u0432.',
        blocksCount: '\u0411\u043b\u043e\u043a\u043e\u0432',
        loading: '\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430...',
        eventListTitle: '\u0421\u043f\u0438\u0441\u043e\u043a \u0441\u043e\u0431\u044b\u0442\u0438\u0439',
        eventListHint: '\u0417\u0434\u0435\u0441\u044c \u043c\u043e\u0436\u043d\u043e \u0432\u044b\u0431\u0440\u0430\u0442\u044c \u0441\u043e\u0431\u044b\u0442\u0438\u0435 \u0434\u043b\u044f \u0440\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u044f.',
        emptyAdminState: '\u041f\u043e\u043a\u0430 \u043d\u0435\u0442 \u043d\u0438 \u043e\u0434\u043d\u043e\u0433\u043e \u0441\u043e\u0431\u044b\u0442\u0438\u044f. \u0421\u043e\u0437\u0434\u0430\u0439 \u043f\u0435\u0440\u0432\u043e\u0435 \u0447\u0435\u0440\u0435\u0437 \u043a\u043d\u043e\u043f\u043a\u0443 \u0432\u044b\u0448\u0435.',
        eventModalCreateTitle: '\u0421\u043e\u0437\u0434\u0430\u043d\u0438\u0435 \u0441\u043e\u0431\u044b\u0442\u0438\u044f',
        eventModalEditTitle: '\u0420\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u0435 \u0441\u043e\u0431\u044b\u0442\u0438\u044f',
        blockModalCreateTitle: '\u0421\u043e\u0437\u0434\u0430\u043d\u0438\u0435 \u0431\u043b\u043e\u043a\u0430',
        blockModalEditTitle: '\u0420\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u0435 \u0431\u043b\u043e\u043a\u0430',
        selectedEvent: '\u0412\u044b\u0431\u0440\u0430\u043d\u043e \u0441\u043e\u0431\u044b\u0442\u0438\u0435',
        noImage: '\u0411\u0435\u0437 \u0438\u0437\u043e\u0431\u0440\u0430\u0436\u0435\u043d\u0438\u044f',
        draft: '\u0427\u0435\u0440\u043d\u043e\u0432\u0438\u043a',
        ready: '\u0413\u043e\u0442\u043e\u0432\u043e',
        archived: '\u0410\u0440\u0445\u0438\u0432',
        nameRu: '\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435 RU',
        nameEn: 'Name EN',
        descriptionRu: '\u041e\u043f\u0438\u0441\u0430\u043d\u0438\u0435 RU',
        descriptionEn: 'Description EN',
      };
    }

    return {
      title: 'Events',
      subtitle: 'CRUD for events and event blocks.',
      createEvent: 'Create event',
      editEvent: 'Edit event',
      createBlock: 'Create block',
      editBlock: 'Edit block',
      savePositions: 'Save positions',
      position: 'Position',
      invalidPositions: 'Positions must be unique integers from 1 to N.',
      filtersTitle: 'Filters',
      searchPlaceholder: 'Search by slug or name',
      all: 'All',
      detailsTitle: 'Event details',
      slug: 'Slug',
      status: 'Status',
      save: 'Save',
      delete: 'Delete',
      close: 'Close',
      cancel: 'Cancel',
      publicLink: 'Public page',
      blocksTitle: 'Event blocks',
      blockVisible: 'Visible in public version',
      createEventFirst: 'Create or select an event first, then manage its blocks.',
      eventSaved: 'Event saved.',
      blockSaved: 'Block saved.',
      eventDeleted: 'Event deleted.',
      blockDeleted: 'Block deleted.',
      reorderSaved: 'Block order updated.',
      confirmDeleteEvent: 'Delete this event?',
      confirmDeleteBlock: 'Delete this block?',
      loadError: 'Failed to load data.',
      noEvents: 'No events yet.',
      noSelection: 'Select an event on the left or create a new one.',
      blockEmpty: 'This event has no blocks yet.',
      blocksCount: 'Blocks',
      loading: 'Loading...',
      eventListTitle: 'Event list',
      eventListHint: 'Choose an event to review or edit.',
      emptyAdminState: 'There are no events yet. Create the first one with the button above.',
      eventModalCreateTitle: 'Create event',
      eventModalEditTitle: 'Edit event',
      blockModalCreateTitle: 'Create block',
      blockModalEditTitle: 'Edit block',
      selectedEvent: 'Selected event',
      noImage: 'No image',
      draft: 'Draft',
      ready: 'Ready',
      archived: 'Archived',
      nameRu: 'Name RU',
      nameEn: 'Name EN',
      descriptionRu: 'Description RU',
      descriptionEn: 'Description EN',
    };
  }, [locale]);
  const statusOptions: Array<{ value: EventStatus | 'ALL'; label: string }> = [
    { value: 'ALL', label: t.all },
    { value: EventStatus.DRAFT, label: t.draft },
    { value: EventStatus.READY, label: t.ready },
    { value: EventStatus.ARCHIVED, label: t.archived },
  ];

  const loadCatalog = useCallback(async () => {
    try {
      setLoadingCatalog(true);
      setErrorMessage(null);
      const params = new URLSearchParams({ page: '0', size: '100' });
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      const response = await apiJson<EventAdminCatalogResponse>(`${ADMIN_EVENTS_API}?${params.toString()}`);
      const nextSlugs = response.items.map((item) => item.slug);
      setItems(response.items);
      setSelectedSlug((current) => (current && nextSlugs.includes(current) ? current : response.items[0]?.slug ?? null));
    } catch (error) {
      setErrorMessage(error instanceof ApiError || error instanceof Error ? error.message : t.loadError);
    } finally {
      setLoadingCatalog(false);
    }
  }, [apiJson, search, statusFilter, t.loadError]);

  const loadDetails = useCallback(async (slug: string) => {
    try {
      setLoadingDetails(true);
      setErrorMessage(null);
      const response = await apiJson<EventAdminDetails>(`${ADMIN_EVENTS_API}/${slug}`);
      setSelectedItem(response);
      setBlockPositions(buildBlockPositionState(response.blocks));
    } catch (error) {
      setSelectedItem(null);
      setBlockPositions({});
      setErrorMessage(error instanceof ApiError || error instanceof Error ? error.message : t.loadError);
    } finally {
      setLoadingDetails(false);
    }
  }, [apiJson, t.loadError]);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    if (!selectedSlug) {
      setSelectedItem(null);
      setBlockPositions({});
      return;
    }
    void loadDetails(selectedSlug);
  }, [loadDetails, selectedSlug]);

  const openCreateEventModal = () => {
    setEventForm(EMPTY_EVENT_FORM);
    setEventModalMode('create');
    setImageError(null);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const openEditEventModal = () => {
    if (!selectedItem) return;
    setEventForm(mapEventToForm(selectedItem));
    setEventModalMode('edit');
    setImageError(null);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const closeEventModal = () => {
    setEventModalMode(null);
    setImageError(null);
  };

  const openCreateBlockModal = () => {
    if (!selectedItem) {
      setErrorMessage(t.createEventFirst);
      return;
    }
    setBlockForm(EMPTY_BLOCK_FORM);
    setEditingBlockId(null);
    setBlockModalMode('create');
    setBlockImageError(null);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const openEditBlockModal = (block: EventBlockAdminItem) => {
    setBlockForm(mapBlockToForm(block));
    setEditingBlockId(block.id);
    setBlockModalMode('edit');
    setBlockImageError(null);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const closeBlockModal = () => {
    setBlockModalMode(null);
    setEditingBlockId(null);
    setBlockForm(EMPTY_BLOCK_FORM);
    setBlockImageError(null);
  };

  const validateEventForm = () => {
    if (!normalizeSlug(eventForm.slug)) return 'Slug is required';
    return validateLocalizedTextPair(eventForm.name, t.nameRu, t.nameEn)
      ?? validateLocalizedTextPair(eventForm.description, t.descriptionRu, t.descriptionEn);
  };

  const validateBlockForm = () => {
    return validateLocalizedTextPair(blockForm.name, t.nameRu, t.nameEn)
      ?? validateLocalizedTextPair(blockForm.description, t.descriptionRu, t.descriptionEn);
  };

  const validateBlockPositions = (blocks: EventBlockAdminItem[]) => {
    const values = blocks.map((block) => Number(blockPositions[block.id]));
    if (values.some((value) => !Number.isInteger(value) || value < 1 || value > blocks.length)) {
      return t.invalidPositions;
    }
    if (new Set(values).size !== values.length) {
      return t.invalidPositions;
    }
    return null;
  };

  const handlePositionChange = (blockId: number, value: string) => {
    setBlockPositions((prev) => ({ ...prev, [blockId]: value }));
  };

  const handleSaveEvent = async () => {
    const validationError = validateEventForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      setSavingEvent(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      const request: EventUpsertRequest = {
        slug: normalizeSlug(eventForm.slug),
        status: eventForm.status,
        nameJson: { ru: eventForm.name.ru.trim(), en: eventForm.name.en.trim() },
        descriptionJson: { ru: eventForm.description.ru.trim(), en: eventForm.description.en.trim() },
        imageBucket: eventForm.imageBucket ?? null,
        imageObjectKey: eventForm.imageObjectKey ?? null,
      };

      const response = eventModalMode === 'edit' && selectedItem
        ? await apiPutJson<EventUpsertRequest, EventAdminDetails>(`${ADMIN_EVENTS_API}/${selectedItem.slug}`, request)
        : await apiPostJson<EventUpsertRequest, EventAdminDetails>(ADMIN_EVENTS_API, request);

      setSelectedSlug(response.slug);
      setSelectedItem(response);
      setBlockPositions(buildBlockPositionState(response.blocks));
      setSuccessMessage(t.eventSaved);
      closeEventModal();
      await loadCatalog();
    } catch (error) {
      setErrorMessage(error instanceof ApiError || error instanceof Error ? error.message : t.loadError);
    } finally {
      setSavingEvent(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedItem || !window.confirm(t.confirmDeleteEvent)) return;
    try {
      setErrorMessage(null);
      setSuccessMessage(null);
      await apiDeleteVoid(`${ADMIN_EVENTS_API}/${selectedItem.slug}`);
      setSelectedSlug(null);
      setSelectedItem(null);
      setBlockPositions({});
      closeEventModal();
      closeBlockModal();
      setSuccessMessage(t.eventDeleted);
      await loadCatalog();
    } catch (error) {
      setErrorMessage(error instanceof ApiError || error instanceof Error ? error.message : t.loadError);
    }
  };
  const handleSaveBlock = async () => {
    if (!selectedItem) {
      setErrorMessage(t.createEventFirst);
      return;
    }
    const validationError = validateBlockForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      setSavingBlock(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      const request: EventBlockUpsertRequest = {
        nameJson: { ru: blockForm.name.ru.trim(), en: blockForm.name.en.trim() },
        descriptionJson: { ru: blockForm.description.ru.trim(), en: blockForm.description.en.trim() },
        imageBucket: blockForm.imageBucket ?? null,
        imageObjectKey: blockForm.imageObjectKey ?? null,
        visible: blockForm.visible,
      };

      const response = editingBlockId !== null
        ? await apiPutJson<EventBlockUpsertRequest, EventAdminDetails>(`${ADMIN_EVENTS_API}/${selectedItem.slug}/blocks/${editingBlockId}`, request)
        : await apiPostJson<EventBlockUpsertRequest, EventAdminDetails>(`${ADMIN_EVENTS_API}/${selectedItem.slug}/blocks`, request);

      setSelectedItem(response);
      setBlockPositions(buildBlockPositionState(response.blocks));
      setSuccessMessage(t.blockSaved);
      closeBlockModal();
      await loadCatalog();
    } catch (error) {
      setErrorMessage(error instanceof ApiError || error instanceof Error ? error.message : t.loadError);
    } finally {
      setSavingBlock(false);
    }
  };

  const handleDeleteBlock = async () => {
    if (!selectedItem || editingBlockId === null || !window.confirm(t.confirmDeleteBlock)) return;
    try {
      setErrorMessage(null);
      setSuccessMessage(null);
      await apiDeleteVoid(`${ADMIN_EVENTS_API}/${selectedItem.slug}/blocks/${editingBlockId}`);
      await loadDetails(selectedItem.slug);
      await loadCatalog();
      closeBlockModal();
      setSuccessMessage(t.blockDeleted);
    } catch (error) {
      setErrorMessage(error instanceof ApiError || error instanceof Error ? error.message : t.loadError);
    }
  };

  const handleSavePositions = async () => {
    if (!selectedItem) {
      return;
    }

    const validationError = validateBlockPositions(selectedItem.blocks);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    const request: EventBlockReorderRequest = {
      items: selectedItem.blocks.map((block) => ({
        blockId: block.id,
        position: Number(blockPositions[block.id]),
      })),
    };
    try {
      setSavingPositions(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      const response = await apiPutJson<EventBlockReorderRequest, EventAdminDetails>(`${ADMIN_EVENTS_API}/${selectedItem.slug}/blocks/reorder`, request);
      setSelectedItem(response);
      setBlockPositions(buildBlockPositionState(response.blocks));
      setSuccessMessage(t.reorderSaved);
      await loadCatalog();
    } catch (error) {
      setErrorMessage(error instanceof ApiError || error instanceof Error ? error.message : t.loadError);
    } finally {
      setSavingPositions(false);
    }
  };

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => getLocalizedText(a.nameJson, heroLocale).localeCompare(
      getLocalizedText(b.nameJson, heroLocale),
      locale === 'ru' ? 'ru' : 'en',
    ));
  }, [heroLocale, items, locale]);

  const sortedBlocks = useMemo(() => {
    return [...(selectedItem?.blocks ?? [])].sort((a, b) => a.position - b.position);
  }, [selectedItem]);

  const selectedEventName = selectedItem ? getLocalizedText(selectedItem.nameJson, heroLocale) : null;

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[var(--foreground)]">{t.title}</h2>
            <p className="mt-2 text-sm text-[var(--foreground-soft)]">{t.subtitle}</p>
          </div>
          <button type="button" onClick={openCreateEventModal} className="w-fit rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-2 text-sm font-semibold tracking-wide text-emerald-300 transition hover:bg-emerald-400/15">{t.createEvent}</button>
        </div>
      </div>

      <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
        <div className="mb-3 text-sm font-semibold text-[var(--foreground)]">{t.filtersTitle}</div>
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
          <input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t.searchPlaceholder} className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-400/40" />
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => {
              const active = statusFilter === option.value;
              return <button key={option.value} type="button" onClick={() => setStatusFilter(option.value)} className={active ? 'rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-300' : 'rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-2 text-sm text-[var(--foreground-soft)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]'}>{option.label}</button>;
            })}
          </div>
        </div>
      </div>

      {successMessage ? <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-300">{successMessage}</div> : null}
      {errorMessage ? <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">{errorMessage}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <div className="mb-4">
            <div className="text-sm font-semibold text-[var(--foreground)]">{t.eventListTitle}</div>
            <div className="mt-1 text-xs text-[var(--foreground-soft)]">{t.eventListHint}</div>
          </div>

          {loadingCatalog ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4 text-sm text-[var(--foreground-soft)]">{t.loading}</div>
          ) : sortedItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] p-4 text-sm text-[var(--foreground-soft)]">{t.emptyAdminState}</div>
          ) : (
            <div className="space-y-3">
              {sortedItems.map((item) => {
                const active = selectedSlug === item.slug;
                return (
                  <button key={item.id} type="button" onClick={() => setSelectedSlug(item.slug)} className={`w-full rounded-2xl border p-4 text-left transition ${active ? 'border-cyan-400/40 bg-cyan-400/10' : 'border-[var(--border)] bg-[var(--surface-strong)] hover:bg-[var(--surface-hover)]'}`}>
                    <div className="text-sm font-semibold text-[var(--foreground)]">{getLocalizedText(item.nameJson, heroLocale)}</div>
                    <div className="mt-2 text-xs text-[var(--foreground-soft)]">{item.slug}</div>
                    <div className="mt-2 flex items-center justify-between text-[11px] uppercase tracking-wide text-[var(--foreground-muted)]"><span>{item.status}</span><span>{t.blocksCount}: {item.blockCount}</span></div>
                  </button>
                );
              })}
            </div>
          )}
        </aside>
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
          {!selectedItem ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--foreground-soft)]">{loadingDetails ? t.loading : t.noSelection}</div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wide text-[var(--foreground-muted)]">{t.selectedEvent}</div>
                  <h3 className="mt-2 text-2xl font-bold text-[var(--foreground)]">{selectedEventName}</h3>
                  <div className="mt-2 text-sm text-[var(--foreground-soft)]">{selectedItem.slug}</div>
                  <div className="mt-4 inline-flex rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-1 text-xs uppercase tracking-wide text-[var(--foreground-muted)]">{selectedItem.status}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/events/${selectedItem.slug}`} className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/15">{t.publicLink}</Link>
                  <button type="button" onClick={openEditEventModal} className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-2 text-sm text-[var(--foreground)] transition hover:bg-[var(--surface-hover)]">{t.editEvent}</button>
                  <button type="button" onClick={openCreateBlockModal} className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-400/15">{t.createBlock}</button>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
                <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)]">
                  {selectedItem.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selectedItem.imageUrl} alt={selectedEventName ?? 'Event image'} className="h-full min-h-48 w-full object-cover" />
                  ) : (
                    <div className="flex min-h-48 items-center justify-center text-sm text-[var(--foreground-soft)]">{t.noImage}</div>
                  )}
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-5">
                  <div className="text-sm font-semibold text-[var(--foreground)]">{t.detailsTitle}</div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--foreground-soft)]">{getLocalizedText(selectedItem.descriptionJson, heroLocale)}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xl font-bold text-[var(--foreground)]">{t.blocksTitle}</h4>
                    <p className="mt-1 text-sm text-[var(--foreground-soft)]">{t.blocksCount}: {sortedBlocks.length}</p>
                  </div>
                  {sortedBlocks.length > 0 ? (
                    <button type="button" onClick={() => void handleSavePositions()} disabled={savingPositions} className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-50">{t.savePositions}</button>
                  ) : null}
                </div>

                {sortedBlocks.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[var(--border)] p-4 text-sm text-[var(--foreground-soft)]">{t.blockEmpty}</div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {sortedBlocks.map((block) => (
                        <article key={block.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                            <div className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 lg:w-36">
                              <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground-soft)]">
                                <span>{t.position}</span>
                                <input type="number" min={1} max={sortedBlocks.length} value={blockPositions[block.id] ?? ''} onChange={(event) => handlePositionChange(block.id, event.target.value)} className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-400/40" />
                              </label>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <h5 className="text-lg font-semibold text-[var(--foreground)]">{getLocalizedText(block.nameJson, heroLocale)}</h5>
                                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[var(--foreground-soft)]">{getLocalizedText(block.descriptionJson, heroLocale)}</p>
                                </div>
                                <button type="button" onClick={() => openEditBlockModal(block)} className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-400/15">{t.editBlock}</button>
                              </div>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>

                    <div className="flex justify-end">
                      <button type="button" onClick={() => void handleSavePositions()} disabled={savingPositions} className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-50">{t.savePositions}</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      <DictionaryModal open={eventModalMode !== null} onClose={closeEventModal} closeLabel={t.close} title={eventModalMode === 'edit' ? t.eventModalEditTitle : t.eventModalCreateTitle}>
        <div className="space-y-5">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[var(--foreground-soft)]">{t.slug}</span>
            <input type="text" value={eventForm.slug} onChange={(event) => setEventForm((prev) => ({ ...prev, slug: event.target.value }))} className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-400/40" placeholder="windfall-temple" />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[var(--foreground-soft)]">{t.status}</span>
            <select value={eventForm.status} onChange={(event) => setEventForm((prev) => ({ ...prev, status: event.target.value as EventStatus }))} className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-400/40">
              <option value={EventStatus.DRAFT}>{t.draft}</option>
              <option value={EventStatus.READY}>{t.ready}</option>
              <option value={EventStatus.ARCHIVED}>{t.archived}</option>
            </select>
          </label>

          <LocalizedTextFields value={eventForm.name} onChange={(value) => setEventForm((prev) => ({ ...prev, name: value }))} ruLabel={t.nameRu} enLabel={t.nameEn} />
          <LocalizedTextareaFields value={eventForm.description} onChange={(value) => setEventForm((prev) => ({ ...prev, description: value }))} ruLabel={t.descriptionRu} enLabel={t.descriptionEn} rows={5} />

          <EventImageUploadField locale={heroLocale} value={eventForm} onChange={(value) => setEventForm((prev) => ({ ...prev, ...value }))} onUploadingChange={setEventUploading} onErrorChange={setImageError} disabled={savingEvent} />
          {imageError ? <div className="text-sm text-red-300">{imageError}</div> : null}

          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => void handleSaveEvent()} disabled={savingEvent || eventUploading} className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-50">{t.save}</button>
            {eventModalMode === 'edit' ? <button type="button" onClick={() => void handleDeleteEvent()} className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-400/15">{t.delete}</button> : null}
            <button type="button" onClick={closeEventModal} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--foreground-soft)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]">{t.cancel}</button>
          </div>
        </div>
      </DictionaryModal>
      <DictionaryModal open={blockModalMode !== null} onClose={closeBlockModal} closeLabel={t.close} title={blockModalMode === 'edit' ? t.blockModalEditTitle : t.blockModalCreateTitle}>
        <div className="space-y-4">
          <LocalizedTextFields value={blockForm.name} onChange={(value) => setBlockForm((prev) => ({ ...prev, name: value }))} ruLabel={t.nameRu} enLabel={t.nameEn} />
          <LocalizedTextareaFields value={blockForm.description} onChange={(value) => setBlockForm((prev) => ({ ...prev, description: value }))} ruLabel={t.descriptionRu} enLabel={t.descriptionEn} rows={5} />
          <label className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)]">
            <input type="checkbox" checked={blockForm.visible} onChange={(event) => setBlockForm((prev) => ({ ...prev, visible: event.target.checked }))} className="h-4 w-4 rounded border-[var(--border)]" />
            <span>{t.blockVisible}</span>
          </label>
          <EventImageUploadField locale={heroLocale} value={blockForm} onChange={(value) => setBlockForm((prev) => ({ ...prev, ...value }))} onUploadingChange={setBlockUploading} onErrorChange={setBlockImageError} disabled={savingBlock} />
          {blockImageError ? <div className="text-sm text-red-300">{blockImageError}</div> : null}

          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => void handleSaveBlock()} disabled={savingBlock || blockUploading} className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-50">{t.save}</button>
            {blockModalMode === 'edit' ? <button type="button" onClick={() => void handleDeleteBlock()} className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-400/15">{t.delete}</button> : null}
            <button type="button" onClick={closeBlockModal} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--foreground-soft)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]">{t.cancel}</button>
          </div>
        </div>
      </DictionaryModal>
    </section>
  );
}
