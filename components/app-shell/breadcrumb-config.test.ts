import { describe, expect, it } from "vitest";

import { resolveBreadcrumb } from "@/components/app-shell/breadcrumb-config";

describe("resolveBreadcrumb", () => {
  it("returns Dashboard for /app", () => {
    expect(resolveBreadcrumb("/app")).toEqual([
      { ns: "app.shell.breadcrumb", key: "dashboard" },
    ]);
  });

  it("returns Dashboard › Notifications for /app/notifications", () => {
    expect(resolveBreadcrumb("/app/notifications")).toEqual([
      { ns: "app.shell.breadcrumb", key: "dashboard", href: "/app" },
      { ns: "app.shell.breadcrumb", key: "notifications" },
    ]);
  });

  it("returns Settings › Profile for /app/me/settings", () => {
    expect(resolveBreadcrumb("/app/me/settings")).toEqual([
      { ns: "app.shell.breadcrumb", key: "settings", href: "/app/me/settings" },
      { ns: "settings.nav", key: "profile" },
    ]);
  });

  it("returns Settings › Password for /app/me/settings/password", () => {
    expect(resolveBreadcrumb("/app/me/settings/password")).toEqual([
      { ns: "app.shell.breadcrumb", key: "settings", href: "/app/me/settings" },
      { ns: "settings.nav", key: "password" },
    ]);
  });

  it("returns Administration › Users for /app/admin/users", () => {
    expect(resolveBreadcrumb("/app/admin/users")).toEqual([
      {
        ns: "app.shell.breadcrumb",
        key: "administration",
        href: "/app/admin",
      },
      { ns: "admin.nav", key: "users" },
    ]);
  });

  it("returns Administration › Users for nested /app/admin/users/[id]", () => {
    expect(resolveBreadcrumb("/app/admin/users/abc-123")).toEqual([
      {
        ns: "app.shell.breadcrumb",
        key: "administration",
        href: "/app/admin",
      },
      { ns: "admin.nav", key: "users" },
    ]);
  });

  it("returns Organizations for /app/organizations", () => {
    expect(resolveBreadcrumb("/app/organizations")).toEqual([
      { ns: "app.shell.breadcrumb", key: "organizations" },
    ]);
  });

  it("returns Organizations › Create for /app/organizations/new", () => {
    expect(resolveBreadcrumb("/app/organizations/new")).toEqual([
      {
        ns: "app.shell.breadcrumb",
        key: "organizations",
        href: "/app/organizations",
      },
      { ns: "app.shell.breadcrumb", key: "organizationsNew" },
    ]);
  });

  it("returns Organizations › Organization for /app/o/:slug", () => {
    expect(resolveBreadcrumb("/app/o/acme")).toEqual([
      {
        ns: "app.shell.breadcrumb",
        key: "organizations",
        href: "/app/organizations",
      },
      { ns: "app.shell.breadcrumb", key: "organizationsActive" },
    ]);
  });

  it.each([
    ["members", "organizationsMembers"],
    ["invitations", "organizationsInvitations"],
    ["audit", "organizationsAudit"],
    ["settings", "organizationsSettings"],
  ])(
    "returns Organizations › Organization › leaf for /app/o/:slug/%s",
    (segment, key) => {
      expect(resolveBreadcrumb(`/app/o/acme/${segment}`)).toEqual([
        {
          ns: "app.shell.breadcrumb",
          key: "organizations",
          href: "/app/organizations",
        },
        {
          ns: "app.shell.breadcrumb",
          key: "organizationsActive",
          href: "/app/o/acme",
        },
        { ns: "app.shell.breadcrumb", key },
      ]);
    },
  );

  it("falls back to Dashboard for unknown paths", () => {
    expect(resolveBreadcrumb("/somewhere/else")).toEqual([
      { ns: "app.shell.breadcrumb", key: "dashboard" },
    ]);
  });
});
