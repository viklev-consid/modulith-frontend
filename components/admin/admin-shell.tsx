"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { useAuth } from "@/components/auth-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { adminRoutes } from "@/lib/admin-routes";
import { cn } from "@/lib/utils";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations("admin.shell");
  const tNav = useTranslations("admin.nav");
  const pathname = usePathname();
  const { isLoading, currentUser, permissions } = useAuth();

  if (isLoading || !currentUser) {
    return (
      <main className="grid min-h-svh place-items-center">
        <Spinner />
      </main>
    );
  }

  const visibleLinks = adminRoutes.filter((link) =>
    permissions.includes(link.permission),
  );

  if (visibleLinks.length === 0) {
    return (
      <main className="grid min-h-svh place-items-center px-4">
        <Card className="max-w-md">
          <CardContent className="grid gap-2 py-6">
            <h1 className="text-base font-medium">{t("accessDenied.title")}</h1>
            <p className="text-muted-foreground">
              {t("accessDenied.description")}
            </p>
            <Link
              href="/app"
              className="text-sm font-medium underline underline-offset-4"
            >
              {t("accessDenied.back")}
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-svh bg-background">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 md:grid-cols-[220px_1fr] md:px-6">
        <aside className="md:border-r md:pr-4">
          <div className="mb-4">
            <h1 className="text-lg font-semibold">{t("title")}</h1>
            <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>
          <nav className="grid gap-1">
            {visibleLinks.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  <item.icon className="size-4" />
                  {tNav(item.labelKey)}
                </Link>
              );
            })}
          </nav>
        </aside>
        <section className="min-w-0">{children}</section>
      </div>
    </main>
  );
}
