import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginForm, LoginShell } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in | Modulith",
  description: "Access your Modulith workspace.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginShell />}>
      <LoginForm />
    </Suspense>
  );
}
