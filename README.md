# GameOps Platform - Frontend

Next.js frontend for the public site and admin workspace.

## Authentication

Authentication uses the API Gateway as a Backend for Frontend (BFF):

- login starts at `GET /oauth2/authorization/keycloak` on the Gateway;
- the browser stores only the Gateway session cookie;
- `GET /api/session` returns the current user and roles;
- unsafe API requests obtain a CSRF token from `GET /api/session/csrf`;
- logout sends `POST /api/logout` and continues through the Keycloak end-session flow;
- OAuth access and refresh tokens are never stored in frontend JavaScript storage.

The frontend keeps the existing `ROLE_*` checks. Roles returned by `/api/session` are normalized in `src/lib/auth-context.tsx`.

## Local development

Start the dev infrastructure and create `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8081
```

Then run:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Verification

```bash
npm run lint
npm run build
```

## Main authentication files

- `src/lib/auth-context.tsx` loads and exposes the Gateway session.
- `src/lib/bff-auth.ts` contains the session and CSRF client.
- `src/lib/use-api.ts` sends cookies and CSRF headers to the Gateway.
