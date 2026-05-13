# 0003 - Split Authentication, Onboarding, And Permissions By Runtime Layer

Date: 2026-05-13

Status: Accepted

## Context

The app needs authentication, onboarding gates, role checks, and fine-grained permission-gated UI. These checks happen in different runtimes with different data access:

- Next.js Proxy can inspect cookies before page rendering.
- Route handlers can read and update the encrypted session.
- Server components can read server-only session data.
- Client components can use React Query and generated API calls.

The cookie must stay small and must not become a full authorization payload.

## Decision

Authentication, onboarding, and permissions are split by layer:

| Layer             | Reads From                                       | Responsibility                                                            |
| ----------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| `proxy.ts`        | Sealed session cookie                            | Coarse redirects for authenticated, unauthenticated, and onboarding flows |
| `app/api/auth/**` | `iron-session` and backend auth endpoints        | Login, register, logout, refresh, OAuth, password flows, session exposure |
| Server components | Server-only session helpers                      | Coarse role-aware rendering only                                          |
| `AuthProvider`    | `/api/auth/session` and `/api/proxy/v1/users/me` | Client auth state, current profile, permissions, onboarding navigation    |
| `<Can>`           | React Query current-user data                    | Fine-grained permission-gated UI                                          |

The session cookie stores access token, refresh token, expiry, and minimal public identity. Permissions are fetched from `GET /v1/users/me` through the BFF proxy and cached client-side with React Query.

## Consequences

The cookie remains small and sensitive data stays out of client JavaScript. Permission checks can evolve with backend claims without changing the cookie format.

Middleware-style redirects remain fast and coarse. Fine-grained authorization is intentionally performed closer to the UI and backed by the current user profile.

## Agent Guidance

Do not add permissions or large profile payloads to the session cookie.

Do not rely on `proxy.ts` for fine-grained permissions. Proxy should answer only questions like:

- Is there a usable session?
- Should an authenticated user be redirected away from public auth pages?
- Has onboarding been completed enough to enter protected app routes?

Use `<Can>` or `hasPermission`-style client logic for permission-gated UI. When changing permission-gated UI, validate permission strings against backend API/contract data.

When returning session data to the browser, use `publicUser()` or equivalent minimal data. Never return tokens.
