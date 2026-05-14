import {
  ClipboardListIcon,
  MailIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";

export type AdminRoute = {
  href: string;
  label: string;
  icon: LucideIcon;
  permission: string;
};

export const adminRoutes = [
  {
    href: "/admin/users",
    label: "Users",
    icon: UsersIcon,
    permission: "users.users.read",
  },
  {
    href: "/admin/invitations",
    label: "Invitations",
    icon: MailIcon,
    permission: "users.invitations.write",
  },
  {
    href: "/admin/audit",
    label: "Audit trail",
    icon: ClipboardListIcon,
    permission: "audit.trail.read",
  },
] as const satisfies readonly AdminRoute[];
