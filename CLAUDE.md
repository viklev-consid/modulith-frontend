@AGENTS.md

# Modulith Frontend

Next.js companion app for the Modulith .NET backend. This is a template project — the frontend is a separate repo, communicating with the backend exclusively through its OpenAPI spec.

## Architecture

### BFF (Backend-for-Frontend) pattern

All API communication goes through a Next.js server-side proxy. The browser never talks directly to the .NET API.

- **Tokens never reach the browser.** Access + refresh tokens are sealed in an encrypted httpOnly cookie via `iron-session`. The cookie holds `{accessToken, refreshToken, expiresAt, user: {id, email, role}}` — no permissions, no display name.
- **Single proxy chokepoint.** All API calls route through `/api/proxy/[...path]`, which reads the cookie, checks token expiry, refreshes silently if needed, attaches `Authorization: Bearer <jwt>`, and forwards the request.
- **BFF auth routes** (`/api/auth/*`) handle login, register, logout, refresh, session, and Google OAuth. They proxy to the .NET backend and seal/clear the cookie.
- **Middleware** runs on every navigation for coarse route protection only — checks cookie existence and expiry, redirects to `/login` or `/onboarding`. It does NOT check permissions.

### Permission model

Permissions are NOT stored in the cookie (to avoid the 4KB limit). They're fetched via `GET /v1/users/me` and cached client-side in React Query.

| Layer             | Reads from                  | Can check                               |
| ----------------- | --------------------------- | --------------------------------------- |
| Middleware        | Cookie (existence + expiry) | Authenticated? Onboarded?               |
| Server components | Cookie (decrypt for role)   | Coarse role-level layout                |
| Client components | React Query cache           | Everything — role, permissions, profile |
| `<Can>` component | React Query cache           | `hasPermission("audit.trail.read")`     |

### Route groups

```
app/
  (public)/       — no auth required (login, register, forgot-password, reset-password, confirm-email)
  (onboarding)/   — requires auth, shown before onboarding is complete
  (app)/          — requires auth + completed onboarding (all main app pages)
  api/auth/       — BFF auth routes
  api/proxy/      — catch-all proxy
```

## Code generation — OpenAPI pipeline

Types are generated, not hand-written. The OpenAPI spec is the single source of truth.

- `openapi.json` is **committed** in the repo as the contract snapshot.
- `pnpm api:sync` — fetches the spec from the running backend (`http://localhost:5000/openapi/v1.json`).
- `pnpm api:generate` — runs `@hey-api/openapi-ts` against the local `openapi.json`, outputs to `src/api/generated/`.
- **Never hand-edit files in `src/api/generated/`** — they are overwritten on every codegen run.
- CI runs `api:generate` against the committed spec. Builds are fully decoupled from the backend.

Generated outputs:
| Output | Plugin | Used by |
|---|---|---|
| TypeScript interfaces | `@hey-api/types` | Everything |
| Zod validation schemas | `@hey-api/zod` | TanStack Forms (client validation matching backend rules) |
| React Query hooks | `@hey-api/tanstack-query` | Components (`useQuery` / `useMutation` wrappers) |
| Fetch client | `@hey-api/fetch` | BFF proxy (typed fetch to .NET API) |

## Error handling — ProblemDetails

The .NET backend returns RFC 9457 `ProblemDetails` consistently. A single mapper (`src/api/problems.ts`) converts them:

- **Validation errors** (status 400 with `errors` object) → mapped to TanStack Forms field errors.
- **Business errors** (status 409, 404, 422, etc.) → displayed as toast notifications via Sonner.
- **Auth errors** (status 401) → trigger token refresh or redirect to login.

All mutations must use this mapper. Do not write custom error handling per form.

## Technology choices

These are deliberate decisions. Do not substitute alternatives.

| Need                            | Use this                               | NOT this                                     |
| ------------------------------- | -------------------------------------- | -------------------------------------------- |
| Server state                    | TanStack Query (generated hooks)       | `useEffect` + `useState`, SWR                |
| Forms                           | TanStack Forms + generated Zod schemas | React Hook Form, uncontrolled forms          |
| Data tables                     | TanStack Table                         | Manual `<table>` rendering                   |
| URL state (pagination, filters) | nuqs                                   | `useSearchParams` manually                   |
| Validation                      | Zod (generated from OpenAPI)           | Hand-written schemas, yup                    |
| Session/cookies                 | iron-session                           | next-auth, better-auth, cookies API directly |
| Toasts                          | Sonner (via `sonner` package)          | window.alert, custom toast system            |
| Icons                           | lucide-react                           | heroicons, font-awesome                      |
| Component primitives            | shadcn/ui (already installed)          | MUI, Chakra, Ant Design                      |
| Styling                         | Tailwind CSS v4                        | CSS modules, styled-components               |
| Dark mode                       | next-themes (ThemeProvider)            | Manual class toggling                        |

## Key files and their roles

```
src/api/client.ts        — configured fetch client (base URL: /api/proxy)
src/api/problems.ts      — ProblemDetails → form errors / toast mapper
src/api/generated/       — auto-generated types, zod schemas, query hooks (DO NOT EDIT)
src/lib/session.ts       — iron-session config and session type definition
src/lib/sse.ts           — SSE client (EventSource + reconnect + query invalidation)
components/auth-provider  — React context: useCurrentUser, isAuthenticated, hasPermission
components/can.tsx       — <Can permission="..."> for permission-gated rendering
components/ui/           — shadcn/ui components (managed by shadcn CLI)
middleware.ts            — route protection (auth redirect, onboarding gate)
```

## Conventions

### File organization

- Pages go in `app/(public)/`, `app/(onboarding)/`, or `app/(app)/` based on auth requirements.
- BFF API routes go in `app/api/auth/` or `app/api/proxy/`.
- Shared components go in `components/`. Page-specific components stay in the page's directory.
- shadcn/ui components live in `components/ui/` — add new ones via `pnpm dlx shadcn@latest add <name>`.

### Patterns

- Use `"use client"` only when the component needs browser APIs, event handlers, or hooks. Default to server components.
- Forms: create with TanStack Forms, validate with generated Zod schemas, submit via generated mutation hooks, handle errors with the ProblemDetails mapper.
- Mutations: always invalidate relevant React Query caches on success. Use `queryClient.invalidateQueries()`.
- Loading states: use Suspense boundaries and skeleton components from `components/ui/skeleton`.
- Navigation: use Next.js `<Link>` component. Do not use `window.location` or `router.push` for normal navigation.

### React 19 conventions

- **Context:** Use `React.use(MyContext)` instead of `React.useContext(MyContext)`. The `use()` hook is the React 19 way and supports conditional calls.
- **Refs:** Pass `ref` as a regular prop. Do not use `forwardRef` — it is unnecessary in React 19.
- **Composition:** Prefer compound components (e.g., `Dialog`, `DialogTrigger`, `DialogContent`) over boolean props that toggle modes. Create explicit variant components instead of adding `isX` flags.

### Data fetching — BFF proxy is intentional

- Do NOT refactor data fetching into server components or server actions. All API calls go through the BFF proxy (`/api/proxy/[...path]`) + React Query hooks. This is a deliberate architecture decision — the proxy manages token attachment, silent refresh, and SSE streaming.
- Server components may read the session cookie for coarse role checks, but all data fetching happens client-side through React Query.

### Hydration

- `suppressHydrationWarning` on `<html>` is specifically for `next-themes` (class attribute differs between server and client). Do not spread this attribute to other elements to mask real hydration issues.
- Prefer CSS-based responsive design (Tailwind breakpoints) over `useIsMobile` hooks that cause hydration mismatches. The `hooks/use-mobile.ts` hook initializes as `undefined` on the server, causing a flash when it resolves client-side.

### Path alias

`@/*` maps to the project root. Use `@/components/ui/button` not `../../../components/ui/button`.

## Commands

```bash
pnpm dev            # Start dev server (Turbopack)
pnpm build          # Production build
pnpm lint           # ESLint
pnpm format         # Prettier (write mode)
pnpm typecheck      # TypeScript check (tsc --noEmit)
pnpm api:sync       # Fetch OpenAPI spec from running backend
pnpm api:generate   # Run codegen against local openapi.json
pnpm test           # Run tests (Vitest)
```

## Plan reference

The full implementation plan with mockups, flows, API surface, and phased delivery is in `frontend-template-plan.html`. Open it in a browser for the formatted version. The plan covers 4 phases:

1. **Foundation + Auth** — codegen pipeline, BFF auth, login/register, app shell, SSE infrastructure
2. **Onboarding + Password Flows** — onboarding wizard, Google OAuth, forgot/reset password
3. **Profile + Account Management** — settings pages, notifications (bell + SSE + preferences), GDPR
4. **Admin + Audit** — user management, invitations, audit trail, permission-gated UI
