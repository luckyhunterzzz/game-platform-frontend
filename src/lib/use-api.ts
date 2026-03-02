'use client';

import { useAuth } from '@/lib/auth-context';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8081';

export type ApiFetchResult = { status: number; body: string };

export function useApi() {
  const { keycloak } = useAuth();

  async function apiFetch(path: string, init: RequestInit = {}): Promise<ApiFetchResult> {
    const url = path.startsWith('http') ? path : `${API_BASE}${path}`;

    const headers = new Headers(init.headers);
    headers.set('X-Request-Id', crypto.randomUUID());

    const token = keycloak?.token;
    if (token) headers.set('Authorization', `Bearer ${token}`);

    const res = await fetch(url, { ...init, headers });
    const body = await res.text();

    return { status: res.status, body };
  }

  return { apiFetch };
}