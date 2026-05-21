import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { isOrgRole } from "@/lib/org-roles";

/**
 * Renders an organization role with a rank-aware visual treatment.
 *
 * Owner gets the primary variant; Admin a softer fill; Member is muted.
 * Unknown role strings (in case the backend ships a new tier we haven't
 * mapped) render as outlines so they remain visible without claiming
 * ranking they may not have.
 */
export function OrgRoleBadge({ role }: { role: string }) {
  const t = useTranslations("organizations.list.role");

  const variant: "default" | "secondary" | "outline" = isOrgRole(role)
    ? role === "Owner"
      ? "default"
      : role === "Admin"
        ? "secondary"
        : "outline"
    : "outline";

  // Translation may not exist for unknown role strings — fall back to the raw value.
  let label = role;
  if (isOrgRole(role)) {
    label = t(role);
  }

  return <Badge variant={variant}>{label}</Badge>;
}
