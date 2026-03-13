export enum PublicationType {
  NEWS = 'NEWS',
  EVENT = 'EVENT',
  SCHEDULE = 'SCHEDULE',
  GUIDE = 'GUIDE',
}

export enum PublicationStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export interface PublicationItem {
  id: string;
  type: PublicationType;
  status: PublicationStatus;
  title: string;
  content?: string | null;
  imageUrl?: string | null;
  publishedAt?: string | null;
  pinned: boolean;
}

export interface PublicationFeedResponse {
  items: PublicationItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

export interface CreatePublicationRequest {
  title: string;
  content?: string | null;
  type: PublicationType;
  status: PublicationStatus;
  pinned: boolean;
  publishedAt?: string | null;
  imageBucket?: string | null;
  imageObjectKey?: string | null;
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