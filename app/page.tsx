import type { Metadata } from "next";
import Link from "next/link";
import {
  ActivityIcon,
  LogOutIcon,
  SettingsIcon,
  ShieldIcon,
} from "lucide-react";

import { BellDropdown } from "@/components/bell-dropdown";
import { Can } from "@/components/can";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard | Modulith",
};

const ADMIN_PERMISSIONS = [
  "users.users.read",
  "users.invitations.write",
  "audit.trail.read",
] as const;

export default function Page() {
  return (
    <div className="min-h-svh px-6 py-5">
      <header className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-sm font-medium">Modulith</h1>
          <p className="text-xs text-muted-foreground">
            Auth foundation is ready for the next feature slice.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BellDropdown />
          <Can anyOf={ADMIN_PERMISSIONS}>
            <Link
              href="/admin"
              className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
            >
              <ShieldIcon />
              Admin
            </Link>
          </Can>
          <Link
            href="/activity"
            className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
          >
            <ActivityIcon />
            Activity
          </Link>
          <Link
            href="/settings"
            className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
          >
            <SettingsIcon />
            Settings
          </Link>
          <form action="/api/auth/logout" method="post">
            <Button size="sm" variant="outline" type="submit">
              <LogOutIcon />
              Sign out
            </Button>
          </form>
        </div>
      </header>
      <div className="grid max-w-3xl gap-3 py-6 text-sm">
        <h2 className="font-medium">Dashboard</h2>
        <p className="text-muted-foreground">
          The application shell will grow here once profile, notifications, and
          admin workflows are wired.
        </p>
      </div>
    </div>
  );
}
