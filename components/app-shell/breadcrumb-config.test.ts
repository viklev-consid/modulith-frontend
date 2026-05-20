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

  it("returns Settings › Profile for /app/settings", () => {
    expect(resolveBreadcrumb("/app/settings")).toEqual([
      { ns: "app.shell.breadcrumb", key: "settings", href: "/app/settings" },
      { ns: "settings.nav", key: "profile" },
    ]);
  });

  it("returns Settings › Password for /app/settings/password", () => {
    expect(resolveBreadcrumb("/app/settings/password")).toEqual([
      { ns: "app.shell.breadcrumb", key: "settings", href: "/app/settings" },
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

  it("falls back to Dashboard for unknown paths", () => {
    expect(resolveBreadcrumb("/somewhere/else")).toEqual([
      { ns: "app.shell.breadcrumb", key: "dashboard" },
    ]);
  });
});
