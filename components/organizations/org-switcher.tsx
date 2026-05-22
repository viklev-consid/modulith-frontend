"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  Building2Icon,
  CheckIcon,
  ChevronsUpDownIcon,
  PlusIcon,
} from "lucide-react";

import { listMyOrganizationsOptions } from "@/api/generated/@tanstack/react-query.gen";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Organization switcher.
 *
 * Reads `/v1/organizations/my` from the cache (the auth provider prefetches
 * it). The active organization is inferred from the current URL slug
 * (`/app/o/:slug/...`) — there is no separate server-side
 * "active org" state in v1. The switcher just routes to the chosen slug.
 *
 * When the user has no organizations, the trigger collapses to a
 * "Create organization" CTA.
 */
export function OrgSwitcher() {
  const t = useTranslations("organizations.shell.switcher");
  const { data, isLoading } = useQuery(listMyOrganizationsOptions());
  const pathname = usePathname();
  const { push } = useRouter();

  const organizations = data?.organizations ?? [];

  // Extract the active slug from the URL so the trigger reflects whatever
  // org the user is currently inside. Matches `/app/o/:slug`.
  const activeSlug = (() => {
    const match = pathname.match(/^\/app\/o\/([^/]+)/);
    return match ? match[1] : null;
  })();

  const activeOrg = activeSlug
    ? organizations.find((org) => org.slug === activeSlug)
    : null;

  if (!isLoading && organizations.length === 0) {
    // No memberships: surface the create affordance directly. The switcher
    // shouldn't pretend there are orgs to switch between.
    return (
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="w-full justify-start gap-2"
        onClick={() => push("/app/organizations/new")}
        aria-label={t("create")}
      >
        <PlusIcon className="size-4" />
        <span className="truncate group-data-[collapsible=icon]:hidden">
          {t("create")}
        </span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="w-full justify-between gap-2"
            aria-label={t("label")}
          >
            <span className="flex min-w-0 items-center gap-2">
              <Building2Icon className="size-4 shrink-0" />
              <span className="truncate group-data-[collapsible=icon]:hidden">
                {activeOrg?.name ?? t("placeholder")}
              </span>
            </span>
            <ChevronsUpDownIcon className="size-4 shrink-0 opacity-60 group-data-[collapsible=icon]:hidden" />
          </Button>
        }
      />
      <DropdownMenuContent align="start" className="w-64">
        {/* Base UI requires GroupLabel to live inside a Group — wrap the
            membership list so the section heading attaches to a real group
            instead of crashing the menu. */}
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("label")}</DropdownMenuLabel>
          {organizations.map((org) => {
            const isActive = org.slug === activeSlug;
            return (
              <DropdownMenuItem
                key={org.organizationId}
                render={
                  <Link
                    href={`/app/o/${org.slug}`}
                    className="flex items-center justify-between gap-2"
                  />
                }
              >
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm">{org.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    /{org.slug}
                  </span>
                </span>
                {isActive ? (
                  <CheckIcon className="size-4 shrink-0" aria-hidden="true" />
                ) : null}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/app/organizations" />}>
          {t("viewAll")}
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/app/organizations/new" />}>
          <PlusIcon />
          <span>{t("create")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
