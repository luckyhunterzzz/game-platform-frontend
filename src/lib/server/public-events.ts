import type { EventLanguage, PublicEventDetails, PublicEventFeedResponse } from '@/lib/types/event';

const API_BASE_URL =
  process.env.INTERNAL_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  'http://localhost:8081';

type FetchOptions = {
  revalidate?: number;
};

async function fetchApiJson<TResponse>(
  path: string,
  { revalidate = 900 }: FetchOptions = {},
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'X-Request-Id': crypto.randomUUID(),
    },
    next: {
      revalidate,
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json() as Promise<TResponse>;
}

export async function getPublicEvents(language: EventLanguage): Promise<PublicEventFeedResponse> {
  return fetchApiJson<PublicEventFeedResponse>(`/api/v1/public/events?page=0&size=100&language=${language}`);
}

export async function getPublicEventBySlug(
  slug: string,
  language: EventLanguage,
): Promise<PublicEventDetails | null> {
  try {
    return await fetchApiJson<PublicEventDetails>(
      `/api/v1/public/events/${encodeURIComponent(slug)}?language=${language}`,
      { revalidate: 300 },
    );
  } catch {
    return null;
  }
}
