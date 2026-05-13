"use client";

import type { ReactNode } from "react";

import { useAuth } from "@/components/auth-provider";

export function usePermission(permission: string) {
  const { permissions } = useAuth();
  return permissions.includes(permission);
}

export function Can({
  permission,
  children,
  fallback = null,
}: {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return usePermission(permission) ? children : fallback;
}
