import type { ReactNode } from "react";

import { AuthHydration } from "@/components/auth-hydration";
import { LegalComplianceGate } from "@/components/legal/legal-compliance-gate";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthHydration>
      {children}
      <LegalComplianceGate />
    </AuthHydration>
  );
}
