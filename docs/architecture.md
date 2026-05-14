# Architecture

## BFF (Backend-for-Frontend) pattern

All API communication goes through a Next.js server-side proxy. The browser never talks directly to the .NET API.

- **Tokens never reach the browser.** Access + refresh tokens are sealed in an encrypted httpOnly cookie via `iron-session`. The cookie holds `{accessToken, refreshToken, expiresAt, user: {id, email, role}}` — no permissions, no display name.
- **Single proxy chokepoint.** All API calls route through `/api/proxy/[...path]`, which reads the cookie, checks token expiry, refreshes silently if needed, attaches `Authorization: Bearer <jwt>`, and forwards the request.
- **BFF auth routes** (`/api/auth/*`) handle login, register, logout, refresh, session, and Google OAuth. They proxy to the .NET backend and seal/clear the cookie.
- **Middleware** runs on every navigation for coarse route protection only — checks cookie existence and expiry, redirects to `/login` or `/onboarding`. It does NOT check permissions.

## Permission model

Permissions are NOT stored in the cookie (to avoid the 4KB limit). They're fetched via `GET /v1/users/me` through the BFF boundary and hydrated into React Query for protected routes.

| Layer             | Reads from                  | Can check                               |
| ----------------- | --------------------------- | --------------------------------------- |
| Middleware        | Cookie (existence + expiry) | Authenticated? Onboarded?               |
| Server components | Cookie + backend profile    | Route data, redirects, permissions      |
| Client components | Hydrated React Query cache  | Everything — role, permissions, profile |
| `<Can>` component | React Query cache           | `hasPermission("audit.trail.read")`     |

## Server-default query pattern

Route-critical reads default to server prefetch with React Query hydration:

1. Server pages/layouts create a per-request `QueryClient` with `createQueryClient()`.
2. Generated TanStack Query options are prefetched with `client: serverClient`.
3. The dehydrated state is passed through `HydrationBoundary`.
4. Client components keep using the same generated `useQuery` options for cache reads, invalidation, and client transitions.

Use client-only queries for hidden, lazy, polling, or highly interactive data. Examples include notification dropdown contents and background refreshes after a mutation.

`AuthHydration` is the protected-layout entry point for session/current-user data. `AuthProvider` still exposes `useAuth()` to client components, but protected routes should not depend on a client effect to discover the current user.

## Route groups

```
app/
  (public)/       — no auth required (login, register, forgot-password, reset-password, confirm-email, goodbye)
  (onboarding)/   — requires auth, shown before onboarding is complete
  (app)/          — requires auth + completed onboarding
    admin/        — permission-gated: users, invitations, audit trail
    activity/     — personal audit feed (caller's own events)
    settings/     — profile, password, email, connections, notifications, data
    notifications/
  api/auth/       — BFF auth routes
  api/proxy/      — catch-all proxy
```

## Admin access pattern

Admin features live under `app/(app)/admin/*` and use two complementary layers of gating:

- **Discoverability gating** — the shared `AdminShell` (`components/admin/admin-shell.tsx`) reads the user's hydrated permissions from React Query and hides sidebar links the user lacks. If no admin permissions resolve, the shell renders an "Access denied" card instead of children.
- **Server routing** — the admin landing page reads the current user on the server and redirects to the first route listed in `lib/admin-routes.ts` that the user can access.
- **Authorization** — the backend continues to enforce permissions on every endpoint. The frontend gate is a UX layer; it never replaces the API check.

When adding a new admin page, place it in `app/(app)/admin/<feature>/`, declare its required permission in `lib/admin-routes.ts`, server-prefetch route-critical reads, and rely on the backend's 403 if the gate is bypassed.
