# GameOps Platform - Frontend

This is the frontend part of the **GameOps Platform** MVP. It is built with **Next.js 15** and integrated with **Keycloak** for authentication.

## Features
* **OIDC Authentication**: Secure login via Keycloak (Authorization Code Flow with PKCE).
* **Role-based Access**: Custom React context to manage user roles (e.g., `ROLE_admin`).
* **API Integration**: Custom hook for authorized requests to the API Gateway.
* **Dockerized**: Ready to run in a containerized environment.

## Tech Stack
* **Framework**: Next.js (App Router)
* **Language**: TypeScript
* **Auth**: Keycloak-js
* **Styling**: Tailwind CSS

## How to Run Locally

### 1. Prerequisites
Make sure you have the [Infrastructure Repository](https://github.com/your-username/game-platform-infra) running.

### 2. Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8080
NEXT_PUBLIC_KEYCLOAK_REALM=game-realm
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=game-frontend
NEXT_PUBLIC_API_BASE_URL=http://localhost:8081
```
### 3. Development Mode
```Bash
npm install
npm run dev
```
Open http://localhost:3000 to see the result.

### 4. Docker Build
```Bash
docker build -t game-frontend .
```

## Project Structure
* src/lib/auth-context.tsx: Keycloak initialization and auth state.
* src/lib/use-api.ts: API fetcher with automatic Bearer token injection.
* src/app/page.tsx: Diagnostic dashboard for testing endpoints.