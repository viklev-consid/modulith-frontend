import type { Metadata } from "next";

import { SecuritySettings } from "@/components/settings/security-settings";

export const metadata: Metadata = {
  title: "Security | Modulith",
};

export default function SecuritySettingsPage() {
  return <SecuritySettings />;
}
