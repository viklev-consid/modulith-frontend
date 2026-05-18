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

import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Settings | Modulith",
};

const links = [
  { href: "/app/settings", label: "Profile", icon: UserIcon },
  { href: "/app/settings/password", label: "Password", icon: KeyRoundIcon },
  { href: "/app/settings/email", label: "Email", icon: MailIcon },
  { href: "/app/settings/security", label: "Security", icon: ShieldIcon },
  { href: "/app/settings/activity", label: "Activity", icon: ActivityIcon },
  { href: "/app/settings/connections", label: "Connections", icon: LinkIcon },
  {
    href: "/app/settings/notifications",
    label: "Notifications",
    icon: BellIcon,
  },
  { href: "/app/settings/data", label: "Your data", icon: DatabaseIcon },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-svh bg-background">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 md:grid-cols-[220px_1fr] md:px-6">
        <aside className="md:border-r md:pr-4">
          <div className="mb-4">
            <h1 className="text-lg font-semibold">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Manage your account preferences.
            </p>
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
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <section className="min-w-0">{children}</section>
      </div>
    </main>
  );
}
