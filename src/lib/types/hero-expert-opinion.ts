'use client';

import type { LocalizedText } from '@/lib/types/hero';

export type HeroExpertOpinionSourceType = 'TELEGRAM' | 'VK' | 'FORUM' | 'YOUTUBE';

export type HeroExpertOpinionAdminResponseDto = {
  id: number;
  heroId: number;
  authorName: string;
  sourceUrl?: string | null;
  sourceTitle?: string | null;
  sourceType?: HeroExpertOpinionSourceType | null;
  contentJson: LocalizedText;
  isPublished: boolean;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type HeroExpertOpinionPublicResponseDto = {
  id: number;
  authorName: string;
  sourceUrl?: string | null;
  sourceTitle?: string | null;
  sourceType?: HeroExpertOpinionSourceType | null;
  content?: string | null;
  publishedAt?: string | null;
};

export type HeroExpertOpinionDraft = {
  id?: number;
  localId: string;
  authorName: string;
  sourceUrl: string;
  sourceTitle: string;
  sourceType: HeroExpertOpinionSourceType | '';
  content: LocalizedText;
  isPublished: boolean;
  publishedAt: string;
};

export type HeroExpertOpinionMutationRequest = {
  authorName: string;
  sourceUrl?: string | null;
  sourceTitle?: string | null;
  sourceType?: HeroExpertOpinionSourceType | null;
  contentJson: LocalizedText;
  isPublished: boolean;
  publishedAt?: string | null;
};

export function createEmptyHeroExpertOpinionDraft(): HeroExpertOpinionDraft {
  return {
    localId: crypto.randomUUID(),
    authorName: '',
    sourceUrl: '',
    sourceTitle: '',
    sourceType: '',
    content: {
      ru: '',
      en: '',
    },
    isPublished: false,
    publishedAt: '',
  };
}

export function mapAdminHeroExpertOpinionDto(
  dto: HeroExpertOpinionAdminResponseDto,
): HeroExpertOpinionDraft {
  return {
    id: dto.id,
    localId: `saved-${dto.id}`,
    authorName: dto.authorName ?? '',
    sourceUrl: dto.sourceUrl ?? '',
    sourceTitle: dto.sourceTitle ?? '',
    sourceType: dto.sourceType ?? '',
    content: dto.contentJson ?? { ru: '', en: '' },
    isPublished: Boolean(dto.isPublished),
    publishedAt: dto.publishedAt ?? '',
  };
}

export function buildHeroExpertOpinionPayload(
  draft: HeroExpertOpinionDraft,
): HeroExpertOpinionMutationRequest {
  return {
    authorName: draft.authorName.trim(),
    sourceUrl: draft.sourceUrl.trim() || null,
    sourceTitle: draft.sourceTitle.trim() || null,
    sourceType: draft.sourceType || null,
    contentJson: {
      ru: draft.content.ru.trim(),
      en: draft.content.en.trim(),
    },
    isPublished: draft.isPublished,
    publishedAt: draft.publishedAt.trim() || null,
  };
}

export function validateHeroExpertOpinionDraft(
  item: HeroExpertOpinionDraft,
  locale: 'RU' | 'EN',
): string | null {
  if (!item.authorName.trim()) {
    return locale === 'RU' ? 'Укажите автора мнения' : 'Author name is required';
  }

  if (!item.content.ru.trim() && !item.content.en.trim()) {
    return locale === 'RU'
      ? 'Добавьте текст мнения хотя бы на одном языке'
      : 'Add opinion content in at least one language';
  }

  if (item.isPublished && !item.publishedAt.trim()) {
    return locale === 'RU'
      ? 'Для опубликованного мнения нужна дата публикации'
      : 'Published opinion must have a published date';
  }

  if (item.sourceUrl.trim()) {
    try {
      new URL(item.sourceUrl.trim());
    } catch {
      return locale === 'RU' ? 'Ссылка на источник некорректна' : 'Source URL is invalid';
    }
  }

  return null;
}

export function sortHeroExpertOpinions<T extends { publishedAt?: string | null; id?: number }>(items: T[]): T[] {
  return [...items].sort((left, right) => {
    const leftDate = left.publishedAt ? Date.parse(left.publishedAt) : Number.NEGATIVE_INFINITY;
    const rightDate = right.publishedAt ? Date.parse(right.publishedAt) : Number.NEGATIVE_INFINITY;

    if (leftDate !== rightDate) {
      return rightDate - leftDate;
    }

    return (right.id ?? 0) - (left.id ?? 0);
  });
}
