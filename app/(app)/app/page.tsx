import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getTranslations } from "next-intl/server";
import { PlusIcon } from "lucide-react";

import { listMyOrganizationsOptions } from "@/api/generated/@tanstack/react-query.gen";
import { serverClient } from "@/api/server-client";
import { OrgList } from "@/components/organizations/org-list";
import { buttonVariants } from "@/components/ui/button";
import { createQueryClient } from "@/lib/query-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata.app");
  return { title: t("dashboard") };
}

/**
 * Cross-org dashboard.
 *
 * Today this is a thin frame around the org list — it answers "what
 * orgs am I in" for users who haven't yet picked one from the picker.
 * Template users plugging in cross-org widgets (aggregate metrics,
 * recent activity, etc.) should compose them above the OrgList block.
 */
export default async function DashboardPage() {
  // Independent awaits — race them rather than waterfall. The query
  // client is constructed sync so it doesn't go in the Promise.all.
  const queryClient = createQueryClient();
  const [tDash, tList] = await Promise.all([
    getTranslations("app.dashboard"),
    getTranslations("organizations.list"),
    queryClient.prefetchQuery(
      listMyOrganizationsOptions({ client: serverClient }),
    ),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <section className="grid gap-6">
        <header className="grid gap-1">
          <h1 className="text-lg font-semibold">{tDash("title")}</h1>
          <p className="text-sm text-muted-foreground">{tDash("body")}</p>
        </header>
        <section className="grid gap-4">
          <header className="flex flex-wrap items-end justify-between gap-3">
            <div className="grid gap-1">
              <h2 className="text-base font-semibold">{tList("title")}</h2>
              <p className="text-sm text-muted-foreground">
                {tList("description")}
              </p>
            </div>
            <Link
              href="/app/organizations/new"
              className={buttonVariants({ size: "sm" })}
            >
              <PlusIcon />
              <span>{tList("create")}</span>
            </Link>
          </header>
          <Suspense>
            <OrgList />
          </Suspense>
        </section>
      </section>
    </HydrationBoundary>
  );
}
