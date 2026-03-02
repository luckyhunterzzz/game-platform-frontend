'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useApi } from '@/lib/use-api';

export default function HomePage() {
  const { loading, authenticated, userId, roles, login, logout } = useAuth();
  const { apiFetch } = useApi();

  const [publicResult, setPublicResult] = useState('');
  const [adminResult, setAdminResult] = useState('');

  async function callPublic() {
    const r = await apiFetch('/api/v1/public/test', { method: 'GET' });
    setPublicResult(`${r.status}\n${r.body}`);
  }

  async function callAdmin() {
    const r = await apiFetch('/api/v1/admin/test', { method: 'GET' });
    setAdminResult(`${r.status}\n${r.body}`);
  }

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>GameOps Platform - MVP</h1>

      {loading ? (
        <p>Auth loading...</p>
      ) : (
        <>
          <div style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
            {!authenticated ? (
              <button onClick={login} style={{ padding: '8px 12px', border: '1px solid #ccc' }}>
                Login (Keycloak)
              </button>
            ) : (
              <button onClick={logout} style={{ padding: '8px 12px', border: '1px solid #ccc' }}>
                Logout
              </button>
            )}
          </div>

          <div style={{ marginTop: 16 }}>
            <div>authenticated: {String(authenticated)}</div>
            <div>userId: {userId ?? '-'}</div>
            <div>roles: {roles.length ? roles.join(', ') : '-'}</div>
          </div>

          <hr style={{ margin: '24px 0' }} />

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={callPublic} style={{ padding: '8px 12px', border: '1px solid #ccc' }}>
              Call /public/test
            </button>
            <button onClick={callAdmin} style={{ padding: '8px 12px', border: '1px solid #ccc' }}>
              Call /admin/test
            </button>
          </div>

          <div style={{ marginTop: 16 }}>
            <h3>Public result</h3>
            <pre style={{ padding: 12, background: '#f6f6f6', overflowX: 'auto' }}>{publicResult}</pre>
          </div>

          <div style={{ marginTop: 16 }}>
            <h3>Admin result</h3>
            <pre style={{ padding: 12, background: '#f6f6f6', overflowX: 'auto' }}>{adminResult}</pre>
          </div>
        </>
      )}
    </main>
  );
}