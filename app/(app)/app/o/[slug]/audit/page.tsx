import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { OrgAuditTable } from "@/components/organizations/org-audit-table";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata.app.organizations");
  return { title: t("audit") };
}

export default async function OrgAuditPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  await Promise.all([params, searchParams]);
  return <OrgAuditTable />;
}
