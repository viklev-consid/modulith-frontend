import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginShell } from "../login-form";
import { TwoFactorForm } from "./two-factor-form";

export const metadata: Metadata = {
  title: "Verify sign-in | Modulith",
  description: "Enter your authenticator code to finish signing in.",
};

export default function LoginTwoFactorPage() {
  return (
    <Suspense fallback={<LoginShell />}>
      <TwoFactorForm />
    </Suspense>
  );
}
