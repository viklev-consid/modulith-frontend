// Known canonical legal document types from the backend. Keep the mapping
// here rather than the i18n catalog because (a) these are stable
// identifiers the backend owns, not user-facing strings we translate, and
// (b) the fallback humanizer below handles unknown types gracefully so a
// new backend type does not require a frontend release to render.
const KNOWN_LEGAL_TYPE_LABELS: Record<string, string> = {
  "terms-of-service": "Terms of Service",
  "privacy-policy": "Privacy Policy",
  "cookie-policy": "Cookie Policy",
  dpa: "Data Processing Agreement",
};

/**
 * Turn a backend legal document `type` slug into a human label.
 *
 * `acceptedDocuments[]` from `GET /v1/users/me/legal-compliance` does not
 * include a `title`, only `type`. This helper produces a readable label
 * without an extra request — used for row labels in the settings ledger.
 * The View sheet still fetches the canonical title via `getLegalDocument`.
 */
export function humanizeLegalType(type: string): string {
  const known = KNOWN_LEGAL_TYPE_LABELS[type.toLowerCase()];
  if (known) return known;
  return type
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}
