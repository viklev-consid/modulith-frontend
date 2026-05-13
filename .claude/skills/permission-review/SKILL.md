---
name: permission-review
description: Use when creating or modifying components that use the <Can> component, usePermission hook, or hasPermission checks. Validates permission strings against the backend API and checks for consistent usage patterns.
version: "1.0.0"
---

# Permission-Aware Component Reviewer

Validates that permission strings used in UI components are correct and consistent with the backend API contract.

## When to use

Run this review after creating or modifying any component that:

- Uses `<Can permission="...">`
- Calls `usePermission("...")`
- Accesses `permissions` from `useAuth()`

## Review steps

### 1. Collect all permission strings used in the codebase

```bash
grep -rn 'permission=' --include="*.tsx" --include="*.ts" app/ components/ | grep -v node_modules | grep -v api/generated
grep -rn 'usePermission(' --include="*.tsx" --include="*.ts" app/ components/ | grep -v node_modules | grep -v api/generated
grep -rn 'hasPermission(' --include="*.tsx" --include="*.ts" app/ components/ | grep -v node_modules | grep -v api/generated
```

### 2. Cross-reference against the backend API

Check the OpenAPI spec and generated types for known permission patterns:

```bash
grep -rn 'permission' api/generated/sdk.gen.ts | grep -i "requires\|permission"
```

The backend uses dotted permission strings (e.g., `"users.users.read"`, `"audit.trail.read"`). Verify every permission string in UI code:

- [ ] Follows the dotted notation pattern: `<module>.<resource>.<action>`
- [ ] Is referenced in the backend API documentation (sdk.gen.ts comments)
- [ ] Has no typos (check each segment against known modules/resources/actions)
- [ ] Is used consistently (same permission string isn't written differently in different files)

### 3. Check component patterns

- [ ] `<Can>` is used for UI gating, not for data fetching decisions
- [ ] Permission checks happen at the right granularity (page-level vs element-level)
- [ ] Fallback content is appropriate (don't show broken UI when permission is denied)
- [ ] No permission checks are duplicated — if a parent gates on a permission, children don't re-check

### 4. Report format

```
## Permission Audit

### Strings found
| Permission string        | Files using it                     | Valid? |
|-------------------------|------------------------------------|--------|
| audit.trail.read        | app/(app)/page.tsx:27              | YES    |
| users.users.read        | app/(app)/admin/users/page.tsx:12  | YES    |
| audit.trail.raed        | components/sidebar.tsx:45          | TYPO   |

### Issues
- **TYPO**: `audit.trail.raed` in sidebar.tsx:45 — should be `audit.trail.read`
- **UNKNOWN**: `foo.bar.baz` in settings.tsx:12 — not found in backend API docs
```
