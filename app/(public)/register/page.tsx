import type { Metadata } from "next";
import { Suspense } from "react";

import { RegisterContent, RegisterShell } from "./register-form";

export const metadata: Metadata = {
  title: "Create account | Modulith",
  description: "Set up your Modulith workspace access.",
};

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterShell />}>
      <RegisterContent />
    </Suspense>
  );
}
