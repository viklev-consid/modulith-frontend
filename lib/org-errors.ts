"use client";

import { problemHasErrorCode, type ProblemDetails } from "@/api/problems";

/**
 * Named constants for the Organizations module's RFC 9457 problem codes.
 *
 * Mirrors the backend's error catalog. Call sites use `problemHasErrorCode`
 * to branch on these — the backend already ships localized `title`/`detail`
 * strings, so we don't keep a copy dictionary here.
 */
export const ORG_ERRORS = {
  LastOwnerRequired: "Organizations.Owner.LastOwnerRequired",
  RoleEscalationForbidden: "Organizations.Role.EscalationForbidden",
  UserErasureBlocked: "Organizations.Owner.UserErasureBlocked",
  InvitationInvalid: "Organizations.Invitation.Invalid",
  RegistrationUnavailable: "Organizations.RegistrationUnavailable",
  SlugTaken: "Organizations.Slug.Taken",
  NotFound: "Organizations.NotFound",
} as const;

export type OrgErrorCode = (typeof ORG_ERRORS)[keyof typeof ORG_ERRORS];

export function isOrgError(
  problem: ProblemDetails,
  code: OrgErrorCode,
): boolean {
  return problemHasErrorCode(problem, code);
}

/**
 * Shape of the extension payload on `Organizations.Owner.UserErasureBlocked`.
 *
 * The backend lists the orgs the user is the sole Owner of, so the UI can
 * route them to a remediation page (transfer ownership / delete org).
 */
export type BlockingOrganization = {
  organizationId: string;
  name: string;
  slug: string;
};

export function extractBlockingOrganizations(
  problem: ProblemDetails,
): BlockingOrganization[] {
  // Backends vary on extension placement: top-level vs `extensions`. Accept both.
  const top = (problem as unknown as Record<string, unknown>)
    .blockingOrganizations;
  const nested = problem.extensions?.blockingOrganizations;
  const candidate = Array.isArray(top) ? top : nested;
  return Array.isArray(candidate) ? (candidate as BlockingOrganization[]) : [];
}
