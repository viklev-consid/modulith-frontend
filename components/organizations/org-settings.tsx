"use client";

import { useTranslations } from "next-intl";

import { usePermission } from "@/components/can";
import { DeleteOrgDialog } from "@/components/organizations/delete-org-dialog";
import { EditOrgForm } from "@/components/organizations/edit-org-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { useActiveOrg } from "@/lib/org-context";

/**
 * Org settings page.
 *
 * Two surfaces gated by scoped permissions:
 *
 * - Update (name + slug) → `organizations.update`
 * - Delete → `organizations.delete`
 *
 * Members with neither permission see a friendly empty state rather than
 * a blank page. Platform admins acting under override won't have a
 * membership in /my and so won't have scoped permissions either —
 * intentional: their reads succeed but writes flow through the same
 * permission strings the backend enforces.
 */
export function OrgSettings() {
  const t = useTranslations("organizations.settings");
  const org = useActiveOrg();
  const canUpdate = usePermission("organizations.update", org.organizationId);
  const canDelete = usePermission("organizations.delete", org.organizationId);

  if (!canUpdate && !canDelete) {
    return (
      <Empty>
        <EmptyTitle>{t("noAccess.title")}</EmptyTitle>
        <EmptyDescription>{t("noAccess.description")}</EmptyDescription>
      </Empty>
    );
  }

  return (
    <div className="grid gap-4">
      {canUpdate ? <EditOrgForm /> : null}
      {canDelete ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">
              {t("dangerZone.title")}
            </CardTitle>
            <CardDescription>{t("dangerZone.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <DeleteOrgDialog />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
