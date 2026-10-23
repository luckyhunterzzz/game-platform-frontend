'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  AUTH_REQUIRED_EVENT,
  clearCsrfToken,
  fetchBffSession,
  gatewayUrl,
  getCsrfToken,
  type BffSession,
} from '@/lib/bff-auth';
import { useRuntimeConfig } from '@/lib/runtime-config/context';

type AuthContextValue = {
  loading: boolean;
  authenticated: boolean;
  error: string | null;
  userId: string | null;
  userEmail: string | null;
  displayName: string | null;
  roles: string[];
  login: () => void;
  logout: () => void;
  refreshSession: () => Promise<void>;
};

const ANONYMOUS_SESSION: BffSession = {
  authenticated: false,
  user: null,
};

const AuthContext = createContext<AuthContextValue | null>(null);

function withRolePrefix(roles: string[]): string[] {
  return roles.map((role) => (role.startsWith('ROLE_') ? role : `ROLE_${role}`));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { apiBaseUrl } = useRuntimeConfig();
  const [session, setSession] = useState<BffSession>(ANONYMOUS_SESSION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSession = useCallback(async () => {
    if (!apiBaseUrl) {
      setError('API configuration is unavailable');
      setLoading(false);
      return;
    }

    try {
      const nextSession = await fetchBffSession(apiBaseUrl);
      setSession(nextSession);
      setError(null);
    } catch (sessionError: unknown) {
      setError(
        sessionError instanceof Error
          ? sessionError.message
          : 'Authentication is temporarily unavailable',
      );
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    const abortController = new AbortController();

    void fetchBffSession(apiBaseUrl, abortController.signal)
      .then((nextSession) => {
        setSession(nextSession);
        setError(null);
      })
      .catch((sessionError: unknown) => {
        if (abortController.signal.aborted) {
          return;
        }

        setError(
          sessionError instanceof Error
            ? sessionError.message
            : 'Authentication is temporarily unavailable',
        );
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      });

    return () => abortController.abort();
  }, [apiBaseUrl]);

  useEffect(() => {
    const handleAuthenticationRequired = () => {
      clearCsrfToken(apiBaseUrl);
      setSession(ANONYMOUS_SESSION);
      setError(null);
      setLoading(false);
    };

    window.addEventListener(AUTH_REQUIRED_EVENT, handleAuthenticationRequired);
    return () => window.removeEventListener(AUTH_REQUIRED_EVENT, handleAuthenticationRequired);
  }, [apiBaseUrl]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refreshSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refreshSession]);

  const value = useMemo<AuthContextValue>(() => {
    const user = session.authenticated ? session.user : null;

    return {
      loading,
      authenticated: Boolean(user),
      error,
      userId: user?.id ?? null,
      userEmail: user?.email ?? null,
      displayName: user?.username ?? user?.email ?? user?.id ?? null,
      roles: withRolePrefix(user?.roles ?? []),
      login: () => {
        window.location.assign(gatewayUrl(apiBaseUrl, '/oauth2/authorization/keycloak'));
      },
      logout: () => {
        clearCsrfToken(apiBaseUrl);
        void getCsrfToken(apiBaseUrl)
          .then((csrfToken) => {
            const form = document.createElement('form');
            const csrfInput = document.createElement('input');

            form.method = 'POST';
            form.action = gatewayUrl(apiBaseUrl, '/api/logout');
            form.hidden = true;

            csrfInput.type = 'hidden';
            csrfInput.name = csrfToken.parameterName;
            csrfInput.value = csrfToken.token;

            form.appendChild(csrfInput);
            document.body.appendChild(form);
            form.submit();
          })
          .catch((logoutError: unknown) => {
            setError(
              logoutError instanceof Error
                ? logoutError.message
                : 'Logout is temporarily unavailable',
            );
          });
      },
      refreshSession,
    };
  }, [apiBaseUrl, error, loading, refreshSession, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
