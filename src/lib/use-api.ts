'use client';

import { useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import type { ErrorResponse } from '@/lib/types/publication';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8081';

export type ApiFetchResult = {
  status: number;
  body: string;
};

export class ApiError extends Error {
  status: number;
  payload?: ErrorResponse | unknown;

  constructor(message: string, status: number, payload?: ErrorResponse | unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

export function useApi() {
  const { keycloak } = useAuth();

  const apiFetch = useCallback(
    async (path: string, init: RequestInit = {}): Promise<ApiFetchResult> => {
      const url = path.startsWith('http') ? path : `${API_BASE}${path}`;

      const headers = new Headers(init.headers);
      headers.set('X-Request-Id', crypto.randomUUID());

      const token = keycloak?.token;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      const res = await fetch(url, {
        ...init,
        headers,
      });

      const body = await res.text();

      return {
        status: res.status,
        body,
      };
    },
    [keycloak?.token],
  );

  const apiJson = useCallback(
    async <TResponse,>(path: string, init: RequestInit = {}): Promise<TResponse> => {
      const headers = new Headers(init.headers);

      if (!headers.has('Content-Type') && init.body && !(init.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
      }

      const response = await apiFetch(path, {
        ...init,
        headers,
      });

      let parsedBody: unknown = null;

      if (response.body) {
        try {
          parsedBody = JSON.parse(response.body);
        } catch {
          parsedBody = response.body;
        }
      }

      if (response.status >= 400) {
        if (
          parsedBody &&
          typeof parsedBody === 'object' &&
          'message' in parsedBody &&
          typeof (parsedBody as { message?: unknown }).message === 'string'
        ) {
          throw new ApiError(
            (parsedBody as { message: string }).message,
            response.status,
            parsedBody,
          );
        }

        throw new ApiError(`Request failed with status ${response.status}`, response.status, parsedBody);
      }

      return parsedBody as TResponse;
    },
    [apiFetch],
  );

  const apiPostJson = useCallback(
    async <TRequest, TResponse>(
      path: string,
      body: TRequest,
      init: RequestInit = {},
    ): Promise<TResponse> => {
      return apiJson<TResponse>(path, {
        ...init,
        method: 'POST',
        body: JSON.stringify(body),
      });
    },
    [apiJson],
  );

  const apiPostFormData = useCallback(
    async <TResponse,>(
      path: string,
      formData: FormData,
      init: RequestInit = {},
    ): Promise<TResponse> => {
      return apiJson<TResponse>(path, {
        ...init,
        method: 'POST',
        body: formData,
      });
    },
    [apiJson],
  );

  return {
    apiFetch,
    apiJson,
    apiPostJson,
    apiPostFormData,
  };
}