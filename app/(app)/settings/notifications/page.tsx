import type { Metadata } from "next";

import { NotificationPreferencesForm } from "@/components/settings/notification-preferences-form";

export const metadata: Metadata = {
  title: "Notification settings | Modulith",
};

export default function NotificationSettingsPage() {
  return <NotificationPreferencesForm />;
}
