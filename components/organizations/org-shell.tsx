"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { notFound, usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import {
  getOrganizationOptions,
  listMyOrganizationsQueryKey,
} from "@/api/generated/@tanstack/react-query.gen";
import type {
  GetOrganizationResponse,
  ListMyOrganizationsResponse,
} from "@/api/generated";
import { problemHasErrorCode, type ProblemDetails } from "@/api/problems";
import { AccessModeBadge } from "@/components/organizations/access-mode-badge";
import { OrgRoleBadge } from "@/components/organizations/org-role-badge";
import { Spinner } from "@/components/ui/spinner";
import { OrgContext, type OrgContextValue } from "@/lib/org-context";

type OrgShellProps = {
  slug: string;
  children: React.ReactNode;
};

/**
 * Active-organization shell.
 *
 * Resolution order:
 * 1. Look up the slug in the cached `/my` response. Members hit this path.
 * 2. Fall back to `getOrganization(slug)` for platform admins acting under
 *    `PlatformOverride` (they aren't in `/my`).
 * 3. Treat a 404 as "soft-deleted or you were removed": drop the stale
 *    `/my` entry, toast, and bounce to `/app/organizations`.
 *
 * The resolved organization seeds `OrgContext` for descendants. The shell
 * also renders the header (name, role badge, access-mode badge, nav tabs).
 */
export function OrgShell({ slug, children }: OrgShellProps) {
  const t = useTranslations("organizations.shell");
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Always issue the GET, regardless of `/my` cache state, because the
  // response carries `accessMode` (which `/my` does not). Cheap with the
  // QueryClient's 30s staleTime.
  const orgQuery = useQuery({
    ...getOrganizationOptions({ path: { organizationRef: slug } }),
    retry: (_attemptIndex, error) => {
      // 404 is terminal — no point retrying.
      const status = (error as unknown as ProblemDetails)?.status;
      return status !== 404;
    },
  });

  // Pull the membership record for role + scoped-permission context. Absent
  // for platform-override admins.
  const myOrgs = queryClient.getQueryData<ListMyOrganizationsResponse>(
    listMyOrganizationsQueryKey(),
  );
  const membership = myOrgs?.organizations.find((org) => org.slug === slug);

  // Handle 404 as "no longer accessible": evict the stale /my entry (if any)
  // and bounce out. Effect rather than render-time redirect so it runs once
  // and the toast can fire.
  useEffect(() => {
    if (orgQuery.error == null) return;
    const status = (orgQuery.error as unknown as ProblemDetails).status;
    const isGone =
      status === 404 ||
      problemHasErrorCode(
        orgQuery.error as unknown as ProblemDetails,
        "Organizations.NotFound",
      );
    if (!isGone) return;

    if (myOrgs) {
      queryClient.setQueryData<ListMyOrganizationsResponse>(
        listMyOrganizationsQueryKey(),
        {
          organizations: myOrgs.organizations.filter((o) => o.slug !== slug),
        },
      );
    }
    toast.error(t("removed.title"), { description: t("removed.description") });
    router.replace("/app/organizations");
  }, [orgQuery.error, myOrgs, queryClient, router, slug, t]);

  const contextValue = useMemo<OrgContextValue | null>(() => {
    const org = orgQuery.data as GetOrganizationResponse | undefined;
    if (!org) return null;
    return {
      organizationId: org.organizationId,
      slug: org.slug,
      name: org.name,
      role: membership?.role,
      accessMode: org.accessMode,
    };
  }, [orgQuery.data, membership?.role]);

  if (orgQuery.isLoading) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <Spinner />
      </div>
    );
  }

  if (
    orgQuery.isError &&
    (orgQuery.error as unknown as ProblemDetails)?.status === 404
  ) {
    // The effect above will route away; in the meantime, render nothing.
    return null;
  }

  if (!contextValue) {
    // Some other error: let Next's standard error UI handle it.
    notFound();
  }

  // Tabs that always render. Each underlying page additionally guards by
  // scoped permission via <Can inOrg=... /> — disabled tabs would just lead
  // to empty/forbidden states.
  const tabs = [
    { href: `/app/organizations/o/${slug}`, key: "overview", exact: true },
    {
      href: `/app/organizations/o/${slug}/members`,
      key: "members",
      exact: false,
    },
    {
      href: `/app/organizations/o/${slug}/invitations`,
      key: "invitations",
      exact: false,
    },
    {
      href: `/app/organizations/o/${slug}/settings`,
      key: "settings",
      exact: false,
    },
  ] as const;

  const isActive = (href: string, exact: boolean) =>
    exact
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <OrgContext.Provider value={contextValue}>
      <section className="grid gap-4">
        <header className="grid gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-semibold">{contextValue.name}</h1>
            {contextValue.role ? (
              <OrgRoleBadge role={contextValue.role} />
            ) : null}
            <AccessModeBadge accessMode={contextValue.accessMode} />
          </div>
          <p className="text-xs text-muted-foreground">/{contextValue.slug}</p>
        </header>
        <nav
          aria-label={t("nav.label")}
          className="flex flex-wrap gap-1 border-b text-sm"
        >
          {tabs.map((tab) => {
            const active = isActive(tab.href, tab.exact);
            return (
              <Link
                key={tab.key}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={
                  "border-b-2 px-3 py-2 -mb-px transition-colors " +
                  (active
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground")
                }
              >
                {t(`nav.${tab.key}`)}
              </Link>
            );
          })}
        </nav>
        <div>{children}</div>
      </section>
    </OrgContext.Provider>
  );
}
