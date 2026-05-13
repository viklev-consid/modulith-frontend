import type { Metadata } from "next";

import { EmailSettingsForm } from "@/components/settings/email-settings-form";

export const metadata: Metadata = {
  title: "Email settings | Modulith",
};

export default function EmailSettingsPage() {
  return <EmailSettingsForm />;
}
