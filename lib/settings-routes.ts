import {
  ActivityIcon,
  BellIcon,
  DatabaseIcon,
  KeyRoundIcon,
  MailIcon,
  ShieldIcon,
  UserIcon,
  type LucideIcon,
} from "lucide-react";

export type SettingsRouteLabelKey =
  | "profile"
  | "password"
  | "email"
  | "security"
  | "activity"
  | "notifications"
  | "data";

export type SettingsRoute = {
  href: string;
  labelKey: SettingsRouteLabelKey;
  icon: LucideIcon;
};

export const settingsRoutes = [
  { href: "/app/settings", labelKey: "profile", icon: UserIcon },
  { href: "/app/settings/password", labelKey: "password", icon: KeyRoundIcon },
  { href: "/app/settings/email", labelKey: "email", icon: MailIcon },
  { href: "/app/settings/security", labelKey: "security", icon: ShieldIcon },
  { href: "/app/settings/activity", labelKey: "activity", icon: ActivityIcon },
  {
    href: "/app/settings/notifications",
    labelKey: "notifications",
    icon: BellIcon,
  },
  { href: "/app/settings/data", labelKey: "data", icon: DatabaseIcon },
] as const satisfies readonly SettingsRoute[];
