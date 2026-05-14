"use client";

import type { ReactNode } from "react";

import { useAuth } from "@/components/auth-provider";

export function usePermission(permission: string) {
  const { permissions } = useAuth();
  return permissions.includes(permission);
}

export function Can({
  permission,
  anyOf,
  children,
  fallback = null,
}: {
  permission?: string;
  anyOf?: readonly string[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { permissions } = useAuth();
  const isAllowed =
    (permission ? permissions.includes(permission) : false) ||
    (anyOf ? anyOf.some((item) => permissions.includes(item)) : false);

  return isAllowed ? children : fallback;
}
