import 'server-only';

import type { RuntimeConfig } from '@/lib/runtime-config/types';

const LOCAL_FRONTEND_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const RU_FRONTEND_HOST = 'ru.gameops-platform.dev';

function normalizeForwardedHost(value: string | null): string {
  return value?.split(',')[0]?.trim().toLowerCase() ?? '';
}

function stripPort(host: string): string {
  const normalizedHost = host.trim().toLowerCase();
  const portSeparatorIndex = normalizedHost.indexOf(':');

  return portSeparatorIndex >= 0
    ? normalizedHost.slice(0, portSeparatorIndex)
    : normalizedHost;
}

export function resolveRuntimeConfigByHost(host: string): RuntimeConfig {
  const normalizedHost = stripPort(host);

  if (LOCAL_FRONTEND_HOSTS.has(normalizedHost)) {
    return {
      frontendUrl: 'http://localhost:3000',
      apiBaseUrl: 'http://localhost:8081',
      authUrl: 'http://localhost:8080',
      mediaUrl: 'http://localhost:9000',
    };
  }

  if (normalizedHost === RU_FRONTEND_HOST) {
    return {
      frontendUrl: 'https://ru.gameops-platform.dev',
      apiBaseUrl: 'https://ru-api.gameops-platform.dev',
      authUrl: 'https://ru-auth.gameops-platform.dev',
      mediaUrl: 'https://ru-media.gameops-platform.dev',
    };
  }

  return {
    frontendUrl: 'https://gameops-platform.dev',
    apiBaseUrl: 'https://api.gameops-platform.dev',
    authUrl: 'https://auth.gameops-platform.dev',
    mediaUrl: 'https://media.gameops-platform.dev',
  };
}

export function resolveRuntimeConfigFromHeaders(headersLike: Headers): RuntimeConfig {
  const forwardedHost = normalizeForwardedHost(headersLike.get('x-forwarded-host'));
  const host = normalizeForwardedHost(headersLike.get('host'));

  return resolveRuntimeConfigByHost(forwardedHost || host);
}
