import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getTranslations } from "next-intl/server";
import { PlusIcon } from "lucide-react";

import { listMyOrganizationsOptions } from "@/api/generated/@tanstack/react-query.gen";
import { serverClient } from "@/api/server-client";
import { OrgList } from "@/components/organizations/org-list";
import { Button } from "@/components/ui/button";
import { createQueryClient } from "@/lib/query-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata.app.organizations");
  return { title: t("list") };
}

export default async function OrganizationsPage() {
  const t = await getTranslations("organizations.list");
  const queryClient = createQueryClient();

  await queryClient.prefetchQuery(
    listMyOrganizationsOptions({ client: serverClient }),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <section className="grid gap-4">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div className="grid gap-1">
            <h1 className="text-lg font-semibold">{t("title")}</h1>
            <p className="text-sm text-muted-foreground">{t("description")}</p>
          </div>
          <Button size="sm" render={<Link href="/app/organizations/new" />}>
            <PlusIcon />
            <span>{t("create")}</span>
          </Button>
        </header>
        <Suspense>
          <OrgList />
        </Suspense>
      </section>
    </HydrationBoundary>
  );
}
