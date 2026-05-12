# Modulith Frontend — Implementation Plan

> Agent-friendly reference derived from `frontend-template-plan.html`. Open the HTML in a browser for mockups and diagrams. This file is the actionable implementation guide.

---

## Architecture overview

```
Browser
  ├── TanStack Forms + Zod (validation)
  ├── React Query (generated hooks → server state)
  └── shadcn/ui + Tailwind v4 (rendering)
        │
        ▼
  fetch → /api/*  (httpOnly cookie attached automatically)
        │
────────┼──────────────────────────────────────────────
        │
Next.js Server (BFF)
  ├── middleware.ts           → route guards (auth + onboarding)
  ├── /api/auth/*             → login, register, logout, OAuth, session
  ├── /api/proxy/[...path]    → generic proxy (attach Bearer token)
  └── iron-session            → encrypt/decrypt token cookie
        │
        │  Authorization: Bearer <jwt>
        ▼
.NET Modulith API (unchanged)
  ├── /v1/users/*
  ├── /v1/catalog/*
  ├── /v1/me/notifications/*
  └── /v1/audit/*
```

**Key principle:** The .NET backend requires zero changes. The BFF is purely a frontend concern.

---

## Cookie session shape

```typescript
// Sealed by iron-session into a single httpOnly cookie
{
  accessToken: string; // JWT from backend
  refreshToken: string; // opaque token from backend
  expiresAt: number; // unix timestamp (from JWT exp claim)
  user: {
    id: string; // from JWT sub claim
    email: string; // from JWT claim
    role: string; // from JWT claim — coarse gate only
  }
}
```

No permissions in the cookie. Permissions fetched via `GET /v1/users/me`, cached in React Query.

---

## API surface

Every endpoint the frontend consumes. All proxied through the BFF.

### Auth (BFF-handled)

| Method | Endpoint                        | Notes                                                            |
| ------ | ------------------------------- | ---------------------------------------------------------------- |
| POST   | `/v1/users/register`            | Accepts optional `invitationToken` (required in InviteOnly mode) |
| POST   | `/v1/users/login`               |                                                                  |
| POST   | `/v1/users/token/refresh`       |                                                                  |
| POST   | `/v1/users/logout`              |                                                                  |
| POST   | `/v1/users/logout/all`          |                                                                  |
| POST   | `/v1/users/auth/google/login`   |                                                                  |
| POST   | `/v1/users/auth/google/confirm` |                                                                  |

### Password management

| Method | Endpoint                        | Notes                                     |
| ------ | ------------------------------- | ----------------------------------------- |
| POST   | `/v1/users/password/forgot`     |                                           |
| POST   | `/v1/users/password/reset`      |                                           |
| POST   | `/v1/users/me/password`         | Change password (requires current)        |
| POST   | `/v1/users/me/password/initial` | Set initial password (Google OAuth users) |

### Email change

| Method | Endpoint                     | Notes                           |
| ------ | ---------------------------- | ------------------------------- |
| POST   | `/v1/users/me/email/request` | Sends confirmation to new email |
| POST   | `/v1/users/me/email/confirm` | Token from email link           |

### Profile and onboarding

| Method | Endpoint                          | Notes                                                 |
| ------ | --------------------------------- | ----------------------------------------------------- |
| GET    | `/v1/users/me`                    | Returns profile + permissions array                   |
| POST   | `/v1/users/me/onboarding`         | Complete onboarding (accept terms, optional password) |
| POST   | `/v1/users/me/auth/google/link`   |                                                       |
| DELETE | `/v1/users/me/auth/google/unlink` |                                                       |

### Notifications

| Method | Endpoint                            | Notes                                                       |
| ------ | ----------------------------------- | ----------------------------------------------------------- |
| GET    | `/v1/me/notifications`              | Paginated list (filter: unread/archived, cursor pagination) |
| GET    | `/v1/me/notifications/unread-count` | Integer count for bell badge                                |
| GET    | `/v1/me/notifications/stream`       | SSE `text/event-stream`, proxied through BFF                |
| PATCH  | `/v1/me/notifications/{id}/read`    | Mark single as read                                         |
| PATCH  | `/v1/me/notifications/read-all`     | Mark all unread as read                                     |
| DELETE | `/v1/me/notifications/{id}`         | Archive (hide) notification                                 |

### Notification preferences

| Method | Endpoint                          | Notes                                  |
| ------ | --------------------------------- | -------------------------------------- |
| GET    | `/v1/me/notification-preferences` | Per-category bell/email toggles        |
| PUT    | `/v1/me/notification-preferences` | Account/Security categories are locked |

### GDPR

| Method | Endpoint                     | Notes                                |
| ------ | ---------------------------- | ------------------------------------ |
| GET    | `/v1/users/me/personal-data` | Download JSON export                 |
| DELETE | `/v1/users/me`               | Fires UserErasure event cross-module |

### Admin — users

| Method | Endpoint                  | Notes          |
| ------ | ------------------------- | -------------- |
| GET    | `/v1/users`               | Paginated list |
| GET    | `/v1/users/{userId}`      |                |
| PUT    | `/v1/users/{userId}/role` |                |

### Admin — invitations

| Method | Endpoint                               | Notes                              |
| ------ | -------------------------------------- | ---------------------------------- |
| POST   | `/v1/users/invitations`                | Requires `users.invitations.write` |
| DELETE | `/v1/users/invitations/{invitationId}` | Revoke pending invitation          |

### Audit

| Method | Endpoint          | Notes                                      |
| ------ | ----------------- | ------------------------------------------ |
| GET    | `/v1/audit/trail` | Filterable by user, event type. Paginated. |

---

## Project structure (target)

```
modulith-frontend/
├── openapi.json                      ← committed contract snapshot
├── hey-api.config.ts                 ← codegen configuration
├── app/
│   ├── api/                          ← BFF routes
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   ├── register/route.ts
│   │   │   ├── logout/route.ts
│   │   │   ├── refresh/route.ts
│   │   │   ├── session/route.ts
│   │   │   └── google/
│   │   │       ├── login/route.ts
│   │   │       └── confirm/route.ts
│   │   └── proxy/
│   │       └── [...path]/route.ts
│   │
│   ├── (public)/                     ← no auth required
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── reset-password/page.tsx
│   │   ├── confirm-email/page.tsx
│   │   └── goodbye/page.tsx
│   │
│   ├── (onboarding)/                 ← requires auth, before onboarding complete
│   │   └── onboarding/page.tsx
│   │
│   ├── (app)/                        ← requires auth + completed onboarding
│   │   ├── layout.tsx                ← app shell, nav, user menu, bell icon
│   │   ├── page.tsx                  ← dashboard / home
│   │   ├── settings/
│   │   │   ├── page.tsx              ← profile
│   │   │   ├── password/page.tsx
│   │   │   ├── email/page.tsx
│   │   │   ├── connections/page.tsx
│   │   │   ├── notifications/page.tsx
│   │   │   └── data/page.tsx         ← GDPR export + delete
│   │   ├── notifications/page.tsx    ← full notification list
│   │   ├── activity/page.tsx         ← own audit trail
│   │   └── admin/                    ← permission-gated
│   │       ├── users/page.tsx
│   │       ├── users/[id]/page.tsx
│   │       ├── invitations/page.tsx
│   │       └── audit/page.tsx
│   │
│   ├── auth/google/confirm/page.tsx  ← Google OAuth confirm screen
│   ├── middleware.ts
│   └── layout.tsx                    ← root layout, providers
│
├── components/
│   ├── ui/                           ← shadcn/ui (managed by CLI)
│   ├── auth-provider.tsx
│   ├── can.tsx
│   ├── bell-dropdown.tsx
│   ├── notification-toast.tsx
│   └── problem-toast.tsx
│
├── lib/
│   ├── session.ts                    ← iron-session config + types
│   ├── sse.ts                        ← EventSource client + reconnect
│   └── constants.ts
│
└── api/
    ├── generated/                    ← DO NOT EDIT — output from codegen
    │   ├── types.ts
    │   ├── zod.ts
    │   └── queries.ts
    ├── client.ts                     ← configured fetch client (base URL: /api/proxy)
    └── problems.ts                   ← ProblemDetails → form/toast mapper
```

---

## Registration modes

The backend supports three modes. The frontend must adapt.

| Mode           | Register page                                                       | Google OAuth (new user)                   | Admin invitations               |
| -------------- | ------------------------------------------------------------------- | ----------------------------------------- | ------------------------------- |
| **Open**       | Standard form, no token needed                                      | Free provisioning                         | Available (optional)            |
| **InviteOnly** | Requires `?token=…` in URL. Without → "invitation required" message | Requires invitation token in confirm step | Primary workflow                |
| **Disabled**   | Shows "registration closed". No form.                               | Rejects provisioning                      | Available (pre-stage for later) |

---

## Phase 1 — Foundation + Auth

Everything depends on this phase. No feature works without auth and the codegen pipeline.

### 1.1 OpenAPI codegen pipeline

**Goal:** Running `pnpm api:generate` produces typed client code from the spec.

**Files to create:**

- `openapi.json` — initial spec snapshot from the backend (run backend, hit `/openapi/v1.json`, commit result)
- `hey-api.config.ts` — codegen configuration

**hey-api config must specify these plugins:**

- `@hey-api/types` → generates TypeScript interfaces
- `@hey-api/zod` → generates Zod validation schemas
- `@hey-api/tanstack-query` → generates React Query hooks
- `@hey-api/fetch` → generates typed fetch client

**Output directory:** `api/generated/`

**Scripts to add to package.json:**

- `api:sync` — `curl -o openapi.json http://localhost:5000/openapi/v1.json` (or equivalent)
- `api:generate` — runs `@hey-api/openapi-ts` against `./openapi.json`

**Dependencies to install:** `@hey-api/openapi-ts`, `@hey-api/client-fetch`, `@tanstack/react-query`, `zod`

**Exit criteria:** `pnpm api:generate` runs without errors and produces `api/generated/types.ts`, `api/generated/zod.ts`, `api/generated/queries.ts`.

### 1.2 API client setup

**Goal:** A configured fetch client that all generated hooks use, pointing at the BFF proxy.

**Files to create:**

- `api/client.ts` — creates a `@hey-api/client-fetch` instance configured with `baseUrl: '/api/proxy'`

**Behavior:**

- All requests go through `/api/proxy/[...path]` — the browser never calls the .NET API directly
- The client does NOT set Authorization headers — the BFF proxy reads the cookie and attaches the Bearer token server-side
- On 401 responses, redirect to `/login`

### 1.3 ProblemDetails error mapper

**Goal:** A single utility that converts .NET ProblemDetails responses into form errors or toast messages.

**Files to create:**

- `api/problems.ts`

**ProblemDetails shape from backend:**

```typescript
interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  errors?: Record<string, string[]>; // validation errors keyed by field name
}
```

**Mapper behavior:**

- If `errors` object is present → return mapped field errors for TanStack Forms (convert PascalCase field names from .NET to camelCase)
- If no `errors` but status is 4xx → fire a Sonner toast with `title` and `detail`
- If status is 401 → do not toast, trigger auth redirect
- If status is 5xx → fire a generic error toast

**Must export:**

- `mapProblemToFieldErrors(problem: ProblemDetails)` → `Record<string, string>`
- `handleProblem(problem: ProblemDetails)` → void (shows toast or maps errors)
- A utility to extract ProblemDetails from a fetch response

### 1.4 iron-session setup

**Goal:** Encrypted httpOnly cookie that stores tokens server-side.

**Dependencies to install:** `iron-session`

**Files to create:**

- `lib/session.ts`

**Must export:**

- `SessionData` type (matching the cookie shape in the architecture section above)
- `getSession(req)` / `getSession(cookies)` — reads and decrypts the session
- `sessionOptions` — iron-session config (cookie name, password from env var, ttl, httpOnly, secure, sameSite)

**Environment variable:** `SESSION_SECRET` — 32+ character string for iron-session encryption. Add to `.env.example`.

### 1.5 BFF auth routes

**Goal:** Server-side route handlers that proxy auth requests to the backend and manage the session cookie.

**Files to create:**

- `app/api/auth/login/route.ts`
- `app/api/auth/register/route.ts`
- `app/api/auth/logout/route.ts`
- `app/api/auth/refresh/route.ts`
- `app/api/auth/session/route.ts`

**Route behavior:**

| Route                | Method | Does what                                                                                                                                                                                                     |
| -------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/api/auth/login`    | POST   | Receives `{email, password}` from client. Forwards to `POST /v1/users/login` on backend. On success, seals `{accessToken, refreshToken, expiresAt, user}` into cookie. Returns `{id, email, role}` to client. |
| `/api/auth/register` | POST   | Receives `{email, password, displayName, invitationToken?}`. Forwards to `POST /v1/users/register`. Same cookie behavior as login.                                                                            |
| `/api/auth/logout`   | POST   | Forwards to `POST /v1/users/logout` with Bearer token. Clears session cookie.                                                                                                                                 |
| `/api/auth/refresh`  | POST   | Reads cookie, calls `POST /v1/users/token/refresh` with refresh token. Updates cookie with new tokens. Internal — never called by client code directly.                                                       |
| `/api/auth/session`  | GET    | Reads cookie, returns `{id, email, role}` without hitting backend. Used by auth provider on mount. Returns 401 if no valid session.                                                                           |

**All auth routes must:**

- Parse ProblemDetails errors from backend and forward them with the same status code
- Never expose tokens to the client — only return user info `{id, email, role}`
- Set `Content-Type: application/json`

### 1.6 Catch-all proxy

**Goal:** Single proxy that forwards all non-auth API calls to the backend with the Bearer token attached.

**Files to create:**

- `app/api/proxy/[...path]/route.ts`

**Behavior:**

1. Read session cookie
2. If no session → return 401
3. Check `expiresAt` — if token expires within 60 seconds, call `/api/auth/refresh` internally first
4. Set `Authorization: Bearer <accessToken>` header
5. Forward the request (method, body, query params, content-type) to `${BACKEND_URL}/${path}`
6. Stream the response back to the client (important for SSE)
7. Preserve status codes and response headers from backend

**Must handle all HTTP methods:** GET, POST, PUT, PATCH, DELETE

**SSE special handling:** When the response is `text/event-stream`, proxy must stream without buffering (no `Content-Length`, chunked transfer). Detect via Accept header or response Content-Type.

**Environment variable:** `BACKEND_URL` — base URL of the .NET API (e.g., `http://localhost:5000`). Add to `.env.example`.

### 1.7 Middleware

**Goal:** Route protection that runs on every navigation.

**Files to create:**

- `middleware.ts` (at app root)

**Logic:**

1. Define public routes that don't require auth: `/login`, `/register`, `/forgot-password`, `/reset-password`, `/confirm-email`, `/goodbye`
2. Read session cookie (check existence and expiry only — no decryption needed for the fast path)
3. **No cookie or expired** → redirect to `/login` (unless on a public route)
4. **Valid cookie, trying to access login/register** → redirect to `/` (already authenticated)
5. **Valid cookie, onboarding incomplete** → redirect to `/onboarding` (unless already on `/onboarding`)
6. Detecting onboarding status: check for a flag in the cookie, or let the auth provider handle this client-side after fetching `/v1/users/me`

**Matcher config:** Exclude static assets, `_next`, `api/` routes from middleware.

### 1.8 Auth provider

**Goal:** Client-side React context that provides auth state to the entire app.

**Dependencies to install:** `@tanstack/react-query` (if not already from codegen step)

**Files to create:**

- `components/auth-provider.tsx`

**Must provide via context:**

- `user: { id, email, role } | null`
- `permissions: string[]`
- `isAuthenticated: boolean`
- `isLoading: boolean`
- `login(email, password): Promise<void>`
- `register(data): Promise<void>`
- `logout(): Promise<void>`

**Behavior:**

1. On mount, call `GET /api/auth/session` to check for existing session
2. If session exists, set `initialData` on a `useCurrentUser` React Query hook
3. `useCurrentUser` fetches `GET /api/proxy/v1/users/me` in background → returns profile + `permissions[]`
4. Permissions cached by React Query — `<Can>` and route guards read from cache
5. On login success, set session data and trigger `useCurrentUser` fetch
6. On logout, clear query cache and redirect to `/login`

### 1.9 `<Can>` permission component

**Files to create:**

- `components/can.tsx`

**API:**

```tsx
<Can permission="audit.trail.read">
  <AuditTrailLink />
</Can>;

// Also export hook form
const canViewAudit = usePermission("audit.trail.read");
```

**Reads permissions from the React Query cache (via `useCurrentUser`).**

### 1.10 Login page

**Files to create:**

- `app/(public)/login/page.tsx`

**UI (see mockup "Login" in HTML plan):**

- Centered card: "Sign in" heading
- Email field, Password field
- "Forgot password?" link → `/forgot-password`
- "Sign in" submit button
- Divider "or"
- "Continue with Google" button (Phase 2 — render but disable or hide for now)
- "Don't have an account? Register" link → `/register`

**Form behavior:**

- TanStack Form with generated Zod schema for login request validation
- Submit calls `login()` from auth provider
- On ProblemDetails error → map to field errors (e.g., "Invalid credentials" on email field)
- On success → redirect to `/` (or `/onboarding` if onboarding incomplete)

### 1.11 Register page

**Files to create:**

- `app/(public)/register/page.tsx`

**Must handle three registration modes:**

**Open mode (default):**

- Fields: Display name, Email, Password, Confirm password
- "Create account" button
- "Already have an account? Sign in" link

**InviteOnly mode with valid token (`/register?token=…`):**

- Heading: "You're invited"
- Email field pre-filled and read-only (from invitation)
- Display name, Password, Confirm password fields
- Token sent along with registration payload

**InviteOnly mode without token:**

- Lock icon, "Invitation required" heading
- Message: "Registration is currently by invitation only."
- "Already have an account? Sign in" link

**Disabled mode:**

- "Registration closed" heading
- Message: "New account registration is not available at this time."
- "Already have an account? Sign in" link

**Expired/invalid token:**

- Warning icon, "Invitation expired" heading
- "Contact your administrator for a new invitation."

**Determining registration mode:** Fetch from backend config endpoint or embed in the OpenAPI spec. The mode affects what the register page renders before the user interacts.

**Form behavior:**

- TanStack Form with generated Zod schema
- Submit calls `register()` from auth provider
- On ProblemDetails → map to field errors
- On success → redirect (middleware will send to `/onboarding` if needed)

### 1.12 App shell

**Files to create:**

- `app/(app)/layout.tsx`

**UI (see mockup "App Shell" in HTML plan):**

- Top nav bar (dark background):
  - Left: "Modulith" brand
  - Center: nav links — Home, Activity, Settings, Admin (conditionally via `<Can>`)
  - Right: Bell icon (with unread badge), user name, avatar dropdown
- Bell icon shows unread count from `GET /v1/me/notifications/unread-count`
- User dropdown: profile link, sign out
- Admin nav links visible only to users with admin permissions

### 1.13 SSE infrastructure

**Goal:** Real-time notification delivery via Server-Sent Events.

**Files to create:**

- `lib/sse.ts`

**Behavior:**

1. On auth provider mount (authenticated user), open EventSource to `/api/proxy/v1/me/notifications/stream`
2. Listen for `notification.created` events
3. On event received:
   - Invalidate `unread-count` React Query cache (badge updates automatically)
   - Invalidate notifications list query
   - Optionally show a Sonner toast with the notification summary
4. Handle reconnection: EventSource auto-reconnects, but add exponential backoff for repeated failures
5. Close connection on logout or component unmount

### 1.14 React Query provider setup

**Files to create/modify:**

- `app/layout.tsx` — wrap with `QueryClientProvider`

**QueryClient config:**

- `staleTime`: 60 seconds (don't refetch on every mount)
- `retry`: 1 (retry once on failure, then show error)
- `refetchOnWindowFocus`: true (refresh data when user returns to tab)

### Phase 1 exit criteria

- [ ] `pnpm api:generate` produces typed client code from the OpenAPI spec
- [ ] User can register (all three modes: open, invite-only, disabled)
- [ ] User can log in with email/password
- [ ] User sees their name in the nav after login
- [ ] User can log out
- [ ] Bell icon shows unread notification count
- [ ] SSE connection streams events and updates the badge in real-time
- [ ] Invite-link registration works end to end (`/register?token=…`)
- [ ] ProblemDetails errors display correctly in forms and as toasts
- [ ] Expired tokens refresh silently via the proxy
- [ ] Unauthenticated users are redirected to `/login`
- [ ] Authenticated users visiting `/login` are redirected to `/`

---

## Phase 2 — Onboarding + Password Flows

Completes the full auth lifecycle. After this phase, the template handles every auth scenario the backend supports.

### 2.1 Onboarding wizard

**Files to create:**

- `app/(onboarding)/onboarding/page.tsx`

**UI (see mockups "Onboarding — Terms" and "Onboarding — Password" in HTML plan):**

Multi-step wizard with a stepper indicator (Terms → Password → Complete):

**Step 1 — Accept terms:**

- Display Terms of Service and Privacy Policy (version badges)
- Checkbox: "I accept the terms and privacy policy"
- "Continue" button (disabled until checkbox checked)

**Step 2 — Set initial password (conditional):**

- Only shown for Google OAuth users who don't have a password yet
- New password + Confirm password fields
- "Skip for now" and "Set password" buttons
- If user registered with email/password, skip this step entirely

**Step 3 — Complete:**

- Call `POST /v1/users/me/onboarding` with `{ termsAccepted: true, initialPassword?: string }`
- On success → redirect to `/` (app home)

**Middleware integration:** Users with incomplete onboarding are redirected here from any `(app)` route.

### 2.2 Google OAuth flow

**Dependencies to install:** `@react-oauth/google` or use GSI script directly

**Files to create:**

- `app/api/auth/google/login/route.ts`
- `app/api/auth/google/confirm/route.ts`
- `app/auth/google/confirm/page.tsx`

**Flow:**

1. User clicks "Continue with Google" on login or register page
2. Google Sign-In (GSI) button/popup obtains an ID token in the browser
3. Client sends ID token to `POST /api/auth/google/login`
4. BFF forwards to `POST /v1/users/auth/google/login` on backend
5. **Existing user:** Backend returns tokens → BFF seals cookie → redirect to app
6. **New user:** Backend returns `{ pendingToken, email, displayName }` → redirect to confirm page
7. Confirm page shows user info and "Create account & continue" button
8. In **InviteOnly** mode: confirm page checks for `?token=…` in URL, includes `invitationToken` in the confirm POST
9. On confirm: `POST /api/auth/google/confirm` → BFF seals cookie → redirect to `/onboarding`

**BFF route behavior:**

| Route                           | Does what                                                                                                            |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `POST /api/auth/google/login`   | Forwards Google ID token to backend. If existing user → seal cookie, return user. If new user → return pending info. |
| `POST /api/auth/google/confirm` | Forwards `{ pendingToken, invitationToken? }` to backend. On success → seal cookie, return user.                     |

### 2.3 Forgot password page

**Files to create:**

- `app/(public)/forgot-password/page.tsx`

**UI (see mockups "Forgot Password" and "Check Email" in HTML plan):**

**Request state:**

- Email input field
- "Send reset link" button
- "Back to sign in" link

**Sent state (same page, different view):**

- Checkmark icon
- "Check your email" heading
- "We sent a password reset link to **{email}**"
- "The link expires in 30 minutes."
- "Didn't receive it? Resend" link
- "Back to sign in" link

**Form behavior:**

- Submit calls `POST /api/proxy/v1/users/password/forgot` with `{ email }`
- Backend always returns 200 (even for non-existent emails — no user enumeration)
- On success → toggle to "sent" state

### 2.4 Reset password page

**Files to create:**

- `app/(public)/reset-password/page.tsx`

**URL:** `/reset-password?token=…` (token from email link)

**UI (see mockup "Reset Password" in HTML plan):**

- "Set new password" heading
- New password + Confirm password fields
- "Minimum 10 characters" hint
- "Reset password" submit button

**Form behavior:**

- Read `token` from URL search params
- Submit calls `POST /api/proxy/v1/users/password/reset` with `{ token, newPassword }`
- On success → redirect to `/login` with a success toast
- On error (expired/invalid token) → show error message with link back to forgot-password

### Phase 2 exit criteria

- [ ] New users complete onboarding before seeing the app
- [ ] Onboarding wizard handles both email-registered and Google-registered users
- [ ] Google Sign-In works end to end (existing user → app, new user → confirm → onboarding)
- [ ] Google OAuth in InviteOnly mode requires and sends invitation token
- [ ] Forgot password → email → reset password flow works
- [ ] Invalid/expired reset tokens show appropriate error

---

## Phase 3 — Profile + Account Management

Self-service account features. Form-heavy — exercises the ProblemDetails mapper and two-phase flows.

### 3.1 Settings layout

**Files to create:**

- `app/(app)/settings/layout.tsx`

**UI:** Sidebar navigation on the left, content area on the right.

**Sidebar links:**

- Profile (`/settings`)
- Password (`/settings/password`)
- Email (`/settings/email`)
- Connections (`/settings/connections`)
- Notifications (`/settings/notifications`)
- Your data (`/settings/data`)

### 3.2 Profile settings page

**Files to create:**

- `app/(app)/settings/page.tsx`

**UI (see mockup "Profile" in HTML plan):**

- Display name field (editable)
- Email field (read-only, with hint "Change it in Email settings")
- Role badge (read-only)
- Save button for display name changes

**Form:** TanStack Form, submit via `PUT /api/proxy/v1/users/me` (or equivalent profile update endpoint).

### 3.3 Change password page

**Files to create:**

- `app/(app)/settings/password/page.tsx`

**UI (see mockup "Change Password" in HTML plan):**

- Current password field
- New password field
- Confirm new password field
- "Update password" button

**Form:** Submit via `POST /api/proxy/v1/users/me/password`. Map ProblemDetails for "incorrect current password" to the current password field.

### 3.4 Email change page

**Files to create:**

- `app/(app)/settings/email/page.tsx`
- `app/(public)/confirm-email/page.tsx`

**Two states on the settings page:**

**Default state (see mockup "Email Change"):**

- Shows current email
- "New email address" input
- "Request change" button
- Hint: "We'll send a confirmation link to the new address."

**Pending state (see mockup "Email — Pending"):**

- Info card: "Confirmation pending — We sent a link to **{newEmail}**. Check your email to complete the change."
- Shows current email still active

**Confirm email page (`/confirm-email?token=…`):**

- Reads token from URL
- Calls `POST /api/proxy/v1/users/me/email/confirm` with `{ token }`
- On success → "Email updated" message with checkmark, "Go to app" button
- On error → "Invalid or expired link" message

### 3.5 Google account linking

**Files to create:**

- `app/(app)/settings/connections/page.tsx`

**UI (see mockup "Connections" in HTML plan):**

- Shows connected Google account (if linked): email, "Unlink" button
- If not linked: "Link Google account" button
- Hint: "Linking an account lets you sign in with it."

**Actions:**

- Link: trigger Google Sign-In → send ID token to `POST /api/proxy/v1/users/me/auth/google/link`
- Unlink: confirmation dialog → `DELETE /api/proxy/v1/users/me/auth/google/unlink`

### 3.6 Bell notification dropdown

**Files to create:**

- `components/bell-dropdown.tsx`

**UI (see mockup "Notification Dropdown" in HTML plan):**

- Popover triggered by clicking bell icon in nav
- Header: "Notifications" + "Mark all read" link
- List of recent notifications (3-5 items):
  - Unread: blue dot, bold text, light blue background
  - Read: muted text, no background
  - Each shows: title, category, relative time
- Footer: "View all notifications" link → `/notifications`

**Data:** Fetched via generated React Query hook for `GET /v1/me/notifications` (limit to 5, unread first).

**Actions:**

- Click notification → mark as read (`PATCH /v1/me/notifications/{id}/read`) + navigate if linked
- "Mark all read" → `PATCH /v1/me/notifications/read-all` → invalidate queries

### 3.7 Full notification list page

**Files to create:**

- `app/(app)/notifications/page.tsx`

**UI (see mockup "All Notifications" in HTML plan):**

- Page heading: "Notifications"
- Filter dropdown: All / Unread / Archived (managed via nuqs URL params)
- List of notifications with:
  - Unread indicator (blue dot)
  - Title, category, relative time
  - "Archive" button per item
- "Load more" button (cursor pagination)

**Empty state (see mockup "Notifications — Empty"):**

- Bell icon, "All caught up" heading
- "You have no unread notifications."

**Dependencies to install (if not already):** `nuqs`

### 3.8 Real-time notification toast

**Files to create:**

- `components/notification-toast.tsx`

**Behavior:** When an SSE `notification.created` event arrives (from `lib/sse.ts`):

1. Show a Sonner toast in the top-right corner
2. Toast shows: notification title, category, "just now"
3. Clicking toast navigates to linked resource (if any)
4. Toast auto-dismisses after 5 seconds
5. Badge count in nav updates immediately (via React Query invalidation — already wired in SSE module)

### 3.9 Notification preferences page

**Files to create:**

- `app/(app)/settings/notifications/page.tsx`

**UI (see mockup "Notification Prefs" in HTML plan):**

- Table with columns: Category, Bell, Email
- Rows:
  - Product: toggleable bell + email checkboxes
  - Collaboration: toggleable bell + email checkboxes
  - System: toggleable bell + email checkboxes
  - Account: locked (email-only, read-only, "locked" badge)
  - Security: locked (email-only, read-only, "locked" badge)
- Hint: "Account and Security notifications are always sent by email and cannot be changed."
- "Save preferences" button

**Data:** Fetch via `GET /v1/me/notification-preferences`, save via `PUT /v1/me/notification-preferences`.

### 3.10 GDPR — export personal data

**Files to modify:**

- `app/(app)/settings/data/page.tsx`

**UI (see mockup "Your Data" in HTML plan):**

**Export section:**

- "Export personal data" card
- "Download a JSON file with all data we hold about you."
- "Download my data" button
- Triggers `GET /api/proxy/v1/users/me/personal-data` → downloads JSON file

### 3.11 GDPR — delete account

**UI (same page, see mockup "Your Data" and "Delete Account — Confirm"):**

**Delete section:**

- Red-bordered card: "Delete account"
- "Permanently delete your account and all associated data. This cannot be undone."
- "Delete my account" button → opens confirmation dialog

**Confirmation dialog:**

- Red heading: "Delete your account?"
- Warning text about irreversibility
- "Type your email to confirm" input
- Cancel / "Delete forever" buttons
- Submit enabled only when typed email matches current email
- Calls `DELETE /api/proxy/v1/users/me`
- On success → clear session, redirect to `/goodbye`

### 3.12 Goodbye page

**Files to create:**

- `app/(public)/goodbye/page.tsx`

**UI (see mockup "Account Deleted"):**

- "Account deleted" heading
- "Your account and all associated data have been permanently removed."
- "Return to home" button → `/login`

### Phase 3 exit criteria

- [ ] All settings pages render and save correctly
- [ ] Password change validates current password, maps errors
- [ ] Email change flow: request → pending UI → confirmation page → email updated
- [ ] Google linking and unlinking works
- [ ] Bell dropdown shows recent notifications with read/unread states
- [ ] Full notification list page with filtering (unread/archived) and cursor pagination
- [ ] Mark as read (single + mark all) and archive work
- [ ] SSE events trigger real-time toasts
- [ ] Notification preferences save correctly with locked Account/Security rows
- [ ] GDPR export downloads JSON
- [ ] Account deletion: type-email confirmation, deletion, redirect to goodbye page

---

## Phase 4 — Admin + Audit

Permission-gated admin features. Introduces TanStack Table and nuqs for real.

### 4.1 Admin route protection

**Files to modify:**

- `app/(app)/admin/layout.tsx` (create)

**Behavior:**

- Wrap admin layout with permission check
- If user lacks admin permissions → show "Access denied" or redirect to home
- Use `<Can>` or `usePermission` from auth provider
- Admin nav links in the app shell are already conditionally rendered (from Phase 1)

### 4.2 User list page

**Files to create:**

- `app/(app)/admin/users/page.tsx`

**Dependencies to install:** `@tanstack/react-table`

**UI (see mockup "Admin — Users" in HTML plan):**

- Page heading: "Users"
- Search input (filters by name/email)
- Table columns: Name, Email, Role (badge)
- Click row → navigate to `/admin/users/[id]`
- Pagination: Prev / "1 / 3" / Next (managed via nuqs URL params)

**Data:** `GET /api/proxy/v1/users` with pagination and search query params.

**Implementation:**

- TanStack Table for column definitions, sorting, pagination state
- nuqs for syncing page/search params to URL
- Generated React Query hook for data fetching

### 4.3 User detail page

**Files to create:**

- `app/(app)/admin/users/[id]/page.tsx`

**UI (see mockup "Admin — User Detail" in HTML plan):**

- "← Back to users" link
- User name + role badge
- Info card: Email, Joined date, Login method (Google linked?), Onboarding status
- Actions section:
  - "Change role" button → opens role change dialog
- "Recent activity" section (last few audit entries for this user)

**Data:** `GET /api/proxy/v1/users/{userId}`

### 4.4 Role change dialog

**Files to create:**

- Component within the user detail page or a shared dialog component

**UI (see mockup "Role Change" in HTML plan):**

- Dialog/modal: "Change user role"
- "Changing the role for **{name}**."
- Role select dropdown (Admin / User)
- Hint about what admin access grants
- Cancel / Confirm buttons

**Action:** `PUT /api/proxy/v1/users/{userId}/role` with `{ role }`. On success → invalidate user detail and user list queries, show success toast.

### 4.5 Invitation management page

**Files to create:**

- `app/(app)/admin/invitations/page.tsx`

**UI (see mockups "Admin — Invite User" and "Invite — Sent" in HTML plan):**

**Send invitation card:**

- Email input + "Send invite" button
- On success → toast: "Invitation sent — An email has been sent to {email}. It expires in 7 days."

**Pending invitations table:**

- Columns: Email, Expires (relative time), Action
- Active invitations: "Revoke" button
- Expired invitations: grayed out, "Expired" badge, no action

**Actions:**

- Create: `POST /api/proxy/v1/users/invitations` (requires `users.invitations.write`)
- Revoke: `DELETE /api/proxy/v1/users/invitations/{invitationId}`
- On either action → invalidate invitations list query

### 4.6 Own activity feed

**Files to create:**

- `app/(app)/activity/page.tsx`

**UI (see mockup "Activity" in HTML plan):**

- Page heading: "Your activity"
- Timeline list with colored dots per event type:
  - Green: login, onboarding completed
  - Amber: password changed
  - Purple: Google account linked
- Each entry: event name, relative time
- "Load more" button (pagination)

**Data:** `GET /api/proxy/v1/audit/trail` filtered to current user (backend filters by authenticated user for non-admins).

### 4.7 Admin audit trail

**Files to create:**

- `app/(app)/admin/audit/page.tsx`

**UI (see mockups "Admin — Audit" and "Audit — Expanded Entry" in HTML plan):**

- Page heading: "Audit trail"
- Filters row: user ID input, event type dropdown (managed via nuqs)
- Timeline list (same style as own activity, but shows which user + who performed action)
- Each entry has a "detail" badge → click to expand
- Expanded view shows full JSON payload in a code block:
  ```json
  {
    "eventType": "user.role.changed",
    "resourceType": "User",
    "resourceId": "8f3a…c2d1",
    "payload": {
      "oldRole": "User",
      "newRole": "Admin",
      "changedBy": "a1b2…e4f5"
    },
    "occurredAt": "2026-05-10T10:30:00Z"
  }
  ```
- Pagination: Prev / "1 / 12" / Next

**Data:** `GET /api/proxy/v1/audit/trail` with optional `userId` and `eventType` query params.

### Phase 4 exit criteria

- [ ] Admin routes are protected — non-admin users cannot access
- [ ] Admin nav links hidden from non-admin users
- [ ] User list with search, pagination via URL params
- [ ] User detail page shows profile info and recent activity
- [ ] Role change dialog works with confirmation
- [ ] Invitation management: create, list pending, revoke
- [ ] Own activity feed (regular users see their own events)
- [ ] Admin audit trail with user/event filters and expandable JSON detail
- [ ] All admin actions invalidate relevant queries and show toasts

---

## Open decisions (all resolved)

| Decision       | Resolution                                                                 |
| -------------- | -------------------------------------------------------------------------- |
| Repo structure | Separate repo. Backend is complete on its own. OpenAPI spec is the bridge. |
| OpenAPI spec   | Committed file + sync script. CI decoupled from backend.                   |
| Google OAuth   | GSI button (client-side ID token → BFF → backend verification).            |
| Session cookie | Single cookie, no permissions. Permissions in React Query.                 |
| Proxy strategy | Catch-all first. Extract specific routes only when needed.                 |
| CORS           | Backend responsibility. BFF makes server-to-server requests.               |
| Dev experience | Two terminals: backend (Aspire) + frontend (Next.js).                      |
