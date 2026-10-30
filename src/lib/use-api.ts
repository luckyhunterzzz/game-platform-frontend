'use client';

import { useCallback } from 'react';
import {
  clearCsrfToken,
  getCsrfToken,
  isUnsafeMethod,
  notifyAuthenticationRequired,
  verifyBffSession,
} from '@/lib/bff-auth';
import { useRuntimeConfig } from '@/lib/runtime-config/context';
import type { ErrorResponse } from '@/lib/types/publication';

export type ApiFetchResult = {
  status: number;
  body: string;
};

const AUTH_REFRESH_PENDING_HEADER = 'X-Auth-Refresh-Pending';
const AUTH_REFRESH_RETRY_DELAY_MS = 1000;

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
  const { apiBaseUrl } = useRuntimeConfig();

  const apiFetch = useCallback(
    async (path: string, init: RequestInit = {}): Promise<ApiFetchResult> => {
      if (!apiBaseUrl) {
        throw new ApiError('API configuration is unavailable', 503);
      }

      const url = path.startsWith('http') ? path : `${apiBaseUrl}${path}`;

      const headers = new Headers(init.headers);
      headers.set('X-Request-Id', crypto.randomUUID());

      const requestUrl = new URL(url, window.location.origin);
      const gatewayOrigin = new URL(apiBaseUrl, window.location.origin).origin;
      const isGatewayRequest = requestUrl.origin === gatewayOrigin;

      if (isGatewayRequest) {
        headers.delete('Authorization');

        if (isUnsafeMethod(init.method) && !headers.has('X-XSRF-TOKEN')) {
          const csrfToken = await getCsrfToken(apiBaseUrl);
          headers.set(csrfToken.headerName, csrfToken.token);
        }
      }

      const performRequest = () => fetch(url, {
        ...init,
        headers,
        credentials: init.credentials ?? (isGatewayRequest ? 'include' : undefined),
      });

      let res: Response;

      try {
        res = await performRequest();

        if (
          isGatewayRequest &&
          res.status === 503 &&
          res.headers.get(AUTH_REFRESH_PENDING_HEADER) === 'true'
        ) {
          await new Promise((resolve) => setTimeout(resolve, AUTH_REFRESH_RETRY_DELAY_MS));
          headers.set('X-Request-Id', crypto.randomUUID());
          res = await performRequest();
        }

        if (isGatewayRequest && res.status === 401) {
          clearCsrfToken(apiBaseUrl);
          const verifiedSession = await verifyBffSession(apiBaseUrl);

          if (verifiedSession?.authenticated && !isUnsafeMethod(init.method)) {
            headers.set('X-Request-Id', crypto.randomUUID());
            res = await performRequest();
          } else if (verifiedSession && !verifiedSession.authenticated) {
            notifyAuthenticationRequired();
          }
        }
      } catch (error) {
        const apiHost = (() => {
          try {
            return new URL(apiBaseUrl).host;
          } catch {
            return apiBaseUrl;
          }
        })();

        throw new ApiError(
          `Network error while reaching ${apiHost}. Check CORS or reverse proxy configuration.`,
          0,
          error,
        );
      }

      const body = await res.text();

      if (isGatewayRequest && (res.status === 401 || res.status === 403)) {
        clearCsrfToken(apiBaseUrl);
      }

      return {
        status: res.status,
        body,
      };
    },
    [apiBaseUrl],
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

        const fallbackMessage = response.status === 401
          ? 'Authentication is required or the session has expired'
          : response.status === 403
            ? 'You do not have permission to perform this action'
            : response.status === 503
              ? 'Authentication service is temporarily unavailable. Your session was not deleted'
              : `Request failed with status ${response.status}`;

        throw new ApiError(fallbackMessage, response.status, parsedBody);
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

  const apiPutJson = useCallback(
    async <TRequest, TResponse>(
      path: string,
      body: TRequest,
      init: RequestInit = {},
    ): Promise<TResponse> => {
      return apiJson<TResponse>(path, {
        ...init,
        method: 'PUT',
        body: JSON.stringify(body),
      });
    },
    [apiJson],
  );

  const apiPatchJson = useCallback(
    async <TRequest, TResponse>(
      path: string,
      body: TRequest,
      init: RequestInit = {},
    ): Promise<TResponse> => {
      return apiJson<TResponse>(path, {
        ...init,
        method: 'PATCH',
        body: JSON.stringify(body),
      });
    },
    [apiJson],
  );

  const apiDelete = useCallback(
    async <TResponse,>(path: string, init: RequestInit = {}): Promise<TResponse> => {
      return apiJson<TResponse>(path, {
        ...init,
        method: 'DELETE',
      });
    },
    [apiJson],
  );

  const apiDeleteVoid = useCallback(
    async (path: string, init: RequestInit = {}): Promise<void> => {
      const response = await apiFetch(path, {
        ...init,
        method: 'DELETE',
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

        const fallbackMessage = response.status === 401
          ? 'Authentication is required or the session has expired'
          : response.status === 403
            ? 'You do not have permission to perform this action'
            : response.status === 503
              ? 'Authentication service is temporarily unavailable. Your session was not deleted'
              : `Request failed with status ${response.status}`;

        throw new ApiError(fallbackMessage, response.status, parsedBody);
      }
    },
    [apiFetch],
  );

  const apiPostFormData = useCallback(
  async <TResponse>(
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
    apiPutJson,
    apiPatchJson,
    apiDelete,
    apiDeleteVoid,
  };
}
