"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth-provider";

const ADMIN_LANDING_ROUTES = [
  { href: "/admin/users", permission: "users.users.read" },
  { href: "/admin/invitations", permission: "users.invitations.write" },
  { href: "/admin/audit", permission: "audit.trail.read" },
] as const;

export default function AdminIndexPage() {
  const { replace } = useRouter();
  const { isLoading, currentUser, permissions } = useAuth();

  useEffect(() => {
    if (isLoading || !currentUser) {
      return;
    }
    const first = ADMIN_LANDING_ROUTES.find((route) =>
      permissions.includes(route.permission),
    );
    if (first) {
      replace(first.href);
    }
  }, [isLoading, currentUser, permissions, replace]);

  return null;
}
