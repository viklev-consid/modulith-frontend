"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GaugeIcon,
  HelpCircleIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  ShieldIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Can } from "@/components/can";
import { ProfileMenu } from "@/components/app-shell/profile-menu";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { adminRoutes } from "@/lib/admin-routes";

const ADMIN_PERMISSIONS = adminRoutes.map((route) => route.permission);

export function AppSidebar({ onSearchOpen }: { onSearchOpen: () => void }) {
  const t = useTranslations("app.shell");
  const pathname = usePathname();

  const isActive = (href: string, exact = false) =>
    exact
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center">
          <div className="grid size-7 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
            M
          </div>
          <div className="grid text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="font-medium">{t("brand")}</span>
            <span className="text-xs text-muted-foreground">
              {t("workspaceLabel")}
            </span>
          </div>
        </div>
        <div className="px-2 group-data-[collapsible=icon]:px-0">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled
            aria-label={t("quickCreate")}
            className="w-full justify-start gap-2 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
          >
            <PlusIcon className="size-4" />
            <span className="group-data-[collapsible=icon]:hidden">
              {t("quickCreate")}
            </span>
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("workspaceLabel")}</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={isActive("/app", true)}
                tooltip={t("dashboard")}
                render={<Link href="/app" />}
              >
                <GaugeIcon />
                <span>{t("dashboard")}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={`${t("search")} (⌘K)`}
              onClick={onSearchOpen}
            >
              <SearchIcon />
              <span>{t("search")}</span>
              <span className="ml-auto text-[10px] text-muted-foreground group-data-[collapsible=icon]:hidden">
                ⌘K
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <Can anyOf={ADMIN_PERMISSIONS}>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={isActive("/app/admin")}
                tooltip={t("administration")}
                render={<Link href="/app/admin" />}
              >
                <ShieldIcon />
                <span>{t("administration")}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </Can>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={isActive("/app/settings")}
              tooltip={t("settings")}
              render={<Link href="/app/settings" />}
            >
              <SettingsIcon />
              <span>{t("settings")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              type="button"
              disabled
              aria-disabled
              tooltip={t("help")}
            >
              <HelpCircleIcon />
              <span>{t("help")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <ProfileMenu />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
