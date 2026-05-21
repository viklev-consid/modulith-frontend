import { adminRoutes, type AdminRouteLabelKey } from "@/lib/admin-routes";
import {
  settingsRoutes,
  type SettingsRouteLabelKey,
} from "@/lib/settings-routes";

type ShellBreadcrumbKey =
  | "dashboard"
  | "settings"
  | "administration"
  | "notifications"
  | "organizations"
  | "organizationsNew"
  | "organizationsActive";

export type Crumb =
  | {
      ns: "app.shell.breadcrumb";
      key: ShellBreadcrumbKey;
      href?: string;
    }
  | {
      ns: "settings.nav";
      key: SettingsRouteLabelKey;
      href?: string;
    }
  | {
      ns: "admin.nav";
      key: AdminRouteLabelKey;
      href?: string;
    };

const trails: { match: (path: string) => boolean; build: () => Crumb[] }[] = [
  {
    match: (p) => p === "/app",
    build: () => [{ ns: "app.shell.breadcrumb", key: "dashboard" }],
  },
  {
    match: (p) => p === "/app/notifications",
    build: () => [
      { ns: "app.shell.breadcrumb", key: "dashboard", href: "/app" },
      { ns: "app.shell.breadcrumb", key: "notifications" },
    ],
  },
  ...settingsRoutes.map((route) => ({
    match: (p: string) => p === route.href,
    build: (): Crumb[] => [
      {
        ns: "app.shell.breadcrumb",
        key: "settings",
        href: "/app/settings",
      },
      { ns: "settings.nav", key: route.labelKey },
    ],
  })),
  ...adminRoutes.map((route) => ({
    match: (p: string) => p === route.href || p.startsWith(`${route.href}/`),
    build: (): Crumb[] => [
      {
        ns: "app.shell.breadcrumb",
        key: "administration",
        href: "/app/admin",
      },
      { ns: "admin.nav", key: route.labelKey },
    ],
  })),
  {
    match: (p) => p === "/app/admin",
    build: () => [{ ns: "app.shell.breadcrumb", key: "administration" }],
  },
  {
    match: (p) => p === "/app/organizations",
    build: () => [{ ns: "app.shell.breadcrumb", key: "organizations" }],
  },
  {
    match: (p) => p === "/app/organizations/new",
    build: () => [
      {
        ns: "app.shell.breadcrumb",
        key: "organizations",
        href: "/app/organizations",
      },
      { ns: "app.shell.breadcrumb", key: "organizationsNew" },
    ],
  },
  {
    match: (p) => p.startsWith("/app/organizations/o/"),
    build: () => [
      {
        ns: "app.shell.breadcrumb",
        key: "organizations",
        href: "/app/organizations",
      },
      { ns: "app.shell.breadcrumb", key: "organizationsActive" },
    ],
  },
];

export function resolveBreadcrumb(pathname: string): Crumb[] {
  const match = trails.find((entry) => entry.match(pathname));
  return match?.build() ?? [{ ns: "app.shell.breadcrumb", key: "dashboard" }];
}
