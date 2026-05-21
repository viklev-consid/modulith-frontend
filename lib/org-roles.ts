/**
 * Organization roles and rank helpers.
 *
 * The backend exposes roles as bare strings (no enum in the OpenAPI spec).
 * This module is the single source of truth for the role list and the rank
 * comparisons used to enforce role-escalation rules client-side.
 *
 * Rank is highest-wins: Owner > Admin > Member.
 *
 * Backend errors (`Organizations.Role.EscalationForbidden`,
 * `Organizations.Owner.LastOwnerRequired`) remain the source of truth; the
 * helpers here exist to hide UI affordances that would deterministically fail.
 */

export const ORG_ROLES = ["Owner", "Admin", "Member"] as const;
export type OrgRole = (typeof ORG_ROLES)[number];

const RANK: Record<OrgRole, number> = {
  Owner: 3,
  Admin: 2,
  Member: 1,
};

export function isOrgRole(value: string): value is OrgRole {
  return (ORG_ROLES as readonly string[]).includes(value);
}

export function roleRank(role: string): number {
  return isOrgRole(role) ? RANK[role] : 0;
}

/**
 * Roles the caller is permitted to assign or invite at.
 *
 * The backend forbids assigning a role at or above the caller's own rank
 * (returns `Organizations.Role.EscalationForbidden`). Strictly below, never
 * equal.
 */
export function rolesBelow(callerRole: string): OrgRole[] {
  const callerRank = roleRank(callerRole);
  return ORG_ROLES.filter((role) => RANK[role] < callerRank);
}

export function isHigherOrEqualRank(a: string, b: string): boolean {
  return roleRank(a) >= roleRank(b);
}
