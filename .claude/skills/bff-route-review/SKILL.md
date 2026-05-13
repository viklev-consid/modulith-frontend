---
name: bff-route-review
description: Use after creating or modifying any API route under app/api/. Reviews BFF routes for security, error handling, session management, and token leakage. Run this before committing changes to API routes.
version: "1.0.0"
---

# BFF Route Reviewer

Reviews Next.js API routes (`app/api/**`) for security and correctness against the project's BFF architecture.

## When to use

Run this review after creating or modifying any file under `app/api/auth/` or `app/api/proxy/`.

## Review checklist

For every API route file, verify **all** of the following:

### 1. Session handling

- [ ] Route reads the session via `getSession()` from `@/lib/session`
- [ ] Auth routes (`app/api/auth/*`) that require authentication check `hasUsableSession(session)` before proceeding
- [ ] Public auth routes (login, register) do NOT require an existing session
- [ ] Session is saved (`session.save()`) after any mutation to session data

### 2. Error handling

- [ ] Non-OK backend responses are handled via `problemResponse(response)` from `@/lib/backend`
- [ ] No raw `Error` objects or stack traces are returned to the client
- [ ] Response status codes match the backend's response (no swallowed errors)
- [ ] No `try/catch` that silently swallows errors — errors must propagate

### 3. Token security

- [ ] `accessToken` and `refreshToken` are NEVER included in response bodies
- [ ] Only `publicUser()` data (id, email, role) is returned to the client
- [ ] No tokens appear in URL parameters or query strings
- [ ] The `Authorization` header is only set on outbound requests to the backend, never in responses

### 4. Request forwarding

- [ ] The `host` header is deleted before forwarding to the backend
- [ ] The `cookie` header is deleted before forwarding to the backend
- [ ] `force-dynamic` is exported to prevent caching of auth responses
- [ ] Content-type is set correctly for JSON requests

### 5. Response security

- [ ] No backend-internal headers are leaked to the client (hop-by-hop headers stripped)
- [ ] Error responses do not distinguish "user not found" from "wrong password" (no account enumeration)
- [ ] No sensitive data in error `detail` or `extensions` fields

## How to run

Read each changed API route file and check against the checklist above. Report findings as:

- **PASS** — requirement met
- **FAIL** — requirement violated (explain what and where)
- **N/A** — requirement not applicable to this route type

Example:

```
## Review: app/api/auth/login/route.ts

| Check                          | Status | Notes                              |
|--------------------------------|--------|------------------------------------|
| Session read                   | PASS   | Uses getSession() at line 30       |
| Error handling via problemResponse | PASS | Line 23-25                         |
| No tokens in response          | PASS   | Returns publicUser() only          |
| Account enumeration            | FAIL   | Backend error passed through as-is |
```
