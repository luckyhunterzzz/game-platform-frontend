import type { LocalizedText } from './hero';

export enum EventStatus {
  DRAFT = 'DRAFT',
  READY = 'READY',
  ARCHIVED = 'ARCHIVED',
}

export type EventLanguage = 'RU' | 'EN';

export interface PublicEventBlock {
  id: number;
  position: number;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
}

export interface PublicEventSummary {
  id: number;
  slug: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
}

export interface PublicEventDetails extends PublicEventSummary {
  blocks: PublicEventBlock[];
}

export interface PublicEventFeedResponse {
  items: PublicEventSummary[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

export interface EventAdminSummary {
  id: number;
  slug: string;
  status: EventStatus;
  nameJson: LocalizedText;
  descriptionJson?: LocalizedText | null;
  imageUrl?: string | null;
  blockCount: number;
  updatedAt?: string | null;
}

export interface EventAdminCatalogResponse {
  items: EventAdminSummary[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

export interface EventBlockAdminItem {
  id: number;
  position: number;
  nameJson: LocalizedText;
  descriptionJson?: LocalizedText | null;
  imageBucketJson?: LocalizedText | null;
  imageObjectKeyJson?: LocalizedText | null;
  imageUrlJson?: LocalizedText | null;
  visible: boolean;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface EventAdminDetails {
  id: number;
  slug: string;
  status: EventStatus;
  nameJson: LocalizedText;
  descriptionJson?: LocalizedText | null;
  imageBucket?: string | null;
  imageObjectKey?: string | null;
  imageUrl?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  blocks: EventBlockAdminItem[];
}

export interface EventUpsertRequest {
  slug: string;
  nameJson: LocalizedText;
  descriptionJson?: LocalizedText | null;
  status: EventStatus;
  imageBucket?: string | null;
  imageObjectKey?: string | null;
}

export interface EventBlockUpsertRequest {
  nameJson: LocalizedText;
  descriptionJson?: LocalizedText | null;
  imageBucketJson?: LocalizedText | null;
  imageObjectKeyJson?: LocalizedText | null;
  visible: boolean;
}

export interface EventBlockReorderItemRequest {
  blockId: number;
  position: number;
}

export interface EventBlockReorderRequest {
  items: EventBlockReorderItemRequest[];
}
