import type { Metadata } from "next";

import { PasswordSettingsForm } from "@/components/settings/password-settings-form";

export const metadata: Metadata = {
  title: "Password settings | Modulith",
};

export default function PasswordSettingsPage() {
  return <PasswordSettingsForm />;
}
