import type { Metadata } from "next";
import Link from "next/link";
import {
  ActivityIcon,
  BellIcon,
  DatabaseIcon,
  KeyRoundIcon,
  LinkIcon,
  MailIcon,
  ShieldIcon,
  UserIcon,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata.settings");
  return { title: t("shell") };
}

type SettingsLinkKey =
  | "profile"
  | "password"
  | "email"
  | "security"
  | "activity"
  | "connections"
  | "notifications"
  | "data";

const links: { href: string; key: SettingsLinkKey; icon: typeof UserIcon }[] = [
  { href: "/app/settings", key: "profile", icon: UserIcon },
  { href: "/app/settings/password", key: "password", icon: KeyRoundIcon },
  { href: "/app/settings/email", key: "email", icon: MailIcon },
  { href: "/app/settings/security", key: "security", icon: ShieldIcon },
  { href: "/app/settings/activity", key: "activity", icon: ActivityIcon },
  { href: "/app/settings/connections", key: "connections", icon: LinkIcon },
  {
    href: "/app/settings/notifications",
    key: "notifications",
    icon: BellIcon,
  },
  { href: "/app/settings/data", key: "data", icon: DatabaseIcon },
];

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("settings.shell");
  const tNav = await getTranslations("settings.nav");
  return (
    <main className="min-h-svh bg-background">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 md:grid-cols-[220px_1fr] md:px-6">
        <aside className="md:border-r md:pr-4">
          <div className="mb-4">
            <h1 className="text-lg font-semibold">{t("title")}</h1>
            <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>
          <nav className="grid gap-1">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <item.icon className="size-4" />
                {tNav(item.key)}
              </Link>
            ))}
          </nav>
        </aside>
        <section className="min-w-0">{children}</section>
      </div>
    </main>
  );
}
