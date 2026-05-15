import type { Metadata } from "next";
import { Suspense } from "react";

import { ResetPasswordContent, ResetShell } from "./reset-password-form";

export const metadata: Metadata = {
  title: "Set new password | Modulith",
  description: "Choose a new password for your Modulith account.",
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetShell />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
