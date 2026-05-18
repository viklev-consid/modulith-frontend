import type { Metadata } from "next";
import Link from "next/link";
import { LogOutIcon, SettingsIcon, ShieldIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { BellDropdown } from "@/components/bell-dropdown";
import { Can } from "@/components/can";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata.app");
  return { title: t("dashboard") };
}

const ADMIN_PERMISSIONS = [
  "users.users.read",
  "users.invitations.write",
  "audit.trail.read",
] as const;

export default async function Page() {
  const t = await getTranslations("app.dashboard");
  return (
    <div className="min-h-svh px-6 py-5">
      <header className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-sm font-medium">{t("brand")}</h1>
          <p className="text-xs text-muted-foreground">{t("tagline")}</p>
        </div>
        <div className="flex items-center gap-2">
          <BellDropdown />
          <Can anyOf={ADMIN_PERMISSIONS}>
            <Link
              href="/app/admin"
              className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
            >
              <ShieldIcon />
              {t("admin")}
            </Link>
          </Can>
          <Link
            href="/app/settings"
            className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
          >
            <SettingsIcon />
            {t("settings")}
          </Link>
          <form action="/api/auth/logout" method="post">
            <Button size="sm" variant="outline" type="submit">
              <LogOutIcon />
              {t("signOut")}
            </Button>
          </form>
        </div>
      </header>
      <div className="grid max-w-3xl gap-3 py-6 text-sm">
        <h2 className="font-medium">{t("title")}</h2>
        <p className="text-muted-foreground">{t("body")}</p>
      </div>
    </div>
  );
}
