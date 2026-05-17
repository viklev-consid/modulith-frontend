"use client";

import { useAuth } from "@/components/auth-provider";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { SetInitialPasswordForm } from "@/components/settings/set-initial-password-form";

export function PasswordSettingsForm() {
  const { currentUser } = useAuth();

  if (currentUser && !currentUser.hasPassword) {
    return <SetInitialPasswordForm />;
  }

  return <ChangePasswordForm />;
}
