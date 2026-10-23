export const AUTH_REQUIRED_EVENT = 'gameops:auth-required';

export type BffSessionUser = {
  id: string;
  username: string | null;
  email: string | null;
  roles: string[];
};

export type BffSession = {
  authenticated: boolean;
  user: BffSessionUser | null;
};

export type CsrfToken = {
  headerName: string;
  parameterName: string;
  token: string;
};

const csrfTokens = new Map<string, Promise<CsrfToken>>();

export function gatewayUrl(apiBaseUrl: string, path: string): string {
  return `${apiBaseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

export function isUnsafeMethod(method?: string): boolean {
  const normalizedMethod = (method ?? 'GET').toUpperCase();
  return !['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(normalizedMethod);
}

export async function fetchBffSession(
  apiBaseUrl: string,
  signal?: AbortSignal,
): Promise<BffSession> {
  const response = await fetch(gatewayUrl(apiBaseUrl, '/api/session'), {
    cache: 'no-store',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Session request failed with status ${response.status}`);
  }

  return response.json() as Promise<BffSession>;
}

export function getCsrfToken(apiBaseUrl: string): Promise<CsrfToken> {
  const cacheKey = apiBaseUrl.replace(/\/$/, '');
  const cachedToken = csrfTokens.get(cacheKey);

  if (cachedToken) {
    return cachedToken;
  }

  const tokenPromise = fetch(gatewayUrl(apiBaseUrl, '/api/session/csrf'), {
    cache: 'no-store',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  }).then(async (response) => {
    if (!response.ok) {
      throw new Error(`CSRF request failed with status ${response.status}`);
    }

    return response.json() as Promise<CsrfToken>;
  }).catch((error) => {
    csrfTokens.delete(cacheKey);
    throw error;
  });

  csrfTokens.set(cacheKey, tokenPromise);
  return tokenPromise;
}

export function clearCsrfToken(apiBaseUrl: string): void {
  csrfTokens.delete(apiBaseUrl.replace(/\/$/, ''));
}

export function notifyAuthenticationRequired(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_REQUIRED_EVENT));
  }
}
