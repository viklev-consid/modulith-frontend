import type { ReactNode } from "react";

import { AuthHydration } from "@/components/auth-hydration";

export default function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AuthHydration requireCompletedOnboarding={false}>{children}</AuthHydration>
  );
}
