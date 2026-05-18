import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ConnectionsSettings } from "@/components/settings/connections-settings";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata.settings");
  return { title: t("connections") };
}

export default function ConnectionsSettingsPage() {
  return <ConnectionsSettings />;
}
