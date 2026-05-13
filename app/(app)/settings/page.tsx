import type { Metadata } from "next";

import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";

export const metadata: Metadata = {
  title: "Profile settings | Modulith",
};

export default function SettingsPage() {
  return <ProfileSettingsForm />;
}
