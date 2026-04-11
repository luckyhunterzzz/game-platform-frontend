import type { LocalizedText } from './hero';

export enum PublicationType {
  NEWS = 'NEWS',
  EVENT = 'EVENT',
  SCHEDULE = 'SCHEDULE',
  GUIDE = 'GUIDE',
  ALLIANCE = 'ALLIANCE',
  GIFTCODES = 'GIFTCODES',
}

export enum PublicationStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export type PublicationLanguage = 'RU' | 'EN';

export interface PublicationItem {
  id: string;
  type: PublicationType;
  status?: PublicationStatus;
  title: string;
  content?: string | null;
  imageUrl?: string | null;
  publishedAt?: string | null;
  pinned: boolean;
  showInNewsFeed?: boolean;
}

export interface PublicationFeedResponse {
  items: PublicationItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

export interface PublicationAdminSummary {
  id: string;
  type: PublicationType;
  status: PublicationStatus;
  titleJson: LocalizedText;
  contentJson: LocalizedText;
  imageUrl?: string | null;
  publishedAt?: string | null;
  pinned: boolean;
  pinnedUntil?: string | null;
  showInNewsFeed: boolean;
}

export interface PublicationAdminFeedResponse {
  items: PublicationAdminSummary[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

export interface PublicationUpsertRequest {
  titleJson: LocalizedText;
  contentJson: LocalizedText;
  type: PublicationType;
  status: PublicationStatus;
  pinned: boolean;
  pinnedUntil?: string | null;
  showInNewsFeed: boolean;
  publishedAt?: string | null;
  imageBucket?: string | null;
  imageObjectKey?: string | null;
}

export interface PublicationAdminDetails {
  id: string;
  type: PublicationType;
  status: PublicationStatus;
  titleJson: LocalizedText;
  contentJson: LocalizedText;
  imageBucket?: string | null;
  imageObjectKey?: string | null;
  imageUrl?: string | null;
  publishedAt?: string | null;
  pinned: boolean;
  pinnedUntil?: string | null;
  showInNewsFeed: boolean;
}

export interface ImageUploadResponse {
  bucket: string;
  objectKey: string;
  url: string;
}

export interface ErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}

export const PUBLICATION_TYPES = Object.values(PublicationType);
export const PUBLICATION_STATUSES = Object.values(PublicationStatus);
