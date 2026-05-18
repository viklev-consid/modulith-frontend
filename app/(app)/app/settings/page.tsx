import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata.settings");
  return { title: t("profile") };
}

export default function SettingsPage() {
  return <ProfileSettingsForm />;
}
