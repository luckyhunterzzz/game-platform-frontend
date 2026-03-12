import type { PublicationStatus, PublicationType } from '@/lib/types/publication';

export type Locale = 'en' | 'ru';

export type Messages = {
  navbar: {
    theme: string;
    language: string;
    userId: string;
    login: string;
    logout: string;
  };
  common: {
    languageEnglish: string;
    languageRussian: string;
  };
  publications: {
    title: string;
    subtitle: string;
    publishedTab: string;
    draftsTab: string;
    scheduledTab: string;
    createButton: string;
    createSuccess: string;
    loading: string;
    loadingMore: string;
    loadMore: string;
    loadError: string;
    emptyTitle: string;
    emptyDescription: string;
    pinned: string;
    showMore: string;
    showLess: string;
    noDescription: string;
    publishedAt: string;
    notPublishedYet: string;
    invalidDate: string;
  };
  createPublicationModal: {
    title: string;
    close: string;
    titleLabel: string;
    titlePlaceholder: string;
    contentLabel: string;
    contentPlaceholder: string;
    typeLabel: string;
    statusLabel: string;
    scheduledAtLabel: string;
    timeCaption: string;
    scheduledHint: string;
    scheduledPlaceholder: string;
    pinnedLabel: string;
    cancel: string;
    submit: string;
    submitting: string;
    createError: string;
    scheduledDateRequired: string;
    scheduledDateInvalid: string;
    scheduledDateFuture: string;
  };
  publicationType: Record<PublicationType, string>;
  publicationStatus: Record<PublicationStatus, string>;
};