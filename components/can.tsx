"use client";

import type { ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/components/auth-provider";
import { hasOrgPermission } from "@/lib/org-permissions";

/**
 * Permission check.
 *
 * Without `orgId`, checks the global permissions array on `/v1/users/me`
 * (platform-level checks).
 *
 * With `orgId`, checks the per-org scoped permissions cached from
 * `GET /v1/organizations/my`. Returns `false` for orgs the caller isn't a
 * member of — including platform admins acting under `PlatformOverride`,
 * who pass these checks at the API level but won't appear in `/my`. Pages
 * rendering content for such admins should additionally read `accessMode`
 * from `OrgContext`.
 */
export function usePermission(permission: string, orgId?: string | null) {
  const { permissions } = useAuth();
  const queryClient = useQueryClient();
  if (orgId) {
    return hasOrgPermission(queryClient, orgId, permission);
  }
  return permissions.includes(permission);
}

type CanProps = {
  permission?: string;
  anyOf?: readonly string[];
  /**
   * When set, all permission checks resolve against this organization's
   * scoped permissions instead of the global `/me` permissions.
   */
  inOrg?: string | null;
  children: ReactNode;
  fallback?: ReactNode;
};

export function Can({
  permission,
  anyOf,
  inOrg,
  children,
  fallback = null,
}: CanProps) {
  const { permissions: globalPermissions } = useAuth();
  const queryClient = useQueryClient();

  const check = (p: string) =>
    inOrg
      ? hasOrgPermission(queryClient, inOrg, p)
      : globalPermissions.includes(p);

  const isAllowed =
    (permission ? check(permission) : false) ||
    (anyOf ? anyOf.some(check) : false);

  return isAllowed ? children : fallback;
}
