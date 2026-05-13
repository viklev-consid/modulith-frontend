import type { Metadata } from "next";

import { ConnectionsSettings } from "@/components/settings/connections-settings";

export const metadata: Metadata = {
  title: "Connections | Modulith",
};

export default function ConnectionsSettingsPage() {
  return <ConnectionsSettings />;
}
